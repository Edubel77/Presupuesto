import {
  Bell,
  Calendar,
  FileText,
  Home,
  ListOrdered,
  LogOut,
  Moon,
  PlusCircle,
  Sparkles,
  Sun,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type AppScreen =
  | "dashboard"
  | "movements"
  | "detail"
  | "register"
  | "register-income";

interface TopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  monthLabel: string;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onJumpToAlerts: () => void;
  onOpenAssistant: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
}

export function TopBar({
  isDark,
  onToggleTheme,
  monthLabel,
  currentScreen,
  onNavigate,
  onJumpToAlerts,
  onOpenAssistant,
  userEmail,
  onSignOut,
}: TopBarProps) {
  const navItems: Array<{
    id: AppScreen;
    label: string;
    icon: typeof Home;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "movements", label: "Movimientos", icon: ListOrdered },
    { id: "detail", label: "Detalle", icon: FileText },
    { id: "register", label: "Registrar gasto", icon: PlusCircle },
    { id: "register-income", label: "Registrar ingreso", icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111424]/90 backdrop-blur-md border-b border-indigo-100/80 dark:border-slate-800/90 transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: App icon + Brand wordmark */}
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] rounded-lg"
        >
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B3DF5] to-indigo-800 flex items-center justify-center shadow-xs shrink-0">
            <Wallet className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
          <span>Mi Presupuesto Mensual</span>
        </button>

        {/* Zone 2: Screen navigation */}
        <nav
          aria-label="Pantallas de la aplicación"
          className="hidden lg:flex items-center gap-1 text-xs font-medium"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5] ${
                  isActive
                    ? "bg-[#5B3DF5] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-indigo-50/70 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Assistant button + Period indicator + Theme toggle + Alerts jump */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAssistant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-[#5B3DF5] dark:text-indigo-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Asistente</span>
          </button>

          <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 min-h-[38px] rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
            <Calendar
              className="w-3.5 h-3.5 text-[#5B3DF5] dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>{monthLabel}</span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="inline-flex items-center gap-1 p-1 min-h-[38px] rounded-full border border-indigo-100 dark:border-slate-700 bg-indigo-50/60 dark:bg-slate-900 transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                !isDark
                  ? "bg-white text-[#5B3DF5] shadow-xs"
                  : "text-slate-400"
              }`}
            >
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
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
            onClick={onJumpToAlerts}
            aria-label="Ir a notificaciones inteligentes"
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-[#5B3DF5] dark:hover:text-indigo-300 hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title={userEmail ? `Cerrar sesión (${userEmail})` : "Cerrar sesión"}
            aria-label={
              userEmail ? `Cerrar sesión de ${userEmail}` : "Cerrar sesión"
            }
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/60 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Mobile screen switch strip */}
      <nav
        aria-label="Navegación móvil"
        className="flex lg:hidden items-center justify-between gap-1 overflow-x-auto border-t border-indigo-100/70 dark:border-slate-800 px-2 py-1.5 bg-white/95 dark:bg-[#111424]/95"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={`mob-${item.id}`}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#5B3DF5] text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
