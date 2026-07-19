import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type PropsWithChildren,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store, useStore } from "@/data/store";
import { getStoredSession, getStoredToken, isTokenValid, safeInternalNext } from "@/lib/authStorage";
import type { Role } from "@/lib/types";
import {
  ArrowLeft,
  Bike,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Package,
  Phone,
  Shield,
  Store,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
}>;

function AuthLayout({ children, title, subtitle, eyebrow = "MoveDek Account" }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,514px)]">
        <div className="hidden lg:block hero-gradient" aria-hidden="true" />
        <section className="flex min-h-screen items-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10 xl:pr-20">
          <div className="mx-auto w-full max-w-[514px]">
            <div className="mb-9 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-muted-foreground transition hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <span className="chip bg-accent/10 text-accent px-3.5 py-2 text-sm font-bold">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-accent/10">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                {eyebrow}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-[-0.04em] text-primary sm:text-[36px]">
                {title}
              </h1>
              {subtitle && <p className="text-base font-medium text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="mt-9">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
      <Icon className="h-5 w-5" />
    </span>
  );
}

const AuthInput = forwardRef<HTMLInputElement, ComponentPropsWithRef<typeof Input>>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        "h-[54px] rounded-xl border border-input bg-muted/40 px-4 text-[15px] font-medium text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  ),
);
AuthInput.displayName = "AuthInput";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-semibold text-destructive">{message}</p>;
}

function dashboardPathForRole(role: Role) {
  return role === "customer" ? "/app" : `/${role}`;
}

