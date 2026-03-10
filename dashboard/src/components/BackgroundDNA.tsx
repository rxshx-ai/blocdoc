"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useApi } from "@/lib/api";
import { useRouter } from "next/navigation";

// Utility to create a soft glowing dot for our particles
function createCircleTexture() {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.2, "rgba(255,255,255,0.8)");
        gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

// Interactive Ledger Nodes
function LedgerNode({ pos, hash, router }: { pos: THREE.Vector3, hash: string, router: any }) {
    const [hovered, setHovered] = useState(false);

    return (
        <group position={pos}>
            <mesh
                onPointerOver={() => { document.body.style.cursor = "pointer"; setHovered(true) }}
                onPointerOut={() => { document.body.style.cursor = "auto"; setHovered(false) }}
                onClick={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "auto";
                    router.push("/blockchain"); // Go to network/ledger page
                }}
                scale={hovered ? 1.5 : 1}
            >
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color={hovered ? "#ff00aa" : "#00ffff"} transparent opacity={0.6} />
            </mesh>

            {/* Pulsing ring */}
            <mesh scale={hovered ? 2.5 : 1.8}>
                <ringGeometry args={[0.3, 0.35, 32]} />
                <meshBasicMaterial color={hovered ? "#ff00aa" : "#00ffff"} side={THREE.DoubleSide} transparent opacity={0.3} />
            </mesh>

            {hovered && (
                <Html distanceFactor={15} center>
                    <div className="bg-[#0f172a]/90 backdrop-blur-md text-cyan-300 font-mono text-[10px] px-3 py-2 rounded-lg border border-cyan-500/50 shadow-[0_0_15px_rgba(0,255,255,0.3)] whitespace-nowrap pointer-events-none transform -translate-y-8 transition-all animate-pulse">
                        <div className="text-white text-xs mb-1">View Block Data</div>
                        {hash}
                    </div>
                </Html>
            )}
        </group>
    );
}

