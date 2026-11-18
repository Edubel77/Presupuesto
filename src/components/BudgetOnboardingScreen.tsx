import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  LogOut,
  Moon,
  Sparkles,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { formatCOP, formatThousandsCO } from "../data/budgetData";

interface BudgetOnboardingScreenProps {
  initialName: string;
  userEmail: string | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onSubmitBudget: (displayName: string, monthlyBudget: number) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const PRESET_BUDGETS = [1500000, 2800000, 4000000];

export function BudgetOnboardingScreen({
  initialName,
  userEmail,
  isDark,
  onToggleTheme,
  onSubmitBudget,
  onSignOut,
}: BudgetOnboardingScreenProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [digitsOnly, setDigitsOnly] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericBudget = digitsOnly ? Number(digitsOnly) : 0;

  function handleAmountChange(raw: string) {
    const cleaned = raw.replace(/[^\d]/g, "");
    setDigitsOnly(cleaned);
    if (errorMsg) setErrorMsg(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMsg("Por favor escribe cómo quieres que te llamemos.");
      return;
    }

    if (!digitsOnly || Number.isNaN(numericBudget) || numericBudget < 1000) {
      setErrorMsg(
        "Ingresa un presupuesto mensual válido desde $1.000 COP para empezar."
      );
      return;
    }

    if (numericBudget > 100000000) {
      setErrorMsg("El presupuesto máximo permitido es $100.000.000 COP.");
      return;
    }

    setErrorMsg(null);
    setIsSaving(true);
    try {
      await onSubmitBudget(cleanName, numericBudget);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "No fue posible guardar tu presupuesto inicial. Intenta de nuevo."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col dashboard-canvas text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <header className="border-b border-indigo-100/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#111424]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B3DF5] to-indigo-800 flex items-center justify-center shadow-xs shrink-0">
              <Wallet className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <span>Mi Presupuesto Mensual</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-pressed={isDark}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="inline-flex items-center gap-1 p-1 min-h-[38px] rounded-full border border-indigo-100 dark:border-slate-700 bg-indigo-50/60 dark:bg-slate-900 transition-colors duration-150 cursor-pointer shrink-0"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  !isDark
                    ? "bg-white text-[#5B3DF5] shadow-xs"
                    : "text-slate-400"
                }`}
              >
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  isDark
                    ? "bg-[#5B3DF5] text-white shadow-xs"
                    : "text-slate-400"
                }`}
              >
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => void onSignOut()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[480px] bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 card-surface space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center mx-auto">
              <Sparkles
                className="w-6 h-6 text-[#5B3DF5] dark:text-indigo-400"
                aria-hidden="true"
              />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              ¿Cuál es tu presupuesto mensual?
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Tu cuenta{" "}
              {userEmail ? (
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  ({userEmail})
                </span>
              ) : null}{" "}
              empieza desde cero. Define cuánto dinero destinarás este mes y
              luego podrás editarlo cuando quieras.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="onboarding-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tu nombre
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="onboarding-name"
                  type="text"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej: Laura"
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="onboarding-budget"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Presupuesto mensual (COP) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono text-base font-bold text-slate-400 pointer-events-none">
                  $
                </span>
                <input
                  id="onboarding-budget"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={formatThousandsCO(digitsOnly)}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="2.800.000"
                  className="w-full pl-9 pr-16 py-3 min-h-[52px] font-mono text-xl font-bold rounded-2xl border border-indigo-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-50 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                />
                <span className="absolute right-4 font-mono text-xs font-semibold text-slate-400 pointer-events-none">
                  COP
                </span>
              </div>

              {numericBudget > 0 && (
                <p className="text-xs font-medium text-[#5B3DF5] dark:text-indigo-400 tabular-nums">
                  Presupuesto inicial: {formatCOP(numericBudget)}
                </p>
              )}

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_BUDGETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDigitsOnly(String(preset));
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border transition-colors cursor-pointer tabular-nums ${
                      numericBudget === preset
                        ? "bg-[#5B3DF5] border-[#5B3DF5] text-white"
                        : "border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#5B3DF5]/50"
                    }`}
                  >
                    {formatCOP(preset)}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-medium text-red-600 dark:text-red-400"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-[48px] px-5 rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
            >
              <span>
                {isSaving
                  ? "Guardando tu presupuesto..."
                  : "Guardar presupuesto y empezar"}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
