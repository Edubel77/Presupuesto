import { ArrowLeftRight, ChevronRight } from "lucide-react";
import {
  CATEGORY_COLORS,
  formatCOP,
  isExpenseCategory,
  type MovementEntry,
} from "../data/budgetData";
import { CategoryIcon } from "./CategoryIcon";

interface RecentMovementsProps {
  movements: MovementEntry[];
  totalCount: number;
  onSelectMovement: (id: string) => void;
  onViewAllMovements: () => void;
}

export function RecentMovements({
  movements,
  totalCount,
  onSelectMovement,
  onViewAllMovements,
}: RecentMovementsProps) {
  return (
    <section
      id="movimientos"
      aria-labelledby="movements-heading"
      className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 card-surface space-y-4 transition-colors duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
            <ArrowLeftRight
              className="w-4 h-4 text-[#5B3DF5] dark:text-indigo-400"
              aria-hidden="true"
            />
          </div>
          <h2
            id="movements-heading"
            className="font-display text-lg font-bold text-slate-900 dark:text-slate-50 truncate"
          >
            Últimos movimientos
          </h2>
        </div>

        <button
          type="button"
          onClick={onViewAllMovements}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#5B3DF5] dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] rounded"
        >
          <span>Ver todos ({totalCount})</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {movements.map((item) => {
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
                className="w-full text-left py-3 flex items-center justify-between gap-3.5 hover:bg-indigo-50/45 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isIncome ? (
                    <div
                      className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-base"
                      aria-hidden="true"
                    >
                      💰
                    </div>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl ${palette?.iconBg ?? "bg-slate-100 dark:bg-slate-800"} flex items-center justify-center shrink-0`}
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
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
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
                    className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
