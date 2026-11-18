import { type FormEvent, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Layers,
  Pencil,
  Plus,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { formatCOP, formatPercent } from "../data/budgetData";

interface FinancialSummaryProps {
  monthLabel: string;
  currentDay: number;
  totalDays: number;
  remainingDays: number;
  baseMonthlyBudget: number;
  totalIncome: number;
  monthlyBudget: number;
  totalSpent: number;
  totalExpenseMovements: number;
  availableBalance: number;
  spentPercentage: number;
  availablePercentage: number;
  suggestedDailyLimit: number;
  onOpenRegister: () => void;
  onOpenRegisterIncome: () => void;
  onUpdateBudget: (newBudget: number) => void;
}

export function FinancialSummary({
  monthLabel,
  currentDay,
  totalDays,
  remainingDays,
  baseMonthlyBudget,
  totalIncome,
  monthlyBudget,
  totalSpent,
  totalExpenseMovements,
  availableBalance,
  spentPercentage,
  availablePercentage,
  suggestedDailyLimit,
  onOpenRegister,
  onOpenRegisterIncome,
  onUpdateBudget,
}: FinancialSummaryProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(baseMonthlyBudget));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const monthProgressPercentage = (currentDay / totalDays) * 100;
  const isPositiveBalance = availableBalance >= 0;
  const accountStatusLabel = isPositiveBalance
    ? "Balance positivo"
    : "Balance negativo";
  const barSpentWidth = Math.min(100, Math.max(0, spentPercentage));
  const barAvailableWidth = Math.max(0, 100 - barSpentWidth);

  function handleStartEdit() {
    setBudgetDraft(String(baseMonthlyBudget));
    setBudgetError(null);
    setIsEditingBudget(true);
  }

  function handleCancelEdit() {
    setIsEditingBudget(false);
    setBudgetError(null);
  }

  function handleDraftChange(raw: string) {
    setBudgetDraft(raw.replace(/[^\d]/g, ""));
    if (budgetError) {
      setBudgetError(null);
    }
  }

  function handleSaveBudget(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(budgetDraft);
    if (!budgetDraft.trim() || Number.isNaN(parsed) || parsed < 1000) {
      setBudgetError("Ingresa un presupuesto válido desde $1.000 COP.");
      return;
    }
    if (parsed > 100000000) {
      setBudgetError("El presupuesto máximo permitido es $100.000.000 COP.");
      return;
    }
    onUpdateBudget(parsed);
    setIsEditingBudget(false);
    setBudgetError(null);
  }

  return (
    <section id="resumen" aria-labelledby="resumen-heading" className="space-y-4">
      {/* Period context header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{monthLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Día {currentDay} de {totalDays}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Restan {remainingDays} días del mes
            </span>
          </div>
          <h1
            id="resumen-heading"
            className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance"
          >
            Resumen financiero del mes
          </h1>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          Saldo disponible = Presupuesto disponible − Gastos registrados
        </p>
      </div>

      {/* 3 Separate KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo disponible + Estado de cuenta */}
        <div
          className={`relative overflow-hidden bg-white dark:bg-[#131625] border rounded-2xl p-6 card-surface flex flex-col justify-between gap-3 transition-colors duration-200 ${
            isPositiveBalance
              ? "border-emerald-200/70 dark:border-emerald-900/50"
              : "border-red-300 dark:border-red-800/80 bg-red-50/25 dark:bg-red-950/15"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 220 90"
            className={`pointer-events-none absolute right-0 bottom-0 w-44 h-20 ${
              isPositiveBalance
                ? "text-emerald-500/10 dark:text-emerald-400/10"
                : "text-red-500/12 dark:text-red-400/12"
            }`}
            fill="currentColor"
          >
            <path d="M0,90 C55,85 85,45 140,35 C175,28 200,15 220,0 L220,90 Z" />
          </svg>

          <div className="relative flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Saldo disponible
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                isPositiveBalance
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {isPositiveBalance ? (
                <Wallet className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{accountStatusLabel}</span>
            </span>
          </div>

          <div className="relative space-y-1.5">
            <p
              className={`font-display text-2xl sm:text-[32px] leading-tight font-bold tracking-tight tabular-nums ${
                isPositiveBalance
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {formatCOP(availableBalance)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              <span
                className={`font-semibold ${
                  isPositiveBalance
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {formatPercent(availablePercentage)} disponible
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isPositiveBalance
                  ? `Cupo sugerido: ${formatCOP(suggestedDailyLimit)}/día`
                  : `Excedido por ${formatCOP(Math.abs(availableBalance))}`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Presupuesto disponible (Base editable + ingresos) */}
        <div className="relative overflow-hidden bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 card-surface flex flex-col justify-between gap-3 transition-colors duration-200">
          <svg
            aria-hidden="true"
            viewBox="0 0 220 90"
            className="pointer-events-none absolute right-0 bottom-0 w-44 h-20 text-indigo-500/8 dark:text-indigo-400/10"
            fill="currentColor"
          >
            <path d="M0,90 C60,82 95,52 150,38 C185,29 205,16 220,4 L220,90 Z" />
          </svg>

          <div className="relative flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {totalIncome > 0 ? "Presupuesto disponible" : "Presupuesto mensual"}
            </span>
            {!isEditingBudget ? (
              <button
                type="button"
                onClick={handleStartEdit}
                aria-label="Editar presupuesto mensual"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-lg border border-indigo-100 dark:border-slate-700 bg-indigo-50/60 dark:bg-slate-800/80 text-xs font-medium text-[#5B3DF5] dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
              >
                <Pencil className="w-3 h-3" aria-hidden="true" />
                <span>Editar</span>
              </button>
            ) : (
              <Calendar
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 shrink-0"
                aria-hidden="true"
              />
            )}
          </div>

          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="relative space-y-2.5">
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-sm font-semibold text-slate-400 pointer-events-none">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  aria-label="Nuevo presupuesto mensual base en COP"
                  value={budgetDraft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  className="w-full pl-7 pr-12 py-2 min-h-[40px] font-mono text-base font-bold rounded-xl border border-indigo-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-slate-50 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                />
                <span className="absolute right-3 font-mono text-[11px] font-medium text-slate-400 pointer-events-none">
                  COP
                </span>
              </div>

              {budgetError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-red-600 dark:text-red-400"
                >
                  {budgetError}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                  {budgetDraft ? formatCOP(Number(budgetDraft)) : "$0 COP"}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    aria-label="Cancelar edición"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="submit"
                    aria-label="Guardar presupuesto mensual"
                    className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-[#5B3DF5] text-white text-xs font-semibold hover:bg-[#4B2FE0] cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Aplicar</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="relative space-y-1.5">
              <p className="font-display text-2xl sm:text-[32px] leading-tight font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                {formatCOP(monthlyBudget)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {totalIncome > 0 ? (
                  <>
                    <span>Base {formatCOP(baseMonthlyBudget)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      +{formatCOP(totalIncome)} ingresos
                    </span>
                  </>
                ) : (
                  <span>Toca “Editar” para ajustar el límite del mes</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Total gastado */}
        <div className="relative overflow-hidden bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 card-surface flex flex-col justify-between gap-3 transition-colors duration-200">
          <svg
            aria-hidden="true"
            viewBox="0 0 220 90"
            className="pointer-events-none absolute right-0 bottom-0 w-44 h-20 text-violet-500/8 dark:text-violet-400/10"
            fill="currentColor"
          >
            <path d="M0,90 C55,80 105,55 155,40 C188,30 206,14 220,2 L220,90 Z" />
          </svg>

          <div className="relative flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Total gastado
            </span>
            <Layers
              className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="relative space-y-1.5">
            <p className="font-display text-2xl sm:text-[32px] leading-tight font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
              {formatCOP(totalSpent)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span
                className={
                  !isPositiveBalance
                    ? "font-semibold text-red-600 dark:text-red-400"
                    : ""
                }
              >
                {formatPercent(spentPercentage)} ejecutado
              </span>
              <span aria-hidden="true">·</span>
              <span>{totalExpenseMovements} gastos registrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas: centered balanced block 28px below KPI cards */}
      <div className="my-7 flex justify-center">
        <div
          aria-labelledby="quick-actions-heading"
          className="w-full max-w-[640px] bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl px-5 sm:px-6 py-4 card-surface transition-colors duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
            <h2
              id="quick-actions-heading"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center sm:text-left whitespace-nowrap shrink-0"
            >
              Acciones rápidas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 sm:max-w-[460px]">
              <button
                type="button"
                onClick={onOpenRegisterIncome}
                className="w-full h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:-translate-y-px transition-all duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Registrar ingreso</span>
              </button>

              <button
                type="button"
                onClick={onOpenRegister}
                className="w-full h-11 px-4 rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm hover:-translate-y-px transition-all duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Registrar gasto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Separate Execution Progress Bar + Account Status Card */}
      <div
        className={`bg-white dark:bg-[#131625] border rounded-2xl px-6 py-4 card-surface space-y-2.5 transition-colors duration-200 ${
          isPositiveBalance
            ? "border-indigo-100/90 dark:border-slate-800"
            : "border-red-300 dark:border-red-800/80"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            {isPositiveBalance ? (
              <>
                <CheckCircle2
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-slate-800 dark:text-slate-100">
                  Estado de cuenta:{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {accountStatusLabel}
                  </span>
                </span>
              </>
            ) : (
              <>
                <AlertTriangle
                  className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-red-700 dark:text-red-400">
                  Estado de cuenta: {accountStatusLabel}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-[3px] inline-block ${
                  isPositiveBalance
                    ? "bg-[#5B3DF5] dark:bg-indigo-400"
                    : "bg-red-600 dark:bg-red-500"
                }`}
                aria-hidden="true"
              />
              <span>
                Gastado:{" "}
                <strong
                  className={
                    isPositiveBalance
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-red-700 dark:text-red-400"
                  }
                >
                  {formatPercent(spentPercentage)}
                </strong>
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              |
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-[3px] inline-block ${
                  isPositiveBalance
                    ? "bg-emerald-600 dark:bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
                aria-hidden="true"
              />
              <span>
                Disponible:{" "}
                <strong
                  className={
                    isPositiveBalance
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  }
                >
                  {formatPercent(availablePercentage)}
                </strong>
              </span>
            </span>
          </div>
        </div>

        <div className="relative pt-1 pb-5">
          <div
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round(spentPercentage))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Estado de cuenta: ${accountStatusLabel}. Porcentaje gastado ${formatPercent(spentPercentage)}, disponible ${formatPercent(availablePercentage)}`}
            className="h-3 w-full rounded-full overflow-hidden flex bg-emerald-100 dark:bg-slate-800"
          >
            <div
              style={{ width: `${barSpentWidth}%` }}
              className={`h-full transition-all duration-300 ${
                isPositiveBalance
                  ? "bg-[#5B3DF5]"
                  : "bg-red-600 dark:bg-red-500"
              }`}
            />
            {barAvailableWidth > 0 && (
              <div
                style={{ width: `${barAvailableWidth}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300"
              />
            )}
          </div>

          <div
            style={{ left: `${monthProgressPercentage}%` }}
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          >
            <div className="w-1 h-5 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
              Día {currentDay} ({formatPercent(monthProgressPercentage)})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
