"use client";
import { useState } from "react";
import { API_BASE, apiFetch, setToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // Our backend login expects username+password for TokenObtainPairView
      const body = {
        username: emailOrUsername,
        password,
      };
      const res = await fetch(`${API_BASE}/accounts/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = "Invalid username or password.";
        try {
          const j = await res.json();
          if (typeof j?.detail === "string") {
            // Map common backend messages to friendlier copy
            if (j.detail.toLowerCase().includes("no active account")) msg = "Invalid username or password.";
            else msg = j.detail;
          }
        } catch {
          // ignore JSON parse; keep default msg
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { access: string };
      setToken(data.access);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Unable to sign in. Please try again.");
    }
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back. Enter your details to continue.">
      <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-1">
            <span className="label">Username or Email</span>
            <input
              className="input"
              placeholder="you@example.com"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="label">Password</span>
            <input
              className="input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button className="btn btn-primary" type="submit">Sign in</button>

          <div className="text-sm opacity-80">
            Don’t have an account? <a className="underline" href="/signup">Create one</a>
          </div>
      </form>
    </AuthCard>
  );
}

