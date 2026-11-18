export type ExpenseCategory =
  | "Alimentación"
  | "Transporte"
  | "Servicios públicos"
  | "Ropa y compras personales"
  | "Entretenimiento y ocio";

export type IncomeCategory =
  | "Salario"
  | "Trabajo independiente"
  | "Negocio"
  | "Inversiones"
  | "Regalo"
  | "Bonificación"
  | "Reembolso"
  | "Otro";

export type PaymentMethod =
  | "Efectivo"
  | "Cuenta bancaria"
  | "Nequi"
  | "Daviplata"
  | "Tarjeta"
  | "Otro";

export type MovementType = "expense" | "income";

export interface MovementEntry {
  id: string;
  type: MovementType;
  day: number;
  dateISO: string;
  dateLabel: string;
  description: string;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

// Keep alias for compatibility across components
export type ExpenseEntry = MovementEntry;

export interface DailySpendPoint {
  day: number;
  dateLabel: string;
  shortDate: string;
  total: number;
  entries: MovementEntry[];
  primaryCategory: ExpenseCategory | null;
}

export const MONTHLY_BUDGET_COP = 2800000;
export const MONTH_LABEL = "Noviembre 2026";
export const CURRENT_DAY = 17;
export const CURRENT_DATE_ISO = "2026-11-17";
export const TOTAL_DAYS_IN_MONTH = 30;

export const CATEGORIES: ExpenseCategory[] = [
  "Alimentación",
  "Servicios públicos",
  "Ropa y compras personales",
  "Entretenimiento y ocio",
  "Transporte",
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  "Salario",
  "Trabajo independiente",
  "Negocio",
  "Inversiones",
  "Regalo",
  "Bonificación",
  "Reembolso",
  "Otro",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo",
  "Cuenta bancaria",
  "Nequi",
  "Daviplata",
  "Tarjeta",
  "Otro",
];

export const CATEGORY_COLORS: Record<
  ExpenseCategory,
  {
    bar: string;
    darkBar: string;
    text: string;
    darkText: string;
    iconBg: string;
    dot: string;
  }
> = {
  Alimentación: {
    bar: "bg-emerald-500",
    darkBar: "dark:bg-emerald-500",
    text: "text-emerald-600",
    darkText: "dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
    dot: "#10B981",
  },
  "Servicios públicos": {
    bar: "bg-sky-500",
    darkBar: "dark:bg-sky-400",
    text: "text-sky-600",
    darkText: "dark:text-sky-400",
    iconBg: "bg-sky-50 dark:bg-sky-950/60",
    dot: "#0EA5E9",
  },
  "Ropa y compras personales": {
    bar: "bg-amber-500",
    darkBar: "dark:bg-amber-400",
    text: "text-amber-600",
    darkText: "dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
    dot: "#F59E0B",
  },
  "Entretenimiento y ocio": {
    bar: "bg-indigo-500",
    darkBar: "dark:bg-indigo-400",
    text: "text-indigo-600",
    darkText: "dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/60",
    dot: "#6366F1",
  },
  Transporte: {
    bar: "bg-slate-500",
    darkBar: "dark:bg-slate-400",
    text: "text-slate-600",
    darkText: "dark:text-slate-300",
    iconBg: "bg-slate-100 dark:bg-slate-800/80",
    dot: "#64748B",
  },
};

export const INITIAL_EXPENSE_ENTRIES: MovementEntry[] = [
  {
    id: "mov-019",
    type: "expense",
    day: 17,
    dateISO: "2026-11-17",
    dateLabel: "17 nov 2026",
    description: "Almuerzo ejecutivo y café de la tarde",
    category: "Alimentación",
    amount: 38500,
  },
  {
    id: "mov-018",
    type: "expense",
    day: 17,
    dateISO: "2026-11-17",
    dateLabel: "17 nov 2026",
    description: "Recarga mensual tarjeta de transporte",
    category: "Transporte",
    amount: 42000,
  },
  {
    id: "mov-017",
    type: "expense",
    day: 16,
    dateISO: "2026-11-16",
    dateLabel: "16 nov 2026",
    description: "Servicio de internet fibra óptica hogar",
    category: "Servicios públicos",
    amount: 128000,
  },
  {
    id: "mov-016",
    type: "expense",
    day: 15,
    dateISO: "2026-11-15",
    dateLabel: "15 nov 2026",
    description: "Camisa básica de algodón",
    category: "Ropa y compras personales",
    amount: 89000,
  },
  {
    id: "mov-015",
    type: "expense",
    day: 15,
    dateISO: "2026-11-15",
    dateLabel: "15 nov 2026",
    description: "Entradas de cine y combo",
    category: "Entretenimiento y ocio",
    amount: 58000,
  },
  {
    id: "mov-014",
    type: "expense",
    day: 14,
    dateISO: "2026-11-14",
    dateLabel: "14 nov 2026",
    description: "Mercado de fin de semana y frutas",
    category: "Alimentación",
    amount: 156000,
  },
  {
    id: "mov-013",
    type: "expense",
    day: 13,
    dateISO: "2026-11-13",
    dateLabel: "13 nov 2026",
    description: "Cena con amigos y bolos",
    category: "Entretenimiento y ocio",
    amount: 62000,
  },
  {
    id: "mov-012",
    type: "expense",
    day: 12,
    dateISO: "2026-11-12",
    dateLabel: "12 nov 2026",
    description: "Chaqueta ligera y calzado casual",
    category: "Ropa y compras personales",
    amount: 185000,
  },
  {
    id: "mov-011",
    type: "expense",
    day: 11,
    dateISO: "2026-11-11",
    dateLabel: "11 nov 2026",
    description: "Almuerzo y onces de oficina",
    category: "Alimentación",
    amount: 36500,
  },
  {
    id: "mov-010",
    type: "expense",
    day: 10,
    dateISO: "2026-11-10",
    dateLabel: "10 nov 2026",
    description: "Factura de acueducto y gas natural",
    category: "Servicios públicos",
    amount: 115000,
  },
  {
    id: "mov-009",
    type: "expense",
    day: 9,
    dateISO: "2026-11-09",
    dateLabel: "9 nov 2026",
    description: "Trayectos urbanos en transporte público",
    category: "Transporte",
    amount: 24000,
  },
  {
    id: "mov-008",
    type: "expense",
    day: 8,
    dateISO: "2026-11-08",
    dateLabel: "8 nov 2026",
    description: "Tarde de café especial y libro",
    category: "Entretenimiento y ocio",
    amount: 54000,
  },
  {
    id: "mov-007",
    type: "expense",
    day: 7,
    dateISO: "2026-11-07",
    dateLabel: "7 nov 2026",
    description: "Mercado semanal en supermercado",
    category: "Alimentación",
    amount: 142000,
  },
  {
    id: "mov-006",
    type: "expense",
    day: 6,
    dateISO: "2026-11-06",
    dateLabel: "6 nov 2026",
    description: "Salida a cenar y música en vivo",
    category: "Entretenimiento y ocio",
    amount: 95000,
  },
  {
    id: "mov-005",
    type: "expense",
    day: 5,
    dateISO: "2026-11-05",
    dateLabel: "5 nov 2026",
    description: "Panadería artesanal y lácteos",
    category: "Alimentación",
    amount: 28000,
  },
  {
    id: "mov-004",
    type: "expense",
    day: 4,
    dateISO: "2026-11-04",
    dateLabel: "4 nov 2026",
    description: "Factura mensual de energía eléctrica",
    category: "Servicios públicos",
    amount: 168000,
  },
  {
    id: "mov-003",
    type: "expense",
    day: 3,
    dateISO: "2026-11-03",
    dateLabel: "3 nov 2026",
    description: "Almuerzo corriente y jugo natural",
    category: "Alimentación",
    amount: 44500,
  },
  {
    id: "mov-002",
    type: "expense",
    day: 2,
    dateISO: "2026-11-02",
    dateLabel: "2 nov 2026",
    description: "Traslados de inicio de semana",
    category: "Transporte",
    amount: 32000,
  },
  {
    id: "mov-001",
    type: "expense",
    day: 1,
    dateISO: "2026-11-01",
    dateLabel: "1 nov 2026",
    description: "Despensa básica de inicio de mes",
    category: "Alimentación",
    amount: 85000,
  },
];

export function formatCOP(value: number): string {
  const abs = Math.round(Math.abs(value));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return value < 0 ? `-$${formatted} COP` : `$${formatted} COP`;
}

export function formatThousandsCO(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatDateSpanishLabel(dateISO: string): string {
  const parts = dateISO.split("-");
  if (parts.length !== 3) return dateISO;
  const [year, monthStr, dayStr] = parts;
  const day = Number(dayStr);
  const monthIdx = Number(monthStr) - 1;
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const monthLabel = months[monthIdx] ?? monthStr;
  if (dateISO === CURRENT_DATE_ISO) {
    return "Hoy";
  }
  return `${day} ${monthLabel} ${year}`;
}

export function formatCompactCOP(value: number): string {
  if (value >= 1000000) {
    const millions = (value / 1000000).toFixed(1).replace(".", ",");
    return `$${millions}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${value}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function isExpenseCategory(cat: string): cat is ExpenseCategory {
  return (CATEGORIES as string[]).includes(cat);
}

export function buildDailySeries(
  entries: MovementEntry[],
  categoryFilter: ExpenseCategory | "Todas" = "Todas"
): DailySpendPoint[] {
  const days: DailySpendPoint[] = [];
  const expenseEntries = entries.filter((entry) => entry.type === "expense");

  for (let d = 1; d <= TOTAL_DAYS_IN_MONTH; d++) {
    const dayEntries = expenseEntries.filter(
      (entry) =>
        entry.day === d &&
        (categoryFilter === "Todas" || entry.category === categoryFilter)
    );
    const total = dayEntries.reduce((sum, item) => sum + item.amount, 0);

    let primaryCategory: ExpenseCategory | null = null;
    if (dayEntries.length > 0) {
      const sorted = [...dayEntries].sort((a, b) => b.amount - a.amount);
      if (isExpenseCategory(sorted[0].category)) {
        primaryCategory = sorted[0].category;
      }
    }

    days.push({
      day: d,
      dateLabel: `${d} nov 2026`,
      shortDate: `${d} nov`,
      total,
      entries: dayEntries,
      primaryCategory,
    });
  }

  return days;
}

export function computeDashboardSummary(
  entries: MovementEntry[],
  baseMonthlyBudget: number = MONTHLY_BUDGET_COP
) {
  const expenseEntries = entries.filter((item) => item.type === "expense");
  const incomeEntries = entries.filter((item) => item.type === "income");

  const totalSpent = expenseEntries.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = incomeEntries.reduce((sum, item) => sum + item.amount, 0);
  const effectiveBudget = baseMonthlyBudget + totalIncome;
  const availableBalance = effectiveBudget - totalSpent;

  const spentPercentage =
    effectiveBudget > 0 ? Math.max(0, (totalSpent / effectiveBudget) * 100) : 100;
  const availablePercentage = Math.max(0, 100 - spentPercentage);
  const remainingDays = TOTAL_DAYS_IN_MONTH - CURRENT_DAY;
  const suggestedDailyLimit =
    availableBalance > 0 ? Math.round(availableBalance / remainingDays) : 0;
  const currentDailyAverage = Math.round(totalSpent / CURRENT_DAY);

  const categoryTotals = CATEGORIES.map((category) => {
    const total = expenseEntries
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      category,
      total,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);

  const dailySeries = buildDailySeries(entries, "Todas").slice(0, CURRENT_DAY);
  const peakDayPoint = [...dailySeries].sort((a, b) => b.total - a.total)[0];

  return {
    monthLabel: MONTH_LABEL,
    currentDay: CURRENT_DAY,
    totalDays: TOTAL_DAYS_IN_MONTH,
    remainingDays,
    baseMonthlyBudget,
    totalIncome,
    monthlyBudget: effectiveBudget,
    totalSpent,
    totalMovements: entries.length,
    totalExpenseMovements: expenseEntries.length,
    availableBalance,
    spentPercentage,
    availablePercentage,
    suggestedDailyLimit,
    currentDailyAverage,
    categoryTotals,
    recentMovements: entries.slice(0, 5),
    peakDay: {
      day: peakDayPoint?.day ?? CURRENT_DAY,
      amount: peakDayPoint?.total ?? 0,
      category: peakDayPoint?.primaryCategory ?? "Alimentación",
    },
  };
}
