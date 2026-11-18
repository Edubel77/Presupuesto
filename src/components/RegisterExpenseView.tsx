import { type FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Wallet,
} from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CURRENT_DAY,
  type ExpenseCategory,
  type ExpenseEntry,
  formatCOP,
} from "../data/budgetData";
import { CategoryIcon } from "./CategoryIcon";

interface RegisterExpenseViewProps {
  currentAvailableBalance: number;
  onSaveExpense: (newExpense: Omit<ExpenseEntry, "id">) => void;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [15000, 30000, 50000, 100000];

export function RegisterExpenseView({
  currentAvailableBalance,
  onSaveExpense,
  onCancel,
}: RegisterExpenseViewProps) {
  const [amountInput, setAmountInput] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("Alimentación");
  const [description, setDescription] = useState<string>("");
  const [day, setDay] = useState<number>(CURRENT_DAY);
  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    day?: string;
  }>({});

  const parsedAmount = Number(amountInput.replace(/[^\d]/g, ""));
  const isValidNumericAmount =
    amountInput.trim().length > 0 && !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const projectedBalance = isValidNumericAmount
    ? currentAvailableBalance - parsedAmount
    : currentAvailableBalance;

  function handleAmountChange(raw: string) {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    setAmountInput(digitsOnly);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextErrors: {
      amount?: string;
      description?: string;
      day?: string;
    } = {};

    if (!amountInput.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = "Ingresa un monto válido mayor a $0 COP.";
    } else if (parsedAmount < 500) {
      nextErrors.amount = "El monto mínimo permitido es $500 COP.";
    } else if (parsedAmount > 20000000) {
      nextErrors.amount = "El monto supera el límite máximo por registro.";
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 2) {
      nextErrors.description =
        "Escribe un concepto breve (al menos 2 caracteres).";
    }

    if (!Number.isInteger(day) || day < 1 || day > CURRENT_DAY) {
      nextErrors.day = `Selecciona un día válido entre el 1 y el ${CURRENT_DAY} de noviembre.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const paddedDay = String(day).padStart(2, "0");
    onSaveExpense({
      type: "expense",
      day,
      dateISO: `2026-11-${paddedDay}`,
      dateLabel: `${day} nov 2026`,
      description: cleanDescription,
      category,
      amount: parsedAmount,
    });
  }

  return (
    <section
      aria-labelledby="register-heading"
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Back link */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver al Dashboard</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          <span>Registro rápido en menos de 30 s</span>
        </span>
      </div>

      {/* Registration Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 card-surface space-y-6 transition-colors duration-200"
      >
        <div className="space-y-1">
          <h1
            id="register-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Registrar nuevo gasto
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa el valor pagado, elige la categoría y guarda para actualizar
            tu saldo disponible al instante.
          </p>
        </div>

        {/* 1. Monto en COP */}
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="expense-amount"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Monto pagado (COP)
            </label>
            {isValidNumericAmount && (
              <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400 tabular-nums">
                {formatCOP(parsedAmount)}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
              $
            </span>
            <input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              autoFocus
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="35000"
              aria-invalid={Boolean(errors.amount)}
              className={`w-full pl-9 pr-16 py-3 min-h-[52px] font-mono text-xl font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 tabular-nums focus:outline-none focus:ring-2 ${
                errors.amount
                  ? "border-red-400 focus:ring-red-500"
                  : "border-indigo-100 dark:border-slate-700 focus:ring-indigo-600"
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
              COP
            </span>
          </div>

          {/* Quick one-tap amount presets */}
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAmountChange(String(preset))}
                className="px-3 py-1.5 min-h-[34px] text-xs font-mono font-medium rounded-lg border border-indigo-100 dark:border-slate-700 bg-indigo-50/40 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer tabular-nums"
              >
                {formatCOP(preset)}
              </button>
            ))}
          </div>

          {errors.amount && (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.amount}</span>
            </p>
          )}
        </div>

        {/* 2. Categoría (one-tap selector) */}
        <div className="space-y-2.5">
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Categoría
          </span>
          <div
            role="radiogroup"
            aria-label="Categoría del gasto"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {CATEGORIES.map((cat) => {
              const palette = CATEGORY_COLORS[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[46px] rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    isSelected
                      ? "bg-[#231D54] dark:bg-indigo-600 text-white border-[#231D54] dark:border-indigo-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50/40 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-white/15" : palette.iconBg
                      }`}
                    >
                      <CategoryIcon
                        category={cat}
                        className={`w-4 h-4 ${
                          isSelected
                            ? "text-white"
                            : `${palette.text} ${palette.darkText}`
                        }`}
                      />
                    </span>
                    <span className="text-xs font-medium truncate">{cat}</span>
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Concepto y Día */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label
              htmlFor="expense-description"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Descripción
            </label>
            <input
              id="expense-description"
              type="text"
              maxLength={80}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Ej. Almuerzo, café, pasaje..."
              aria-invalid={Boolean(errors.description)}
              className={`w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.description
                  ? "border-red-400 focus:ring-red-500"
                  : "border-indigo-100 dark:border-slate-700 focus:ring-indigo-600"
              }`}
            />
            {errors.description && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="expense-day"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Fecha (noviembre)
            </label>
            <select
              id="expense-day"
              value={day}
              onChange={(e) => {
                setDay(Number(e.target.value));
                if (errors.day) {
                  setErrors((prev) => ({ ...prev, day: undefined }));
                }
              }}
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 tabular-nums"
            >
              {Array.from({ length: CURRENT_DAY }, (_, i) => CURRENT_DAY - i).map(
                (d) => (
                  <option key={d} value={d}>
                    {d} nov 2026{d === CURRENT_DAY ? " (Hoy)" : ""}
                  </option>
                )
              )}
            </select>
            {errors.day && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.day}</span>
              </p>
            )}
          </div>
        </div>

        {/* Live Balance Impact Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Wallet
              className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <span>Saldo disponible tras guardar este gasto:</span>
          </div>
          <span
            className={`font-mono font-bold tabular-nums ${
              projectedBalance < 0
                ? "text-red-700 dark:text-red-400"
                : "text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {formatCOP(projectedBalance)}
          </span>
        </div>

        {/* Submit & Cancel Actions */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 min-h-[44px] rounded-xl border border-indigo-100 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Guardar gasto</span>
          </button>
        </div>
      </form>
    </section>
  );
}
