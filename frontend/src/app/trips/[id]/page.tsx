"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { authFetch, API_BASE } from "@/lib/api";
import { buildRouteSummary, formatMoneyMinor } from "@/lib/format";
import AuthGuard from "@/components/AuthGuard";
import { useParams } from "next/navigation";

type City = { id: number; name: string; country: string };
type SearchCity = { id?: number | null; name: string; country: string; lat?: string; lon?: string };
type Activity = { id: number; title: string; cost_amount: number; currency: string };
type Stop = { id: number; city: City; start_date: string; end_date: string; activities: Activity[] };
type Trip = { id: number; name: string; start_date: string; end_date: string; origin_city?: City|null; is_public: boolean; public_slug?: string|null; stops: Stop[] };

export default function TripDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // city search for new stop (debounced via backend places API)
  const [cityQ, setCityQ] = useState("");
  const [cityResults, setCityResults] = useState<SearchCity[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [stopStart, setStopStart] = useState("");
  const [stopEnd, setStopEnd] = useState("");

  // activity form
  const [targetStopId, setTargetStopId] = useState<number | null>(null);
  const [actTitle, setActTitle] = useState("");
  const [actCost, setActCost] = useState("");
  const [actCurr, setActCurr] = useState("USD");

  async function load() {
    setLoading(true);
    try {
      const t = await authFetch<Trip>(`/trips/${id}/`);
      setTrip(t);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  function searchCities(q: string) { setCityQ(q); }
  const cityAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    const t = cityQ.trim();
    if (t.length < 2) { setCityResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        if (cityAbort.current) cityAbort.current.abort();
        const controller = new AbortController();
        cityAbort.current = controller;
        const res = await fetch(`${API_BASE}/search/cities?q=${encodeURIComponent(t)}`, { signal: controller.signal });
        const data = await res.json();
        setCityResults(Array.isArray(data) ? data : []);
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [cityQ]);

  async function addStop() {
    if (!cityId || !stopStart || !stopEnd) { setError("City and dates required"); return; }
    try {
      await authFetch(`/trips/${id}/stops/`, {
        method: "POST",
        body: JSON.stringify({ city_id: cityId, start_date: stopStart, end_date: stopEnd, order: (trip?.stops?.length || 0) + 1 })
      });
      setCityId(null); setCityQ(""); setCityResults([]); setStopStart(""); setStopEnd("");
      load();
    } catch (e: any) { setError(String(e)); }
  }

  async function addActivity() {
    if (!targetStopId || !actTitle) { setError("Stop and title required"); return; }
    try {
      await authFetch(`/trips/${id}/stops/${targetStopId}/activities/`, {
        method: "POST",
        body: JSON.stringify({ title: actTitle, cost_amount: Number(actCost || 0), currency: actCurr })
      });
      setActTitle(""); setActCost("");
      load();
    } catch (e: any) { setError(String(e)); }
  }

  async function shareTrip() {
    try {
      const r = await authFetch<{ public_slug: string }>(`/trips/${id}/share`, { method: "POST" });
      setTrip(prev => prev ? { ...prev, is_public: true, public_slug: (r as any).public_slug } : prev);
    } catch (e: any) { setError(String(e)); }
  }

  const [budget, setBudget] = useState<number | null>(null);
  async function loadBudget() {
    try {
      const r = await authFetch<{ total_cost_minor: number }>(`/trips/${id}/budget`);
      setBudget((r as any).total_cost_minor || 0);
    } catch {}
  }

  // Edit origin city on trip detail
  const [originEditQ, setOriginEditQ] = useState<string>("");
  const [originEditResults, setOriginEditResults] = useState<SearchCity[]>([]);
  const [originEditId, setOriginEditId] = useState<number | null>(null);
  const [editingOrigin, setEditingOrigin] = useState<boolean>(false);
  const originEditAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    const t = originEditQ.trim();
    if (t.length < 2) { setOriginEditResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        if (originEditAbort.current) originEditAbort.current.abort();
        const controller = new AbortController();
        originEditAbort.current = controller;
        const res = await fetch(`${API_BASE}/search/cities?q=${encodeURIComponent(t)}`, { signal: controller.signal });
        const data = await res.json();
        setOriginEditResults(Array.isArray(data) ? data : []);
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [originEditQ]);

  async function saveOriginEdit() {
    if (!originEditId) return;
    try {
      const updated = await authFetch<Trip>(`/trips/${id}/`, { method: 'PATCH', body: JSON.stringify({ origin_city_id: originEditId }) });
      setTrip(updated);
      setOriginEditQ("");
      setOriginEditResults([]);
      setOriginEditId(null);
      setEditingOrigin(false);
    } catch (e: any) {
      setError(String(e));
    }
  }

  return (
    <AuthGuard>
      <div className="grid gap-6">
        {loading && <div className="section">Loading…</div>}
        {error && <div className="section text-red-400">{error}</div>}
        {trip && (
          <>
            <div className="section">
              <div className="text-xl font-semibold">{trip.name}</div>
              <div className="label">{trip.start_date} → {trip.end_date}</div>
              <div className="mt-2 text-sm">Origin: {trip.origin_city ? `${trip.origin_city.name}, ${trip.origin_city.country}` : "Not set"}</div>
              <div className="mt-1 text-sm opacity-80">Route: {buildRouteSummary(trip.origin_city, trip.stops)}</div>
              <div className="mt-3 flex gap-2">
                {!trip.is_public ? (
                  <button className="btn btn-primary" onClick={shareTrip}>Share publicly</button>
                ) : (
                  <a className="btn btn-ghost" href={`/t/${trip.public_slug}`} target="_blank">Open public page</a>
                )}
              </div>
              <div className="mt-4">
                {!editingOrigin ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setEditingOrigin(true); setOriginEditQ(""); setOriginEditResults([]); setOriginEditId(null); }}
                  >
                    Edit origin
                  </button>
                ) : (
                  <div className="max-w-md">
                    <div className="label mb-1">Update origin city</div>
                    <div className="relative">
                      <input className="input" placeholder="Search origin city" value={originEditQ} onChange={(e)=>setOriginEditQ(e.target.value)} />
                      {originEditQ.trim().length > 0 && originEditQ.trim().length < 2 && (
                        <div className="label mt-1">Type at least 2 characters…</div>
                      )}
                      {originEditResults.length > 0 && (
                        <div className="absolute z-50 mt-1 left-0 right-0 rounded border border-white/10 bg-black/20 backdrop-blur-sm max-h-60 overflow-auto shadow-lg">
                          {originEditResults.map((c, idx) => (
                            <button key={`${c.id ?? 'new'}-o-${idx}`} type="button" className="w-full text-left px-3 py-1 hover:bg-white/10" onClick={async ()=>{
                              try {
                                let newId = c.id ?? null;
                                if (!newId) {
                                  const ensured = await authFetch<{id:number}>(`/cities/ensure/`, { method: 'POST', body: JSON.stringify({ name: c.name, country: c.country }) });
                                  newId = ensured?.id ?? null;
                                }
                                setOriginEditId(newId);
                                setOriginEditQ(`${c.name}, ${c.country}`);
                                setOriginEditResults([]);
                              } catch { setOriginEditResults([]); }
                            }}>
                              {c.name}, {c.country}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="btn btn-primary" disabled={!originEditId} onClick={saveOriginEdit}>Save origin</button>
                      <button className="btn btn-ghost" onClick={() => { setEditingOrigin(false); setOriginEditQ(""); setOriginEditResults([]); setOriginEditId(null); }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="section">
              <h3 className="text-lg font-semibold mb-3">Stops</h3>
              <div className="grid gap-2 mb-4">
                {trip.stops?.map((s) => (
                  <div key={s.id} className="card p-3">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{s.city.name}, {s.city.country}</div>
                        <div className="label">{s.start_date} → {s.end_date}</div>
                      </div>
                    </div>
                    {s.activities?.length ? (
                      <ul className="mt-2 text-sm">
                        {s.activities.map(a => (
                          <li key={a.id} className="flex justify-between">
                            <span>{a.title}</span>
                            <span className="opacity-70">{formatMoneyMinor(a.cost_amount, a.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="label mt-2">No activities</div>}
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2 relative">
                  <input className="input" placeholder="Search city" value={cityQ} onChange={(e) => searchCities(e.target.value)} />
                  {cityQ.trim().length > 0 && cityQ.trim().length < 2 && (
                    <div className="label mt-1">Type at least 2 characters…</div>
                  )}
                  {cityResults.length > 0 && (
                    <div className="absolute z-50 mt-1 left-0 right-0 rounded border border-white/10 bg-black/20 backdrop-blur-sm max-h-60 overflow-auto shadow-lg">
                      {cityResults.map((c, idx) => (
                        <button key={`${c.id ?? 'new'}-${idx}`} type="button" className="w-full text-left px-3 py-1 hover:bg-white/10" onClick={async () => {
                          try {
                            let newId = c.id ?? null;
                            if (!newId) {
                              const ensured = await authFetch<{id:number}>(`/cities/ensure/`, { method: 'POST', body: JSON.stringify({ name: c.name, country: c.country }) });
                              newId = ensured?.id ?? null;
                            }
                            setCityId(newId);
                            setCityQ(`${c.name}, ${c.country}`);
                            setCityResults([]);
                          } catch { setCityResults([]); }
                        }}>
                          {c.name}, {c.country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input className="input" type="date" value={stopStart} onChange={(e) => setStopStart(e.target.value)} />
                <input className="input" type="date" value={stopEnd} onChange={(e) => setStopEnd(e.target.value)} />
                <div className="flex items-end">
                  <button className="btn btn-primary" onClick={addStop}>Add stop</button>
                </div>
              </div>
            </div>

            <div className="section">
              <h3 className="text-lg font-semibold mb-3">Budget</h3>
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost" onClick={loadBudget}>Refresh totals</button>
                {budget !== null && <div className="label">Total: {formatMoneyMinor(budget, 'INR')}</div>}
              </div>
            </div>

            <div className="section">
              <h3 className="text-lg font-semibold mb-3">Add Activity</h3>
              <div className="grid sm:grid-cols-5 gap-3">
                <input className="input" placeholder="Stop ID" value={targetStopId ?? ""} onChange={(e) => setTargetStopId(Number(e.target.value) || null)} />
                <input className="input" placeholder="Title" value={actTitle} onChange={(e) => setActTitle(e.target.value)} />
                <input className="input" placeholder="Cost (minor units)" value={actCost} onChange={(e) => setActCost(e.target.value)} />
                <input className="input" placeholder="Currency" value={actCurr} onChange={(e) => setActCurr(e.target.value)} />
                <div className="flex items-end">
                  <button className="btn btn-primary" onClick={addActivity}>Add activity</button>
                </div>
              </div>
              <div className="label mt-2">Tip: choose Stop ID from the list above.</div>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}


