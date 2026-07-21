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
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store, useStore } from "@/data/store";
import { safeInternalNext } from "@/lib/authStorage";
import type { Role } from "@/lib/types";
import {
  ArrowLeft,
  BarChart3,
  Bike,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
  MapPinned,
  Package,
  Phone,
  Shield,
  ShieldCheck,
  Store,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuthPortal = "admin" | "courier" | "merchant" | "customer" | "account";

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  portal?: AuthPortal;
}>;

const portalContent: Record<
  AuthPortal,
  {
    label: string;
    headline: string;
    description: string;
    icon: LucideIcon;
    features: { icon: LucideIcon; label: string }[];
  }
> = {
  admin: {
    label: "MoveDek Admin",
    headline: "Run every MoveDek operation from one secure command center.",
    description:
      "Manage users, deliveries, finance, live operations, compliance, and platform performance in real time.",
    icon: ShieldCheck,
    features: [
      { icon: MapPinned, label: "Live operations and courier tracking" },
      { icon: Users, label: "User, courier, and merchant management" },
      { icon: BarChart3, label: "Financial and performance intelligence" },
    ],
  },
  courier: {
    label: "MoveDek Courier",
    headline: "Your delivery workspace, built to keep you moving.",
    description:
      "Manage assignments, publish live location, track earnings, and complete deliveries from one reliable workspace.",
    icon: Bike,
    features: [
      { icon: MapPinned, label: "Live routes and delivery navigation" },
      { icon: Package, label: "Assignment and delivery management" },
      { icon: ShieldCheck, label: "Secure account and payout access" },
    ],
  },
  merchant: {
    label: "MoveDek Merchant",
    headline: "Reliable logistics for every order your business sends.",
    description:
      "Create deliveries, monitor fulfilment, manage your team, and understand performance from one merchant dashboard.",
    icon: Store,
    features: [
      { icon: Package, label: "Order and dispatch management" },
      { icon: MapPinned, label: "Real-time delivery visibility" },
      { icon: BarChart3, label: "Business performance insights" },
    ],
  },
  customer: {
    label: "MoveDek Customer",
    headline: "Send, track, and receive with confidence.",
    description:
      "Book deliveries in minutes, follow every movement, and get help whenever you need it.",
    icon: Package,
    features: [
      { icon: Zap, label: "Fast delivery booking" },
      { icon: MapPinned, label: "Real-time package tracking" },
      { icon: Headphones, label: "Responsive customer support" },
    ],
  },
  account: {
    label: "MoveDek Account",
    headline: "One account for every MoveDek experience.",
    description:
      "Access your deliveries, operations, business tools, and account settings securely.",
    icon: Zap,
    features: [
      { icon: ShieldCheck, label: "Secure account access" },
      { icon: MapPinned, label: "Real-time logistics visibility" },
      { icon: Headphones, label: "Support when you need it" },
    ],
  },
};

