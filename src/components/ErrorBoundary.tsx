import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error no capturado en la aplicación:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#293827] text-white flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
          <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Ha ocurrido una incidencia</h2>
              <p className="text-xs text-[#A3B89E] mt-1.5 leading-relaxed">
                El sistema detectó una discrepancia temporal al renderizar los datos deportivos.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-[#293827] p-3 rounded-xl border border-[#445941] text-left">
                <span className="text-[10px] uppercase font-bold text-[#A3B89E] block mb-1">Detalle técnico:</span>
                <p className="text-xs font-mono text-red-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-5 rounded-xl bg-[#65C556] hover:bg-[#54b045] text-[#293827] font-extrabold text-sm transition shadow-lg shadow-[#65C556]/20 cursor-pointer min-h-[44px]"
              >
                Recargar y Continuar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
