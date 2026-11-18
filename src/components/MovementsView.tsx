import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ListOrdered,
  Plus,
  Receipt,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  type ExpenseCategory,
  formatCOP,
  isExpenseCategory,
  type MovementEntry,
} from "../data/budgetData";
import { CategoryIcon } from "./CategoryIcon";

interface MovementsViewProps {
  entries: MovementEntry[];
  monthLabel: string;
  onSelectMovement: (id: string) => void;
  onBackToDashboard: () => void;
  onOpenRegister: () => void;
  onOpenRegisterIncome: () => void;
}

type MovementFilter = "Todos" | "Ingresos" | "Gastos" | ExpenseCategory;

export function MovementsView({
  entries,
  monthLabel,
  onSelectMovement,
  onBackToDashboard,
  onOpenRegister,
  onOpenRegisterIncome,
}: MovementsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<MovementFilter>("Todos");

  const hasAnyMovements = entries.length > 0;

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...entries]
      .sort((a, b) => b.day - a.day)
      .filter((item) => {
        let matchesFilter = true;
        if (selectedFilter === "Ingresos") {
          matchesFilter = item.type === "income";
        } else if (selectedFilter === "Gastos") {
          matchesFilter = item.type === "expense";
        } else if (selectedFilter !== "Todos") {
          matchesFilter =
            item.type === "expense" && item.category === selectedFilter;
        }

        const matchesQuery =
          query.length === 0 ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.dateLabel.toLowerCase().includes(query);
        return matchesFilter && matchesQuery;
      });
  }, [entries, searchQuery, selectedFilter]);

  const filteredExpensesSum = useMemo(
    () =>
      filteredEntries
        .filter((e) => e.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    [filteredEntries]
  );

  const filteredIncomesSum = useMemo(
    () =>
      filteredEntries
        .filter((e) => e.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    [filteredEntries]
  );

  return (
    <section aria-labelledby="all-movements-heading" className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5B3DF5] dark:text-indigo-400 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Volver al Dashboard</span>
          </button>

          <div className="space-y-0.5">
            <h1
              id="all-movements-heading"
              className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-50"
            >
              Movimientos de {monthLabel}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {hasAnyMovements ? (
                <>
                  Lista cronológica completa · {filteredEntries.length}{" "}
                  {filteredEntries.length === 1 ? "registro" : "registros"}
                  {filteredIncomesSum > 0 && (
                    <>
                      {" "}
                      · Ingresos:{" "}
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        +{formatCOP(filteredIncomesSum)}
                      </span>
                    </>
                  )}
                  {filteredExpensesSum > 0 && (
                    <>
                      {" "}
                      · Gastos:{" "}
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {formatCOP(filteredExpensesSum)}
                      </span>
                    </>
                  )}
                </>
              ) : (
                "Sin movimientos registrados en el periodo actual"
              )}
            </p>
          </div>
        </div>

        {hasAnyMovements && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenRegisterIncome}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              <span>Registrar ingreso</span>
            </button>

            <button
              type="button"
              onClick={onOpenRegister}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Registrar gasto</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State: Movimientos vacío */}
      {!hasAnyMovements ? (
        <div className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl px-6 py-16 card-surface text-center flex flex-col items-center justify-center space-y-4 transition-colors duration-200">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center">
            <Receipt
              className="w-6 h-6 text-[#5B3DF5] dark:text-indigo-400"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              Tus gastos van a vivir aquí
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              cada vez que pagues algo, lo registras y aparece en esta lista
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRegister}
            className="mt-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm hover:-translate-y-px transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Registrar gasto</span>
          </button>
        </div>
      ) : (
        /* Populated Chronological Card */
        <div className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 card-surface space-y-5 transition-colors duration-200">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por concepto, categoría o fecha..."
                aria-label="Buscar movimientos"
                className="w-full pl-10 pr-4 py-2 min-h-[42px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar movimientos"
              className="flex flex-wrap items-center gap-1.5"
            >
              {(["Todos", "Ingresos", "Gastos"] as const).map((tab) => {
                const isActive = selectedFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedFilter(tab)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#5B3DF5] text-white border-[#5B3DF5]"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
              {CATEGORIES.map((category) => {
                const isActive = selectedFilter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedFilter(category)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#5B3DF5] text-white border-[#5B3DF5]"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <CategoryIcon category={category} className="w-3.5 h-3.5" />
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chronological List */}
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center mx-auto">
                <ListOrdered
                  className="w-5 h-5 text-[#5B3DF5] dark:text-indigo-400"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No se encontraron movimientos con este filtro
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("Todos");
                }}
                className="text-xs font-medium text-[#5B3DF5] dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map((item) => {
                const isIncome = item.type === "income";
                const palette =
                  !isIncome && isExpenseCategory(item.category)
                    ? CATEGORY_COLORS[item.category]
                    : null;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMovement(item.id)}
                      className="w-full text-left py-3.5 flex items-center justify-between gap-4 hover:bg-indigo-50/45 dark:hover:bg-slate-800/40 -mx-2 px-3 rounded-xl transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {isIncome ? (
                          <div
                            className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-lg"
                            aria-hidden="true"
                          >
                            💰
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl ${palette?.iconBg ?? "bg-slate-100 dark:bg-slate-800"} flex items-center justify-center shrink-0`}
                          >
                            {isExpenseCategory(item.category) && (
                              <CategoryIcon
                                category={item.category}
                                className={`w-4 h-4 ${palette?.text ?? ""} ${palette?.darkText ?? ""}`}
                              />
                            )}
                          </div>
                        )}

                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {isIncome ? (
                              <>
                                <span className="tabular-nums">{item.dateLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                  Ingreso
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{item.category}</span>
                              </>
                            ) : (
                              <>
                                <span>{item.category}</span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{item.dateLabel}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="font-mono uppercase text-[11px]">
                              {item.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono text-sm sm:text-base font-semibold tabular-nums whitespace-nowrap ${
                            isIncome
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {isIncome
                            ? `+${formatCOP(item.amount)}`
                            : formatCOP(-item.amount)}
                        </span>
                        <ChevronRight
                          className="w-4 h-4 text-slate-400 dark:text-slate-500"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
