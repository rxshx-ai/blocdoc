import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // In our backend auth, the headers for admin creation require X-Role
        const res = await fetch("http://127.0.0.1:8000/admin/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Role": "admin",
                "X-Actor-Id": "admin-1"
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ detail: data.detail || 'Failed to create user' }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
