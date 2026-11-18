import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  FileAudio,
  ImagePlus,
  Mic,
  Pencil,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  CURRENT_DATE_ISO,
  type ExpenseCategory,
  formatCOP,
  formatDateSpanishLabel,
  isExpenseCategory,
  type MovementEntry,
} from "../data/budgetData";

export interface RegisteredExpenseReceipt {
  amount: number;
  date: string;
  description: string;
  category: ExpenseCategory;
}

export interface MessageAttachmentPreview {
  type: "image" | "audio";
  previewUrl: string;
  label: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
  transcript?: string;
  attachment?: MessageAttachmentPreview;
  registeredExpense?: RegisteredExpenseReceipt;
  timestamp: string;
}

interface PendingAttachment {
  type: "image" | "audio";
  mimeType: string;
  data: string; // base64 without data: prefix
  previewUrl: string;
  label: string;
}

interface BudgetContextPayload {
  userName: string;
  currentDateISO: string;
  monthLabel: string;
  monthlyBudget: number;
  totalSpent: number;
  totalIncome: number;
  availableBalance: number;
  categories: Array<{ category: string; total: number; percentage: number }>;
  recentMovements: MovementEntry[];
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  onAddMessage: (msg: AssistantMessage) => void;
  budgetContext: BudgetContextPayload;
  onUpdateUserName: (name: string) => void;
  onRegisterExpense: (expense: RegisteredExpenseReceipt) => void;
}

const SUGGESTED_PROMPTS = [
  "Gasté 28.000 en almuerzo hoy",
  "¿Cuánto saldo disponible me queda?",
  "¿Puedo comprar algo de 150.000 COP?",
];

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function normalizeCategory(rawCategory: unknown): ExpenseCategory {
  if (typeof rawCategory === "string") {
    if (isExpenseCategory(rawCategory)) return rawCategory;
    const lower = rawCategory.toLowerCase();
    const match = CATEGORIES.find((c) => c.toLowerCase() === lower);
    if (match) return match;
    if (lower.includes("comida") || lower.includes("aliment")) {
      return "Alimentación";
    }
    if (
      lower.includes("transporte") ||
      lower.includes("bus") ||
      lower.includes("uber")
    ) {
      return "Transporte";
    }
    if (
      lower.includes("servicio") ||
      lower.includes("luz") ||
      lower.includes("agua") ||
      lower.includes("internet")
    ) {
      return "Servicios públicos";
    }
    if (lower.includes("ropa") || lower.includes("compra")) {
      return "Ropa y compras personales";
    }
    if (
      lower.includes("cine") ||
      lower.includes("ocio") ||
      lower.includes("entreten")
    ) {
      return "Entretenimiento y ocio";
    }
  }
  return "Alimentación";
}

function normalizeDateISO(rawDate: unknown): string {
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }
  return CURRENT_DATE_ISO;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer el archivo adjunto."));
      }
    };
    reader.onerror = () =>
      reject(new Error("Error al procesar el archivo adjunto."));
    reader.readAsDataURL(blob);
  });
}

function inferMimeTypeFromFile(file: File, kind: "image" | "audio"): string {
  const cleanType = file.type.split(";")[0].trim();
  if (cleanType) return cleanType;
  const name = file.name.toLowerCase();
  if (kind === "image") {
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  }
  if (name.endsWith(".mp3")) return "audio/mp3";
  if (name.endsWith(".wav")) return "audio/wav";
  if (name.endsWith(".ogg")) return "audio/ogg";
  if (name.endsWith(".m4a") || name.endsWith(".mp4")) return "audio/mp4";
  return "audio/webm";
}

function formatRecordingDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function AssistantDrawer({
  isOpen,
  onClose,
  messages,
  onAddMessage,
  budgetContext,
  onUpdateUserName,
  onRegisterExpense,
}: AssistantDrawerProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Inline userName edit inside Assistant header
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(budgetContext.userName);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cancelRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    setDraftName(budgetContext.userName);
  }, [budgetContext.userName]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, isLoading, pendingAttachment]);

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  // Clean up active microphone stream when drawer closes or component unmounts
  useEffect(() => {
    if (!isOpen && isRecording) {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setIsRecording(false);
    }
  }, [isOpen, isRecording]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleFileSelected(
    e: ChangeEvent<HTMLInputElement>,
    kind: "image" | "audio"
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setMediaNotice(null);

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setMediaNotice(
        "El archivo supera el límite de 10 MB. Por favor selecciona uno más liviano."
      );
      return;
    }

    try {
      const dataUrl = await readBlobAsDataUrl(file);
      const commaIdx = dataUrl.indexOf(",");
      const base64Data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      const mimeType = inferMimeTypeFromFile(file, kind);

      setPendingAttachment({
        type: kind,
        mimeType,
        data: base64Data,
        previewUrl: dataUrl,
        label: file.name || (kind === "image" ? "Imagen adjunta" : "Audio adjunto"),
      });
    } catch (err) {
      setMediaNotice(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el archivo seleccionado."
      );
    }
  }

  async function handleStartRecording() {
    if (isLoading || isRecording) return;
    setMediaNotice(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setMediaNotice(
        "Tu navegador no permite grabar audio directamente. Puedes subir un archivo de audio."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const candidateTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const supportedType = candidateTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      cancelRecordingRef.current = false;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);

        if (cancelRecordingRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const rawMime = recorder.mimeType || supportedType || "audio/webm";
        const cleanMime = rawMime.split(";")[0].trim() || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: cleanMime });
        audioChunksRef.current = [];

        if (blob.size < 256) {
          setMediaNotice("La grabación fue muy corta. Intenta hablar de nuevo.");
          return;
        }

        if (blob.size > MAX_ATTACHMENT_BYTES) {
          setMediaNotice("La nota de voz supera los 10 MB permitidos.");
          return;
        }

        try {
          const dataUrl = await readBlobAsDataUrl(blob);
          const commaIdx = dataUrl.indexOf(",");
          const base64Data =
            commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;

          setPendingAttachment({
            type: "audio",
            mimeType: cleanMime,
            data: base64Data,
            previewUrl: dataUrl,
            label: "Nota de voz grabada",
          });
        } catch {
          setMediaNotice("No fue posible procesar la grabación de audio.");
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      const errorName = err instanceof Error ? err.name : "";
      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
      ) {
        setMediaNotice(
          "Permiso de micrófono denegado. Habilítalo en tu navegador o sube un archivo de audio."
        );
      } else {
        setMediaNotice(
          "No se pudo acceder al micrófono. Verifica que esté conectado o sube un archivo de audio."
        );
      }
    }
  }

  function handleStopRecording(cancel = false) {
    cancelRecordingRef.current = cancel;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setIsRecording(false);
    }
  }

  function handleSaveUserName() {
    const cleaned = draftName.trim();
    if (cleaned.length > 0) {
      onUpdateUserName(cleaned);
    } else {
      setDraftName(budgetContext.userName);
    }
    setIsEditingName(false);
  }

  async function sendPrompt(promptText: string, overrideAttachment?: PendingAttachment | null) {
    const trimmed = promptText.trim();
    const attachmentToSend =
      overrideAttachment !== undefined ? overrideAttachment : pendingAttachment;

    if ((!trimmed && !attachmentToSend) || isLoading) return;

    setMediaNotice(null);

    const displayText =
      trimmed.length > 0
        ? trimmed
        : attachmentToSend?.type === "image"
          ? "Recibo / imagen adjunta para analizar"
          : "Nota de voz adjunta para transcribir y analizar";

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: displayText,
      attachment: attachmentToSend
        ? {
            type: attachmentToSend.type,
            previewUrl: attachmentToSend.previewUrl,
            label: attachmentToSend.label,
          }
        : undefined,
      timestamp: new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    onAddMessage(userMsg);
    setInput("");
    setPendingAttachment(null);
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError)
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.transcript
            ? `${m.text}\n[Transcripción previa: ${m.transcript}]`
            : m.text,
        }));

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          attachment: attachmentToSend
            ? {
                type: attachmentToSend.type,
                mimeType: attachmentToSend.mimeType,
                data: attachmentToSend.data,
                fileName: attachmentToSend.label,
              }
            : undefined,
          history: historyPayload,
          budgetContext: {
            userName: budgetContext.userName,
            currentDateISO: budgetContext.currentDateISO,
            monthLabel: budgetContext.monthLabel,
            monthlyBudget: budgetContext.monthlyBudget,
            totalSpent: budgetContext.totalSpent,
            totalIncome: budgetContext.totalIncome,
            availableBalance: budgetContext.availableBalance,
            categories: budgetContext.categories,
            recentMovements: budgetContext.recentMovements.map((m) => ({
              description: m.description,
              category: m.category,
              amount: m.amount,
              dateLabel: m.dateLabel,
              type: m.type,
            })),
          },
        }),
      });

      let data: {
        text?: string;
        transcript?: string;
        functionCalls?: Array<{
          name: string;
          args: Record<string, unknown>;
        }>;
        error?: string;
        status?: number;
      } = {};

      try {
        data = (await response.json()) as typeof data;
      } catch {
        data = {};
      }

      if (!response.ok) {
        const status = data.status ?? response.status;
        const rawError = data.error ?? "";
        let friendlyMessage: string;

        if (
          status === 503 ||
          rawError.includes("503") ||
          rawError.toLowerCase().includes("unavailable") ||
          rawError.toLowerCase().includes("overloaded")
        ) {
          friendlyMessage =
            "El asistente está muy solicitado en este momento. Por favor, intenta de nuevo en un minuto.";
        } else if (
          status === 429 ||
          rawError.includes("429") ||
          rawError.includes("RESOURCE_EXHAUSTED")
        ) {
          friendlyMessage =
            "He alcanzado mi límite de mensajes por ahora. Intenta de nuevo más tarde.";
        } else {
          friendlyMessage = rawError
            ? `Error del servidor (${status}): ${rawError}`
            : `Error del servidor (${status}): No fue posible procesar la solicitud.`;
        }

        onAddMessage({
          id: `err-${Date.now()}`,
          role: "assistant",
          text: friendlyMessage,
          isError: true,
          timestamp: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        return;
      }

      let registeredExpense: RegisteredExpenseReceipt | undefined;
      const registerCall = (data.functionCalls ?? []).find(
        (fc) => fc.name === "registerExpense"
      );

      if (registerCall) {
        const rawAmount = Number(registerCall.args.amount);
        if (!Number.isNaN(rawAmount) && rawAmount > 0) {
          const receipt: RegisteredExpenseReceipt = {
            amount: Math.round(rawAmount),
            date: normalizeDateISO(registerCall.args.date),
            description:
              typeof registerCall.args.description === "string" &&
              registerCall.args.description.trim().length > 0
                ? registerCall.args.description.trim()
                : "Gasto registrado",
            category: normalizeCategory(registerCall.args.category),
          };
          onRegisterExpense(receipt);
          registeredExpense = receipt;
        }
      }

      const assistantMsg: AssistantMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        transcript: data.transcript,
        text:
          data.text?.trim() ||
          (registeredExpense
            ? `¡Listo, ${budgetContext.userName}! He guardado tu gasto "${registeredExpense.description}" por ${formatCOP(registeredExpense.amount)}.`
            : "Listo, procesé tu consulta."),
        registeredExpense,
        timestamp: new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      onAddMessage(assistantMsg);
    } catch (err) {
      const msg =
        err instanceof Error
          ? `Error de conexión: ${err.message}`
          : "Error de conexión con el servidor del asistente.";
      onAddMessage({
        id: `err-${Date.now()}`,
        role: "assistant",
        text: msg,
        isError: true,
        timestamp: new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    void sendPrompt(input);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-drawer-title"
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-[2px]"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#131625] border-l border-indigo-100 dark:border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-indigo-100/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B3DF5] to-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="assistant-drawer-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-50 truncate"
                  >
                    Asistente de presupuesto
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="truncate">
                      Disponible: {formatCOP(budgetContext.availableBalance)}
                    </span>
                    <span aria-hidden="true">·</span>
                    {isEditingName ? (
                      <span className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveUserName();
                            } else if (e.key === "Escape") {
                              setDraftName(budgetContext.userName);
                              setIsEditingName(false);
                            }
                          }}
                          aria-label="Tu nombre para el asistente"
                          className="w-20 px-1.5 py-0.5 text-xs rounded border border-indigo-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#5B3DF5]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveUserName}
                          aria-label="Guardar nombre"
                          className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        title="Cambiar tu nombre"
                        className="inline-flex items-center gap-1 font-medium text-[#5B3DF5] dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                      >
                        <span>{budgetContext.userName}</span>
                        <Pencil className="w-2.5 h-2.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar asistente"
                className="w-9 h-9 rounded-xl border border-indigo-100 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    } space-y-1.5`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#5B3DF5] text-white rounded-br-sm"
                          : msg.isError
                            ? "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 text-red-800 dark:text-red-300 rounded-bl-sm"
                            : "bg-slate-100/90 dark:bg-slate-800/85 text-slate-800 dark:text-slate-100 rounded-bl-sm"
                      }`}
                    >
                      {/* Attachment preview inside user bubble */}
                      {msg.attachment && (
                        <div className="mb-2">
                          {msg.attachment.type === "image" ? (
                            <img
                              src={msg.attachment.previewUrl}
                              alt={msg.attachment.label}
                              className="max-h-48 w-auto rounded-xl object-cover border border-white/20"
                            />
                          ) : (
                            <div className="p-2 rounded-xl bg-white/15 space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/90">
                                <Mic className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">{msg.attachment.label}</span>
                              </div>
                              <audio
                                controls
                                src={msg.attachment.previewUrl}
                                className="w-full max-w-[240px] h-8"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Audio transcript caption in assistant bubble */}
                      {!isUser && msg.transcript && (
                        <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/70 text-[11px] text-indigo-900 dark:text-indigo-200">
                          <span className="font-semibold">Transcripción: </span>
                          <span className="italic">“{msg.transcript}”</span>
                        </div>
                      )}

                      {msg.isError ? (
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400"
                            aria-hidden="true"
                          />
                          <span>{msg.text}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {/* Visual confirmation card when registerExpense executed */}
                      {msg.registeredExpense && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2
                              className="w-4 h-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Gasto registrado en el dashboard</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="font-medium truncate">
                              {msg.registeredExpense.description}
                            </span>
                            <span className="font-mono font-bold tabular-nums shrink-0">
                              {formatCOP(msg.registeredExpense.amount)}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80">
                            {msg.registeredExpense.category} ·{" "}
                            {formatDateSpanishLabel(msg.registeredExpense.date)}
                          </p>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 px-1 tabular-nums">
                      {isUser ? budgetContext.userName : "Asistente"} · {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator ('escribiendo...' dots animation) */}
              {isLoading && (
                <div aria-live="polite" className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
                    <Bot
                      className="w-3.5 h-3.5 text-[#5B3DF5] dark:text-indigo-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-slate-100/90 dark:bg-slate-800/85 text-xs text-slate-600 dark:text-slate-300">
                    <span>escribiendo</span>
                    <span
                      className="inline-flex items-center gap-1"
                      aria-hidden="true"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-indigo-400 animate-bounce [animation-delay:-0.25s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-indigo-400 animate-bounce [animation-delay:-0.12s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-indigo-400 animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts + Multimodal attachment preview + Input form */}
            <div className="p-4 border-t border-indigo-100/80 dark:border-slate-800 space-y-2.5 bg-slate-50/70 dark:bg-[#0F1220]">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isLoading || isRecording}
                    onClick={() => void sendPrompt(suggestion, null)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#5B3DF5]/50 hover:text-[#5B3DF5] dark:hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Media notice / permission error */}
              {mediaNotice && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-300"
                >
                  <span>{mediaNotice}</span>
                  <button
                    type="button"
                    onClick={() => setMediaNotice(null)}
                    aria-label="Cerrar aviso"
                    className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Pending image or audio preview before sending */}
              {pendingAttachment && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700">
                  {pendingAttachment.type === "image" ? (
                    <>
                      <img
                        src={pendingAttachment.previewUrl}
                        alt={pendingAttachment.label}
                        className="w-12 h-12 rounded-lg object-cover border border-indigo-100 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {pendingAttachment.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Imagen lista · envía o escribe una nota
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <FileAudio
                          className="w-3.5 h-3.5 text-[#5B3DF5] dark:text-indigo-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{pendingAttachment.label}</span>
                      </div>
                      <audio
                        controls
                        src={pendingAttachment.previewUrl}
                        className="w-full h-8"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    aria-label="Quitar archivo adjunto"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Live Voice Recording Banner */}
              {isRecording && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300 tabular-nums">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span>
                      Grabando nota de voz · {formatRecordingDuration(recordingSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStopRecording(true)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-100/70 dark:hover:bg-red-900/40 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStopRecording(false)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                      <span>Detener</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleFileSelected(e, "image")}
                className="hidden"
                aria-hidden="true"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => void handleFileSelected(e, "image")}
                className="hidden"
                aria-hidden="true"
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => void handleFileSelected(e, "audio")}
                className="hidden"
                aria-hidden="true"
              />

              {/* Multimodal action bar + Text input */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isLoading || isRecording}
                    onClick={() => imageInputRef.current?.click()}
                    title="Subir ticket, recibo o captura"
                    aria-label="Subir imagen de recibo o gasto"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#5B3DF5]/50 hover:text-[#5B3DF5] dark:hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Recibo / Foto</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || isRecording}
                    onClick={() => cameraInputRef.current?.click()}
                    title="Tomar foto con cámara"
                    aria-label="Tomar foto de recibo con cámara"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#5B3DF5]/50 hover:text-[#5B3DF5] dark:hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || isRecording}
                    onClick={() => audioInputRef.current?.click()}
                    title="Subir archivo de audio"
                    aria-label="Subir archivo de audio o nota de voz"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#5B3DF5]/50 hover:text-[#5B3DF5] dark:hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileAudio className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Audio</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    isRecording
                      ? handleStopRecording(false)
                      : void handleStartRecording()
                  }
                  title={
                    isRecording ? "Detener grabación" : "Grabar nota de voz"
                  }
                  aria-label={
                    isRecording ? "Detener grabación" : "Grabar nota de voz"
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    isRecording
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#5B3DF5]/50 hover:text-[#5B3DF5] dark:hover:text-indigo-300"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                      <span>Detener</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Grabar</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  disabled={isLoading || isRecording}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    pendingAttachment
                      ? "Añade un comentario opcional o pulsa enviar..."
                      : "Ej: Gasté 25.000 en comida hoy..."
                  }
                  aria-label="Escribe un gasto o pregunta sobre tu presupuesto"
                  className="flex-1 px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    isRecording ||
                    (input.trim().length === 0 && !pendingAttachment)
                  }
                  aria-label="Enviar mensaje"
                  className="w-11 h-11 rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
