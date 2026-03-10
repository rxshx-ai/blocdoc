"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Truck, MapPin, Building2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const createIcon = (color: string, iconComponent: any) => {
    return L.divIcon({
        html: renderToStaticMarkup(
            <div className={`w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center`} style={{ backgroundColor: color }}>
                {iconComponent}
            </div>
        ),
        className: 'custom-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

const TRUCK_ICON = createIcon("#3b82f6", <Truck size={16} color="white" />);
const PICKUP_ICON = createIcon("#10b981", <Building2 size={16} color="white" />);
const DELIVERY_ICON = createIcon("#ef4444", <MapPin size={16} color="white" />);

export default function LiveMap({ shipments, userRole }: { shipments: any[], userRole: string }) {
    const [routes, setRoutes] = useState<Record<string, { coords: [number, number][], progress: number }>>({});

    // Filter to shipments that are relevant to be shown on map
    const mapShipments = useMemo(() => {
        if (!shipments) return [];
        return shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'PROVIDER_SELECTED' || s.status === 'DELIVERED');
    }, [shipments]);

    useEffect(() => {
        const fetchRoutes = async () => {
            for (const s of mapShipments) {
                if (!routes[s.shipment_id] && s.pickup_longitude && s.delivery_longitude) {
                    try {
                        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${s.pickup_longitude},${s.pickup_latitude};${s.delivery_longitude},${s.delivery_latitude}?overview=full&geometries=geojson`);
                        const data = await res.json();
                        if (data.routes && data.routes[0]) {
                            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]); // reverse to lat, lng
                            let progress = 0;
                            if (s.status === 'DELIVERED') progress = coords.length - 1;
                            else if (s.status === 'IN_TRANSIT') {
                                // Mock progress based on fake creation time or just a steady animated loop
                                const randomStart = Math.floor(Math.random() * (Math.floor(coords.length * 0.8)));
                                progress = Math.max(0, randomStart);
                            }

                            setRoutes(prev => ({
                                ...prev,
                                [s.shipment_id]: { coords, progress }
                            }));
                        }
                    } catch (err) {
                        console.error("OSRM Error", err);
                    }
                }
            }
        };
        fetchRoutes();
    }, [mapShipments]);

    // Animate drivers
    useEffect(() => {
        const interval = setInterval(() => {
            setRoutes(prev => {
                const next = { ...prev };
                let changed = false;
                for (const shipId in next) {
                    const shipment = mapShipments.find(s => s.shipment_id === shipId);
                    if (shipment && shipment.status === 'IN_TRANSIT') {
                        if (next[shipId].progress < next[shipId].coords.length - 1) {
                            next[shipId] = {
                                ...next[shipId],
                                progress: next[shipId].progress + 1
                            };
                            changed = true;
                        }
                    }
                }
                return changed ? next : prev;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [mapShipments]);

    const bounds: [number, number][] = mapShipments.length > 0 && mapShipments[0].pickup_latitude
        ? mapShipments.flatMap(s => [
            [s.pickup_latitude, s.pickup_longitude] as [number, number],
            [s.delivery_latitude, s.delivery_longitude] as [number, number]
        ])
        : [[40.7128, -74.0060], [40.7306, -73.9866]];

    return (
        <MapContainer
            bounds={bounds as any}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full rounded-2xl z-0"
            style={{ minHeight: "350px", background: "#f8f9fa" }}
        >
            <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {mapShipments.map(s => {
                const route = routes[s.shipment_id];
                const currentPos = route && route.coords[route.progress]
                    ? route.coords[route.progress]
                    : [s.pickup_latitude, s.pickup_longitude];

                return (
                    <div key={s.shipment_id}>
                        <Marker position={[s.pickup_latitude, s.pickup_longitude]} icon={PICKUP_ICON}>
                            <Popup className="font-sans">
                                <b>{s.pickup_location}</b><br />Shipper Origin
                            </Popup>
                        </Marker>

                        <Marker position={[s.delivery_latitude, s.delivery_longitude]} icon={DELIVERY_ICON}>
                            <Popup className="font-sans">
                                <b>{s.delivery_location}</b><br />Delivery Target
                            </Popup>
                        </Marker>

                        {route && (
                            <Polyline positions={route.coords} color="#94a3b8" weight={4} dashArray="5, 10" opacity={0.5} />
                        )}

                        {route && route.progress > 0 && (
                            <Polyline positions={route.coords.slice(0, route.progress + 1)} color="#3b82f6" weight={5} opacity={0.8} />
                        )}

                        {s.status === 'IN_TRANSIT' && currentPos && (
                            <Marker position={currentPos as [number, number]} icon={TRUCK_ICON}>
                                <Popup className="font-sans">
                                    <b>{s.shipment_id}</b><br />
                                    Driver: {s.selected_provider}<br />
                                    Status: Live Transit
                                </Popup>
                            </Marker>
                        )}
                    </div>
                );
            })}
        </MapContainer>
    );
}
