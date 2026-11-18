import { useMemo, useState } from "react";
import { BarChart3, Calendar, PieChart, TrendingUp } from "lucide-react";
import {
  buildDailySeries,
  CATEGORIES,
  CATEGORY_COLORS,
  CURRENT_DAY,
  type ExpenseCategory,
  type ExpenseEntry,
  formatCompactCOP,
  formatCOP,
  formatPercent,
} from "../data/budgetData";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryTotalItem {
  category: ExpenseCategory;
  total: number;
  percentage: number;
}

interface DailyExpensesChartProps {
  entries: ExpenseEntry[];
  categoryTotals: CategoryTotalItem[];
  totalSpent: number;
}

type ChartMode = "bars" | "line";

export function DailyExpensesChart({
  entries,
  categoryTotals,
  totalSpent,
}: DailyExpensesChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("bars");
  const [selectedCategory, setSelectedCategory] = useState<
    ExpenseCategory | "Todas"
  >("Todas");
  const [activeDay, setActiveDay] = useState<number>(17);

  const series = useMemo(
    () => buildDailySeries(entries, selectedCategory),
    [entries, selectedCategory]
  );

  const elapsedSeries = series.slice(0, CURRENT_DAY);
  const filteredTotal = elapsedSeries.reduce((sum, p) => sum + p.total, 0);
  const averageDaily = Math.round(filteredTotal / CURRENT_DAY);

  const maxSpend = useMemo(() => {
    const peak = Math.max(...elapsedSeries.map((d) => d.total), 40000);
    const step = Math.ceil(peak / 4 / 1000) * 1000;
    return Math.max(step * 4, 40000);
  }, [elapsedSeries]);

  const activePoint =
    series.find((d) => d.day === activeDay) ?? series[CURRENT_DAY - 1];

  const svgWidth = 720;
  const svgHeight = 235;
  const padLeft = 48;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 34;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(maxSpend * ratio),
    y: padTop + plotHeight * (1 - ratio),
  }));

  const stepX = plotWidth / series.length;
  const barWidth = Math.max(8, stepX * 0.62);
  const avgY = padTop + plotHeight * (1 - Math.min(averageDaily / maxSpend, 1));

  const linePoints = elapsedSeries.map((pt, idx) => {
    const x = padLeft + idx * stepX + stepX / 2;
    const y = padTop + plotHeight * (1 - pt.total / maxSpend);
    return { x, y, pt };
  });

  const linePath = linePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePoints.length > 0
      ? `${linePath} L ${linePoints[linePoints.length - 1].x.toFixed(1)} ${(padTop + plotHeight).toFixed(1)} L ${linePoints[0].x.toFixed(1)} ${(padTop + plotHeight).toFixed(1)} Z`
      : "";

  return (
    <section
      id="gastos-diarios"
      aria-labelledby="chart-heading"
      className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 card-surface space-y-5 transition-colors duration-200"
    >
      {/* Header with soft lavender icon badge + Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
            <BarChart3
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-0.5">
            <h2
              id="chart-heading"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-50"
            >
              Gráfico de gastos diarios
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Evolución diaria del 1 al {CURRENT_DAY} de noviembre · Promedio:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {formatCOP(averageDaily)}
              </span>
            </p>
          </div>
        </div>

        {/* Interactive Barras | Línea Toggle */}
        <div
          role="group"
          aria-label="Tipo de gráfico"
          className="inline-flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900 border border-indigo-100/80 dark:border-slate-800 rounded-xl self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setChartMode("bars")}
            aria-pressed={chartMode === "bars"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              chartMode === "bars"
                ? "bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Barras</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode("line")}
            aria-pressed={chartMode === "line"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              chartMode === "line"
                ? "bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Línea</span>
          </button>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div
        role="group"
        aria-label="Filtrar por categoría"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setSelectedCategory("Todas")}
          aria-pressed={selectedCategory === "Todas"}
          className={`px-3.5 py-1.5 min-h-[36px] text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
            selectedCategory === "Todas"
              ? "bg-[#231D54] dark:bg-indigo-600 text-white border-[#231D54] dark:border-indigo-600 shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800"
          }`}
        >
          Todas
        </button>
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                isActive
                  ? "bg-[#231D54] dark:bg-indigo-600 text-white border-[#231D54] dark:border-indigo-600 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-indigo-100 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800"
              }`}
            >
              <CategoryIcon category={category} className="w-3.5 h-3.5" />
              <span>{category}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Readout Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-indigo-100/80 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
          <Calendar
            className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0"
            aria-hidden="true"
          />
          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {activePoint.dateLabel}
          </span>
          <span aria-hidden="true">·</span>
          {activePoint.day > CURRENT_DAY ? (
            <span className="text-slate-500 dark:text-slate-400">
              Día restante del mes sin registros aún
            </span>
          ) : activePoint.entries.length > 0 ? (
            <span>
              {activePoint.entries.map((e) => e.description).join(" / ")}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              Sin gastos en esta categoría
            </span>
          )}
        </div>
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-50 tabular-nums whitespace-nowrap shrink-0">
          {formatCOP(activePoint.total)}
        </span>
      </div>

      {/* Responsive SVG Chart with gradient indigo-violet bars */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Gráfico de gastos diarios en pesos colombianos durante noviembre"
          className="w-full min-w-[540px] h-auto select-none"
        >
          <defs>
            <linearGradient id="indigoBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#2E266D" />
            </linearGradient>
            <linearGradient id="indigoBarActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines & Y labels */}
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={svgWidth - padRight}
                y2={tick.y}
                className="stroke-slate-200/75 dark:stroke-slate-800"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {formatCompactCOP(tick.value)}
              </text>
            </g>
          ))}

          {/* Daily Average Dashed Reference Line */}
          {averageDaily > 0 && (
            <line
              x1={padLeft}
              y1={avgY}
              x2={svgWidth - padRight}
              y2={avgY}
              strokeDasharray="4 4"
              className="stroke-amber-500 dark:stroke-amber-400"
              strokeWidth="1.35"
            />
          )}

          {/* Bars or Line */}
          {chartMode === "bars" ? (
            <g>
              {series.map((pt, idx) => {
                const isFuture = pt.day > CURRENT_DAY;
                const isSelected = pt.day === activeDay;
                const x = padLeft + idx * stepX + (stepX - barWidth) / 2;
                const barH = isFuture
                  ? 4
                  : Math.max(
                      pt.total > 0 ? 5 : 3,
                      (pt.total / maxSpend) * plotHeight
                    );
                const y = padTop + plotHeight - barH;

                return (
                  <g
                    key={pt.day}
                    onMouseEnter={() => setActiveDay(pt.day)}
                    onClick={() => setActiveDay(pt.day)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={padLeft + idx * stepX}
                      y={padTop}
                      width={stepX}
                      height={plotHeight + 24}
                      fill="transparent"
                    />
                    {isFuture || pt.total === 0 ? (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx={2}
                        className="fill-indigo-100 dark:fill-slate-800"
                      />
                    ) : (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx={4}
                        fill={
                          isSelected
                            ? "url(#indigoBarActive)"
                            : "url(#indigoBarGrad)"
                        }
                        opacity={isSelected ? 1 : 0.88}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              {areaPath && (
                <path
                  d={areaPath}
                  className="fill-indigo-500/12 dark:fill-indigo-400/15"
                />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-indigo-600 dark:stroke-indigo-400"
                />
              )}
              {linePoints.map(({ x, y, pt }) => {
                const isSelected = pt.day === activeDay;
                return (
                  <g
                    key={pt.day}
                    onMouseEnter={() => setActiveDay(pt.day)}
                    onClick={() => setActiveDay(pt.day)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - stepX / 2}
                      y={padTop}
                      width={stepX}
                      height={plotHeight + 24}
                      fill="transparent"
                    />
                    {isSelected && (
                      <line
                        x1={x}
                        y1={padTop}
                        x2={x}
                        y2={padTop + plotHeight}
                        className="stroke-indigo-300 dark:stroke-indigo-700"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 5 : 3.2}
                      className={
                        isSelected
                          ? "fill-indigo-700 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
                          : "fill-white dark:fill-slate-900 stroke-indigo-600 dark:stroke-indigo-400"
                      }
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* X-axis day ticks with Day 17 highlighted */}
          {series.map((pt, idx) => {
            const showLabel =
              pt.day === 1 ||
              pt.day === 5 ||
              pt.day === 10 ||
              pt.day === 15 ||
              pt.day === CURRENT_DAY ||
              pt.day === 20 ||
              pt.day === 25 ||
              pt.day === 30;
            if (!showLabel) return null;
            const x = padLeft + idx * stepX + stepX / 2;
            const isCurrent = pt.day === CURRENT_DAY;
            return (
              <g key={`xlabel-${pt.day}`}>
                {isCurrent && (
                  <rect
                    x={x - 13}
                    y={svgHeight - 21}
                    width={26}
                    height={17}
                    rx={6}
                    className="fill-indigo-100 dark:fill-indigo-950/90"
                  />
                )}
                <text
                  x={x}
                  y={svgHeight - 9}
                  textAnchor="middle"
                  className={`text-[10px] font-mono tabular-nums ${
                    isCurrent
                      ? "fill-indigo-900 dark:fill-indigo-300 font-semibold"
                      : "fill-slate-400 dark:fill-slate-500"
                  }`}
                >
                  {pt.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Category Distribution Breakdown matching mockup */}
      <div className="pt-5 border-t border-indigo-100/80 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
              <PieChart
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Distribución por categoría
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            Total: {formatCOP(totalSpent)}
          </span>
        </div>

        <div className="space-y-2.5">
          {categoryTotals.map((item) => {
            const palette = CATEGORY_COLORS[item.category];
            return (
              <div
                key={item.category}
                className="flex items-center gap-3.5"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${palette.iconBg} flex items-center justify-center shrink-0`}
                >
                  <CategoryIcon
                    category={item.category}
                    className={`w-4 h-4 ${palette.text} ${palette.darkText}`}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400 w-12 text-right">
                        {formatPercent(item.percentage)}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 w-28 text-right">
                        {formatCOP(item.total)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full rounded-full ${palette.bar} ${palette.darkBar}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
