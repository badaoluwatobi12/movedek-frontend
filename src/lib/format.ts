export const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const genPin = () => String(Math.floor(1000 + Math.random() * 9000));
export const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const priceEstimate = (distanceKm: number, protection: boolean, courierType: string) => {
  const base: Record<string, number> = {
    everyday: 700,
    motorcycle: 900,
    car: 1500,
    van: 2500,
    logistics: 3500,
  };
  const perKm: Record<string, number> = {
    everyday: 120,
    motorcycle: 150,
    car: 220,
    van: 320,
    logistics: 420,
  };
  const b = base[courierType] ?? 900;
  const km = perKm[courierType] ?? 150;
  const distance = Math.round(distanceKm * km);
  const service = Math.round((b + distance) * 0.08);
  const prot = protection ? 300 : 0;
  const total = b + distance + service + prot;
  return { base: b, distance, service, protection: prot, total };
};

export const trustCap: Record<string, number> = {
  bronze: 15000,
  silver: 75000,
  gold: 250000,
  platinum: 5_000_000,
};

export const riskFor = (value: number): "low" | "medium" | "high" =>
  value < 20000 ? "low" : value < 100000 ? "medium" : "high";
