import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/observability/clientErrorReporter";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError({
      source: "error-boundary",
      message: error.message,
      name: error.name,
      stack: error.stack,
      metadata: { componentStack: info.componentStack },
    });
  }

  private reload = () => window.location.reload();

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <section className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            <img src="/logo.svg" alt="" aria-hidden="true" className="h-9 w-9 rounded-xl" />
            <span>MoveDek</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The error has been recorded. Reload the application to continue.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="mt-6 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Reload MoveDek
          </button>
        </section>
      </main>
    );
  }
}
