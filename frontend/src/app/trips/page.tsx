"use client";
import { useEffect, useRef, useState } from "react";
import { authFetch, API_BASE, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { buildRouteSummary } from "@/lib/format";

type Trip = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  origin_city?: { id: number; name: string; country: string } | null;
  is_public: boolean;
  public_slug: string | null;
};

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<Array<{id?: number|null; name:string; country:string; lat?: string; lon?: string}>>([]);
  const [originId, setOriginId] = useState<number | null>(null);
  const [sharing, setSharing] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editOriginQuery, setEditOriginQuery] = useState("");
  const [editOriginResults, setEditOriginResults] = useState<Array<{id?: number|null; name:string; country:string}>>([]);
  const [editOriginId, setEditOriginId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    authFetch<Trip[]>("/trips/").then(setTrips).catch((e) => setError(String(e)));
  }, [router]);

  function searchOrigin(q: string) {
    setOriginQuery(q);
  }

  const originFetchAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    const t = originQuery.trim();
    if (t.length < 2) { setOriginResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        // cancel any in-flight request
        if (originFetchAbort.current) originFetchAbort.current.abort();
        const controller = new AbortController();
        originFetchAbort.current = controller;
        const res = await fetch(`${API_BASE}/search/cities?q=${encodeURIComponent(t)}` , { signal: controller.signal });
        const data = await res.json();
        setOriginResults(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [originQuery]);

  async function createTrip(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = { name, start_date: start, end_date: end };
      if (originId) payload.origin_city_id = originId;
      const trip = await authFetch<Trip>("/trips/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTrips([trip, ...trips]);
      setName("");
      setStart("");
      setEnd("");
      setOriginId(null);
      setOriginQuery("");
      setOriginResults([]);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteTrip(id: number) {
    if (!confirm("Delete this trip?")) return;
    try {
      await authFetch(`/trips/${id}/`, { method: "DELETE" });
      setTrips(trips.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function shareTrip(id: number) {
    try {
      setSharing(id);
      const res = await authFetch<{ public_slug: string }>(`/trips/${id}/share`, { method: "POST" });
      const slug = (res as any).public_slug;
      setTrips(trips.map(t => t.id === id ? { ...t, is_public: true, public_slug: slug } : t));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSharing(null);
    }
  }

  async function copyPublicLink(slug: string) {
    try {
      const url = `${window.location.origin}/t/${slug}`;
      await navigator.clipboard.writeText(url);
      alert("Public link copied to clipboard");
    } catch {}
  }

  function startEdit(t: Trip) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditStart(t.start_date);
    setEditEnd(t.end_date);
    const oq = t.origin_city ? `${t.origin_city.name}, ${t.origin_city.country}` : "";
    setEditOriginQuery(oq);
    setEditOriginId((t as any).origin_city?.id ?? null);
    setEditOriginResults([]);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName(""); setEditStart(""); setEditEnd(""); setEditOriginQuery(""); setEditOriginId(null); setEditOriginResults([]);
  }

  async function saveEdit(id: number) {
    try {
      const payload: any = { name: editName, start_date: editStart, end_date: editEnd };
      if (editOriginId) payload.origin_city_id = editOriginId;
      const updated = await authFetch<Trip>(`/trips/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
      setTrips(trips.map(t => t.id === id ? updated : t));
      cancelEdit();
    } catch (e: any) {
      setError(String(e));
    }
  }

  // Debounced city search for edit form
  const editOriginAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    const t = editOriginQuery.trim();
    if (editingId === null) return;
    if (t.length < 2) { setEditOriginResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        if (editOriginAbort.current) editOriginAbort.current.abort();
        const controller = new AbortController();
        editOriginAbort.current = controller;
        const res = await fetch(`${API_BASE}/search/cities?q=${encodeURIComponent(t)}` , { signal: controller.signal });
        const data = await res.json();
        setEditOriginResults(Array.isArray(data) ? data : []);
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [editOriginQuery, editingId]);

  return (
    <AuthGuard>
    <div className="grid gap-6">
      <div className="section">
        <h2 className="text-lg font-semibold mb-2">Create a new trip</h2>
        <form onSubmit={createTrip} className="grid gap-3 sm:grid-cols-6">
          <input className="input sm:col-span-2" placeholder="Trip name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          <div className="sm:col-span-2 relative">
            <input className="input w-full" placeholder="Starting from (search city)" value={originQuery} onChange={(e) => searchOrigin(e.target.value)} />
            {originQuery.trim().length > 0 && originQuery.trim().length < 2 && (
              <div className="label mt-1">Type at least 2 characters…</div>
            )}
            {originResults.length > 0 && (
              <div className="absolute z-50 mt-1 left-0 right-0 rounded border border-white/10 bg-black/20 backdrop-blur-sm max-h-60 overflow-auto shadow-lg">
                {originResults.map((c, idx) => (
                  <button key={`${c.id ?? 'new'}-${idx}`} type="button" className="w-full text-left px-3 py-1 hover:bg-white/10" onClick={async () => {
                    try {
                      let cityId = c.id ?? null;
                      if (!cityId) {
                        const ensured = await authFetch<{id:number}>(`/cities/ensure/`, { method: 'POST', body: JSON.stringify({ name: c.name, country: c.country }) });
                        cityId = ensured?.id ?? null;
                      }
                      setOriginId(cityId);
                      setOriginQuery(`${c.name}, ${c.country}`);
                      setOriginResults([]);
                    } catch {
                      setOriginId(null);
                      setOriginResults([]);
                    }
                  }}>
                    {c.name}, {c.country}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary sm:col-span-6 w-fit" type="submit">Create trip</button>
        </form>
        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {trips.map((t) => {
          const route = buildRouteSummary(t.origin_city || null, (t as any).stops || []);
          const isEditing = editingId === t.id;
          return (
          <div key={t.id} className="card p-4 hover:ring-1 hover:ring-white/15 transition">
            <div>
              {!isEditing ? (
                <>
                  <div className="font-medium text-lg">{t.name}</div>
                  <div className="text-sm opacity-70">{t.start_date} → {t.end_date}</div>
                  <div className="text-sm opacity-80 mt-1">{route}</div>
                </>
              ) : (
                <div className="grid gap-2 sm:grid-cols-5 mt-1">
                  <input className="input sm:col-span-2" value={editName} onChange={(e)=>setEditName(e.target.value)} />
                  <input className="input" type="date" value={editStart} onChange={(e)=>setEditStart(e.target.value)} />
                  <input className="input" type="date" value={editEnd} onChange={(e)=>setEditEnd(e.target.value)} />
                  <div className="relative">
                    <input className="input" placeholder="Origin (search)" value={editOriginQuery} onChange={(e)=>setEditOriginQuery(e.target.value)} />
                    {editOriginQuery.trim().length > 0 && editOriginQuery.trim().length < 2 && (
                      <div className="label mt-1">Type at least 2 characters…</div>
                    )}
                    {editOriginResults.length > 0 && (
                      <div className="absolute z-50 mt-1 left-0 right-0 rounded border border-white/10 bg-black/20 backdrop-blur-sm max-h-60 overflow-auto shadow-lg">
                        {editOriginResults.map((c, idx) => (
                          <button key={`${c.id ?? 'new'}-e-${idx}`} type="button" className="w-full text-left px-3 py-1 hover:bg-white/10" onClick={async ()=>{
                            try {
                              let cityId = c.id ?? null;
                              if (!cityId) {
                                const ensureRes = await fetch(`${API_BASE}/cities/ensure/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c.name, country: c.country }) });
                                const ensured = await ensureRes.json();
                                cityId = ensured?.id ?? null;
                              }
                              setEditOriginId(cityId);
                              setEditOriginQuery(`${c.name}, ${c.country}`);
                              setEditOriginResults([]);
                            } catch { setEditOriginResults([]); }
                          }}>
                            {c.name}, {c.country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-3 items-center justify-end">
              {!isEditing ? (
                <>
                  <a className="btn btn-ghost h-8 px-3 text-sm" href={`/trips/${t.id}`}>Open</a>
                  {t.is_public && t.public_slug ? (
                    <>
                      <a className="btn btn-ghost h-8 px-3 text-sm" href={`/t/${t.public_slug}`}>Public</a>
                      <button className="btn btn-ghost h-8 px-3 text-sm" onClick={() => t.public_slug && copyPublicLink(t.public_slug!)}>Copy link</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost h-8 px-3 text-sm" disabled={sharing===t.id} onClick={() => shareTrip(t.id)}>{sharing===t.id?"Sharing…":"Share"}</button>
                  )}
                  <button className="btn btn-ghost h-8 px-3 text-sm" onClick={() => startEdit(t)}>Edit</button>
                  <button className="btn btn-ghost h-8 px-3 text-sm" onClick={() => deleteTrip(t.id)}>Delete</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary h-8 px-3 text-sm" onClick={() => saveEdit(t.id)}>Save</button>
                  <button className="btn btn-ghost h-8 px-3 text-sm" onClick={cancelEdit}>Cancel</button>
                </>
              )}
            </div>
          </div>
        );})}
      </div>
    </div>
    </AuthGuard>
  );
}

