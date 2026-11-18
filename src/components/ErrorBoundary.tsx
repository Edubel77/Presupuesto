import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable =
      error.message || "Ocurrió un error inesperado al cargar tus datos.";

    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
      };
      if (parsed && typeof parsed.error === "string") {
        if (parsed.error.toLowerCase().includes("insufficient permissions")) {
          readable =
            "No tienes permisos suficientes para realizar esta operación en la cuenta actual.";
        } else if (parsed.error.toLowerCase().includes("quota exceeded")) {
          readable =
            "Se alcanzó temporalmente la cuota diaria de Firestore. Intenta de nuevo mañana.";
        } else {
          readable = parsed.error;
        }
      }
    } catch {
      // Keep plain error message
    }

    return {
      hasError: true,
      errorMessage: readable,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen dashboard-canvas flex items-center justify-center p-4 text-slate-900 dark:text-slate-50">
          <div className="w-full max-w-md bg-white dark:bg-[#131625] border border-red-200 dark:border-red-900/60 rounded-2xl p-6 card-surface text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center mx-auto">
              <AlertTriangle
                className="w-6 h-6 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-lg font-bold">
                Ocurrió un problema con tu sesión
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {this.state.errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#5B3DF5] hover:bg-[#4B2FE0] text-white text-sm font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
