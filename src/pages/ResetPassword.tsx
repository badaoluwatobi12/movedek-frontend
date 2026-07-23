import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/services/http";

function validPassword(value: string) {
  return (
    value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing its secure token.");
      return;
    }
    if (!validPassword(password)) {
      setError(
        "Use at least 12 characters with uppercase, lowercase, a number, and a symbol.",
      );
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await http<{ reset: true }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setComplete(true);
      window.setTimeout(() => navigate("/auth/login", { replace: true }), 1800);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The password could not be reset.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-3 font-display text-2xl font-extrabold text-primary"
        >
          <img src="/logo.svg" alt="" aria-hidden="true" className="h-10 w-10 rounded-xl" />
          MoveDek
        </Link>
        <h1 className="mt-8 font-display text-3xl font-bold text-primary">
          Create a new password
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your link is single-use and expires automatically.
        </p>

        {complete ? (
          <div className="mt-7 rounded-2xl bg-success/10 p-5 text-sm text-success">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4" /> Password updated
            </div>
            <p className="mt-2">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !token}
            >
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
