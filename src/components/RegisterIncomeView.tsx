import { type FormEvent, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderOpen,
  MessageSquare,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CURRENT_DATE_ISO,
  formatCOP,
  formatDateSpanishLabel,
  formatThousandsCO,
  INCOME_CATEGORIES,
  type IncomeCategory,
  type MovementEntry,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "../data/budgetData";

interface RegisterIncomeViewProps {
  currentAvailableBalance: number;
  currentEffectiveBudget: number;
  onSaveIncome: (newIncome: Omit<MovementEntry, "id">) => void;
  onCancel: () => void;
}

const QUICK_INCOME_PRESETS = [250000, 500000, 850000, 2500000];

export function RegisterIncomeView({
  currentAvailableBalance,
  currentEffectiveBudget,
  onSaveIncome,
  onCancel,
}: RegisterIncomeViewProps) {
  const [amountDigits, setAmountDigits] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<IncomeCategory>("Salario");
  const [dateISO, setDateISO] = useState<string>(CURRENT_DATE_ISO);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Cuenta bancaria");
  const [notes, setNotes] = useState<string>("");
  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    dateISO?: string;
  }>({});
  const [isSavingSuccess, setIsSavingSuccess] = useState<boolean>(false);

  const numericAmount = Number(amountDigits);
  const hasValidAmount =
    amountDigits.length > 0 && !Number.isNaN(numericAmount) && numericAmount > 0;
  const formattedInputDisplay = formatThousandsCO(amountDigits);

  const projectedBalance = hasValidAmount
    ? currentAvailableBalance + numericAmount
    : currentAvailableBalance;
  const projectedBudget = hasValidAmount
    ? currentEffectiveBudget + numericAmount
    : currentEffectiveBudget;

  function handleAmountInputChange(raw: string) {
    // Prevent negative signs or non-numeric characters; keep digits only
    const digitsOnly = raw.replace(/[^\d]/g, "");
    // Strip leading zeros except empty
    const normalized = digitsOnly.replace(/^0+/, "");
    setAmountDigits(normalized);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSavingSuccess) return;

    const nextErrors: {
      amount?: string;
      description?: string;
      dateISO?: string;
    } = {};

    if (!amountDigits || Number.isNaN(numericAmount) || numericAmount <= 0) {
      nextErrors.amount =
        "Por favor ingresa un valor de ingreso mayor a $0 COP.";
    } else if (numericAmount > 100000000) {
      nextErrors.amount = "El monto ingresado supera el límite máximo ($100.000.000 COP).";
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 2) {
      nextErrors.description =
        "Escribe una descripción para identificar este ingreso (mínimo 2 caracteres).";
    }

    if (!dateISO) {
      nextErrors.dateISO = "Selecciona una fecha válida para el ingreso.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const parsedDay = Number(dateISO.split("-")[2]) || 17;

    setIsSavingSuccess(true);

    setTimeout(() => {
      onSaveIncome({
        type: "income",
        day: parsedDay,
        dateISO,
        dateLabel: formatDateSpanishLabel(dateISO),
        description: cleanDescription,
        category,
        amount: numericAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    }, 950);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="register-income-heading"
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Top navigation strip */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-[#131625] text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver al Dashboard</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Aumenta el presupuesto disponible</span>
        </span>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 card-surface space-y-6 transition-colors duration-200"
      >
        <div className="space-y-1">
          <h1
            id="register-income-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Registrar Nuevo Ingreso
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registra cualquier ingreso recibido durante el mes para actualizar
            automáticamente tu presupuesto disponible.
          </p>
        </div>

        {/* Success animation feedback */}
        {isSavingSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <span>✅ Ingreso registrado correctamente.</span>
          </motion.div>
        )}

        {/* 1. Valor del ingreso (obligatorio, auto-formatted COP) */}
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="income-amount"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              <span aria-hidden="true">💰</span>
              <span>Valor del ingreso</span>
              <span className="text-[#5B3DF5] dark:text-indigo-400">*</span>
            </label>
            {hasValidAmount && (
              <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                +{formatCOP(numericAmount)}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
              $
            </span>
            <input
              id="income-amount"
              type="text"
              inputMode="numeric"
              autoFocus
              disabled={isSavingSuccess}
              value={formattedInputDisplay}
              onChange={(e) => handleAmountInputChange(e.target.value)}
              placeholder="850.000"
              aria-required="true"
              aria-invalid={Boolean(errors.amount)}
              className={`w-full pl-9 pr-16 py-3 min-h-[52px] font-mono text-xl font-bold rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 tabular-nums focus:outline-none focus:ring-2 transition-colors ${
                errors.amount
                  ? "border-red-400 focus:ring-red-500"
                  : "border-indigo-100 dark:border-slate-700 focus:ring-[#5B3DF5]"
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
              COP
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_INCOME_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={isSavingSuccess}
                onClick={() => handleAmountInputChange(String(preset))}
                className="px-3 py-1.5 min-h-[34px] text-xs font-mono font-medium rounded-lg border border-indigo-100 dark:border-slate-700 bg-indigo-50/40 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-100/70 dark:hover:bg-slate-800 hover:-translate-y-px transition-all cursor-pointer tabular-nums"
              >
                +{formatCOP(preset)}
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

        {/* 2. Descripción */}
        <div className="space-y-2">
          <label
            htmlFor="income-description"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            <FileText
              className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>Descripción</span>
            <span className="text-[#5B3DF5] dark:text-indigo-400">*</span>
          </label>
          <input
            id="income-description"
            type="text"
            maxLength={90}
            disabled={isSavingSuccess}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="Ej. Salario, Freelance, Venta de computador, Bonificación, Reembolso"
            aria-required="true"
            aria-invalid={Boolean(errors.description)}
            className={`w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              errors.description
                ? "border-red-400 focus:ring-red-500"
                : "border-indigo-100 dark:border-slate-700 focus:ring-[#5B3DF5]"
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

        {/* 3. Categoría & Fecha & Medio de pago */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Categoría dropdown */}
          <div className="space-y-2">
            <label
              htmlFor="income-category"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              <FolderOpen
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400"
                aria-hidden="true"
              />
              <span>Categoría</span>
            </label>
            <select
              id="income-category"
              disabled={isSavingSuccess}
              value={category}
              onChange={(e) => setCategory(e.target.value as IncomeCategory)}
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
            >
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha del ingreso */}
          <div className="space-y-2">
            <label
              htmlFor="income-date"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              <Calendar
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400"
                aria-hidden="true"
              />
              <span>Fecha del ingreso</span>
            </label>
            <input
              id="income-date"
              type="date"
              disabled={isSavingSuccess}
              value={dateISO}
              onChange={(e) => {
                setDateISO(e.target.value);
                if (errors.dateISO) {
                  setErrors((prev) => ({ ...prev, dateISO: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.dateISO)}
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5] tabular-nums"
            />
            {errors.dateISO && (
              <p
                role="alert"
                className="text-xs font-medium text-red-600 dark:text-red-400"
              >
                {errors.dateISO}
              </p>
            )}
          </div>

          {/* Medio de pago */}
          <div className="space-y-2">
            <label
              htmlFor="income-payment-method"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              <CreditCard
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400"
                aria-hidden="true"
              />
              <span>Medio de pago</span>
            </label>
            <select
              id="income-payment-method"
              disabled={isSavingSuccess}
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Observaciones (opcional) */}
        <div className="space-y-2">
          <label
            htmlFor="income-notes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            <MessageSquare
              className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>Observaciones</span>
            <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="income-notes"
            rows={3}
            maxLength={300}
            disabled={isSavingSuccess}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales sobre el origen o detalle de este ingreso..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5] resize-none"
          />
        </div>

        {/* Live Budget & Balance Impact Preview */}
        <div className="px-4 py-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Wallet
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span>Nuevo presupuesto disponible:</span>
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCOP(projectedBudget)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pl-6">
            <span className="text-slate-600 dark:text-slate-400">
              Nuevo saldo disponible:
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCOP(projectedBalance)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <motion.button
            type="button"
            disabled={isSavingSuccess}
            onClick={onCancel}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </motion.button>

          <motion.button
            type="submit"
            disabled={isSavingSuccess}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] dark:bg-[#5B3DF5] dark:hover:bg-[#6D52F7] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>
              {isSavingSuccess ? "Guardando..." : "Guardar ingreso"}
            </span>
          </motion.button>
        </div>
      </form>
    </motion.section>
  );
}
