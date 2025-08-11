"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function rangeDays(startISO: string, endISO: string): string[] {
  if (!startISO || !endISO) return [];
  const out: string[] = [];
  const start = new Date(startISO);
  const end = new Date(endISO);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d).toISOString().slice(0, 10));
  }
  return out;
}

function formatDateNice(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function Inner() {
  const params = useSearchParams();
  const name = params.get("name") || "Your Trip";
  const start = params.get("start") || "";
  const end = params.get("end") || "";
  const fromCity = params.get("from") || "";
  const toCity = params.get("to") || "";
  const place = params.get("place") || "";
  const flights = params.get("flights") || "";

  const days = useMemo(() => rangeDays(start, end), [start, end]);
  const [tab, setTab] = useState<"itinerary" | "policies" | "summary">("itinerary");
  const [exportOpen, setExportOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const rows = useMemo(() => {
    const plan: string[] = [
      `Arrival in ${toCity || "destination"}; Airport pickup → 4★ hotel check‑in; Evening at Baga Beach & shacks`,
      `North Goa sightseeing: Fort Aguada, Candolim & Calangute; Water sports add‑ons; Night market stroll`,
      `Day trip to Dudhsagar Falls; Spice plantation visit; Local Goan thali dinner`,
      `Leisure day: Pool & beach time; Optional sunset cruise; Candolim cafes`,
      `Checkout; Airport drop and flight back to ${fromCity || "home"}`,
    ];
    return days.map((d, i) => ({ date: d, desc: plan[i] || `Free day in ${toCity || "Goa"}` }));
  }, [days, fromCity, toCity]);

  useEffect(() => {
    // Observe day cards to highlight corresponding date row
    const observer = new IntersectionObserver(
      (entries) => {
        // choose the most visible entry
        let maxRatio = 0;
        let idx = activeIdx;
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.index || 0);
          if (e.isIntersecting && e.intersectionRatio >= maxRatio) {
            maxRatio = e.intersectionRatio;
            idx = i;
          }
        }
        if (idx !== activeIdx) setActiveIdx(idx);
      },
      { root: null, threshold: [0.25, 0.5, 0.75] }
    );
    dayRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  function handleSave() {
    try {
      const key = "saved_itineraries";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const payload = {
        name,
        start,
        end,
        from: fromCity,
        to: toCity,
        place,
        flights,
        days: rows,
        savedAt: new Date().toISOString(),
      };
      existing.unshift(payload);
      localStorage.setItem(key, JSON.stringify(existing));
      setSavedMsg("Itinerary saved locally");
      setTimeout(() => setSavedMsg(null), 2500);
    } catch {
      setSavedMsg("Unable to save locally");
      setTimeout(() => setSavedMsg(null), 2500);
    }
  }

  function exportJSON() {
    const data = {
      name,
      start,
      end,
      from: fromCity,
      to: toCity,
      place,
      flights,
      days: rows,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}_${start}_${end}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  function exportPrint() {
    setExportOpen(false);
    window.print();
  }

  return (
    <div className="grid gap-6">
      {/* Header summary */}
      <div className="section">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-[var(--brand-blue)]">{name}</div>
            <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="card p-3"><div className="label">From</div><div className="font-medium">{fromCity || "—"}</div></div>
              <div className="card p-3"><div className="label">To</div><div className="font-medium">{toCity || "—"}</div></div>
              <div className="card p-3"><div className="label">Dates</div><div className="font-medium">{start || "TBD"} → {end || "TBD"}</div></div>
              {place && <div className="card p-3"><div className="label">Highlight</div><div className="font-medium">{place}</div></div>}
              {flights && <div className="card p-3"><div className="label">Flights</div><div className="font-medium">{flights === "with" ? "Included" : "Not included"}</div></div>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="btn btn-secondary" onClick={handleSave}>Save itinerary</button>
            <button className="btn btn-primary" onClick={()=>setExportOpen(true)}>Export</button>
          </div>
        </div>
        {savedMsg && <div className="mt-2 text-sm opacity-80">{savedMsg}</div>}
      </div>

      {/* Tabs */}
      <div className="section">
        <div className="tablist mb-4">
          <button className={`tab-btn ${tab === "itinerary" ? "active" : ""}`} onClick={()=>setTab("itinerary")}>ITINERARY</button>
          <button className={`tab-btn ${tab === "policies" ? "active" : ""}`} onClick={()=>setTab("policies")}>POLICIES</button>
          <button className={`tab-btn ${tab === "summary" ? "active" : ""}`} onClick={()=>setTab("summary")}>SUMMARY</button>
        </div>

        {tab === "itinerary" && (
          <div className="grid gap-4">
            {/* Top action row: Share + badges */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : ''); }}>
                Share
              </button>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="section px-3 py-1">{rows.length} Day Plan</div>
                <div className="section px-3 py-1">2 Transfers</div>
                <div className="section px-3 py-1">1 Hotel</div>
                <div className="section px-3 py-1">1 Activity</div>
                <div className="section px-3 py-1">4 Meals</div>
              </div>
            </div>

            <div className="text-lg font-semibold text-[var(--brand-blue)]">Day Plan</div>

            {/* Two-column layout: left date list, right day cards */}
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Date list */}
              <div className="lg:col-span-2">
                <div className="card p-0 overflow-hidden">
                  <div className="bg-[var(--muted-2)] p-2 text-sm font-medium">Dates</div>
                  <ul className="max-h-[380px] overflow-auto">
                    {rows.map((r, i) => (
                      <li
                        key={i}
                        className={`flex items-center justify-between px-3 py-2 border-b border-[var(--border)] cursor-pointer ${activeIdx === i ? 'bg-[var(--muted-2)]' : ''}`}
                        onClick={() => {
                          dayRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          setActiveIdx(i);
                        }}
                      >
                        <div>
                          <div className="text-sm font-medium">{formatDateNice(r.date)}</div>
                          <div className="text-xs opacity-70">Day {i + 1}</div>
                        </div>
                        <div className="text-xs section px-2 py-1">{toCity || 'Goa'}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Day details */}
              <div className="lg:col-span-3 grid gap-3">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="card p-4"
                    ref={(el) => { dayRefs.current[i] = el; }}
                    data-index={i}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Day {i + 1} — {toCity || 'Goa'}</div>
                      <div className="text-xs opacity-70">{formatDateNice(r.date)}</div>
                    </div>

                    {/* Included chips */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <div className="section px-2 py-1">INCLUDED :</div>
                      {i === 0 && <div className="section px-2 py-1">1 Hotel</div>}
                      {i === 0 && <div className="section px-2 py-1">1 Transfer</div>}
                      {i === 1 && <div className="section px-2 py-1">1 Activity</div>}
                      {i > 0 && i < rows.length && <div className="section px-2 py-1">1 Meal</div>}
                      {i === rows.length - 1 && <div className="section px-2 py-1">1 Transfer</div>}
                    </div>

                    {/* Flight notes day 1 and last day */}
                    {i === 0 && (
                      <div className="mt-3 grid gap-1 text-sm">
                        <div className="font-semibold">FLIGHT</div>
                        <div>Arrival in {toCity || 'Goa'}</div>
                        <div className="opacity-80">Please Note : You need to reach {toCity || 'Goa'} on your own</div>
                        <button className="btn btn-ghost h-8 w-fit px-3 text-xs">VIEW TRANSPORT OPTION(S)</button>
                      </div>
                    )}
                    {i === rows.length - 1 && (
                      <div className="mt-3 grid gap-1 text-sm">
                        <div className="font-semibold">FLIGHT</div>
                        <div>Departure from {toCity || 'Goa'}</div>
                        <div className="opacity-80">Please Note : You need to depart from {toCity || 'Goa'} on your own</div>
                      </div>
                    )}

                    {/* Transfer card day 1 and last day */}
                    {(i === 0 || i === rows.length - 1) && (
                      <div className="mt-3 section p-3 grid gap-1 text-sm">
                        <div className="font-semibold">TRANSFER  {i === 0 ? 'Airport to hotel in ' + (toCity || 'Goa') : 'Hotel in ' + (toCity || 'Goa') + ' to Airport'}</div>
                        <div className="opacity-80">Private Transfer</div>
                        <div className="opacity-80">{i === 0 ? 'Enjoy a comfortable ride from Dabolim Airport to your hotel in North Goa.' : 'Travel comfortably in a private vehicle from your hotel in North Goa to Dabolim Airport.'}</div>
                      </div>
                    )}

                    {/* Hotel block for first 4 nights */}
                    {i === 0 && (
                      <div className="mt-3 section p-3 grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">RESORT 4 Nights In {toCity || 'Goa'}</div>
                          <button className="btn btn-ghost h-8 px-3 text-xs">Change</button>
                        </div>
                        <div className="font-medium">Summit Calangute Resort & Spa</div>
                        <div className="opacity-80">Calangute , 2.1 km drive to Calangute Beach</div>
                        <div className="opacity-80">{formatDateNice(rows[0].date)} - {formatDateNice(rows[rows.length - 1].date)}, 4 Nights</div>
                        <div>Deluxe Room with Private Balcony - Holidays Selections</div>
                        <div className="mt-1">Breakfast is included</div>
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs underline">VIEW ALL INCLUSIONS</summary>
                          <ul className="list-disc pl-5">
                            <li>Complimentary Drinks (2 pints of beer as per property)</li>
                            <li>Gym & Swimming Pool access</li>
                          </ul>
                        </details>
                        <div className="mt-2 flex gap-2">
                          <button className="btn btn-ghost h-8 px-3 text-xs">More Room Options</button>
                        </div>
                      </div>
                    )}

                    {/* Meal blocks for days 2-4 */}
                    {i > 0 && i < rows.length && (
                      <div className="mt-3 section p-3 text-sm">
                        <div className="font-semibold">MEAL — Breakfast In {toCity || 'Goa'}</div>
                      </div>
                    )}

                    {/* Activity block for day 2 */}
                    {i === 1 && (
                      <div className="mt-3 section p-3 grid gap-1 text-sm">
                        <div className="font-semibold">ACTIVITY — In {toCity || 'Goa'}</div>
                        <div className="font-medium">ATV Adventure Ride in Goa (Without Transfers)</div>
                        <div className="opacity-80">Embark on a 40-minute ATV Adventure Ride in Goa at Dodamarg near Mayem Lake! Includes training, safety gear, and guide.</div>
                        <div className="opacity-80">Anytime</div>
                      </div>
                    )}

                    {/* Add to day CTA */}
                    <div className="mt-3">
                      <div className="opacity-80 text-sm">Spend the day at leisure or add an activity, transfer or meal to your day</div>
                      <button className="btn btn-primary mt-2">ADD TO DAY</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "policies" && (
          <div className="text-sm grid gap-2">
            <div className="label">Policies</div>
            <p>Dummy content. Cancellation, reschedule, and refund policies will appear here.</p>
            <p>Check‑in policy: Standard 2 PM; Check‑out policy: 11 AM. Government ID mandatory.</p>
          </div>
        )}

        {tab === "summary" && (
          <div className="text-sm grid gap-2">
            <div className="label">Summary</div>
            <p>Dummy totals and inclusions. Taxes, convenience fee, and promotional discounts will be summarized here.</p>
            <ul className="list-disc pl-5">
              <li>Hotel (4 nights): ₹14,000</li>
              <li>Transfers: ₹2,400</li>
              <li>Activities: ₹4,000</li>
              <li>Meals: Included (as per plan)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Export modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div role="dialog" aria-modal className="card p-4 w-full max-w-xl bg-white">
            <div className="text-lg font-semibold mb-3 text-[var(--brand-blue)]">Export itinerary</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <button className="section p-4 text-left hover:ring-1 hover:ring-[var(--border)]" onClick={exportJSON}>
                <div className="font-medium">Download JSON</div>
                <div className="text-sm opacity-80 mt-1">Share or import later</div>
              </button>
              <button className="section p-4 text-left hover:ring-1 hover:ring-[var(--border)]" onClick={exportPrint}>
                <div className="font-medium">Print / Save as PDF</div>
                <div className="text-sm opacity-80 mt-1">Use your browser's Save as PDF</div>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn btn-ghost" onClick={()=>setExportOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
} 