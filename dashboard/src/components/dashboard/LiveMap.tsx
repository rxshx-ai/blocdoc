"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, Package, MapPin, Navigation, Clock, Thermometer, Activity } from "lucide-react";

// Fix Leaflet marker icons in Next.js
const markerIcons = {
  truck: new Icon({
    iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 17h4V5H2v12h3'/%3E%3Cpath d='M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5'/%3E%3Ccircle cx='7.5' cy='17.5' r='2.5'/%3E%3Ccircle cx='17.5' cy='17.5' r='2.5'/%3E%3C/svg%3E",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  pickup: new Icon({
    iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  delivery: new Icon({
    iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  warning: new Icon({
    iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'/%3E%3Cpath d='M12 9v4'/%3E%3Cpath d='M12 17h.01'/%3E%3C/svg%3E",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
};

// Map bounds updater component
function MapBoundsUpdater({ markers }: { markers: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = markers.map((m) => [m.lat, m.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers]);
  
  return null;
}

interface ShipmentLocation {
  id: string;
  shipment_id: string;
  pickup: { lat: number; lng: number; name: string };
  delivery: { lat: number; lng: number; name: string };
  current?: { lat: number; lng: number };
  status: string;
  cargo_type: string;
  temperature: number;
  eta: string;
  progress: number;
  provider?: string;
}

interface LiveMapProps {
  shipments?: ShipmentLocation[];
  userRole?: string;
  showHeatmap?: boolean;
}

// Generate mock shipment data
const generateMockShipments = (): ShipmentLocation[] => [
  {
    id: "ship-1",
    shipment_id: "TX-VAX-001",
    pickup: { lat: 12.9716, lng: 77.5946, name: "BioPharm Center" },
    delivery: { lat: 12.9352, lng: 77.6245, name: "City General Hospital" },
    current: { lat: 12.9534, lng: 77.6095 },
    status: "IN_TRANSIT",
    cargo_type: "Vaccines",
    temperature: 4.2,
    eta: "12:30 PM",
    progress: 65,
    provider: "MediFleet",
  },
  {
    id: "ship-2",
    shipment_id: "TX-BLD-002",
    pickup: { lat: 12.9279, lng: 77.6271, name: "Blood Bank" },
    delivery: { lat: 12.9898, lng: 77.5910, name: "Emergency Center" },
    current: { lat: 12.9588, lng: 77.6090 },
    status: "IN_TRANSIT",
    cargo_type: "Blood Samples",
    temperature: 3.8,
    eta: "11:45 AM",
    progress: 80,
    provider: "RapidMed",
  },
  {
    id: "ship-3",
    shipment_id: "TX-MED-003",
    pickup: { lat: 12.9988, lng: 77.5513, name: "Pharma Distribution" },
    delivery: { lat: 12.9121, lng: 77.6446, name: "Regional Hospital" },
    status: "PROVIDER_SELECTED",
    cargo_type: "Medicines",
    temperature: 22.0,
    eta: "02:00 PM",
    progress: 0,
    provider: "ColdChain",
  },
];

// Route path interpolator for animation
function interpolateRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }, progress: number) {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
}

export default function LiveMap({ shipments: propShipments, userRole = "admin", showHeatmap = false }: LiveMapProps) {
  const [shipments, setShipments] = useState<ShipmentLocation[]>(propShipments || generateMockShipments());
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Simulate live tracking updates
  useEffect(() => {
    const interval = setInterval(() => {
      setShipments((prev) =>
        prev.map((s) => {
          if (s.status === "IN_TRANSIT" && s.current && s.progress < 100) {
            const newProgress = Math.min(s.progress + 2, 100);
            const newPos = interpolateRoute(s.pickup, s.delivery, newProgress / 100);
            // Add slight randomness for realistic movement
            const jitter = 0.0005;
            return {
              ...s,
              current: {
                lat: newPos.lat + (Math.random() - 0.5) * jitter,
                lng: newPos.lng + (Math.random() - 0.5) * jitter,
              },
              progress: newProgress,
              temperature: s.temperature + (Math.random() - 0.5) * 0.3,
            };
          }
          return s;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const allMarkers = shipments.flatMap((s) => [
    s.pickup,
    s.delivery,
    ...(s.current ? [s.current] : []),
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "#10b981";
      case "IN_TRANSIT":
        return "#3b82f6";
      case "PROVIDER_SELECTED":
        return "#8b5cf6";
      case "DISPUTED":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  if (typeof window === "undefined") {
    return (
      <div className="h-[400px] flex items-center justify-center glass-panel">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater markers={allMarkers} />

        {shipments.map((shipment) => (
          <div key={shipment.id}>
            {/* Pickup marker */}
            <Marker
              position={[shipment.pickup.lat, shipment.pickup.lng]}
              icon={markerIcons.pickup}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold text-green-600">Pickup Location</p>
                  <p className="text-sm">{shipment.pickup.name}</p>
                  <p className="text-xs text-gray-500">{shipment.shipment_id}</p>
                </div>
              </Popup>
            </Marker>

            {/* Delivery marker */}
            <Marker
              position={[shipment.delivery.lat, shipment.delivery.lng]}
              icon={markerIcons.delivery}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold text-red-600">Delivery Location</p>
                  <p className="text-sm">{shipment.delivery.name}</p>
                  <p className="text-xs text-gray-500">{shipment.shipment_id}</p>
                </div>
              </Popup>
            </Marker>

            {/* Current position marker */}
            {shipment.current && (
              <Marker
                position={[shipment.current.lat, shipment.current.lng]}
                icon={markerIcons.truck}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">{shipment.shipment_id}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Cargo:</span> {shipment.cargo_type}</p>
                      <p><span className="text-gray-500">Provider:</span> {shipment.provider}</p>
                      <p className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        <span className={shipment.temperature > 8 ? "text-red-500" : "text-green-500"}>
                          {shipment.temperature.toFixed(1)}°C
                        </span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA: {shipment.eta}
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${shipment.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-center mt-1">{shipment.progress}% complete</p>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route line */}
            <Polyline
              positions={[
                [shipment.pickup.lat, shipment.pickup.lng],
                [shipment.delivery.lat, shipment.delivery.lng],
              ]}
              color={getStatusColor(shipment.status)}
              weight={3}
              opacity={0.6}
              dashArray={shipment.status === "IN_TRANSIT" ? undefined : "10, 10"}
            />

            {/* Accuracy circle around current position */}
            {shipment.current && shipment.status === "IN_TRANSIT" && (
              <Circle
                center={[shipment.current.lat, shipment.current.lng]}
                radius={100}
                pathOptions={{
                  fillColor: getStatusColor(shipment.status),
                  fillOpacity: 0.1,
                  color: getStatusColor(shipment.status),
                  weight: 1,
                }}
              />
            )}
          </div>
        ))}
      </MapContainer>

      {/* Overlay Stats */}
      <div className="absolute top-4 left-4 z-[400]">
        <div className="glass-panel p-3 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Live Tracking
          </h4>
          <div className="space-y-1 text-xs">
            {shipments.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                  selectedShipment === s.id ? "bg-blue-500/20" : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
                onClick={() => setSelectedShipment(s.id)}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(s.status) }}
                />
                <span className="truncate max-w-[120px]">{s.shipment_id}</span>
                {s.status === "IN_TRANSIT" && (
                  <span className="text-blue-500">{s.progress}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <div className="glass-panel p-3 text-xs space-y-2">
          <h4 className="font-semibold">Map Legend</h4>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Pickup Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Delivery Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Active Vehicle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Planned Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