function ParticleStrand({ txHashes, router }: { txHashes: string[], router: any }) {
    const groupRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const bokehRef = useRef<THREE.Points>(null);

    const { dnaPositions, dnaColors, bokehPositions, bokehColors } = useMemo(() => {
        const dnaNum = 12000;
        const bNum = 1000;
        const dPos = new Float32Array(dnaNum * 3);
        const dCol = new Float32Array(dnaNum * 3);
        const bPos = new Float32Array(bNum * 3);
        const bCol = new Float32Array(bNum * 3);

        const cCyan = new THREE.Color("#00ffff");
        const cBlue = new THREE.Color("#0055ff");
        const cPink = new THREE.Color("#ff0055");
        const cWhite = new THREE.Color("#ffffff");

        const rHelix = 3.0;

        for (let i = 0; i < dnaNum; i++) {
            const t = (Math.random() - 0.5) * 60; // Height spread from -30 to 30
            const angle = t * 0.4;
            const type = Math.random();
            let x, y, z;

            if (type < 0.35) {
                // Helix 1
                const spread = Math.random() * 0.6;
                x = Math.cos(angle) * rHelix + (Math.random() - 0.5) * spread;
                y = t;
                z = Math.sin(angle) * rHelix + (Math.random() - 0.5) * spread;
            } else if (type < 0.70) {
                // Helix 2
                const spread = Math.random() * 0.6;
                x = Math.cos(angle + Math.PI) * rHelix + (Math.random() - 0.5) * spread;
                y = t;
                z = Math.sin(angle + Math.PI) * rHelix + (Math.random() - 0.5) * spread;
            } else if (type < 0.85) {
                // Rungs
                const rungT = Math.round(t * 1.5) / 1.5;
                const rungAngle = rungT * 0.4;
                const f = Math.random();
                const h1x = Math.cos(rungAngle) * rHelix;
                const h1z = Math.sin(rungAngle) * rHelix;
                const h2x = Math.cos(rungAngle + Math.PI) * rHelix;
                const h2z = Math.sin(rungAngle + Math.PI) * rHelix;

                x = h1x + (h2x - h1x) * f + (Math.random() - 0.5) * 0.3;
                y = rungT + (Math.random() - 0.5) * 0.3;
                z = h1z + (h2z - h1z) * f + (Math.random() - 0.5) * 0.3;
            } else {
                // Glow noise/dust around the strand
                const r = rHelix + (Math.random() * 4);
                const a = Math.random() * Math.PI * 2;
                x = Math.cos(a) * r;
                y = t;
                z = Math.sin(a) * r;
            }

            dPos[i * 3] = x;
            dPos[i * 3 + 1] = y;
            dPos[i * 3 + 2] = z;

            let col = cCyan;
            const rc = Math.random();
            if (rc > 0.95) col = cPink;
            else if (rc > 0.6) col = cWhite;
            else if (rc > 0.3) col = cBlue;

            dCol[i * 3] = col.r;
            dCol[i * 3 + 1] = col.g;
            dCol[i * 3 + 2] = col.b;
        }

        for (let i = 0; i < bNum; i++) {
            bPos[i * 3] = (Math.random() - 0.5) * 80;
            bPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
            bPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;

            let col = Math.random() > 0.5 ? cBlue : cPink;
            bCol[i * 3] = col.r * 0.15; // Darker/fainter bokeh
            bCol[i * 3 + 1] = col.g * 0.15;
            bCol[i * 3 + 2] = col.b * 0.15;
        }

        return { dnaPositions: dPos, dnaColors: dCol, bokehPositions: bPos, bokehColors: bCol };
    }, []);

    const tex = useMemo(() => createCircleTexture(), []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Hover/Rotation logic: react to mouse movement
            const targetRotX = (state.pointer.y * Math.PI) / 8;
            const targetRotY = (state.pointer.x * Math.PI) / 6 + (state.clock.elapsedTime * 0.05); // Continuous slow spin

            groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * delta * 2;
            groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * delta * 2;

            // Hover effect bobbing
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
        }
    });

    // Determine positions for clickable ledger nodes based on hashes
    const txNodes = useMemo(() => {
        if (!txHashes.length) {
            // Fill with dummy nodes to show off the visual
            return ["0xGenesisBlock...1", "0xNodeInit...2", "0xValidator...3"].map((hash, i) => {
                const t = -10 + (i * 10);
                const angle = t * 0.4;
                return {
                    hash,
                    pos: new THREE.Vector3(Math.cos(angle) * 3.5, t, Math.sin(angle) * 3.5)
                };
            });
        }

        return txHashes.map((hash, i) => {
            const spread = 20; // Y spread for nodes
            const range = spread / Math.max(1, txHashes.length);
            const t = -10 + (i * range) + (Math.random() * range * 0.5);
            const angle = t * 0.4;
            const isOnHelix1 = Math.random() > 0.5;
            const finalAngle = isOnHelix1 ? angle : angle + Math.PI;
            return {
                hash,
                pos: new THREE.Vector3(
                    Math.cos(finalAngle) * 3.5,
                    t,
                    Math.sin(finalAngle) * 3.5
                )
            };
        });
    }, [txHashes]);

    return (
        <group rotation={[0, 0, Math.PI / 4]}> {/* Diagonal tilt */}
            <group ref={groupRef}>
                {/* Core DNA Particles */}
                <points ref={particlesRef}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" count={dnaPositions.length / 3} array={dnaPositions} itemSize={3} />
                        <bufferAttribute attach="attributes-color" count={dnaColors.length / 3} array={dnaColors} itemSize={3} />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.12}
                        vertexColors
                        transparent
                        opacity={0.9}
                        blending={THREE.AdditiveBlending}
                        map={tex}
                        depthWrite={false}
                    />
                </points>

                {/* Floating Bokeh / Background Dust */}
                <points ref={bokehRef}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" count={bokehPositions.length / 3} array={bokehPositions} itemSize={3} />
                        <bufferAttribute attach="attributes-color" count={bokehColors.length / 3} array={bokehColors} itemSize={3} />
                    </bufferGeometry>
                    <pointsMaterial
                        size={3.5}
                        vertexColors
                        transparent
                        opacity={0.6}
                        blending={THREE.AdditiveBlending}
                        map={tex}
                        depthWrite={false}
                    />
                </points>

                {/* Blockchain Data Clickable Nodes */}
                {txNodes.map((n, idx) => (
                    <LedgerNode key={idx} pos={n.pos} hash={n.hash} router={router} />
                ))}
            </group>
        </group>
    );
}

export default function BackgroundDNA() {
    const { apiFetch } = useApi();
    const [txHashes, setTxHashes] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchTxs = async () => {
            try {
                const data = await apiFetch("/shipments");
                const shipments = data.shipments || [];
                const hashes = shipments.flatMap((s: any) => [
                    s.tx_hashes?.create,
                    s.tx_hashes?.select_provider,
                    s.tx_hashes?.pickup,
                    s.tx_hashes?.delivery
                ]).filter(Boolean);

                setTxHashes(hashes.map((h: string) => h.slice(0, 16) + "..."));
            } catch (err) {
                console.error("Error fetching transactions for background", err);
            }
        };
        fetchTxs();

        const intv = setInterval(fetchTxs, 10000); // 10s refresh rate
        return () => clearInterval(intv);
    }, [apiFetch]);

    return (
        <div
            className="fixed inset-0 z-0 bg-[#020617] pointer-events-auto overflow-hidden transition-colors"
            style={{ touchAction: 'none' }}
        >
            <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <ParticleStrand txHashes={txHashes.length > 0 ? txHashes.slice(0, 15) : []} router={router} />
            </Canvas>

            {/* Vignette Overlay for cinematic feel */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-[#020617]/80" />
        </div>
    );
}
