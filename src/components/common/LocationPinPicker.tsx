import { useEffect, useMemo, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L, { type LeafletMouseEvent, type Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

export type LocationPin = {
  latitude: number;
  longitude: number;
};

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:9999px;background:#0298E3;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function ClickToSelect({ onChange }: { onChange: (pin: LocationPin) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

function Recenter({ pin }: { pin: LocationPin | null }) {
  const map = useMap();
  useEffect(() => {
    if (pin) map.setView([pin.latitude, pin.longitude], Math.max(map.getZoom(), 15));
  }, [map, pin]);
  return null;
}

export function LocationPinPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocationPin | null;
  onChange: (pin: LocationPin) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const markerPosition = useMemo<[number, number] | null>(
    () => (value ? [value.latitude, value.longitude] : null),
    [value],
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location access is not available on this device. Tap the map to place the pin.");
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      () => {
        setMessage("MoveDek could not read your location. Tap the map to place the pin manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-primary">{label}</div>
          <p className="text-xs text-muted-foreground">
            Tap the map or drag the pin. The written address does not need to match a map search.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
          <Crosshair className="mr-2 h-4 w-4" />
          {locating ? "Locating…" : "Use current location"}
        </Button>
      </div>
      <div className="h-64 overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={markerPosition ?? LAGOS_CENTER}
          zoom={markerPosition ? 15 : 11}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSelect onChange={onChange} />
          <Recenter pin={value} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const marker = event.target as LeafletMarker;
                  const point = marker.getLatLng();
                  onChange({
                    latitude: Number(point.lat.toFixed(6)),
                    longitude: Number(point.lng.toFixed(6)),
                  });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {value
          ? `Pin selected: ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
          : "No pin selected yet"}
      </div>
      {message && <p className="text-xs text-warning-foreground">{message}</p>}
    </div>
  );
}
