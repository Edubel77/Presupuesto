import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, CheckCircle2, Loader2, Plus, X } from "lucide-react";
import {
  AssistantDrawer,
  type AssistantMessage,
  type RegisteredExpenseReceipt,
} from "./components/AssistantDrawer";
import { AuthScreen } from "./components/AuthScreen";
import { BudgetOnboardingScreen } from "./components/BudgetOnboardingScreen";
import { DailyExpensesChart } from "./components/DailyExpensesChart";
import { FinancialSummary } from "./components/FinancialSummary";
import { MovementDetailView } from "./components/MovementDetailView";
import { MovementsView } from "./components/MovementsView";
import { RecentMovements } from "./components/RecentMovements";
import { RegisterExpenseView } from "./components/RegisterExpenseView";
import { RegisterIncomeView } from "./components/RegisterIncomeView";
import { SmartNotifications } from "./components/SmartNotifications";
import { type AppScreen, TopBar } from "./components/TopBar";
import {
  computeDashboardSummary,
  CURRENT_DATE_ISO,
  formatCOP,
  formatDateSpanishLabel,
  MONTHLY_BUDGET_COP,
  type MovementEntry,
} from "./data/budgetData";
import {
  addMovementDoc,
  auth,
  type BudgetConfigDoc,
  db,
  handleFirestoreError,
  OperationType,
  saveInitialBudgetConfig,
  updateMonthlyBudgetDoc,
  updateUserDisplayNameDoc,
} from "./firebase";

const THEME_STORAGE_KEY = "mi-presupuesto-theme";

function createWelcomeMessage(): AssistantMessage {
  return {
    id: "ast-welcome",
    role: "assistant",
    text: 'Hola, soy tu asistente de presupuesto. Puedes escribirme, enviarme una foto de tu recibo o grabar una nota de voz para registrar gastos (ej. "Gasté 25.000 en almuerzo hoy") o preguntarme cuánto saldo disponible tienes.',
    timestamp: "Ahora",
  };
}

