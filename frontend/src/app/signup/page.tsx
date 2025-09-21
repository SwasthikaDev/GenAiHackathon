"use client";
import { useState } from "react";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import HideWhenAuthed from "@/components/HideWhenAuthed";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken">("idle");
  const [usernameMsg, setUsernameMsg] = useState<string>("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
      form.append("password", password);
      form.append("display_name", `${firstName} ${lastName}`.trim());
      form.append("phone_number", phone);
      form.append("city", city);
      form.append("country", country);
      const res = await fetch(`${API_BASE}/accounts/signup`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      // After successful signup, send user to login
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      {/* soft aurora-like background glows */}
      <div aria-hidden className="aurora" />

      {/* flight path and airplane animated along path */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 mx-auto w-[110%] max-w-none opacity-40"
        height="120"
        viewBox="0 0 1200 120"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          {/* Nearly horizontal path with gentle undulations */}
          <path id="flightPath" d="M0,70 C200,60 400,80 600,60 800,80 1000,60 1200,70" />
        </defs>
        <use href="#flightPath" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 10" />
        <g fill="currentColor" style={{ color: "var(--brand-orange)" }}>
          {/* Rotate +90deg and scale up slightly; adjust translate to keep centered */}
          <g transform="rotate(91) scale(6) translate(-15,-15)">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1v1l3-.5 3 .5v-1l-2-1v-5.5L21 16z" />
            <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
              <mpath xlinkHref="#flightPath" />
            </animateMotion>
          </g>
        </g>
      </svg>

      {/* content */}
      <div className="relative z-10 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          {/* tagline side (hidden on small for minimalism) */}
          <div className="hidden lg:block">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
              <span>✈️</span>
              <span>Plan multi‑city adventures</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Create your journey.
            </h1>
            <p className="mt-2 max-w-md text-[var(--muted)]">
              Sign up to craft beautiful itineraries, track budgets, and share with friends.
            </p>
          </div>

          {/* form card */}
          <AuthCard title="Sign up" subtitle="Join GlobalTrotters and start planning.">
            <form onSubmit={onSubmit} className="grid gap-4">
              <label className="grid gap-1">
                <span className="label">Username</span>
                <input
                  className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
                  placeholder="yourname"
                  value={username}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setUsername(v);
                    if (!v || v.length < 3) { setUsernameStatus("idle"); setUsernameMsg(""); return; }
                    setUsernameStatus("checking");
                    try {
                      const res = await fetch(`${API_BASE}/accounts/check-username?username=${encodeURIComponent(v)}`);
                      const data = await res.json();
                      if (data && typeof data.available === "boolean") {
                        setUsernameStatus(data.available ? "available" : "taken");
                        setUsernameMsg(data.available ? "Username available" : "Username taken");
                      } else {
                        setUsernameStatus("idle"); setUsernameMsg("");
                      }
                    } catch {
                      setUsernameStatus("idle"); setUsernameMsg("");
                    }
                  }}
                  required
                />
                {usernameStatus !== "idle" && (
                  <div className={`text-sm ${usernameStatus === "available" ? "text-green-500" : usernameStatus === "taken" ? "text-red-500" : "opacity-70"}`}>
                    {usernameStatus === "checking" ? "Checking…" : usernameMsg}
                  </div>
                )}
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="label">First name</span>
                  <input className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]" placeholder="Asha" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
                </label>
                <label className="grid gap-1">
                  <span className="label">Last name</span>
                  <input className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]" placeholder="Rao" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="label">Email (optional)</span>
                  <input className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]" placeholder="you@example.com" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                </label>
                <label className="grid gap-1">
                  <span className="label">Phone</span>
                  <input className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]" placeholder="+91 98765 43210" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="label">City</span>
                  <input className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]" placeholder="Bengaluru" value={city} onChange={(e)=>setCity(e.target.value)} />
                </label>
                <label className="grid gap-1">
                  <span className="label">Country</span>
                  <input className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]" placeholder="India" value={country} onChange={(e)=>setCountry(e.target.value)} />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="label">Password</span>
                <input
                  className="input transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <button className="btn btn-primary transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0" type="submit">Sign up</button>

              <HideWhenAuthed>
                <div className="text-sm opacity-80">
                  Already have an account? <a className="underline" href="/login">Sign in</a>
                </div>
              </HideWhenAuthed>
            </form>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}

