export const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const genPin = () => String(Math.floor(1000 + Math.random() * 9000));
export const genId = (p = "id") =>
  `${p}_${Math.random().toString(36).slice(2, 9)}`;

export type PricingZone =
  | "same_area"
  | "nearby_areas"
  | "across_city"
  | "outskirts";

export const pricingZoneDetails: Record<
  PricingZone,
  { label: string; description: string; fare: number }
> = {
  same_area: {
    label: "Within Your Area",
    description: "Pickup and delivery are in the same neighbourhood.",
    fare: 1000,
  },
  nearby_areas: {
    label: "Nearby Area",
    description: "Delivery is to a neighbouring area.",
    fare: 1500,
  },
  across_city: {
    label: "Across Town",
    description: "Delivery crosses several areas within the city.",
    fare: 2500,
  },
  outskirts: {
    label: "City Outskirts",
    description: "Delivery is near or beyond the main edge of the city.",
    fare: 4000,
  },
};

export type PricingLocation = {
  area: string;
  latitude: number;
  longitude: number;
};

const distanceBetweenKm = (a: PricingLocation, b: PricingLocation) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const firstLat = toRadians(a.latitude);
  const secondLat = toRadians(b.latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const resolvePricingZone = (
  pickup: PricingLocation,
  dropoff: PricingLocation,
): PricingZone => {
  const normalizedPickup = pickup.area.trim().toLocaleLowerCase("en-NG");
  const normalizedDropoff = dropoff.area.trim().toLocaleLowerCase("en-NG");
  const distance = distanceBetweenKm(pickup, dropoff);

  if (
    (normalizedPickup.length > 0 && normalizedPickup === normalizedDropoff) ||
    distance <= 3
  ) {
    return "same_area";
  }
  if (distance <= 12) return "nearby_areas";
  if (distance <= 30) return "across_city";
  return "outskirts";
};

export const priceEstimate = ({
  pickup,
  dropoff,
  protection,
  zoneFares,
  protectionFee = 300,
}: {
  pickup: PricingLocation;
  dropoff: PricingLocation;
  protection: boolean;
  zoneFares?: Partial<Record<PricingZone, number>>;
  protectionFee?: number;
}) => {
  const zone = resolvePricingZone(pickup, dropoff);
  const configuredFare = zoneFares?.[zone];
  const zoneFare = Number.isFinite(configuredFare)
    ? Number(configuredFare)
    : pricingZoneDetails[zone].fare;
  const protectionAmount = protection ? protectionFee : 0;
  return {
    zone,
    zoneLabel: pricingZoneDetails[zone].label,
    zoneDescription: pricingZoneDetails[zone].description,
    zoneFare,
    protection: protectionAmount,
    total: zoneFare + protectionAmount,
  };
};

export const trustCap: Record<string, number> = {
  bronze: 15000,
  silver: 75000,
  gold: 250000,
  platinum: 5_000_000,
};

export const riskFor = (value: number): "low" | "medium" | "high" =>
  value < 20000 ? "low" : value < 100000 ? "medium" : "high";
