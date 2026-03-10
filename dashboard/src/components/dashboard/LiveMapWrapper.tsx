"use client";
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[350px] bg-black/5 dark:bg-white/5 animate-pulse rounded-2xl flex items-center justify-center">
            <span className="text-gray-400 font-medium">Loading Telemetry Map...</span>
        </div>
    )
});

export default function LiveMapWrapper({ shipments, userRole }: { shipments: any[], userRole?: string }) {
    return <LiveMap shipments={shipments} userRole={userRole || "admin"} />;
}
