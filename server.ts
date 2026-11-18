import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  type Content,
  type FunctionDeclaration,
  type GenerateContentResponse,
  GoogleGenAI,
  ThinkingLevel,
  Type,
} from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Prioritized active model cascade (no deprecated models)
const ASSISTANT_MODEL_CASCADE = [
  "gemini-4-hydrogen",
  "gemini-3.1-flash-lite",
] as const;

interface CategorySummaryPayload {
  category: string;
  total: number;
  percentage: number;
}

interface RecentMovementPayload {
  description: string;
  category: string;
  amount: number;
  dateLabel: string;
  type?: string;
}

interface SmartNotificationsRequest {
  monthLabel: string;
  currentDay: number;
  totalDays: number;
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  categories: CategorySummaryPayload[];
  recentMovements: RecentMovementPayload[];
  peakDay: {
    day: number;
    amount: number;
    category: string;
  };
}

interface ChatHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

interface AssistantAttachment {
  type: "image" | "audio";
  mimeType: string;
  data: string; // base64 without data: prefix
  fileName?: string;
}

interface AssistantRequest {
  message?: string;
  attachment?: AssistantAttachment;
  history?: ChatHistoryTurn[];
  budgetContext: {
    userName?: string;
    currentDateISO: string;
    monthLabel: string;
    monthlyBudget: number;
    totalSpent: number;
    totalIncome: number;
    availableBalance: number;
    categories: CategorySummaryPayload[];
    recentMovements: RecentMovementPayload[];
  };
}

interface ExtractedFunctionCall {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY no está configurada. Verifica el secreto en la configuración de la aplicación."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function extractHttpStatusCode(error: unknown): number {
  if (!error || typeof error !== "object") return 500;
  const errObj = error as { status?: unknown; code?: unknown; message?: string };
  if (typeof errObj.status === "number") return errObj.status;
  if (typeof errObj.code === "number") return errObj.code;

  const msg = String(errObj.message ?? error);
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return 429;
  if (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("overloaded")
  ) {
    return 503;
  }
  if (msg.includes("404") || msg.includes("NOT_FOUND")) return 404;
  if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) return 403;
  if (msg.includes("400") || msg.includes("INVALID_ARGUMENT")) return 400;
  return 502;
}

function isRetryableCascadeError(statusCode: number): boolean {
  return statusCode === 429 || statusCode === 503 || statusCode === 404;
}

function extractPartsFromResponse(response: GenerateContentResponse): {
  text: string;
  functionCalls: ExtractedFunctionCall[];
} {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const textSegments: string[] = [];
  const functionCalls: ExtractedFunctionCall[] = [];

  for (const part of parts) {
    if (typeof part.text === "string" && part.text.trim().length > 0) {
      textSegments.push(part.text);
    }
    if (part.functionCall && typeof part.functionCall.name === "string") {
      functionCalls.push({
        id: part.functionCall.id,
        name: part.functionCall.name,
        args: (part.functionCall.args ?? {}) as Record<string, unknown>,
      });
    }
  }

  return {
    text: textSegments.join("\n").trim(),
    functionCalls,
  };
}

const registerExpenseDeclaration: FunctionDeclaration = {
  name: "registerExpense",
  description:
    "Registra un nuevo gasto personal en pesos colombianos (COP) dentro del presupuesto mensual del usuario.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.NUMBER,
        description:
          "Monto del gasto en pesos colombianos (COP). Debe ser un número positivo mayor a cero.",
      },
      date: {
        type: Type.STRING,
        description:
          "Fecha del gasto en formato estricto YYYY-MM-DD. Si el usuario dice 'hoy', usa la fecha actual del contexto.",
      },
      description: {
        type: Type.STRING,
        description:
          "Descripción corta y clara del gasto (ej. 'Almuerzo ejecutivo', 'Pasaje de transporte', 'Café').",
      },
      category: {
        type: Type.STRING,
        description:
          "Categoría del gasto. Debe ser exactamente una de: 'Alimentación', 'Transporte', 'Servicios públicos', 'Ropa y compras personales', 'Entretenimiento y ocio'.",
      },
    },
    required: ["amount", "date", "description", "category"],
  },
};

