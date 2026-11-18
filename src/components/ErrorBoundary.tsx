import { Component, type ErrorInfo, type ReactNode } from 'react';
import { IconAlert, IconRefresh } from './Icons';

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
        <div className="min-h-screen bg-[#0f1712] text-white flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
          <div className="bg-[#16221a] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="size-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <IconAlert size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Ha ocurrido una incidencia</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                El sistema detectó una discrepancia temporal al procesar los datos deportivos.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-black/30 p-3.5 rounded-xl border border-white/10 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Detalle técnico</span>
                <p className="text-xs font-mono text-red-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-sm transition shadow-lg shadow-[#199e1b]/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <IconRefresh size={16} />
                <span>Recargar aplicación</span>
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