function resolveDefaultUserName(user: User | null): string {
  if (!user) return "Usuario";
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }
  if (user.email) {
    return user.email.split("@")[0] || "Usuario";
  }
  return "Usuario";
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return false;
  });

  // Firebase Auth & Per-User Firestore State
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  const [movementsLoaded, setMovementsLoaded] = useState<boolean>(false);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfigDoc | null>(
    null
  );
  const [entries, setEntries] = useState<MovementEntry[]>([]);

  // Navigation & UI State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("dashboard");
  const [previousScreen, setPreviousScreen] = useState<
    "dashboard" | "movements"
  >("dashboard");
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(
    null
  );
  const [lastSavedMovement, setLastSavedMovement] =
    useState<MovementEntry | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >(() => [createWelcomeMessage()]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // Ignore storage write errors in restricted contexts
    }
  }, [isDark]);

  // Listen to Firebase Auth state and clear account-scoped data immediately on switch/sign-out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      setBudgetConfig(null);
      setEntries([]);
      setConfigLoaded(false);
      setMovementsLoaded(false);
      setSelectedMovementId(null);
      setLastSavedMovement(null);
      setCurrentScreen("dashboard");
      setIsAssistantOpen(false);
      setAssistantMessages([createWelcomeMessage()]);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe strictly to the signed-in user's private Firestore documents
  useEffect(() => {
    if (!authReady || !currentUser) return;

    const uid = currentUser.uid;
    const configPath = `users/${uid}/budget/config`;
    const movementsPath = `users/${uid}/movements`;

    const unsubConfig = onSnapshot(
      doc(db, "users", uid, "budget", "config"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<BudgetConfigDoc>;
          setBudgetConfig({
            uid: data.uid ?? uid,
            displayName:
              typeof data.displayName === "string" &&
              data.displayName.trim().length > 0
                ? data.displayName.trim()
                : resolveDefaultUserName(currentUser),
            monthlyBudget:
              typeof data.monthlyBudget === "number"
                ? data.monthlyBudget
                : MONTHLY_BUDGET_COP,
            onboardingCompleted: Boolean(data.onboardingCompleted),
          });
        } else {
          setBudgetConfig(null);
        }
        setConfigLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, configPath);
      }
    );

    const movementsQuery = query(
      collection(db, "users", uid, "movements"),
      where("uid", "==", uid)
    );

    const unsubMovements = onSnapshot(
      movementsQuery,
      (snapshot) => {
        const loaded: MovementEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            type: data.type === "income" ? "income" : "expense",
            day: typeof data.day === "number" ? data.day : 1,
            dateISO:
              typeof data.dateISO === "string"
                ? data.dateISO
                : CURRENT_DATE_ISO,
            dateLabel:
              typeof data.dateLabel === "string"
                ? data.dateLabel
                : formatDateSpanishLabel(CURRENT_DATE_ISO),
            description:
              typeof data.description === "string"
                ? data.description
                : "Movimiento",
            category: data.category,
            amount: typeof data.amount === "number" ? data.amount : 0,
            paymentMethod:
              typeof data.paymentMethod === "string"
                ? (data.paymentMethod as MovementEntry["paymentMethod"])
                : undefined,
            notes: typeof data.notes === "string" ? data.notes : undefined,
          };
        });

        loaded.sort(
          (a, b) => b.dateISO.localeCompare(a.dateISO) || b.day - a.day
        );
        setEntries(loaded);
        setMovementsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, movementsPath);
      }
    );

    return () => {
      unsubConfig();
      unsubMovements();
    };
  }, [authReady, currentUser]);

  const effectiveBaseBudget = budgetConfig?.monthlyBudget ?? 0;
  const userName =
    budgetConfig?.displayName ?? resolveDefaultUserName(currentUser);

  const summary = useMemo(
    () => computeDashboardSummary(entries, effectiveBaseBudget),
    [entries, effectiveBaseBudget]
  );

  const hasExpenses = summary.totalExpenseMovements > 0;

  const notificationsPayload = useMemo(
    () => ({
      monthLabel: summary.monthLabel,
      currentDay: summary.currentDay,
      totalDays: summary.totalDays,
      monthlyBudget: summary.monthlyBudget,
      totalSpent: summary.totalSpent,
      availableBalance: summary.availableBalance,
      categories: summary.categoryTotals,
      recentMovements: summary.recentMovements,
      peakDay: summary.peakDay,
    }),
    [summary]
  );

  const selectedEntry = useMemo(
    () =>
      selectedMovementId
        ? entries.find((e) => e.id === selectedMovementId) ?? null
        : null,
    [entries, selectedMovementId]
  );

  const selectedCategoryTotal = useMemo(() => {
    if (!selectedEntry || selectedEntry.type === "income") {
      return selectedEntry?.amount ?? 0;
    }
    return (
      summary.categoryTotals.find((c) => c.category === selectedEntry.category)
        ?.total ?? selectedEntry.amount
    );
  }, [selectedEntry, summary.categoryTotals]);

  function handleNavigate(screen: AppScreen) {
    if (screen === "detail" && !hasExpenses) {
      setSelectedMovementId(null);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleOpenDetail(id: string, from: "dashboard" | "movements") {
    setPreviousScreen(from);
    setSelectedMovementId(id);
    setCurrentScreen("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveExpense(newExpenseData: Omit<MovementEntry, "id">) {
    if (!currentUser) return;
    const savedId = await addMovementDoc(currentUser.uid, newExpenseData);
    setLastSavedMovement({ id: savedId, ...newExpenseData });
    setCurrentScreen("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveIncome(newIncomeData: Omit<MovementEntry, "id">) {
    if (!currentUser) return;
    const savedId = await addMovementDoc(currentUser.uid, newIncomeData);
    setLastSavedMovement({ id: savedId, ...newIncomeData });
    setCurrentScreen("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAssistantRegisterExpense(
    receipt: RegisteredExpenseReceipt
  ) {
    if (!currentUser) return;
    const dayNum = Number(receipt.date.split("-")[2]) || summary.currentDay;
    const movementData: Omit<MovementEntry, "id"> = {
      type: "expense",
      day: dayNum,
      dateISO: receipt.date,
      dateLabel: formatDateSpanishLabel(receipt.date),
      description: receipt.description,
      category: receipt.category,
      amount: receipt.amount,
    };
    const savedId = await addMovementDoc(currentUser.uid, movementData);
    setLastSavedMovement({ id: savedId, ...movementData });
  }

  function handleUpdateBudget(newBudget: number) {
    if (!currentUser) return;
    void updateMonthlyBudgetDoc(currentUser.uid, newBudget);
  }

  function handleUpdateUserName(nextName: string) {
    if (!currentUser) return;
    void updateUserDisplayNameDoc(currentUser.uid, nextName);
  }

  async function handleCompleteOnboarding(
    displayName: string,
    monthlyBudget: number
  ) {
    if (!currentUser) return;
    await saveInitialBudgetConfig(currentUser.uid, displayName, monthlyBudget);
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  function handleJumpToAlerts() {
    if (currentScreen !== "dashboard") {
      setCurrentScreen("dashboard");
      setTimeout(() => {
        document.getElementById("alertas")?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } else {
      document.getElementById("alertas")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  if (!authReady) {
    return (
      <div className="min-h-screen dashboard-canvas flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300">
        <Loader2
          className="w-7 h-7 animate-spin text-[#5B3DF5] dark:text-indigo-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">Verificando tu sesión...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />
    );
  }

  if (!configLoaded || !movementsLoaded) {
    return (
      <div className="min-h-screen dashboard-canvas flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300">
        <Loader2
          className="w-7 h-7 animate-spin text-[#5B3DF5] dark:text-indigo-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">Cargando tus datos privados...</p>
      </div>
    );
  }

  if (!budgetConfig || !budgetConfig.onboardingCompleted) {
    return (
      <BudgetOnboardingScreen
        initialName={resolveDefaultUserName(currentUser)}
        userEmail={currentUser.email}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onSubmitBudget={handleCompleteOnboarding}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col dashboard-canvas text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <TopBar
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        monthLabel={summary.monthLabel}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onJumpToAlerts={handleJumpToAlerts}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        userEmail={currentUser.email}
        onSignOut={() => void handleSignOut()}
      />

      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {currentScreen === "dashboard" && (
            <motion.div
              key="screen-dashboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              {lastSavedMovement && (
                <div
                  role="status"
                  className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-900 dark:text-emerald-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <p className="truncate">
                      {lastSavedMovement.type === "income"
                        ? "✅ Ingreso registrado correctamente: "
                        : "Gasto guardado en tu cuenta: "}
                      <strong>{lastSavedMovement.description}</strong> (
                      <span className="font-mono font-semibold tabular-nums">
                        {lastSavedMovement.type === "income" ? "+" : ""}
                        {formatCOP(lastSavedMovement.amount)}
                      </span>
                      ). Presupuesto y saldo disponibles actualizados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastSavedMovement(null)}
                    aria-label="Cerrar aviso"
                    className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              <FinancialSummary
                monthLabel={summary.monthLabel}
                currentDay={summary.currentDay}
                totalDays={summary.totalDays}
                remainingDays={summary.remainingDays}
                baseMonthlyBudget={summary.baseMonthlyBudget}
                totalIncome={summary.totalIncome}
                monthlyBudget={summary.monthlyBudget}
                totalSpent={summary.totalSpent}
                totalExpenseMovements={summary.totalExpenseMovements}
                availableBalance={summary.availableBalance}
                spentPercentage={summary.spentPercentage}
                availablePercentage={summary.availablePercentage}
                suggestedDailyLimit={summary.suggestedDailyLimit}
                onOpenRegister={() => handleNavigate("register")}
                onOpenRegisterIncome={() => handleNavigate("register-income")}
                onUpdateBudget={handleUpdateBudget}
              />

              {hasExpenses ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-7">
                    <DailyExpensesChart
                      entries={entries}
                      categoryTotals={summary.categoryTotals}
                      totalSpent={summary.totalSpent}
                    />
                  </div>

                  <div className="lg:col-span-5 space-y-5">
                    <RecentMovements
                      movements={summary.recentMovements}
                      totalCount={entries.length}
                      onSelectMovement={(id) => handleOpenDetail(id, "dashboard")}
                      onViewAllMovements={() => handleNavigate("movements")}
                    />
                    <SmartNotifications summaryPayload={notificationsPayload} />
                  </div>
                </div>
              ) : (
                /* Dashboard vacío integrado dentro del dashboard principal */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <section
                    aria-labelledby="dashboard-empty-heading"
                    className={`${
                      entries.length > 0 ? "lg:col-span-7" : "lg:col-span-12"
                    } bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-2xl px-6 py-14 card-surface text-center flex flex-col items-center justify-center space-y-4 transition-colors duration-200`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center">
                      <BarChart3
                        className="w-6 h-6 text-[#5B3DF5] dark:text-indigo-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h2
                        id="dashboard-empty-heading"
                        className="font-display text-xl font-bold text-slate-900 dark:text-slate-50"
                      >
                        Aún no hay gastos este mes
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Registra el primero y empieza a ver en qué se va la plata
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavigate("register")}
                      className="mt-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm hover:-translate-y-px transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Registrar tu primer gasto</span>
                    </button>
                  </section>

                  {entries.length > 0 && (
                    <div className="lg:col-span-5">
                      <RecentMovements
                        movements={summary.recentMovements}
                        totalCount={entries.length}
                        onSelectMovement={(id) =>
                          handleOpenDetail(id, "dashboard")
                        }
                        onViewAllMovements={() => handleNavigate("movements")}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {currentScreen === "movements" && (
            <motion.div
              key="screen-movements"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <MovementsView
                entries={entries}
                monthLabel={summary.monthLabel}
                onSelectMovement={(id) => handleOpenDetail(id, "movements")}
                onBackToDashboard={() => handleNavigate("dashboard")}
                onOpenRegister={() => handleNavigate("register")}
                onOpenRegisterIncome={() => handleNavigate("register-income")}
              />
            </motion.div>
          )}

          {currentScreen === "detail" && (
            <motion.div
              key="screen-detail"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <MovementDetailView
                entry={selectedEntry}
                categoryTotal={selectedCategoryTotal}
                monthlyBudget={summary.monthlyBudget}
                backLabel={
                  previousScreen === "movements"
                    ? "Volver a Movimientos"
                    : "Volver al Dashboard"
                }
                onBack={() => handleNavigate(previousScreen)}
              />
            </motion.div>
          )}

          {currentScreen === "register" && (
            <motion.div
              key="screen-register"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <RegisterExpenseView
                currentAvailableBalance={summary.availableBalance}
                onSaveExpense={(data) => void handleSaveExpense(data)}
                onCancel={() => handleNavigate("dashboard")}
              />
            </motion.div>
          )}

          {currentScreen === "register-income" && (
            <motion.div
              key="screen-register-income"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <RegisterIncomeView
                currentAvailableBalance={summary.availableBalance}
                currentEffectiveBudget={summary.monthlyBudget}
                onSaveIncome={(data) => void handleSaveIncome(data)}
                onCancel={() => handleNavigate("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-indigo-100/80 dark:border-slate-800/80 py-5 mt-2">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Mi Presupuesto Mensual · Pesos colombianos (COP) · Cuenta privada:{" "}
            <strong className="font-medium text-slate-700 dark:text-slate-200">
              {currentUser.email ?? userName}
            </strong>
          </span>
          <span>Datos sincronizados exclusivamente para tu cuenta</span>
        </div>
      </footer>

      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        messages={assistantMessages}
        onAddMessage={(msg) =>
          setAssistantMessages((prev) => [...prev, msg])
        }
        budgetContext={{
          userName,
          currentDateISO: CURRENT_DATE_ISO,
          monthLabel: summary.monthLabel,
          monthlyBudget: summary.monthlyBudget,
          totalSpent: summary.totalSpent,
          totalIncome: summary.totalIncome,
          availableBalance: summary.availableBalance,
          categories: summary.categoryTotals,
          recentMovements: summary.recentMovements,
        }}
        onUpdateUserName={handleUpdateUserName}
        onRegisterExpense={(receipt) =>
          void handleAssistantRegisterExpense(receipt)
        }
      />
    </div>
  );
}
