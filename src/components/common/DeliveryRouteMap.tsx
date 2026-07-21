import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

const pickupIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#10b981;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const dropoffIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#ef4444;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const geocodeCache = new Map<string, [number, number] | null>();

async function geocode(address: string): Promise<[number, number] | null> {
  if (geocodeCache.has(address)) return geocodeCache.get(address) ?? null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${address}, Lagos, Nigeria`)}`,
    );
    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
    }>;
    const first = results[0];
    const point: [number, number] | null = first
      ? [Number(first.lat), Number(first.lon)]
      : null;
    geocodeCache.set(address, point);
    return point;
  } catch {
    geocodeCache.set(address, null);
    return null;
  }
}

function FitToPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      const point = points[0];
      if (point) map.setView(point, 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 });
  }, [points, map]);
  return null;
}

export function DeliveryRouteMap({
  pickupAddress,
  dropoffAddress,
  className,
}: {
  pickupAddress: string;
  dropoffAddress: string;
  className?: string;
}) {
  const [pickup, setPickup] = useState<[number, number] | null | undefined>(
    undefined,
  );
  const [dropoff, setDropoff] = useState<[number, number] | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setPickup(undefined);
    setDropoff(undefined);
    geocode(pickupAddress).then((point) => !cancelled && setPickup(point));
    geocode(dropoffAddress).then((point) => !cancelled && setDropoff(point));
    return () => {
      cancelled = true;
    };
  }, [pickupAddress, dropoffAddress]);

  const loading = pickup === undefined || dropoff === undefined;
  const points = [pickup, dropoff].filter((p): p is [number, number] =>
    Boolean(p),
  );

  if (!loading && points.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-muted/20 text-center text-sm text-muted-foreground ${className ?? ""}`}
      >
        <p>Couldn't locate these addresses on the map.</p>
        <p className="text-xs">
          {pickupAddress} → {dropoffAddress}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border ${className ?? ""}`}
    >
      <MapContainer
        center={LAGOS_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPoints points={points} />
        {pickup && <Marker position={pickup} icon={pickupIcon} />}
        {dropoff && <Marker position={dropoff} icon={dropoffIcon} />}
        {pickup && dropoff && (
          <Polyline
            positions={[pickup, dropoff]}
            pathOptions={{ color: "#0298E3", dashArray: "6 8", weight: 3 }}
          />
        )}
      </MapContainer>
      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-sm font-medium">
          Locating addresses…
        </div>
      )}
    </div>
  );
}
