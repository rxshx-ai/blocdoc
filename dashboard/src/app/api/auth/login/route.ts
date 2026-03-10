import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const res = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ detail: data.detail || 'Invalid credentials' }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
