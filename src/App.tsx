import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { store } from "@/data/store";
import { queryClient } from "@/services/queryClient";
import RequireAuth from "@/routes/RequireAuth";

const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Forgot = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const Otp = lazy(() =>
  import("./pages/Auth").then((module) => ({ default: module.Otp })),
);
const CheckEmail = lazy(() =>
  import("./pages/Auth").then((module) => ({ default: module.CheckEmail })),
);
const VerifyEmail = lazy(() =>
  import("./pages/Auth").then((module) => ({ default: module.VerifyEmail })),
);

import {
  DashboardShell,
  type NavItem,
} from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard,
  Plus,
  History,
  Wallet,
  MapPin,
  LifeBuoy,
  User,
  Home,
  ClipboardList,
  Coins,
  Star,
  Package,
  ShieldCheck,
  Building2,
  Upload,
  Users,
  Store,
  CreditCard,
  Bike,
  Map,
  AlertTriangle,
  ShieldAlert,
  Tag,
  BadgeCheck,
  FileText,
  Settings,
  BellRing,
  MailCheck,
} from "lucide-react";

const CustomerDashboard = lazy(
  () => import("./pages/customer/CustomerDashboard"),
);
const CreateDelivery = lazy(() => import("./pages/customer/CreateDelivery"));
const Tracking = lazy(() => import("./pages/customer/DeliveryTracking"));
const CHistory = lazy(() => import("./pages/customer/DeliveryHistory"));
const WalletPage = lazy(() => import("./pages/customer/CustomerWallet"));
const PaymentCallback = lazy(() => import("./pages/customer/PaymentCallback"));
const WalletTopUpCallback = lazy(
  () => import("./pages/customer/WalletTopUpCallback"),
);
const Addresses = lazy(() => import("./pages/customer/SavedAddresses"));
const Support = lazy(() => import("./pages/customer/CustomerSupport"));
const CSettings = lazy(() => import("./pages/customer/CustomerSettings"));
const CourierHome = lazy(() => import("./pages/courier/CourierDashboard"));
const Onboarding = lazy(() => import("./pages/courier/CourierVerification"));
const JobDetails = lazy(() => import("./pages/courier/JobDetails"));
const ActiveJob = lazy(() => import("./pages/courier/ActiveJob"));
const CourierEarnings = lazy(() => import("./pages/courier/CourierEarnings"));
const CourierWithdrawals = lazy(
  () => import("./pages/courier/CourierWithdrawals"),
);
const CourierRatings = lazy(() => import("./pages/courier/CourierRatings"));
const CourierHistory = lazy(() => import("./pages/courier/CourierHistory"));
const MerchantOverview = lazy(
  () => import("./pages/merchant/MerchantDashboard"),
);
const MerchantOrders = lazy(() => import("./pages/merchant/MerchantOrders"));
const MerchantBulk = lazy(() =>
  import("./pages/merchant/Pages").then((module) => ({
    default: module.MerchantBulk,
  })),
);
const MerchantCustomers = lazy(
  () => import("./pages/merchant/MerchantCustomers"),
);
const MerchantPayments = lazy(
  () => import("./pages/merchant/MerchantPayments"),
);
const MerchantStaff = lazy(() => import("./pages/merchant/MerchantStaff"));
const MerchantSettings = lazy(
  () => import("./pages/merchant/MerchantSettings"),
);
const AdminOverview = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCouriers = lazy(() => import("./pages/admin/AdminCouriers"));
const AdminCourierDetail = lazy(
  () => import("./pages/admin/AdminCourierVerification"),
);
const AdminDeliveries = lazy(() => import("./pages/admin/AdminDeliveries"));
const AdminMap = lazy(() => import("./pages/admin/AdminLiveMap"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminFraud = lazy(() => import("./pages/admin/AdminFraudAlerts"));
const AdminPricing = lazy(() => import("./pages/admin/AdminPricingSettings"));
const AdminCategories = lazy(() =>
  import("./pages/admin/Pages").then((module) => ({
    default: module.AdminCategories,
  })),
);
const AdminTrust = lazy(() => import("./pages/admin/AdminTrustLevels"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupportTickets"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminEmailOperations = lazy(
  () => import("./pages/admin/AdminEmailOperations"),
);

const customerNav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/new", label: "New delivery", icon: Plus },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/notifications", label: "Notifications", icon: BellRing },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/addresses", label: "Addresses", icon: MapPin },
  { to: "/app/support", label: "Support", icon: LifeBuoy },
  { to: "/app/profile", label: "Profile", icon: User },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const courierNav: NavItem[] = [
  { to: "/courier", label: "Home", icon: Home, end: true },
  { to: "/courier/onboarding", label: "Onboarding", icon: ShieldCheck },
  { to: "/courier/earnings", label: "Earnings", icon: Coins },
  { to: "/courier/withdrawals", label: "Withdrawals", icon: Wallet },
  { to: "/courier/notifications", label: "Notifications", icon: BellRing },
  { to: "/courier/ratings", label: "Ratings", icon: Star },
  { to: "/courier/history", label: "History", icon: History },
  { to: "/courier/profile", label: "Profile", icon: User },
];

const merchantNav: NavItem[] = [
  { to: "/merchant", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/merchant/new", label: "New delivery", icon: Plus },
  { to: "/merchant/orders", label: "Orders", icon: ClipboardList },
  { to: "/merchant/bulk", label: "Bulk", icon: Upload },
  { to: "/merchant/customers", label: "Customers", icon: Users },
  { to: "/merchant/payments", label: "Payments", icon: CreditCard },
  { to: "/merchant/notifications", label: "Notifications", icon: BellRing },
  { to: "/merchant/staff", label: "Staff", icon: Store },
  { to: "/merchant/profile", label: "Profile", icon: User },
  { to: "/merchant/settings", label: "Settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/couriers", label: "Couriers", icon: Bike },
  { to: "/admin/deliveries", label: "Deliveries", icon: Package },
  { to: "/admin/map", label: "Live map", icon: Map },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/notifications", label: "Notifications", icon: BellRing },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { to: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { to: "/admin/fraud", label: "Fraud alerts", icon: ShieldAlert },
  { to: "/admin/settings/pricing", label: "Pricing", icon: Tag },
  { to: "/admin/settings/categories", label: "Categories", icon: Building2 },
  { to: "/admin/settings/trust", label: "Trust levels", icon: BadgeCheck },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/admin/audit", label: "Audit log", icon: FileText },
  { to: "/admin/email", label: "Email", icon: MailCheck },
  { to: "/admin/profile", label: "Profile", icon: User },
];

const App = () => {
  useEffect(() => {
    // hydrate() checks for a stored session and no-ops immediately if there
    // isn't one, so it's safe to call unconditionally here. Gating this on
    // the pathname at mount time meant logging in from /auth/login and
    // getting routed to a protected page never called hydrate() at all,
    // since this effect only runs once and the app never remounts on
    // client-side navigation — leaving the store stuck in its initial
    // loading:true state for the rest of the session.
    store.hydrate();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Suspense
            fallback={
              <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
                Loading MoveDek…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<Navigate to="/auth/login" replace />}
              />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/otp" element={<Otp />} />
              <Route path="/auth/check-email" element={<CheckEmail />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/forgot" element={<Forgot />} />
              <Route path="/auth/reset" element={<ResetPassword />} />

              <Route element={<RequireAuth />}>
                <Route
                  element={
                    <DashboardShell
                      role="customer"
                      nav={customerNav}
                      title="Customer"
                    />
                  }
                >
                  <Route path="/app" element={<CustomerDashboard />} />
                  <Route path="/app/new" element={<CreateDelivery />} />
                  <Route path="/app/track/:id" element={<Tracking />} />
                  <Route path="/app/history" element={<CHistory />} />
                  <Route
                    path="/app/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/app/wallet" element={<WalletPage />} />
                  <Route
                    path="/app/wallet/callback"
                    element={<WalletTopUpCallback />}
                  />
                  <Route
                    path="/app/payments/callback"
                    element={<PaymentCallback />}
                  />
                  <Route path="/app/addresses" element={<Addresses />} />
                  <Route path="/app/support" element={<Support />} />
                  <Route path="/app/profile" element={<ProfilePage />} />
                  <Route path="/app/settings" element={<CSettings />} />
                </Route>

                <Route
                  element={
                    <DashboardShell
                      role="courier"
                      nav={courierNav}
                      title="Courier"
                    />
                  }
                >
                  <Route path="/courier" element={<CourierHome />} />
                  <Route path="/courier/onboarding" element={<Onboarding />} />
                  <Route path="/courier/jobs/:id" element={<JobDetails />} />
                  <Route path="/courier/active/:id" element={<ActiveJob />} />
                  <Route
                    path="/courier/earnings"
                    element={<CourierEarnings />}
                  />
                  <Route
                    path="/courier/withdrawals"
                    element={<CourierWithdrawals />}
                  />
                  <Route
                    path="/courier/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/courier/ratings" element={<CourierRatings />} />
                  <Route path="/courier/history" element={<CourierHistory />} />
                  <Route path="/courier/profile" element={<ProfilePage />} />
                </Route>

                <Route
                  element={
                    <DashboardShell
                      role="merchant"
                      nav={merchantNav}
                      title="Merchant"
                    />
                  }
                >
                  <Route path="/merchant" element={<MerchantOverview />} />
                  <Route path="/merchant/new" element={<CreateDelivery />} />
                  <Route path="/merchant/orders" element={<MerchantOrders />} />
                  <Route path="/merchant/bulk" element={<MerchantBulk />} />
                  <Route
                    path="/merchant/customers"
                    element={<MerchantCustomers />}
                  />
                  <Route
                    path="/merchant/payments"
                    element={<MerchantPayments />}
                  />
                  <Route
                    path="/merchant/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/merchant/staff" element={<MerchantStaff />} />
                  <Route path="/merchant/profile" element={<ProfilePage />} />
                  <Route
                    path="/merchant/settings"
                    element={<MerchantSettings />}
                  />
                </Route>

                <Route
                  element={
                    <DashboardShell role="admin" nav={adminNav} title="Admin" />
                  }
                >
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/couriers" element={<AdminCouriers />} />
                  <Route
                    path="/admin/couriers/:id"
                    element={<AdminCourierDetail />}
                  />
                  <Route
                    path="/admin/deliveries"
                    element={<AdminDeliveries />}
                  />
                  <Route path="/admin/map" element={<AdminMap />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                  <Route
                    path="/admin/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route
                    path="/admin/withdrawals"
                    element={<AdminWithdrawals />}
                  />
                  <Route path="/admin/disputes" element={<AdminDisputes />} />
                  <Route path="/admin/fraud" element={<AdminFraud />} />
                  <Route
                    path="/admin/settings/pricing"
                    element={<AdminPricing />}
                  />
                  <Route
                    path="/admin/settings/categories"
                    element={<AdminCategories />}
                  />
                  <Route
                    path="/admin/settings/trust"
                    element={<AdminTrust />}
                  />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/audit" element={<AdminAudit />} />
                  <Route
                    path="/admin/email"
                    element={<AdminEmailOperations />}
                  />
                  <Route path="/admin/profile" element={<ProfilePage />} />
                </Route>
              </Route>

              <Route
                path="/dashboard"
                element={<Navigate to="/app" replace />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
