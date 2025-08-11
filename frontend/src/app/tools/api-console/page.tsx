"use client";
import { useEffect, useMemo, useState } from "react";
import { API_BASE, setToken } from "@/lib/api";

type Json = any;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section mb-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, ...props }: any) {
  return (
    <label className="grid gap-1 mb-3">
      <span className="label">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

function TextArea({ label, ...props }: any) {
  return (
    <label className="grid gap-1 mb-3">
      <span className="label">{label}</span>
      <textarea className="input" rows={6} {...props} />
    </label>
  );
}

export default function ApiConsolePage() {
  const [base, setBase] = useState<string>(API_BASE);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [tripId, setTripId] = useState<number | null>(null);
  const [stopId, setStopId] = useState<number | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  // per-section sinks
  const [authRes, setAuthRes] = useState<string>("");
  const [tripsRes, setTripsRes] = useState<string>("");
  const [stopsRes, setStopsRes] = useState<string>("");
  const [publicRes, setPublicRes] = useState<string>("");
  const [recsRes, setRecsRes] = useState<string>("");
  const canAuth = (username?.trim()?.length ?? 0) > 0 && (password?.trim()?.length ?? 0) > 0;

  useEffect(() => {
    const t = localStorage.getItem("token");
    const r = localStorage.getItem("refresh");
    if (t) setAccess(t);
    if (r) setRefresh(r);
  }, []);

  function show(obj: Json) { setResult(JSON.stringify(obj, null, 2)); }
  const toJson = (obj: Json) => JSON.stringify(obj, null, 2);

  type ApiResult = { ok: boolean; status: number; body: any; ms: number };

  async function api(path: string, init: RequestInit = {}, useAuth = false, sink?: (s: string) => void): Promise<ApiResult> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as any),
    };
    if (useAuth && access) headers["Authorization"] = `Bearer ${access}`;
    const started = performance.now();
    try {
      const res = await fetch(`${base}${path}`, { ...init, headers });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
      const ms = Math.round(performance.now() - started);
      const obj = { status: res.status, ok: res.ok, ms, body };
      if (sink) sink(toJson(obj)); else show(obj);
      return obj;
    } catch (e: any) {
      const ms = Math.round(performance.now() - started);
      const obj = { status: 0, ok: false, ms, body: { error: e?.message || 'Network error' } };
      if (sink) sink(toJson(obj)); else show(obj);
      return obj;
    }
  }

  return (
    <div className="grid gap-6">
      <Section title="Environment & Tokens">
        <Field label="API Base" value={base} onChange={(e: any) => setBase(e.target.value)} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Access token" value={access ?? ""} onChange={(e: any) => setAccess(e.target.value)} />
          <Field label="Refresh token" value={refresh ?? ""} onChange={(e: any) => setRefresh(e.target.value)} />
        </div>
        <div className="flex gap-2 mt-1">
          <button className="btn btn-ghost" onClick={() => { if (access) setToken(access); if (refresh) localStorage.setItem("refresh", refresh); }}>Save to app</button>
          <button className="btn btn-ghost" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("refresh"); setAccess(null); setRefresh(null); }}>Clear tokens</button>
        </div>
      </Section>

      <Section title="Auth">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Username" value={username} onChange={(e: any) => setUsername(e.target.value)} />
          <Field label="Email (optional)" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <Field label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={!canAuth} title={!canAuth ? "Enter username and password" : ""} onClick={async () => {
            if (!canAuth) { setAuthRes(toJson({ error: "Username and password required" })); return; }
            const body = { username, email, password };
            await api(`/accounts/signup`, { method: "POST", body: JSON.stringify(body) }, false, setAuthRes);
          }}>Signup</button>
          <button className="btn btn-primary" disabled={!canAuth} title={!canAuth ? "Enter username and password" : ""} onClick={async () => {
            if (!canAuth) { setAuthRes(toJson({ error: "Username and password required" })); return; }
            const body = { username, password };
            const res = await api(`/accounts/login`, { method: "POST", body: JSON.stringify(body) }, false, setAuthRes);
            if (res.ok) {
              setAccess(res.body.access); setRefresh(res.body.refresh || null);
              setToken(res.body.access); if (res.body.refresh) localStorage.setItem("refresh", res.body.refresh);
            }
          }}>Login</button>
          <button className="btn btn-ghost" onClick={async () => {
            const r = refresh || localStorage.getItem("refresh");
            if (!r) { setAuthRes(toJson({ error: "No refresh token" })); return; }
            const res = await api(`/accounts/refresh`, { method: "POST", body: JSON.stringify({ refresh: r }) }, false, setAuthRes);
            if (res.ok) { setAccess(res.body.access); setToken(res.body.access); }
          }}>Refresh</button>
          <button className="btn btn-ghost" onClick={async () => { await api(`/accounts/profile`, {}, true, setAuthRes); }}>Profile</button>
        </div>
        <TextArea label="Response" value={authRes} onChange={() => {}} />
      </Section>

      <Section title="Personalization (LLM)">
        <div className="flex flex-wrap gap-2 mb-2">
          <button className="btn btn-primary" onClick={() => api(`/recs/personalized/`, { method: "POST" }, true, setRecsRes)}>Get personalized recs</button>
        </div>
        <TextArea label="Response" value={recsRes} onChange={() => {}} />
      </Section>

      <Section title="Trips">
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="btn btn-ghost" onClick={() => api(`/trips/`, {}, true, setTripsRes)}>List</button>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Trip name" id="trip-name" placeholder="My trip" />
          <Field label="Start date" id="trip-start" type="date" />
          <Field label="End date" id="trip-end" type="date" />
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={async () => {
              const name = (document.getElementById("trip-name") as HTMLInputElement)?.value;
              const start = (document.getElementById("trip-start") as HTMLInputElement)?.value;
              const end = (document.getElementById("trip-end") as HTMLInputElement)?.value;
              const res = await api(`/trips/`, { method: "POST", body: JSON.stringify({ name, start_date: start, end_date: end }) }, true, setTripsRes);
              if (res.ok) setTripId(res.body.id);
            }}>Create</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Trip ID" value={tripId ?? ""} onChange={(e: any) => setTripId(Number(e.target.value) || null)} />
          <div className="flex items-end gap-2">
            <button className="btn btn-ghost" onClick={() => tripId && api(`/trips/${tripId}/`, {}, true, setTripsRes)}>Get</button>
            <button className="btn btn-ghost" onClick={async () => { if (!tripId) return; const r = await api(`/trips/${tripId}/share/`, { method: "POST" }, true, setTripsRes); if (r.ok) setPublicSlug(r.body.public_slug || r.body.publicSlug || null); }}>Share</button>
          </div>
        <TextArea label="Response" value={tripsRes} onChange={() => {}} />
        </div>
      </Section>

      <Section title="Cities & Stops & Activities">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Search cities (q)" id="city-q" placeholder="Paris" />
          <div className="flex items-end">
            <button className="btn btn-ghost" onClick={() => {
              const q = (document.getElementById("city-q") as HTMLInputElement)?.value;
              if (!q || q.trim().length < 2) { setStopsRes(toJson({ error: "Enter at least 2 characters" })); return; }
              api(`/search/cities?q=${encodeURIComponent(q)}`, { method: "GET" }, false, setStopsRes);
            }}>Search</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-5 gap-3">
          <Field label="Trip ID" value={tripId ?? ""} onChange={(e: any) => setTripId(Number(e.target.value) || null)} />
          <Field label="City ID" id="city-id" placeholder="e.g. 1" />
          <Field label="Stop start" id="stop-start" type="date" />
          <Field label="Stop end" id="stop-end" type="date" />
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={async () => {
              if (!tripId) return show({ error: "Trip ID required" });
              const cityId = Number((document.getElementById("city-id") as HTMLInputElement)?.value);
              const start = (document.getElementById("stop-start") as HTMLInputElement)?.value;
              const end = (document.getElementById("stop-end") as HTMLInputElement)?.value;
              const r = await api(`/trips/${tripId}/stops/`, { method: "POST", body: JSON.stringify({ city_id: cityId, start_date: start, end_date: end, order: 1 }) }, true, setStopsRes);
              if (r.ok) setStopId(r.body.id);
            }}>Add stop</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-5 gap-3">
          <Field label="Stop ID" value={stopId ?? ""} onChange={(e: any) => setStopId(Number(e.target.value) || null)} />
          <Field label="Title" id="act-title" placeholder="Activity title" />
          <Field label="Cost (minor units)" id="act-cost" placeholder="2500" />
          <Field label="Currency" id="act-curr" placeholder="INR" />
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={async () => {
              if (!tripId || !stopId) return show({ error: "Trip & Stop IDs required" });
              const title = (document.getElementById("act-title") as HTMLInputElement)?.value;
              const cost = Number((document.getElementById("act-cost") as HTMLInputElement)?.value || 0);
              const currency = (document.getElementById("act-curr") as HTMLInputElement)?.value || "INR";
              await api(`/trips/${tripId}/stops/${stopId}/activities/`, { method: "POST", body: JSON.stringify({ title, cost_amount: cost, currency }) }, true, setStopsRes);
            }}>Add activity</button>
          </div>
        <TextArea label="Response" value={stopsRes} onChange={() => {}} />
        </div>
      </Section>

      <Section title="Public">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Public slug" value={publicSlug ?? ""} onChange={(e: any) => setPublicSlug(e.target.value || null)} />
          <div className="flex items-end">
            <button className="btn btn-ghost" onClick={() => publicSlug && api(`/public/itineraries/${publicSlug}`, {}, false, setPublicRes)}>Fetch public</button>
          </div>
        </div>
        <TextArea label="Response" value={publicRes} onChange={() => {}} />
      </Section>
    </div>
  );
}


