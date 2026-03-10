"use client";

import dynamic from 'next/dynamic';

const BackgroundDNA = dynamic(() => import('./BackgroundDNA'), {
    ssr: false
});

export default function ClientDNAWrapper() {
    return <BackgroundDNA />;
}
