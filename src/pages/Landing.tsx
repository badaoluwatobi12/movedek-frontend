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
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl accent-gradient shadow-glow">
              <Zap className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-xl font-bold text-primary">MoveDek</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex text-sm text-muted-foreground">
            <a href="#how" className="hover:text-primary">
              How it works
            </a>
            <a href="#categories" className="hover:text-primary">
              Categories
            </a>
            <a href="#couriers" className="hover:text-primary">
              Couriers
            </a>
            <a href="#merchants" className="hover:text-primary">
              For merchants
            </a>
            <a href="#faq" className="hover:text-primary">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth/register">
              <Button className="accent-gradient text-white shadow-glow hover:opacity-95">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden hero-gradient text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(hsl(200 100% 70% / .5) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="container-x relative py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="chip bg-white/10 text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Launching in Lagos — Yaba first
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold leading-[1.05]">
              Fast delivery powered by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-green-300">
                people already moving.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-white/80 text-lg">
              MoveDek connects you with verified nearby couriers for food, groceries, pharmacy pickups, parcels
              and business logistics — with live tracking, PINs and delivery protection built in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth/register?role=customer">
                <Button size="lg" className="accent-gradient text-white shadow-glow hover:opacity-95">
                  Request delivery <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/register?role=courier">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  Become a courier
                </Button>
              </Link>
              <Link to="/auth/register?role=merchant">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  Partner as merchant
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-green-300" /> Average pickup in 8 min
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-300" /> ID-verified couriers
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-green-300" /> 4.9 rider rating
              </div>
            </div>
          </div>

          <div className="animate-fade-up">
            <div className="relative mx-auto max-w-md rounded-3xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/20 shadow-2xl">
              <div className="rounded-2xl bg-white text-foreground p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Delivery #SL-4291</div>
                    <div className="font-display text-lg font-semibold">Jollof rice & chicken</div>
                  </div>
                  <span className="chip bg-warning/15 text-warning-foreground">In transit</span>
                </div>
                <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Yaba → Victoria Island
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
                    TB
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Tunde B. · Motorcycle</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      4.9 · Gold courier
                    </div>
                  </div>
                  <span className="chip bg-success/15 text-success">PIN 2847</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-semibold text-primary">6.4 km</div>Distance
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-semibold text-primary">₦1,900</div>Fee
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="font-semibold text-primary">12 min</div>ETA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section container-x">
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
      <section id="categories" className="section bg-muted/40">
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
      <section id="couriers" className="section hero-gradient text-white">
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
      <section id="merchants" className="section container-x">
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
      <section id="faq" className="section container-x max-w-3xl">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary text-center">
          Frequently asked
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {[
            {
              q: "Where does MoveDek operate?",
              a: "We're launching in Lagos, starting with Yaba and surrounding mainland/island corridors. New areas roll out monthly.",
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
              Fast delivery powered by people already moving.
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
              <li>Lagos, Nigeria</li>
              <li>hello@movedek.ng</li>
              <li>© {new Date().getFullYear()} MoveDek</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
