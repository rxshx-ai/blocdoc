"use client";

import { motion } from "framer-motion";
import { QrCode, MapPin, Search, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/lib/api";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function QRVerificationPage() {
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const [timeLeft, setTimeLeft] = useState(600);
    const [shipmentId, setShipmentId] = useState("");
    const [qrData, setQrData] = useState<any>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (qrData) {
            timer = setInterval(() => {
                setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [qrData]);

    const handleFetchQR = async () => {
        setError("");
        setQrData(null);
        try {
            // For simplicity in demo, we check pickup first, if fails we check delivery
            const data = await apiFetch(`/shipment/${shipmentId}/pickup_qr`).catch(() => apiFetch(`/shipment/${shipmentId}/delivery_qr`));

            const payloadObj = JSON.parse(data.qr_payload);
            const expiry = new Date(payloadObj.expiration_time).getTime();
            const now = new Date().getTime();
            const diffSecs = Math.floor((expiry - now) / 1000);

            if (diffSecs <= 0) throw new Error("QR Expired");

            setTimeLeft(diffSecs);
            setQrData({ ...data, type: payloadObj.type || (data.status === 'IN_TRANSIT' ? 'delivery' : 'pickup') });
        } catch (err: any) {
            setError(err.message || "Failed to fetch active QR. Has driver arrived?");
        }
    };

    const handleVerify = async (payloadOverride?: any) => {
        setError("");
        setSuccess("");
        try {
            const payloadObj = payloadOverride || JSON.parse(qrData.qr_payload);
            const isPickup = (qrData?.type || payloadObj.type) === 'pickup';
            const endpoint = isPickup ? "/shipment/verify_pickup_qr" : "/shipment/verify_delivery_qr";

            const reqBody: any = {
                shipment_id: payloadObj.shipment_id,
                nonce: payloadObj.nonce,
                expiration_time: payloadObj.expiration_time,
                // Since we are simulating, we just use the user actor_id or mock it
                driver_id: user?.actor_id || "drv-001",
                // Bypassing GPS: For simulation, we inject exactly the pickup/delivery coordinates directly.
                // The real driver app would capture HTML5 Geolocation API here.
                driver_latitude: isPickup ? 40.7128 : 40.7306,
                driver_longitude: isPickup ? -74.0060 : -73.9866,
                ...(isPickup && { signer_private_key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" })
            };

            if (isPickup) reqBody.pickup_location_hash = payloadObj.pickup_location_hash;
            else reqBody.delivery_location_hash = payloadObj.delivery_location_hash;

            await apiFetch(endpoint, {
                method: "POST",
                body: JSON.stringify(reqBody)
            });
            setSuccess("Cryptographic chain transfer successful!");
            setQrData(null);
            setIsScanning(false);
        } catch (err: any) {
            setError(err.message || "Verification Failed");
        }
    };

    const handleScan = (result: any) => {
        if (result && result.length > 0) {
            try {
                // Qr payload in this implementation generated as string directly
                const payloadString = result[0].rawValue;
                // Fallback for json 
                let parsed = payloadString;
                if (typeof payloadString === 'string' && payloadString.startsWith('{')) {
                    parsed = JSON.parse(payloadString.replace(/'/g, '"'));
                } else if (typeof payloadString === 'string') {
                    // Because python `qrcode.make(dict)` might output python dict syntax, 
                    // we have to be careful. The backend actually serializes dictionary str representation.
                    parsed = JSON.parse(payloadString.replace(/'/g, '"'));
                }
                handleVerify(parsed);
            } catch (e) {
                console.error("Failed to parse", e);
                setError("Invalid QR Code signature detected.");
            }
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="glass-panel p-8 flex flex-col items-center justify-center gap-6 max-w-md w-full text-center relative overflow-hidden"
            >
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                    <QrCode size={32} />
                </div>

                <h1 className="text-2xl font-bold tracking-tight">Custody Verification</h1>
                <p className="text-sm text-gray-500">Scan QR code to verify driver arrival and secure custody transfer on chain.</p>

                {!qrData && !success && !isScanning && (
                    <div className="w-full flex flex-col gap-4">
                        <button
                            onClick={() => setIsScanning(true)}
                            className="w-full p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <Camera size={24} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Open Camera Scanner</span>
                        </button>

                        <div className="flex items-center gap-4 text-xs text-gray-400 uppercase font-bold tracking-widest w-full my-2">
                            <div className="h-px bg-black/10 dark:bg-white/10 flex-1" /> OR <div className="h-px bg-black/10 dark:bg-white/10 flex-1" />
                        </div>

                        <div className="w-full flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Shipment ID (Simulate)"
                                value={shipmentId}
                                onChange={(e) => setShipmentId(e.target.value)}
                                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <button onClick={handleFetchQR} className="px-4 py-2 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {isScanning && (
                    <div className="w-full flex flex-col gap-4 items-center">
                        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 relative border border-black/10 dark:border-white/10 shadow-inner">
                            <Scanner onScan={handleScan} classNames={{ container: "w-full h-full" }} components={{ finder: false }} />
                            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-48 border-2 border-blue-500/50 rounded-xl animate-pulse" />
                        </div>
                        <button onClick={() => setIsScanning(false)} className="text-sm text-gray-500 font-medium hover:text-gray-700 dark:hover:text-gray-300">
                            Cancel Scanning
                        </button>
                    </div>
                )}

                {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg w-full">{error}</div>}
                {success && (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="text-sm text-green-500 bg-green-500/10 border border-green-500/20 p-4 rounded-xl w-full font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)] flex items-center gap-2 justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {success}
                        </div>
                        <button onClick={() => setSuccess("")} className="text-xs font-bold uppercase tracking-wider text-gray-500">Scan Another</button>
                    </div>
                )}

                {qrData && (
                    <div className="flex flex-col items-center gap-6 w-full">
                        <div className="relative w-48 h-48 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center justify-center overflow-hidden group">
                            <img src={qrData.qr_image_data_uri} alt="QR Code" className="w-full h-full object-cover" />
                            <motion.div
                                initial={{ top: "10%" }}
                                animate={{ top: "90%" }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                                className="absolute left-4 right-4 h-1 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                            />
                        </div>

                        <div className="flex flex-col gap-1 text-sm font-medium w-full text-center">
                            <span className="text-gray-400 uppercase tracking-widest text-xs">Expires In</span>
                            <span className="text-xl tabular-nums text-red-500 animate-pulse font-bold">
                                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                            </span>
                        </div>

                        <button onClick={() => handleVerify()} className="flex items-center gap-2 justify-center w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 rounded-xl font-bold text-sm tracking-wide">
                            <MapPin size={16} /> GPS Override Verification
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
