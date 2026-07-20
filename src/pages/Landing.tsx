import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Package,
  Bike,
  Car,
  Truck,
  ShieldCheck,
  MapPin,
  Lock,
  CircleDollarSign,
  Utensils,
  Pill,
  ShoppingBasket,
  Building2,
  HandHeart,
  Zap,
  Star,
  Timer,
  Users,
  ArrowRight,
  Globe2,
  Navigation,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

const categories = [
  { icon: Utensils, name: "Food", desc: "Hot meals delivered warm" },
  { icon: ShoppingBasket, name: "Groceries", desc: "Market runs, made easy" },
  { icon: Pill, name: "Pharmacy", desc: "Prescription pickups" },
  { icon: Package, name: "Parcel", desc: "Send anything, anywhere" },
  { icon: HandHeart, name: "Personal Pickup", desc: "Grab it for me" },
  { icon: CircleDollarSign, name: "Buy For Me", desc: "Courier shops on your behalf" },
  { icon: Building2, name: "Business", desc: "Bulk & merchant logistics" },
];

const couriers = [
  { icon: Users, name: "Everyday Courier", tag: "For light items" },
  { icon: Bike, name: "Motorcycle", tag: "Fastest across town" },
  { icon: Car, name: "Car Courier", tag: "Medium loads, comfort" },
  { icon: Truck, name: "Van & Logistics", tag: "Business scale" },
];

const trust = [
  { icon: ShieldCheck, title: "Verified couriers", desc: "ID, selfie & vehicle checks before going live." },
  { icon: MapPin, title: "Live tracking", desc: "Follow your delivery in real time." },
  { icon: Lock, title: "PIN confirmation", desc: "Pickup & drop-off PINs prevent mix-ups." },
  { icon: Star, title: "Delivery protection", desc: "Optional cover on declared item value." },
];