function redirectPathForRole(role: Role, next: string | null) {
  if (!next) return dashboardPathForRole(role);

  if (next.startsWith("/admin") && role !== "admin") return dashboardPathForRole(role);
  if (next.startsWith("/courier") && role !== "courier" && role !== "admin")
    return dashboardPathForRole(role);
  if (next.startsWith("/merchant") && role !== "merchant" && role !== "admin")
    return dashboardPathForRole(role);
  if (next.startsWith("/app") && role !== "customer" && role !== "admin") return dashboardPathForRole(role);

  return next;
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = useMemo(() => safeInternalNext(searchParams.get("next")), [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const token = getStoredToken();
    const session = getStoredSession();

    if (token && session && isTokenValid(token)) {
      navigate(redirectPathForRole(session.role, next), { replace: true });
    }
  }, [navigate, next]);

  const submit = handleSubmit(async (input) => {
    setLoading(true);
    try {
      const user = await store.loginWithCredentials(input.email, input.password);
      toast.success("Signed in");
      navigate(redirectPathForRole(user.role, next), { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Login failed. Check that the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout title="Sign in" subtitle="Login to your account">
      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Email</Label>
          <div className="relative">
            <FieldIcon icon={Mail} />
            <AuthInput
              type="email"
              {...register("email")}
              placeholder="you@mail.ng"
              autoComplete="email"
              className="pl-14"
            />
          </div>
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Password</Label>
          <div className="relative">
            <FieldIcon icon={Lock} />
            <AuthInput
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="Enter password"
              autoComplete="current-password"
              className="pl-14 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
          <Link
            to="/auth/forgot"
            className="inline-flex text-sm font-extrabold text-accent transition hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="h-[54px] w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-none transition hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 space-y-4 text-center text-base font-medium text-muted-foreground">
        <p>
          Don&apos;t have an account?{" "}
          <Link className="font-bold text-accent transition hover:underline" to="/auth/register">
            Sign up
          </Link>
        </p>
        <p>
          Courier or merchant?{" "}
          <Link className="font-bold text-accent transition hover:underline" to="/auth/register">
            Create business account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

const roleOptions: { role: Role; icon: LucideIcon; label: string; desc: string }[] = [
  { role: "customer", icon: Package, label: "Customer", desc: "Send packages, order food, request pickups." },
  { role: "courier", icon: Bike, label: "Courier", desc: "Earn by delivering along your route." },
  { role: "merchant", icon: Store, label: "Merchant", desc: "Grow your business with reliable dispatch." },
];

const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type RegisterFormInput = RegisterInput & { confirmPassword: string };

export function Register() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const initial = (sp.get("role") as Role) || "customer";
  const [role, setRole] = useState<Role>(roleOptions.some((r) => r.role === initial) ? initial : "customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { role },
  });

  const submit = handleSubmit(async (input) => {
    setLoading(true);
    try {
      const user = await store.registerAccount({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        password: input.password,
        role,
      });
      toast.success("Account created");
      navigate(dashboardPathForRole(user.role), { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed. Check that the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout title="Sign up" subtitle="Create your MoveDek account">
      <div className="mb-6 grid gap-3">
        {roleOptions.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => setRole(r.role)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition",
              role === r.role
                ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                : "border-input bg-card hover:border-accent/60",
            )}
          >
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl",
                role === r.role ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <r.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-primary">{r.label}</span>
              <span className="block text-sm font-medium text-muted-foreground">{r.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Full name</Label>
          <div className="relative">
            <FieldIcon icon={User} />
            <AuthInput
              {...register("full_name")}
              placeholder="Your full name"
              autoComplete="name"
              className="pl-14"
            />
          </div>
          <FieldError message={errors.full_name?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Email</Label>
          <div className="relative">
            <FieldIcon icon={Mail} />
            <AuthInput
              type="email"
              {...register("email")}
              placeholder="you@mail.ng"
              autoComplete="email"
              className="pl-14"
            />
          </div>
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Phone</Label>
          <div className="relative">
            <FieldIcon icon={Phone} />
            <AuthInput
              {...register("phone")}
              placeholder="+2348012345678"
              autoComplete="tel"
              className="pl-14"
            />
          </div>
          <FieldError message={errors.phone?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Password</Label>
          <div className="relative">
            <FieldIcon icon={Lock} />
            <AuthInput
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="pl-14 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">Confirm password</Label>
          <div className="relative">
            <FieldIcon icon={Lock} />
            <AuthInput
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className="pl-14"
            />
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <div className="flex items-start gap-2 text-sm font-medium text-muted-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          By continuing you agree to MoveDek&apos;s Terms and Privacy Policy.
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-[54px] w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-none transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-base font-medium text-muted-foreground">
        Have an account?{" "}
        <Link className="font-bold text-accent transition hover:underline" to="/auth/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export function Otp() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const pending = useStore((s) => s.pendingRegistration);

  const verify = () => {
    if (pin.length !== 4) return toast.error("Enter the 4-digit code");
    toast.success("Phone verified. Create your account from the register screen to continue.");
    navigate("/auth/register");
  };

  return (
    <AuthLayout
      title="Verify phone"
      subtitle={
        pending ? `Enter the 4-digit code sent to ${pending.phone}.` : "Enter the 4-digit verification code."
      }
    >
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <input
            key={i}
            inputMode="numeric"
            maxLength={1}
            value={pin[i] ?? ""}
            onChange={(e) => {
              const arr = pin.split("");
              arr[i] = e.target.value.replace(/\D/g, "");
              setPin(arr.join("").slice(0, 4));
              const next = e.target.nextElementSibling as HTMLInputElement | null;
              if (e.target.value && next) next.focus();
            }}
            className="h-14 w-14 rounded-xl border border-input bg-muted/40 text-center font-display text-2xl font-bold text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-ring"
          />
        ))}
      </div>
      <Button
        onClick={verify}
        className="mt-6 h-[54px] w-full rounded-xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
      >
        Verify & continue
      </Button>
      <p className="mt-8 text-center text-base font-medium text-muted-foreground">
        Didn&apos;t get it?{" "}
        <button
          className="font-bold text-accent hover:underline"
          onClick={() => toast.success("A new code has been sent")}
        >
          Resend code
        </button>
      </p>
    </AuthLayout>
  );
}

export function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout title="Reset password" subtitle="We'll email a secure reset link.">
      {sent ? (
        <div className="rounded-xl bg-accent/10 p-4 text-sm font-bold text-accent">
          Check your inbox for reset instructions.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label className="text-base font-bold text-primary">Email</Label>
            <div className="relative">
              <FieldIcon icon={Mail} />
              <AuthInput
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mail.ng"
                autoComplete="email"
                className="pl-14"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="h-[54px] w-full rounded-xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
          >
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-8 text-center text-base font-medium text-muted-foreground">
        <Link to="/auth/login" className="font-bold text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
