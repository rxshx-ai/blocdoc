"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useApi() {
    const { user, logout } = useAuth();

    const apiFetch = async (path: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers || {});

        if (user?.access_token) {
            headers.set("Authorization", `Bearer ${user.access_token}`);
        }

        if (!headers.has("Content-Type") && options.body) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(`/api${path}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            logout();
            throw new Error("Session expired");
        }

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            throw new Error(data?.detail || data?.message || "An API error occurred");
        }

        return data;
    };

    return { apiFetch };
}