export default function Landing() {
  useLayoutEffect(() => {
    // Marketing pages should always open at the beginning instead of restoring
    // a stale scroll position from a previous route or deployment refresh.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background pt-[76px]">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-[100] border-b border-emerald-950/10 bg-white/90 shadow-[0_8px_30px_-24px_rgba(6,78,59,.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/82">
        <div className="container-x flex h-[76px] items-center justify-between">
          <Link to="/" className="group flex items-center gap-3" aria-label="MoveDek home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 shadow-[0_10px_24px_-10px_rgba(5,150,105,.8)] transition-transform group-hover:-rotate-3 group-hover:scale-105">
              <Zap className="h-6 w-6 fill-white text-white" />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-emerald-800">MoveDek</span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary navigation">
            {[
              ["#how", "How it works"],
              ["#categories", "Categories"],
              ["#couriers", "Couriers"],
              ["#merchants", "For merchants"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden items-center gap-2 border-r border-slate-200 pr-4 text-sm font-medium text-slate-600 xl:flex" type="button">
              <Globe2 className="h-4 w-4" /> English
            </button>
            <Link to="/auth/login">
              <Button variant="ghost" className="font-semibold text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900">Sign in</Button>
            </Link>
            <Link to="/auth/register">
              <Button className="rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,.8)] hover:bg-emerald-700">
                <span className="hidden sm:inline">Get started</span><ArrowRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="landing-hero relative text-white" aria-labelledby="landing-heading">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="landing-dot-grid absolute inset-0 opacity-30" />
          <div className="landing-route landing-route-one" />
          <div className="landing-route landing-route-two" />
        </div>

        <div className="container-x relative grid min-h-[calc(100svh-76px)] items-center gap-12 py-16 lg:grid-cols-[.95fr_1.05fr] lg:py-20 xl:min-h-[760px]">
          <div className="relative z-10 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-emerald-50 shadow-lg backdrop-blur">
              <Navigation className="h-3.5 w-3.5" /> Delivery built for everyday movement
            </span>
            <h1 id="landing-heading" className="mt-7 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl xl:text-7xl">
              Fast, trackable delivery for <span className="text-emerald-300">parcels, groceries</span> and growing businesses.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg">
              Book a verified courier for parcels, groceries, pharmacy pickups, personal errands and business logistics. Follow every trip live and confirm each handoff with secure PINs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth/register?role=customer">
                <Button size="lg" className="h-14 w-full rounded-2xl border border-emerald-300/70 bg-emerald-500 px-7 font-bold text-white shadow-[0_20px_45px_-18px_rgba(16,185,129,.9)] hover:bg-emerald-400 sm:w-auto">
                  <Zap className="mr-2 h-4 w-4 fill-current" /> Request delivery <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/register?role=courier">
                <Button size="lg" variant="outline" className="h-14 w-full rounded-2xl border-white/45 bg-white/5 px-7 font-bold text-white backdrop-blur hover:bg-white/15 hover:text-white sm:w-auto">
                  <Users className="mr-2 h-4 w-4" /> Become a courier
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-emerald-50/80">
              <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" /> ID-verified couriers</span>
              <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-300" /> Live tracking</span>
              <span className="flex items-center gap-2"><Lock className="h-5 w-5 text-emerald-300" /> PIN protection</span>
              <span className="flex items-center gap-2"><Star className="h-5 w-5 text-emerald-300" /> Rated service</span>
            </div>
          </div>

          <div className="relative hidden min-h-[570px] lg:block" aria-label="MoveDek live delivery tracking preview">
            <div className="landing-pin landing-pin-one"><MapPin className="h-7 w-7" /></div>
            <div className="landing-pin landing-pin-two"><MapPin className="h-5 w-5" /></div>

            <div className="landing-scooter" aria-hidden="true">
              <Bike className="h-28 w-28 text-emerald-100/90" strokeWidth={1.35} />
            </div>

            <div className="landing-phone">
              <div className="landing-phone-notch" />
              <div className="landing-phone-screen">
                <div className="flex items-center justify-between px-5 pb-3 pt-7">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">In transit</div>
                    <div className="text-[11px] text-slate-500">Arriving in 12 min</div>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"><PhoneCall className="h-4 w-4" /></span>
                </div>
                <div className="landing-map">
                  <span className="landing-map-label landing-map-label-one">PICKUP</span>
                  <span className="landing-map-label landing-map-label-two">IN TRANSIT</span>
                  <span className="landing-map-label landing-map-label-three">DROP-OFF</span>
                  <svg viewBox="0 0 320 220" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    <path d="M70 170 C115 170 95 125 145 122 S176 70 232 58" fill="none" stroke="#059669" strokeWidth="7" strokeLinecap="round" />
                    <circle cx="70" cy="170" r="8" fill="white" stroke="#059669" strokeWidth="5" />
                    <circle cx="145" cy="122" r="7" fill="white" stroke="#059669" strokeWidth="5" />
                    <circle cx="232" cy="58" r="14" fill="#059669" stroke="white" strokeWidth="5" />
                  </svg>
                </div>
                <div className="landing-delivery-card">
                  <div className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">Delivery #MD-4291</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900">Live parcel delivery</div>
                  <div className="mt-4 space-y-3 text-xs text-slate-600">
                    <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-emerald-600" /><span><b className="block text-slate-400">Pickup</b>Collection point</span></div>
                    <div className="flex gap-3"><Navigation className="mt-0.5 h-4 w-4 text-emerald-600" /><span><b className="block text-slate-400">Drop-off</b>Delivery destination</span></div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Share live tracking</div>
                </div>
              </div>
            </div>

            <div className="landing-parcel landing-parcel-one"><Package className="h-8 w-8" /></div>
            <div className="landing-parcel landing-parcel-two"><ShoppingBasket className="h-8 w-8" /></div>
          </div>
        </div>

        <div className="container-x relative z-20 pb-10 lg:pb-12">
          <div className="grid overflow-hidden rounded-3xl border border-white/20 bg-white text-slate-900 shadow-[0_28px_70px_-30px_rgba(6,78,59,.55)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Bike, value: "Fast", label: "Courier matching" },
              { icon: Users, value: "Verified", label: "Courier network" },
              { icon: ShieldCheck, value: "Protected", label: "PIN-confirmed trips" },
              { icon: Star, value: "Rated", label: "Service quality" },
            ].map(({ icon: Icon, value, label }, index) => (
              <div key={label} className={`flex items-center gap-4 px-6 py-6 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon className="h-6 w-6" /></span>
                <div><div className="font-display text-xl font-extrabold text-emerald-950">{value}</div><div className="text-sm text-slate-500">{label}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section container-x scroll-mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">How MoveDek works</h2>
          <p className="mt-3 text-muted-foreground">Three steps between you and delivered.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              n: 1,
              title: "Create a request",
              desc: "Pick a category, add pickup and drop-off details, and see instant pricing.",
            },
            {
              n: 2,
              title: "Matched with a courier",
              desc: "A nearby verified courier accepts. Track live from your dashboard.",
            },
            {
              n: 3,
              title: "PIN & proof delivered",
              desc: "Confirm pickup and drop-off with unique PINs and photo proof.",
            },
          ].map((s) => (
            <div key={s.n} className="card-elevated p-6">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl accent-gradient text-white font-display font-bold">
                {s.n}
              </div>
              <h3 className="font-display text-xl font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="section scroll-mt-24 bg-muted/40">
        <div className="container-x">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
                Delivery categories
              </h2>
              <p className="mt-2 text-muted-foreground">Everything you already send — under one app.</p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div key={c.name} className="card-elevated p-5 hover:shadow-lg transition">
                <c.icon className="h-6 w-6 text-accent" />
                <div className="mt-4 font-display text-lg font-semibold text-primary">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="section container-x">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-accent/15 text-accent">
              <ShieldCheck className="h-3 w-3" /> Trust & safety
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-primary">
              Safer than your average dispatch.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md">
              Every MoveDek delivery is protected by identity verification, live tracking, PIN confirmation,
              delivery proof and escrow-style payments.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trust.map((t) => (
              <div key={t.title} className="card-elevated p-5">
                <t.icon className="h-6 w-6 text-success" />
                <div className="mt-3 font-display font-semibold text-primary">{t.title}</div>
                <div className="text-sm text-muted-foreground">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURIERS */}
      <section id="couriers" className="section scroll-mt-24 hero-gradient text-white">
        <div className="container-x grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 grid gap-4 sm:grid-cols-2">
            {couriers.map((c) => (
              <div key={c.name} className="rounded-2xl bg-white/10 backdrop-blur p-5 ring-1 ring-white/20">
                <c.icon className="h-6 w-6 text-green-300" />
                <div className="mt-3 font-display font-semibold">{c.name}</div>
                <div className="text-sm text-white/70">{c.tag}</div>
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <span className="chip bg-white/10 text-white/80">Earn with MoveDek</span>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold">
              Already moving? Get paid to deliver on the way.
            </h2>
            <p className="mt-3 text-white/80 max-w-md">
              Whether you commute daily, ride a motorcycle, or run a logistics fleet — accept jobs that match
              your route, level and vehicle. Grow from Bronze to Platinum and unlock high-value deliveries.
            </p>
            <Link to="/auth/register?role=courier">
              <Button size="lg" className="mt-6 accent-gradient text-white shadow-glow hover:opacity-95">
                Become a courier
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* MERCHANTS */}
      <section id="merchants" className="section container-x scroll-mt-24">
        <div className="card-elevated overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <span className="chip bg-primary/10 text-primary">
                <Building2 className="h-3 w-3" /> For merchants
              </span>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-primary">
                You sell. MoveDek delivers.
              </h2>
              <p className="mt-3 text-muted-foreground">
                One dashboard for all your outbound orders — restaurants, pharmacies, boutiques, and online
                shops. Bulk dispatch, saved customers, and business-grade tracking.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Bulk delivery creation",
                  "Saved customer directory",
                  "Consolidated invoicing",
                  "Priority courier matching",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth/register?role=merchant">
                <Button size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Partner with MoveDek
                </Button>
              </Link>
            </div>
            <div className="hero-gradient p-8 md:p-12 flex items-center">
              <div className="w-full rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 p-6 text-white">
                <div className="text-sm text-white/80">This week</div>
                <div className="mt-1 font-display text-3xl font-bold">₦482,300</div>
                <div className="text-sm text-white/80">delivered across 92 orders</div>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/10 p-3">
                    <div className="text-xs text-white/70">Active</div>
                    <div className="font-display font-bold">14</div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <div className="text-xs text-white/70">Today</div>
                    <div className="font-display font-bold">28</div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <div className="text-xs text-white/70">Customers</div>
                    <div className="font-display font-bold">340</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section container-x max-w-3xl scroll-mt-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary text-center">
          Frequently asked
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {[
            {
              q: "Where does MoveDek operate?",
              a: "MoveDek is expanding service coverage in phases. Enter your pickup and destination during booking to confirm whether delivery is available in your area.",
            },
            {
              q: "How are couriers verified?",
              a: "Every courier submits a selfie, government ID, and (when applicable) driver's license and vehicle papers. Trust levels unlock as they complete deliveries.",
            },
            {
              q: "What is delivery protection?",
              a: "For a small extra fee, MoveDek covers up to the declared value of your item if it's lost or damaged in transit.",
            },
            {
              q: "How does payment work?",
              a: "Customers pay upfront via wallet or card. Funds are held escrow-style and released to couriers on successful delivery.",
            },
            {
              q: "What items are prohibited?",
              a: "Illegal substances, firearms, hazardous materials, live animals, and any items restricted by Nigerian law. You'll see a reminder during checkout.",
            },
          ].map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="container-x py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl accent-gradient">
                <Zap className="h-5 w-5 text-white" />
              </span>
              <span className="font-display text-xl font-bold">MoveDek</span>
            </div>
            <p className="mt-3 text-sm text-primary-foreground/70">
              Flexible delivery for parcels, errands and business logistics.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#categories">Categories</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">For you</div>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/auth/register?role=customer">Send a package</Link>
              </li>
              <li>
                <Link to="/auth/register?role=courier">Drive with us</Link>
              </li>
              <li>
                <Link to="/auth/register?role=merchant">Merchant partners</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
              <li>Delivery and logistics platform</li>
              <li>hello@movedek.ng</li>
              <li>© {new Date().getFullYear()} MoveDek</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
