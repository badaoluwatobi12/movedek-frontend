import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/services/http";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await http<{ requested: true }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The reset email could not be requested.",
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
          className="font-display text-2xl font-extrabold text-primary"
        >
          MoveDek
        </Link>
        <h1 className="mt-8 font-display text-3xl font-bold text-primary">
          Reset your password
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your account email. We will send a secure, expiring reset link.
        </p>

        {sent ? (
          <div className="mt-7 rounded-2xl bg-accent/10 p-5 text-sm text-accent">
            <div className="flex items-center gap-2 font-bold">
              <Send className="h-4 w-4" /> Check your inbox
            </div>
            <p className="mt-2 leading-6">
              If an account exists for that email, MoveDek has queued a reset
              message. Also check your spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-7 text-center text-sm text-muted-foreground">
          <Link
            to="/auth/login"
            className="font-bold text-accent hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
