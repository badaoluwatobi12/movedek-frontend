import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "@/services/apiBase";
import { getStoredToken } from "@/lib/authStorage";

// Vite/bundler workaround: Leaflet's default marker icon paths break
// when bundled, so we point them at the CDN-hosted assets explicitly.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LiveCourier = {
  courier_id: string;
  user_id: string;
  full_name: string | null;
  vehicle_type: string | null;
  trust_level: string | null;
  latitude: number;
  longitude: number;
  updated_at: string;
};

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const POLL_INTERVAL_MS = 5000;

async function fetchLiveCouriers(): Promise<LiveCourier[]> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/tracking/couriers/live`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`Failed to load live couriers: ${response.status}`);
  const body = await response.json();
  return (body?.data ?? []) as LiveCourier[];
}

export function LiveCourierMap({ className }: { className?: string }) {
  const [couriers, setCouriers] = useState<LiveCourier[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchLiveCouriers();
        if (!cancelled) {
          setCouriers(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't load live courier locations.");
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className ?? ""}`}>
      <MapContainer center={LAGOS_CENTER} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {couriers.map((courier) => (
          <Marker key={courier.courier_id} position={[courier.latitude, courier.longitude]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{courier.full_name ?? "Courier"}</p>
                {courier.vehicle_type && <p className="text-muted-foreground">{courier.vehicle_type}</p>}
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(courier.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow">
        {error ? error : `${couriers.length} courier${couriers.length === 1 ? "" : "s"} online`}
      </div>
    </div>
  );
}
