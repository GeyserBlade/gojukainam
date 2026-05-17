import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack)
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
          </div>
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={this.reset}>Try again</Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Go to dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
