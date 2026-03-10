"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [username, setUsername] = useState('city_hospital');
    const [password, setPassword] = useState('p1');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Authentication failed');

            login(data);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const loadDemoUser = (user: string) => {
        setUsername(user);
        setPassword('p1');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-[#0a0a0a]">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-[1000px] h-[600px] glass-panel rounded-3xl overflow-hidden flex shadow-2xl relative z-10 border border-black/5 dark:border-white/10">

                {/* Left Side: Info & Demo Users */}
                <div className="w-[40%] bg-black/5 dark:bg-white/5 border-r border-black/5 dark:border-white/10 p-8 hidden md:flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                            <Cpu className="text-white relative z-10" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                            HALO Network
                        </h2>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Decentralized healthcare logistics platform secured by cryptographic proof-of-custody.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Fast Access</p>

                        <button onClick={() => loadDemoUser('city_hospital')} className="w-full text-left p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs uppercase">CH</div>
                            <div>
                                <p className="text-sm font-bold">city_hospital</p>
                                <p className="text-xs text-blue-500">Shipper (Hospital)</p>
                            </div>
                        </button>

                        <button onClick={() => loadDemoUser('central_lab')} className="w-full text-left p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xs uppercase">CL</div>
                            <div>
                                <p className="text-sm font-bold">central_lab</p>
                                <p className="text-xs text-green-500">Receiver (Lab)</p>
                            </div>
                        </button>

                        <button onClick={() => loadDemoUser('driver_1')} className="w-full text-left p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold text-xs uppercase">D1</div>
                            <div>
                                <p className="text-sm font-bold">driver_1</p>
                                <p className="text-xs text-purple-500">Provider (Logistics)</p>
                            </div>
                        </button>

                        <button onClick={() => loadDemoUser('driver_2')} className="w-full text-left p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs uppercase">D2</div>
                            <div>
                                <p className="text-sm font-bold">driver_2</p>
                                <p className="text-xs text-orange-500">Provider (Logistics 2)</p>
                            </div>
                        </button>

                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center relative">
                    <div className="max-w-md w-full mx-auto">
                        <div className="mb-10 line-clamp-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Welcome back</h1>
                            <p className="text-gray-500">Enter your credentials to access the ledger.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl flex items-center gap-2"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1 block">
                                        Network Identity
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                            placeholder="Enter actor ID or username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1 block">
                                        Private Token
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black py-4 rounded-2xl font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl"
                            >
                                {isLoggingIn ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck size={20} />
                                        Authenticate
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
