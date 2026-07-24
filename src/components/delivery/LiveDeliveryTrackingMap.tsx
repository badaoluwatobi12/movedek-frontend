import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { Radio, RefreshCw, WifiOff } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "@/services/apiBase";
import { DeliveryRouteMap } from "@/components/common";

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const POLL_INTERVAL_MS = 15_000;

type TrackingSnapshot = {
  delivery_id: string;
  courier_id: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recorded_at: string | null;
  updated_at: string | null;
  stale: boolean;
  session?: {
    id: string;
    status: string;
    started_at: string;
    last_location_at: string | null;
  } | null;
};

function socketBaseUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

async function fetchTracking(deliveryId: string) {
  const response = await fetch(`${API_BASE_URL}/tracking/${deliveryId}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`Tracking request failed (${response.status}).`);
  const body = (await response.json()) as { data: TrackingSnapshot };
  return body.data;
}

function FollowCourier({ location }: { location: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(location, Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [location, map]);
  return null;
}

function courierIcon(heading: number | null) {
  const rotation = Number.isFinite(heading) ? Number(heading) : 0;
  return L.divIcon({
    className: "",
    html: `<div style="transform:rotate(${rotation}deg);width:42px;height:42px;border-radius:9999px;background:#08a75f;border:4px solid white;box-shadow:0 5px 18px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;color:white;font-size:20px">➤</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });
}

function freshness(updatedAt: string | null) {
  if (!updatedAt) return "Waiting for courier GPS";
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(updatedAt)) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  return `Updated ${Math.floor(seconds / 60)}m ago`;
}

export function LiveDeliveryTrackingMap({
  deliveryId,
  pickupAddress,
  dropoffAddress,
  pickupCoordinates,
  dropoffCoordinates,
  active,
  className,
}: {
  deliveryId: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoordinates?: [number, number] | null;
  dropoffCoordinates?: [number, number] | null;
  active: boolean;
  className?: string;
}) {
  const [tracking, setTracking] = useState<TrackingSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchTracking(deliveryId);
      setTracking(next);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load tracking.");
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void refresh();
    if (!active) return;
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active, refresh]);

  useEffect(() => {
    if (!active) return;
    const socket = io(socketBaseUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("tracking:subscribe", deliveryId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("tracking:update", (next: TrackingSnapshot) => setTracking(next));
    return () => {
      socket.disconnect();
    };
  }, [active, deliveryId]);

  const location = useMemo<[number, number] | null>(() => {
    if (!tracking || !Number.isFinite(tracking.latitude) || !Number.isFinite(tracking.longitude)) return null;
    return [Number(tracking.latitude), Number(tracking.longitude)];
  }, [tracking]);

  if (!location) {
    return (
      <div className="relative">
        <DeliveryRouteMap
          pickupAddress={pickupAddress}
          dropoffAddress={dropoffAddress}
          pickupCoordinates={pickupCoordinates}
          dropoffCoordinates={dropoffCoordinates}
          className={className}
        />
        <div className="absolute left-3 top-3 z-[1000] rounded-full bg-background/95 px-3 py-2 text-xs font-medium shadow-md">
          {loading ? "Checking courier GPS…" : "Waiting for courier GPS"}
        </div>
        {error ? (
          <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-destructive px-3 py-2 text-xs text-destructive-foreground shadow">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className ?? ""}`}>
      <MapContainer center={location ?? LAGOS_CENTER} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FollowCourier location={location} />
        {tracking?.accuracy && tracking.accuracy > 0 ? (
          <Circle center={location} radius={tracking.accuracy} pathOptions={{ opacity: 0.25, fillOpacity: 0.08 }} />
        ) : null}
        <Marker position={location} icon={courierIcon(tracking?.heading ?? null)}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Your courier</p>
              <p>{tracking?.speed == null ? "Speed unavailable" : `${Math.round(tracking.speed * 3.6)} km/h`}</p>
              <p>{freshness(tracking?.updated_at ?? null)}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-background/95 px-3 py-2 text-xs font-medium shadow-md">
        {connected ? <Radio className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-amber-500" />}
        {connected ? "Live" : "Polling"} · {freshness(tracking?.updated_at ?? null)}
      </div>
      <button
        type="button"
        onClick={() => void refresh()}
        className="absolute right-3 top-3 z-[1000] rounded-full bg-background/95 p-2 shadow-md"
        title="Refresh live location"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </button>
      {tracking?.stale ? (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow">
          Courier signal is stale. The app may be offline or background tracking was stopped.
        </div>
      ) : null}
    </div>
  );
}
