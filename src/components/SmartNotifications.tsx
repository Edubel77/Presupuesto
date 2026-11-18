import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpCircle,
  Check,
  CheckCircle2,
  Info,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { ExpenseEntry } from "../data/budgetData";

export interface SmartNotification {
  id: string;
  level: "nominal" | "attention" | "limit";
  tag: string;
  title: string;
  message: string;
  metricHighlight: string;
}

interface SmartNotificationsProps {
  summaryPayload: {
    monthLabel: string;
    currentDay: number;
    totalDays: number;
    monthlyBudget: number;
    totalSpent: number;
    availableBalance: number;
    categories: Array<{ category: string; total: number; percentage: number }>;
    recentMovements: ExpenseEntry[];
    peakDay: { day: number; amount: number; category: string };
  };
}

export function SmartNotifications({ summaryPayload }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDismissedIds([]);

    try {
      const response = await fetch("/api/smart-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthLabel: summaryPayload.monthLabel,
          currentDay: summaryPayload.currentDay,
          totalDays: summaryPayload.totalDays,
          monthlyBudget: summaryPayload.monthlyBudget,
          totalSpent: summaryPayload.totalSpent,
          availableBalance: summaryPayload.availableBalance,
          categories: summaryPayload.categories,
          recentMovements: summaryPayload.recentMovements.map((m) => ({
            description: m.description,
            category: m.category,
            amount: m.amount,
            dateLabel: m.dateLabel,
          })),
          peakDay: summaryPayload.peakDay,
        }),
      });

      const data = (await response.json()) as {
        notifications?: SmartNotification[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "No fue posible obtener las notificaciones inteligentes."
        );
      }

      setNotifications(data.notifications ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de conexión al consultar alertas inteligentes."
      );
    } finally {
      setLoading(false);
    }
  }, [summaryPayload]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  function handleDismiss(id: string) {
    setDismissedIds((prev) => [...prev, id]);
  }

  return (
    <section
      id="alertas"
      aria-labelledby="notifications-heading"
      className="bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-6 card-surface space-y-4 transition-colors duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
            <Zap
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
          </div>
          <h2
            id="notifications-heading"
            className="font-display text-lg font-bold text-slate-900 dark:text-slate-50 truncate"
          >
            Notificaciones inteligentes
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void fetchNotifications()}
          disabled={loading}
          aria-label="Actualizar notificaciones inteligentes"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span>{loading ? "Analizando..." : "Actualizar"}</span>
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando alertas">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="py-3 border-t first:border-t-0 border-slate-100 dark:border-slate-800 space-y-2 animate-pulse"
            >
              <div className="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 space-y-2.5"
        >
          <div className="flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            className="inline-flex items-center px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors cursor-pointer"
          >
            Reintentar análisis
          </button>
        </div>
      )}

      {/* Empty dismissed state */}
      {!loading && !error && visibleNotifications.length === 0 && (
        <div className="py-6 text-center space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Todas las alertas han sido revisadas.
          </p>
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Generar nuevo resumen de alertas
          </button>
        </div>
      )}

      {/* Populated Notifications List */}
      {!loading && !error && visibleNotifications.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleNotifications.map((item) => {
            const levelConfig =
              item.level === "limit"
                ? {
                    icon: ArrowUpCircle,
                    labelColor: "text-amber-700 dark:text-amber-400",
                  }
                : item.level === "attention"
                  ? {
                      icon: Info,
                      labelColor: "text-emerald-700 dark:text-emerald-400",
                    }
                  : {
                      icon: CheckCircle2,
                      labelColor: "text-emerald-700 dark:text-emerald-400",
                    };

            const LevelIcon = levelConfig.icon;

            return (
              <li
                key={item.id}
                className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 font-medium ${levelConfig.labelColor}`}
                    >
                      <LevelIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{item.tag}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-slate-300 dark:text-slate-700"
                    >
                      ·
                    </span>
                    <span className="font-mono font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                      {item.metricHighlight}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(item.id)}
                  aria-label={`Marcar alerta como leída: ${item.title}`}
                  title="Marcar como leída"
                  className="p-2 min-w-[36px] min-h-[36px] rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
