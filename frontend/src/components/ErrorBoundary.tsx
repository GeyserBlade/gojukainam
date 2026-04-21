import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full rounded-xl border border-red-900/60 bg-red-950/20 p-6 text-center">
          <div className="text-4xl mb-3" aria-hidden>⚠️</div>
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-400 mb-4">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-sm"
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-100 text-sm"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
