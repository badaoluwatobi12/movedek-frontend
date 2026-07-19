import { useCallback, useEffect, useMemo, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import { Crosshair, LocateFixed, Radio, RefreshCw, Route, WifiOff } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "@/services/apiBase";
import { getStoredToken } from "@/lib/authStorage";

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const POLL_INTERVAL_MS = 15_000;

export type LiveCourier = {
  courier_id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  trust_level: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recorded_at: string | null;
  updated_at: string;
  age_seconds: number;
  stale: boolean;
  active_delivery: {
    id: string;
    status: string;
    pickup_address: string | null;
    dropoff_address: string | null;
  } | null;
};

type Summary = {
  total_couriers: number;
  online_couriers: number;
  live_locations: number;
  stale_locations: number;
  active_deliveries: number;
};

function socketBaseUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const body = await response.json();
  return body.data as T;
}

function courierIcon(courier: LiveCourier) {
  const statusClass = courier.stale ? "bg-amber-500" : "bg-emerald-500";
  const rotation = Number.isFinite(courier.heading) ? courier.heading : 0;
  return L.divIcon({
    className: "",
    html: `<div style="transform:rotate(${rotation}deg)" class="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white ${statusClass} text-white shadow-lg"><span style="font-size:18px;line-height:1">➤</span><span class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white ${statusClass}"></span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

function FitLiveCouriers({ couriers, enabled }: { couriers: LiveCourier[]; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || couriers.length === 0) return;
    if (couriers.length === 1) {
      const courier = couriers[0];
      if (courier) map.flyTo([courier.latitude, courier.longitude], 15, { duration: 0.8 });
      return;
    }
    map.fitBounds(L.latLngBounds(couriers.map((courier) => [courier.latitude, courier.longitude])), {
      padding: [48, 48],
      maxZoom: 15,
    });
  }, [couriers, enabled, map]);
  return null;
}

function ageLabel(seconds: number) {
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export function LiveCourierMap({ className }: { className?: string }) {
  const [couriers, setCouriers] = useState<LiveCourier[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [autoFit, setAutoFit] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [locations, currentSummary] = await Promise.all([
        apiGet<LiveCourier[]>("/tracking/couriers/live?include_stale=true"),
        apiGet<Summary>("/tracking/couriers/summary"),
      ]);
      setCouriers(locations);
      setSummary(currentSummary);
      setError(null);
      setLastRefresh(new Date());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load courier locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const socket = io(socketBaseUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("livemap:subscribe");
    });
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", () => setSocketConnected(false));
    socket.on("courier:location", (location: LiveCourier) => {
      setCouriers((current) => {
        const exists = current.some((candidate) => candidate.courier_id === location.courier_id);
        return exists
          ? current.map((candidate) => candidate.courier_id === location.courier_id ? location : candidate)
          : [location, ...current];
      });
      setLastRefresh(new Date());
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const liveCount = useMemo(() => couriers.filter((courier) => !courier.stale).length, [couriers]);
  const staleCount = couriers.length - liveCount;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-muted/20 ${className ?? ""}`}>
      <MapContainer center={LAGOS_CENTER} zoom={12} scrollWheelZoom className="h-full w-full" style={{ minHeight: 420 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitLiveCouriers couriers={couriers} enabled={autoFit} />
        {couriers.map((courier) => (
          <div key={courier.courier_id}>
            {courier.accuracy && courier.accuracy > 0 ? (
              <Circle center={[courier.latitude, courier.longitude]} radius={courier.accuracy} pathOptions={{ opacity: 0.25, fillOpacity: 0.08 }} />
            ) : null}
            <Marker position={[courier.latitude, courier.longitude]} icon={courierIcon(courier)}>
              <Popup minWidth={240}>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold">{courier.full_name ?? "Courier"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[courier.vehicle_type, courier.vehicle_plate].filter(Boolean).join(" · ") || "Vehicle not specified"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>Speed: {courier.speed == null ? "—" : `${Math.round(courier.speed * 3.6)} km/h`}</span>
                    <span>Accuracy: {courier.accuracy == null ? "—" : `±${Math.round(courier.accuracy)}m`}</span>
                  </div>
                  {courier.active_delivery ? (
                    <div className="rounded-md bg-muted p-2 text-xs">
                      <p className="font-medium">Delivery {courier.active_delivery.id}</p>
                      <p className="capitalize text-muted-foreground">{courier.active_delivery.status.replaceAll("_", " ")}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No active delivery</p>
                  )}
                  <p className={courier.stale ? "text-xs font-medium text-amber-600" : "text-xs text-emerald-600"}>
                    {courier.stale ? "Location stale" : "Live"} · updated {ageLabel(courier.age_seconds)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>

      <div className="absolute left-3 top-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
        <div className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
          {socketConnected ? <Radio className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-amber-500" />}
          {socketConnected ? "Real-time connected" : "Polling fallback"}
        </div>
        <div className="rounded-full bg-background/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
          {liveCount} live · {staleCount} stale
        </div>
        {summary ? (
          <div className="rounded-full bg-background/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
            {summary.active_deliveries} active deliveries
          </div>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 z-[1000] flex gap-2">
        <button type="button" onClick={() => setAutoFit((value) => !value)} className="rounded-full bg-background/95 p-2 shadow-md" title="Toggle automatic map fitting">
          {autoFit ? <LocateFixed className="h-4 w-4 text-primary" /> : <Crosshair className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => void refresh()} className="rounded-full bg-background/95 p-2 shadow-md" title="Refresh locations">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!loading && couriers.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border bg-background/95 p-5 text-center shadow-xl backdrop-blur">
            <Route className="mx-auto mb-3 h-8 w-8 text-primary" />
            <p className="font-semibold">No courier GPS signal yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              An approved courier must be online, grant location permission, and open an active delivery in the MoveDek mobile app.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-destructive px-3 py-2 text-xs text-destructive-foreground shadow">
          {error}
        </div>
      ) : lastRefresh ? (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-full bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow">
          Refreshed {lastRefresh.toLocaleTimeString()}
        </div>
      ) : null}
    </div>
  );
}
