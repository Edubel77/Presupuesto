import { type FormEvent, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { auth, FIREBASE_PROJECT_ID, googleProvider } from "../firebase";

interface AuthScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

type AuthMode = "login" | "register";

function translateFirebaseAuthError(error: unknown): string {
  const errObj = error as { code?: string; message?: string };
  const code = errObj?.code ?? "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos. Verifica tus datos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con este correo electrónico. Inicia sesión.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Ingresa un correo electrónico válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos seguidos. Espera un momento antes de intentar de nuevo.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Se cerró la ventana de Google antes de completar el inicio de sesión.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes e intenta de nuevo.";
    case "auth/operation-not-allowed":
      return `El acceso con correo y contraseña aún no está activado en Firebase Console (Authentication → Sign-in method → Correo electrónico/contraseña en el proyecto ${FIREBASE_PROJECT_ID}). Mientras lo activas, puedes usar "Entrar rápido con Google".`;
    case "auth/network-request-failed":
      return "Error de red al conectar con Firebase. Verifica tu conexión a internet.";
    default:
      return errObj?.message
        ? `No se pudo iniciar sesión: ${errObj.message}`
        : "No fue posible autenticar tu cuenta. Intenta de nuevo.";
  }
}

export function AuthScreen({ isDark, onToggleTheme }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg("Ingresa tu correo electrónico.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        const preferredName =
          fullName.trim() || cleanEmail.split("@")[0] || "Usuario";
        try {
          await updateProfile(cred.user, { displayName: preferredName });
        } catch {
          // Display name will still fall back gracefully during onboarding
        }
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (isSubmitting) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSwitchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMsg(null);
  }

  return (
    <div className="min-h-screen flex flex-col dashboard-canvas text-slate-900 dark:text-slate-50 transition-colors duration-200">
      {/* Minimal branded top bar with theme toggle */}
      <header className="border-b border-indigo-100/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#111424]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B3DF5] to-indigo-800 flex items-center justify-center shadow-xs shrink-0">
              <Wallet className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <span>Mi Presupuesto Mensual</span>
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
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] bg-white dark:bg-[#131625] border border-indigo-100/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 card-surface space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {mode === "login"
                ? "Inicia sesión en tu cuenta"
                : "Crea tu cuenta personal"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Tus gastos, ingresos y presupuesto se guardan de forma privada para ti."
                : "Empieza desde cero definiendo tu presupuesto mensual en pesos colombianos."}
            </p>
          </div>

          {/* Mode Tabs */}
          <div
            role="tablist"
            aria-label="Tipo de acceso"
            className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-indigo-100/70 dark:border-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => handleSwitchMode("login")}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white dark:bg-[#1C2035] text-[#5B3DF5] dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => handleSwitchMode("register")}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white dark:bg-[#1C2035] text-[#5B3DF5] dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Quick Google Login */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleGoogleSignIn()}
            className="w-full min-h-[46px] px-4 rounded-xl border border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Entrar rápido con Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-indigo-100/90 dark:bg-slate-800" />
            <span className="relative px-3 bg-white dark:bg-[#131625] text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              o con tu correo
            </span>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-xs text-red-700 dark:text-red-300 leading-relaxed"
            >
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Tu nombre (opcional)
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Laura Gómez"
                    maxLength={80}
                    className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-11 py-2.5 min-h-[44px] text-sm rounded-xl border border-indigo-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] px-5 rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3DF5]"
            >
              {isSubmitting
                ? "Procesando..."
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta y continuar"}
            </button>
          </form>

          <div className="pt-2 border-t border-indigo-100/80 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <span>Cada cuenta ve y guarda únicamente sus propios datos</span>
          </div>
        </div>
      </main>
    </div>
  );
}
