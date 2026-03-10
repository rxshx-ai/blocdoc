"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

type Role = 'admin' | 'shipper' | 'provider' | 'driver' | 'receiver';

export interface UserSession {
    access_token: string;
    token_type: string;
    username: string;
    role: Role;
    actor_id: string;
}

interface AuthContextType {
    user: UserSession | null;
    login: (session: UserSession) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check local storage on mount
        const stored = localStorage.getItem("halo_session");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                localStorage.removeItem("halo_session");
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Redirect logic
        if (!isLoading) {
            if (!user && pathname !== "/login") {
                router.push("/login");
            } else if (user && pathname === "/login") {
                router.push("/");
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = (session: UserSession) => {
        setUser(session);
        localStorage.setItem("halo_session", JSON.stringify(session));
        router.push("/");
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("halo_session");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