function AuthLayout({
  children,
  title,
  subtitle,
  portal = "account",
}: AuthLayoutProps) {
  const content = portalContent[portal];
  const PortalIcon = content.icon;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
        <aside className="auth-portal-hero relative hidden min-h-screen overflow-hidden px-12 py-14 text-white lg:flex xl:px-16">
          <div
            className="auth-portal-grid absolute inset-0 opacity-35"
            aria-hidden="true"
          />
          <div
            className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -right-20 bottom-14 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex w-full max-w-2xl flex-col">
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-3 font-display text-2xl font-black tracking-[-0.04em]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur">
                <Zap className="h-6 w-6" />
              </span>
              MoveDek
            </Link>

            <div className="my-auto py-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-extrabold backdrop-blur">
                <PortalIcon className="h-4 w-4" />
                {content.label} Portal
              </span>
              <h2 className="mt-7 max-w-xl font-display text-4xl font-black leading-[1.08] tracking-[-0.045em] xl:text-5xl">
                {content.headline}
              </h2>
              <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-emerald-50/90">
                {content.description}
              </p>

              <div className="mt-10 grid max-w-xl gap-3">
                {content.features.map(({ icon: FeatureIcon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                      <FeatureIcon className="h-5 w-5" />
                    </span>
                    <span className="font-bold">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm font-medium text-emerald-100/75">
              Secure access • Real-time operations • Built for Africa
            </p>
          </div>
        </aside>

        <section className="flex min-h-screen items-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-[500px]">
            <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-muted-foreground transition hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-extrabold text-primary">
                <PortalIcon className="h-4 w-4" />
                {content.label}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-[34px] font-black leading-tight tracking-[-0.045em] text-primary sm:text-[40px]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base font-medium text-muted-foreground">
                  {subtitle}
                </p>
              )}
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

const AuthInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithRef<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(
      "h-[54px] rounded-xl border border-input bg-muted/40 px-4 text-[15px] font-medium text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...props}
  />
));
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

  if (next.startsWith("/admin") && role !== "admin")
    return dashboardPathForRole(role);
  if (next.startsWith("/courier") && role !== "courier" && role !== "admin")
    return dashboardPathForRole(role);
  if (next.startsWith("/merchant") && role !== "merchant" && role !== "admin")
    return dashboardPathForRole(role);
  if (next.startsWith("/app") && role !== "customer" && role !== "admin")
    return dashboardPathForRole(role);

  return next;
}

export function portalFromNext(next: string | null): AuthPortal {
  if (next?.startsWith("/admin")) return "admin";
  if (next?.startsWith("/courier")) return "courier";
  if (next?.startsWith("/merchant")) return "merchant";
  if (next?.startsWith("/app")) return "customer";
  return "account";
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = useMemo(
    () => safeInternalNext(searchParams.get("next")),
    [searchParams],
  );
  const portal = useMemo(() => portalFromNext(next), [next]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const activeSession = useStore((state) => state.session);
  const authLoading = useStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && activeSession) {
      navigate(redirectPathForRole(activeSession.role, next), {
        replace: true,
      });
    }
  }, [activeSession, authLoading, navigate, next]);

  const submit = handleSubmit(async (input) => {
    setLoading(true);
    try {
      const user = await store.loginWithCredentials(
        input.email,
        input.password,
      );
      toast.success("Signed in");
      navigate(redirectPathForRole(user.role, next), { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Login failed. Check that the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthLayout
      portal={portal}
      title={portal === "admin" ? "Admin sign in" : "Welcome back"}
      subtitle={
        portal === "admin"
          ? "Sign in to manage MoveDek operations securely."
          : `Sign in to your ${portal === "account" ? "MoveDek" : portal} workspace.`
      }
    >
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
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
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
          <Link
            className="font-bold text-accent transition hover:underline"
            to="/auth/register"
          >
            Sign up
          </Link>
        </p>
        <p>
          Courier or merchant?{" "}
          <Link
            className="font-bold text-accent transition hover:underline"
            to="/auth/register"
          >
            Create business account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

const roleOptions: {
  role: Role;
  icon: LucideIcon;
  label: string;
  desc: string;
}[] = [
  {
    role: "customer",
    icon: Package,
    label: "Customer",
    desc: "Send packages, order food, request pickups.",
  },
  {
    role: "courier",
    icon: Bike,
    label: "Courier",
    desc: "Earn by delivering along your route.",
  },
  {
    role: "merchant",
    icon: Store,
    label: "Merchant",
    desc: "Grow your business with reliable dispatch.",
  },
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
  const [role, setRole] = useState<Role>(
    roleOptions.some((r) => r.role === initial) ? initial : "customer",
  );
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
        error instanceof Error
          ? error.message
          : "Registration failed. Check that the backend is running.",
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
                role === r.role
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <r.icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-primary">{r.label}</span>
              <span className="block text-sm font-medium text-muted-foreground">
                {r.desc}
              </span>
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
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold text-primary">
            Confirm password
          </Label>
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
        <Link
          className="font-bold text-accent transition hover:underline"
          to="/auth/login"
        >
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
    toast.success(
      "Phone verified. Create your account from the register screen to continue.",
    );
    navigate("/auth/register");
  };

  return (
    <AuthLayout
      title="Verify phone"
      subtitle={
        pending
          ? `Enter the 4-digit code sent to ${pending.phone}.`
          : "Enter the 4-digit verification code."
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
              const next = e.target
                .nextElementSibling as HTMLInputElement | null;
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
    <AuthLayout
      title="Reset password"
      subtitle="We'll email a secure reset link."
    >
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
        <Link
          to="/auth/login"
          className="font-bold text-accent hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
