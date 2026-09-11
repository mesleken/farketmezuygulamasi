import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-rose-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                {this.props.fallbackTitle || 'Beklenmeyen Bir Hata Oluştu'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Uygulama bileşeni yüklenirken bir problemle karşılaşıldı. Lütfen sayfayı yenilemeyi deneyin.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200 overflow-x-auto">
                <code className="text-[11px] text-rose-700 font-mono break-words">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Yeniden Dene</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
