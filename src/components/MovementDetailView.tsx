import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  MessageSquare,
  Pencil,
  PieChart,
  Tag,
} from "lucide-react";
import {
  CATEGORY_COLORS,
  formatCOP,
  formatPercent,
  isExpenseCategory,
  type MovementEntry,
} from "../data/budgetData";
import { CategoryIcon } from "./CategoryIcon";

interface MovementDetailViewProps {
  entry: MovementEntry | null;
  categoryTotal: number;
  monthlyBudget: number;
  backLabel: string;
  onBack: () => void;
}

export function MovementDetailView({
  entry,
  categoryTotal,
  monthlyBudget,
  backLabel,
  onBack,
}: MovementDetailViewProps) {
  // Detalle vacío: soft muted text only, sin botón
  if (!entry) {
    return (
      <section
        aria-label="Detalle del movimiento vacío"
        className="max-w-3xl mx-auto"
      >
        <div className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl px-6 py-20 card-surface text-center transition-colors duration-200">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selecciona un gasto en Movimientos para ver el detalle
          </p>
        </div>
      </section>
    );
  }

  const isIncome = entry.type === "income";
  const palette =
    !isIncome && isExpenseCategory(entry.category)
      ? CATEGORY_COLORS[entry.category]
      : null;

  const shareOfBudget =
    monthlyBudget > 0 ? (entry.amount / monthlyBudget) * 100 : 0;
  const shareOfCategory =
    categoryTotal > 0 ? (entry.amount / categoryTotal) * 100 : 100;

  return (
    <section
      aria-labelledby="detail-heading"
      className="max-w-3xl mx-auto space-y-5"
    >
      {/* Top action bar: Volver + Editar (sin funcionalidad) */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>

        <button
          type="button"
          aria-label="Editar movimiento (sin funcionalidad)"
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
          <span>Editar</span>
        </button>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl overflow-hidden card-surface transition-colors duration-200">
        {/* Hero amount header */}
        <div className="p-6 sm:p-8 border-b border-indigo-100/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {isIncome ? (
              <div
                className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-2xl"
                aria-hidden="true"
              >
                💰
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-2xl ${palette?.iconBg ?? "bg-slate-100 dark:bg-slate-800"} flex items-center justify-center shrink-0`}
              >
                {isExpenseCategory(entry.category) && (
                  <CategoryIcon
                    category={entry.category}
                    className={`w-6 h-6 ${palette?.text ?? ""} ${palette?.darkText ?? ""}`}
                  />
                )}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isIncome ? "Detalle del ingreso" : "Detalle del movimiento"}
              </p>
              <h1
                id="detail-heading"
                className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 text-balance"
              >
                {entry.description}
              </h1>
            </div>
          </div>

          <div className="sm:text-right shrink-0 space-y-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isIncome ? "Ingreso registrado" : "Monto registrado"}
            </span>
            <p
              className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${
                isIncome
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-slate-900 dark:text-slate-50"
              }`}
            >
              {isIncome
                ? `+${formatCOP(entry.amount)}`
                : formatCOP(-entry.amount)}
            </p>
          </div>
        </div>

        {/* Full Metadata Grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Tag
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  Categoría
                </dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {entry.category}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  Fecha
                </dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {entry.dateLabel} ({entry.dateISO})
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  Concepto completo
                </dt>
                <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {entry.description}
                </dd>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <Hash
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  Referencia del registro
                </dt>
                <dd className="text-sm font-mono font-semibold uppercase text-slate-900 dark:text-slate-100 tabular-nums">
                  {entry.id}
                </dd>
              </div>
            </div>

            {entry.paymentMethod && (
              <div className="flex items-start gap-3">
                <CreditCard
                  className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Medio de pago
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {entry.paymentMethod}
                  </dd>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <PieChart
                className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {isIncome
                    ? "Aporte al presupuesto disponible"
                    : "Impacto en el presupuesto mensual"}
                </dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatPercent(shareOfBudget)} de {formatCOP(monthlyBudget)}
                </dd>
              </div>
            </div>

            {!isIncome && isExpenseCategory(entry.category) && (
              <div className="flex items-start gap-3">
                <CategoryIcon
                  category={entry.category}
                  className={`w-4 h-4 mt-0.5 shrink-0 ${palette?.text ?? ""} ${palette?.darkText ?? ""}`}
                />
                <div className="space-y-0.5">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Peso dentro de {entry.category}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatPercent(shareOfCategory)} de {formatCOP(categoryTotal)}
                  </dd>
                </div>
              </div>
            )}

            {entry.notes && (
              <div className="flex items-start gap-3">
                <MessageSquare
                  className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Observaciones
                  </dt>
                  <dd className="text-sm text-slate-700 dark:text-slate-300">
                    {entry.notes}
                  </dd>
                </div>
              </div>
            )}
          </div>
        </dl>
      </div>
    </section>
  );
}
