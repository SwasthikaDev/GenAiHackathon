"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type TripCard = {
  id: string;
  title: string;
  description: string;
  start: string; // ISO
  end: string;   // ISO
  budgetMinor: number;
  currency: string;
};

const MOCK_TRIPS: TripCard[] = [
  { id: "t1", title: "Beach Break: Goa", description: "Lazy beaches and seafood shacks.", start: "2025-07-01", end: "2025-07-05", budgetMinor: 3200000, currency: "INR" },
  { id: "t2", title: "Royal Rajasthan", description: "Palaces, forts, and vibrant markets.", start: "2025-12-12", end: "2025-12-19", budgetMinor: 7800000, currency: "INR" },
  { id: "t3", title: "Himalayan Getaway", description: "Cafes, pine forests, and hikes.", start: "2025-03-10", end: "2025-03-16", budgetMinor: 4500000, currency: "INR" },
  { id: "t4", title: "Backwaters", description: "Houseboat and lagoons in Alleppey.", start: "2025-04-18", end: "2025-04-21", budgetMinor: 3900000, currency: "INR" },
  { id: "t5", title: "Island Time: Andaman", description: "Snorkeling and island hopping.", start: "2025-10-08", end: "2025-10-15", budgetMinor: 9100000, currency: "INR" },
];

function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 100);
}

function getBucket(startISO: string, endISO: string): "ongoing" | "upcoming" | "past" {
  const now = new Date();
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (now >= start && now <= end) return "ongoing";
  if (start > now) return "upcoming";
  return "past";
}

const GROUPS = [
  { k: "ongoing", label: "Ongoing" },
  { k: "upcoming", label: "Upcoming" },
  { k: "past", label: "Past" },
] as const;

export default function TripListingPage() {
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const filtered = MOCK_TRIPS.filter((t) =>
      (t.title + t.description).toLowerCase().includes(query.trim().toLowerCase())
    );
    const buckets: Record<string, TripCard[]> = { ongoing: [], upcoming: [], past: [] } as any;
    for (const t of filtered) buckets[getBucket(t.start, t.end)].push(t);
    return buckets as { ongoing: TripCard[]; upcoming: TripCard[]; past: TripCard[] };
  }, [query]);

  return (
    <div className="grid gap-6">
      <div className="section flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-[var(--brand-blue)]">Trip Listing</div>
          <div className="text-sm text-[var(--muted)]">Browse your past, ongoing, and upcoming trips.</div>
        </div>
        <input className="input w-64" placeholder="Search trips…" value={query} onChange={(e)=>setQuery(e.target.value)} />
      </div>

      {GROUPS.map(({k,label}) => (
        <div key={k} className="section">
          <div className="font-semibold mb-3 text-[var(--brand-blue)]">{label}</div>
          {grouped[k].length === 0 ? (
            <div className="label">No {label.toLowerCase()} trips.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[k].map((t) => (
                <div key={t.id} className="card icon-card p-4">
                  <div className="font-medium text-[var(--brand-blue)]">{t.title}</div>
                  <div className="text-sm text-[var(--muted)] mt-1">{t.description}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="section p-2 text-center opacity-80">{new Date(t.start).toLocaleDateString()} → {new Date(t.end).toLocaleDateString()}</div>
                    <div className="section p-2 text-center font-semibold">{formatMoney(t.budgetMinor, t.currency)}</div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link className="btn btn-ghost" href="/trips">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 