async function transcribeAudioWithGemini(
  ai: GoogleGenAI,
  mimeType: string,
  base64Data: string
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe exactamente lo que dice esta nota de voz en español. Devuelve únicamente la transcripción literal, sin comentarios adicionales. Si no se escucha voz inteligible o está vacío, responde exactamente: [INAUDIBLE].",
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });
    const { text } = extractPartsFromResponse(response);
    const cleaned = (text || response.text || "").trim();
    if (!cleaned || cleaned === "[INAUDIBLE]") {
      return null;
    }
    return cleaned;
  } catch (err) {
    console.warn(
      "[assistant] Transcripción previa con gemini-3.5-transcribe no disponible, enviando audio directo a la cascada:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.post("/api/smart-notifications", async (req, res) => {
    try {
      const payload = req.body as SmartNotificationsRequest;
      if (
        !payload ||
        typeof payload.monthlyBudget !== "number" ||
        typeof payload.totalSpent !== "number" ||
        typeof payload.availableBalance !== "number"
      ) {
        return res.status(400).json({
          error: "Datos financieros inválidos para generar notificaciones.",
        });
      }

      const ai = getGeminiClient();

      const prompt = `
Analiza el estado actual del presupuesto mensual en pesos colombianos (COP) y genera exactamente 3 notificaciones inteligentes concisas y útiles para el usuario en español de Colombia.

Datos del mes (${payload.monthLabel}, día ${payload.currentDay} de ${payload.totalDays}):
- Presupuesto mensual: $${payload.monthlyBudget.toLocaleString("es-CO")} COP
- Total gastado: $${payload.totalSpent.toLocaleString("es-CO")} COP (${payload.monthlyBudget > 0 ? ((payload.totalSpent / payload.monthlyBudget) * 100).toFixed(1) : "0.0"}%)
- Saldo disponible: $${payload.availableBalance.toLocaleString("es-CO")} COP (${payload.monthlyBudget > 0 ? ((payload.availableBalance / payload.monthlyBudget) * 100).toFixed(1) : "0.0"}%)
- Día con mayor gasto: Día ${payload.peakDay.day} ($${payload.peakDay.amount.toLocaleString("es-CO")} COP en ${payload.peakDay.category})
- Gasto por categoría:
${payload.categories.map((c) => `  * ${c.category}: $${c.total.toLocaleString("es-CO")} COP (${c.percentage.toFixed(1)}%)`).join("\n")}
- Últimos 5 movimientos:
${payload.recentMovements.map((m) => `  * ${m.dateLabel}: ${m.description} (${m.category}) - $${m.amount.toLocaleString("es-CO")} COP`).join("\n")}

Reglas estrictas:
1. Cada notificación debe ser una alerta financiera concreta (ej. ritmo de gasto vs. avance del mes, cupo diario sugerido para los días restantes, concentración en categoría o pico reciente).
2. Usa siempre el formato de moneda colombiano exacto, por ejemplo "$1.217.500 COP" o "$93.654 COP".
3. No menciones bancos, tarjetas de crédito/débito, inversiones, ni sugieras usar otras apps.
4. Tono profesional, claro, directo y sereno, propio de una app financiera moderna.
5. "level" debe ser exactamente uno de: "nominal", "attention", "limit".
6. "tag" debe ser una etiqueta corta de máximo 2 palabras (ej. "En ritmo", "Atención", "Cupo diario").
7. "title" máximo 52 caracteres; "message" máximo 135 caracteres.
`;

      let response: GenerateContentResponse | null = null;
      let lastError: unknown = null;

      for (const modelName of ASSISTANT_MODEL_CASCADE) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction:
                "Eres el motor de alertas presupuestales de 'Mi Presupuesto Mensual' en Colombia. Devuelves únicamente JSON válido siguiendo el esquema solicitado, con cifras exactas en COP.",
              ...(modelName === "gemini-4-hydrogen"
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  notifications: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        level: { type: Type.STRING },
                        tag: { type: Type.STRING },
                        title: { type: Type.STRING },
                        message: { type: Type.STRING },
                        metricHighlight: { type: Type.STRING },
                      },
                      required: [
                        "id",
                        "level",
                        "tag",
                        "title",
                        "message",
                        "metricHighlight",
                      ],
                    },
                  },
                },
                required: ["notifications"],
              },
            },
          });
          break;
        } catch (err) {
          lastError = err;
          const status = extractHttpStatusCode(err);
          if (!isRetryableCascadeError(status)) {
            throw err;
          }
          console.warn(
            `[smart-notifications] Modelo ${modelName} falló con ${status}; probando siguiente modelo.`
          );
        }
      }

      if (!response) {
        throw lastError ?? new Error("No se obtuvo respuesta de los modelos.");
      }

      const { text } = extractPartsFromResponse(response);
      const rawText = (text || response.text || "{}").trim();
      const parsed = JSON.parse(rawText) as {
        notifications?: Array<{
          id: string;
          level: string;
          tag: string;
          title: string;
          message: string;
          metricHighlight: string;
        }>;
      };

      const notifications = (parsed.notifications ?? [])
        .slice(0, 3)
        .map((item, idx) => ({
          id: item.id || `alert-${idx + 1}`,
          level:
            item.level === "attention" || item.level === "limit"
              ? item.level
              : "nominal",
          tag: item.tag || "Alerta",
          title: item.title,
          message: item.message,
          metricHighlight: item.metricHighlight,
        }));

      return res.json({
        notifications,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const statusCode = extractHttpStatusCode(error);
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible generar las notificaciones inteligentes.";
      return res.status(statusCode).json({ error: message, status: statusCode });
    }
  });

  app.post("/api/assistant", async (req, res) => {
    try {
      const payload = req.body as AssistantRequest;
      const trimmedMessage =
        typeof payload?.message === "string" ? payload.message.trim() : "";
      const attachment = payload?.attachment;

      const hasValidAttachment =
        attachment &&
        (attachment.type === "image" || attachment.type === "audio") &&
        typeof attachment.mimeType === "string" &&
        attachment.mimeType.length > 0 &&
        typeof attachment.data === "string" &&
        attachment.data.length > 0;

      if (
        !payload ||
        (trimmedMessage.length === 0 && !hasValidAttachment) ||
        !payload.budgetContext
      ) {
        return res.status(400).json({
          error:
            "Debes enviar un mensaje, imagen o nota de voz junto con el contexto del presupuesto.",
          status: 400,
        });
      }

      const ai = getGeminiClient();
      const ctx = payload.budgetContext;
      const userName =
        typeof ctx.userName === "string" && ctx.userName.trim().length > 0
          ? ctx.userName.trim()
          : "Edubel";

      const yesterdayDay = Math.max(1, Number(ctx.currentDateISO.slice(8, 10)) - 1);
      const yesterdayISO = `${ctx.currentDateISO.slice(0, 8)}${String(yesterdayDay).padStart(2, "0")}`;

      let audioTranscript: string | null = null;
      if (hasValidAttachment && attachment.type === "audio") {
        audioTranscript = await transcribeAudioWithGemini(
          ai,
          attachment.mimeType,
          attachment.data
        );
      }

      const systemInstruction = `Eres el asistente financiero personal de la aplicación "Mi Presupuesto Mensual" en Colombia.
Reglas de comportamiento:
- Sé breve, amable y experto en finanzas personales.
- Responde siempre en español natural de Colombia y formatea cualquier monto en pesos colombianos (ej: $50.000 COP).
- Nombre del usuario: ${userName}.
- Fecha actual de referencia: ${ctx.currentDateISO} (${ctx.monthLabel}). Si el usuario dice "hoy", usa ${ctx.currentDateISO}. Si dice "ayer", resta un día (${yesterdayISO}).
- Estado actual del presupuesto del usuario:
  * Presupuesto disponible del mes: $${ctx.monthlyBudget.toLocaleString("es-CO")} COP
  * Total gastado: $${ctx.totalSpent.toLocaleString("es-CO")} COP
  * Total ingresos adicionales: $${ctx.totalIncome.toLocaleString("es-CO")} COP
  * Saldo disponible actual: $${ctx.availableBalance.toLocaleString("es-CO")} COP
  * Gastos por categoría: ${ctx.categories.map((c) => `${c.category}: $${c.total.toLocaleString("es-CO")} COP`).join(" | ")}
  * Últimos movimientos: ${ctx.recentMovements.length > 0 ? ctx.recentMovements.map((m) => `${m.description} ($${m.amount.toLocaleString("es-CO")} COP, ${m.category}, ${m.dateLabel})`).join("; ") : "Ninguno registrado aún."}
- Cuando el usuario quiera registrar un gasto (por ejemplo "Gasté 500 en comida hoy" o "Pagué 35 mil en transporte"), llama inmediatamente a la función registerExpense con los 4 parámetros exactos (amount, date, description, category).
- Categorías permitidas únicamente: "Alimentación", "Transporte", "Servicios públicos", "Ropa y compras personales", "Entretenimiento y ocio".
- Confirma los datos del gasto con claridad cuando ejecutes la función o responde directamente las dudas sobre el presupuesto.

Reglas adicionales de análisis multimodal, validación y personalización:
1. Imágenes (tickets, recibos, facturas, capturas de compra o apuntes de gasto):
   - Extrae: monto (amount), fecha (date en YYYY-MM-DD) y descripción (description), e infiere la categoría más adecuada.
   - Si la imagen es borrosa, ilegible o falta o está dudoso algún dato (monto, fecha o descripción), NO llames a registerExpense y NO inventes información: menciona brevemente los datos que sí lograste leer (si aplica) y pregunta amablemente al usuario para confirmar o completar los datos faltantes antes de guardar.
   - Si la imagen NO tiene relación con gastos, recibos, compras o finanzas personales, indica claramente que no puedes procesarla ni registrarla en Mi Presupuesto.
2. Audio (notas de voz grabadas o cargadas):
   - Transcribe el contenido de la nota de voz (menciona brevemente lo que entendiste) y extrae: monto, fecha y descripción.
   - Si el audio es inaudible, falta algún dato (monto, fecha o descripción) o hay ambigüedad, NO llames a registerExpense y NO inventes datos: menciona lo que alcanzaste a entender (si aplica) y solicita aclaración antes de guardar.
   - Si el audio NO tiene relación con gastos o finanzas personales, indica claramente que no puedes procesarlo.
3. Reglas de registro y consultas:
   - Usa siempre la herramienta registerExpense únicamente cuando los datos estén confirmados y completos.
   - Al finalizar un registro con registerExpense, dirígete siempre al usuario por su nombre, por ejemplo: "¡Listo, ${userName}! He guardado tu gasto...".
   - Para consultas de compras o viabilidad ("¿Me alcanza para...?", "¿Puedo comprar...?"), compara explícitamente el gasto solicitado con el saldo disponible actual del contexto ($${ctx.availableBalance.toLocaleString("es-CO")} COP).`;

      const contents: Content[] = [];
      for (const turn of (payload.history ?? []).slice(-8)) {
        if (turn.text.trim().length > 0) {
          contents.push({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.text }],
          });
        }
      }

      const userParts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (hasValidAttachment && attachment.type === "image") {
        const imagePromptText =
          trimmedMessage.length > 0
            ? trimmedMessage
            : "Analiza esta imagen adjunta (ticket, recibo, captura o apunte). Extrae monto, fecha y descripción si corresponden a un gasto. Si falta algún dato o está borroso, pregúntame antes de guardar; si no tiene relación con gastos o finanzas, indícamelo.";
        userParts.push({ text: imagePromptText });
        userParts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.data,
          },
        });
      } else if (hasValidAttachment && attachment.type === "audio") {
        const audioIntro = audioTranscript
          ? `Nota de voz adjunta. Transcripción detectada: "${audioTranscript}".${trimmedMessage.length > 0 ? ` Mensaje adicional del usuario: ${trimmedMessage}` : ""} Verifica monto, fecha y descripción; si falta información o no está claro, pregúntame antes de guardar. Si no trata sobre gastos o finanzas, indícamelo.`
          : `Transcribe esta nota de voz adjunta y extrae monto, fecha y descripción si corresponde a un gasto.${trimmedMessage.length > 0 ? ` Mensaje adicional del usuario: ${trimmedMessage}` : ""} Si falta algún dato o no se entiende bien, pregúntame antes de guardar; si no trata sobre gastos o finanzas, indícamelo.`;
        userParts.push({ text: audioIntro });
        userParts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.data,
          },
        });
      } else {
        userParts.push({ text: trimmedMessage });
      }

      contents.push({
        role: "user",
        parts: userParts,
      });

      let usedModel: string = ASSISTANT_MODEL_CASCADE[0];
      let firstResponse: GenerateContentResponse | null = null;
      let lastError: unknown = null;

      for (const modelName of ASSISTANT_MODEL_CASCADE) {
        try {
          usedModel = modelName;
          firstResponse = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              ...(modelName === "gemini-4-hydrogen"
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              tools: [{ functionDeclarations: [registerExpenseDeclaration] }],
            },
          });
          break;
        } catch (err) {
          lastError = err;
          const status = extractHttpStatusCode(err);
          if (!isRetryableCascadeError(status)) {
            throw err;
          }
          console.warn(
            `[assistant] Modelo ${modelName} falló con estado ${status}; saltando al siguiente modelo en cascada.`
          );
        }
      }

      if (!firstResponse) {
        const finalStatus = extractHttpStatusCode(lastError);
        const rawMessage =
          lastError instanceof Error
            ? lastError.message
            : "Todos los modelos de la cascada fallaron.";
        return res.status(finalStatus).json({
          error: rawMessage,
          status: finalStatus,
        });
      }

      // Robust manual extraction from response.candidates[0].content.parts
      const extracted = extractPartsFromResponse(firstResponse);
      let replyText = extracted.text;
      const functionCalls = extracted.functionCalls;

      // If Gemini invoked registerExpense without accompanying natural-language text,
      // send a functionResponse turn to obtain a brief, personalized confirmation message.
      const registerCall = functionCalls.find(
        (fc) => fc.name === "registerExpense"
      );
      if (registerCall && replyText.length === 0) {
        const argAmount = Number(registerCall.args.amount) || 0;
        const argDesc = String(registerCall.args.description ?? "Gasto");
        const argCat = String(registerCall.args.category ?? "Alimentación");
        const argDate = String(registerCall.args.date ?? ctx.currentDateISO);
        const projectedBalance = ctx.availableBalance - argAmount;

        try {
          const previousContent = firstResponse.candidates?.[0]?.content;
          if (previousContent) {
            const followUp = await ai.models.generateContent({
              model: usedModel,
              contents: [
                ...contents,
                previousContent,
                {
                  role: "user",
                  parts: [
                    {
                      functionResponse: {
                        id: registerCall.id,
                        name: "registerExpense",
                        response: {
                          success: true,
                          userName,
                          registered: {
                            amount: argAmount,
                            description: argDesc,
                            category: argCat,
                            date: argDate,
                          },
                          newAvailableBalance: projectedBalance,
                        },
                      },
                    },
                  ],
                },
              ],
              config: {
                systemInstruction,
                ...(usedModel === "gemini-4-hydrogen"
                  ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                  : {}),
                tools: [{ functionDeclarations: [registerExpenseDeclaration] }],
              },
            });
            const followUpExtracted = extractPartsFromResponse(followUp);
            if (followUpExtracted.text.length > 0) {
              replyText = followUpExtracted.text;
            }
          }
        } catch {
          // Safe fallback text if follow-up turn hits rate limit
        }

        if (replyText.length === 0) {
          replyText = `¡Listo, ${userName}! He guardado tu gasto "${argDesc}" por $${argAmount.toLocaleString("es-CO")} COP en ${argCat} (${argDate}). Tu nuevo saldo disponible es $${projectedBalance.toLocaleString("es-CO")} COP.`;
        }
      }

      if (replyText.length === 0 && functionCalls.length === 0) {
        replyText =
          "Recibí tu mensaje, pero no pude generar una respuesta clara. ¿Podrías reformularlo?";
      }

      return res.json({
        text: replyText,
        transcript: audioTranscript ?? undefined,
        functionCalls,
        modelUsed: usedModel,
      });
    } catch (error) {
      const statusCode = extractHttpStatusCode(error);
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado al consultar el asistente.";
      return res.status(statusCode).json({
        error: message,
        status: statusCode,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mi Presupuesto Mensual listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
