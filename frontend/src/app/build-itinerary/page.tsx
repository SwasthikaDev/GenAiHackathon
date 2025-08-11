"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Package = {
  id: string;
  title: string;
  summary: string;
  startDate?: string;
  endDate?: string;
  budgetMinor?: number;
  currency?: string;
};

function formatMoneyMinor(minor?: number, currency: string = "INR"): string {
  if (!minor && minor !== 0) return "–";
  const major = minor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(major);
}

function Inner() {
  const params = useSearchParams();

  const name = params.get("name") || "Your Custom Trip";
  const start = params.get("start") || "";
  const end = params.get("end") || "";
  const fromCity = params.get("from") || "";
  const toCity = params.get("to") || "";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"budget_desc" | "budget_asc" | "date_asc" | "date_desc">("budget_desc");
  const [choiceHrefBase, setChoiceHrefBase] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://ostrich-known-quetzal.ngrok-free.app/trips/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            start_date: start,
            end_date: end,
            origin: fromCity,
            destination: toCity,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        const items: Package[] = Array.isArray(data?.packages)
          ? data.packages.map((p: any, i: number) => ({
              id: String(p.id ?? i),
              title: String(p.title ?? p.name ?? `Package ${i + 1}`),
              summary: String(p.summary ?? p.description ?? ""),
              startDate: p.startDate ?? p.start_date ?? start,
              endDate: p.endDate ?? p.end_date ?? end,
              budgetMinor: typeof p.budgetMinor === "number" ? p.budgetMinor : (typeof p.budget === "number" ? Math.round(p.budget * 100) : undefined),
              currency: p.currency ?? "INR",
            }))
          : [];
        setPackages(items);
      } catch (e: any) {
        setError("We couldn't fetch packages right now. You can still proceed or try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [name, start, end, fromCity, toCity]);

  const filtered = useMemo(() => {
    const items = (packages.length ? packages : []).filter((p) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) || (p.summary || "").toLowerCase().includes(q)
      );
    });
    return items.sort((a, b) => {
      if (sort === "budget_desc") return (b.budgetMinor ?? 0) - (a.budgetMinor ?? 0);
      if (sort === "budget_asc") return (a.budgetMinor ?? 0) - (b.budgetMinor ?? 0);
      if (sort === "date_asc") return String(a.startDate || "").localeCompare(String(b.startDate || ""));
      if (sort === "date_desc") return String(b.startDate || "").localeCompare(String(a.startDate || ""));
      return 0;
    });
  }, [packages, query, sort]);

  return (
    <div className="grid gap-6">
      <div className="section">
        <div className="text-xl font-semibold text-[var(--brand-blue)]">Build Itinerary</div>
        <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-3">
            <div className="label">Trip name</div>
            <div className="font-medium">{name}</div>
          </div>
          <div className="card p-3">
            <div className="label">Date range</div>
            <div className="font-medium">{start || "TBD"} → {end || "TBD"}</div>
          </div>
          <div className="card p-3">
            <div className="label">From</div>
            <div className="font-medium">{fromCity || "—"}</div>
          </div>
          <div className="card p-3">
            <div className="label">To</div>
            <div className="font-medium">{toCity || "—"}</div>
          </div>
        </div>
      </div>

      {/* Featured itineraries (dummy) */}
      <div className="section">
        <div className="text-2xl font-semibold mb-4 text-[var(--brand-blue)]">Featured itineraries</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i)=> (
            <div
              key={i}
              className="card p-0 overflow-hidden cursor-pointer"
              onClick={() => {
                const qs = new URLSearchParams({ name, start, end, from: fromCity, to: toCity, place: "Goa Highlight" }).toString();
                setChoiceHrefBase(`/itinerary/${i}?${qs}`);
              }}
            >
              <div className="bg-[var(--muted-2)] flex items-center justify-center text-[var(--muted)] aspect-video">Image</div>
              <div className="p-4">
                <div className="text-lg font-semibold text-[var(--brand-blue)]">Goa Hero Itinerary with Complimentary Activities</div>
                {(() => {
                  const items = [
                    "3N/4D",
                    "3 Nights in Goa",
                    "4-Star Hotel Stay",
                    "Airport Pickup & Drop",
                    "2 Activities Included",
                    "Selected Meals",
                  ];
                  const rows: Array<[string, string]> = [];
                  for (let x = 0; x < items.length; x += 2) {
                    rows.push([items[x], items[x + 1] || ""]);
                  }
                  return (
                    <div className="mt-3 overflow-hidden rounded-md border border-[var(--border)]">
                      <table className="w-full text-sm">
                        <tbody>
                          {rows.map((r, ri) => (
                            <tr key={ri} className="border-b last:border-b-0 border-[var(--border)]">
                              <td className="p-2 align-top">{r[0]}</td>
                              <td className="p-2 align-top">{r[1]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                <div className="mt-3">
                  <div className="label mb-1">Highlights</div>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Free Meal worth ₹650 per person</li>
                    <li>Boat Party with Water Sports</li>
                    <li>Reserve now by paying only ₹2,000</li>
                  </ul>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="section p-2 flex items-center justify-between"><span>Price</span><span className="font-semibold">₹8,426 per person</span></div>
                  <div className="section p-2 flex items-center justify-between"><span>Total Price</span><span className="font-semibold">₹16,852</span></div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="btn btn-primary" onClick={(e)=>{ e.stopPropagation(); const qs = new URLSearchParams({ name, start, end, from: fromCity, to: toCity, place: "Goa Highlight" }).toString(); setChoiceHrefBase(`/itinerary/${i}?${qs}`);}}>Choose itinerary</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-[var(--muted)]">Suggested itineraries</div>
          {loading ? <div className="label">Loading…</div> : error ? <div className="text-red-500 text-sm">{error}</div> : null}
        </div>
        <div className="flex gap-2">
          <input className="input" placeholder="Search itineraries…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="input w-48" value={sort} onChange={(e)=>setSort(e.target.value as any)}>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
            <option value="date_asc">Start date: Earliest</option>
            <option value="date_desc">Start date: Latest</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="section label">No itineraries yet. Fill trip details and try again.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p, i) => (
            <div key={p.id || i} className="card icon-card overflow-hidden">
              <div className="p-4">
                <div className="font-semibold text-[var(--brand-blue)]">{p.title}</div>
                {p.summary && <p className="mt-1 text-sm text-[var(--muted)]">{p.summary}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="section p-2 flex items-center justify-center text-xs">
                    <span className="opacity-80">{p.startDate || start || "—"} → {p.endDate || end || "—"}</span>
                  </div>
                  <div className="section p-2 flex items-center justify-center text-xs">
                    <span className="font-semibold">{formatMoneyMinor(p.budgetMinor, p.currency)}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="btn btn-primary" onClick={()=>{ const qs = new URLSearchParams({ name, start, end, from: fromCity, to: toCity, place: p.title || "Itinerary" }).toString(); setChoiceHrefBase(`/itinerary/${i+1}?${qs}`);}}>Choose itinerary</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Choice modal: include/exclude flights */}
      {choiceHrefBase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div role="dialog" aria-modal className="card p-4 w-full max-w-xl bg-white">
            <div className="text-lg font-semibold mb-3 text-[var(--brand-blue)]">Select pricing</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link className="section p-4 hover:ring-1 hover:ring-[var(--border)]" href={`${choiceHrefBase}&flights=with`}>
                <div className="font-medium">Price including flight</div>
                <div className="text-sm opacity-80 mt-1">Best for bundled value</div>
              </Link>
              <Link className="section p-4 hover:ring-1 hover:ring-[var(--border)]" href={`${choiceHrefBase}&flights=without`}>
                <div className="font-medium">Price excluding flight</div>
                <div className="text-sm opacity-80 mt-1">Plan flights separately</div>
              </Link>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn btn-ghost" onClick={()=>setChoiceHrefBase(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuildItineraryPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
} 