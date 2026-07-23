import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-primary"
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              className="h-9 w-9 rounded-xl"
            />
            MoveDek
          </Link>
          <Link to="/auth/login" className="text-sm font-medium text-accent">
            Sign in
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
