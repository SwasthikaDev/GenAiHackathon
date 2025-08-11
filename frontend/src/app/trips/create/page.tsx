"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Package = {
  id: string;
  title: string;
  summary: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  budgetMinor: number; // in minor units (e.g., INR paise)
  currency: string;
};

const SAMPLE_PACKAGES: Package[] = [
  {
    id: "p1",
    title: "Coastal Escape: Goa & Gokarna",
    summary: "Sun-kissed beaches, beach shacks, and cliffside sunsets across Goa and Gokarna.",
    startDate: "2025-09-03",
    endDate: "2025-09-09",
    budgetMinor: 5200000,
    currency: "INR",
  },
  {
    id: "p2",
    title: "Heritage Circuit: Jaipur & Udaipur",
    summary: "Palaces, lakes, and royal cuisine with stays in boutique havelis.",
    startDate: "2025-11-11",
    endDate: "2025-11-17",
    budgetMinor: 7400000,
    currency: "INR",
  },
  {
    id: "p3",
    title: "Tea Hills: Munnar & Thekkady",
    summary: "Lush plantations, spice trails, and serene boat rides in Kerala.",
    startDate: "2025-08-05",
    endDate: "2025-08-10",
    budgetMinor: 3800000,
    currency: "INR",
  },
  {
    id: "p4",
    title: "Island Hop: Andaman",
    summary: "Clear waters, coral reefs, and relaxed island vibes across Havelock and Neil.",
    startDate: "2025-12-18",
    endDate: "2025-12-25",
    budgetMinor: 9900000,
    currency: "INR",
  },
  {
    id: "p5",
    title: "Himalayan Retreat: Manali",
    summary: "Snow peaks, pine forests, and cozy cafes with scenic day hikes.",
    startDate: "2025-10-01",
    endDate: "2025-10-06",
    budgetMinor: 4200000,
    currency: "INR",
  },
  {
    id: "p6",
    title: "Backwaters & Beaches: Kerala",
    summary: "Houseboat in Alleppey, Kochi heritage lanes, and Marari beach sunsets.",
    startDate: "2025-07-15",
    endDate: "2025-07-21",
    budgetMinor: 6100000,
    currency: "INR",
  },
];

function formatMoneyMinor(minor: number, currency: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(major);
}

export default function CreateTripAIPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"budget_desc" | "budget_asc" | "date_asc" | "date_desc">("budget_desc");

  const filtered = useMemo(() => {
    let items = SAMPLE_PACKAGES.filter((p) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
      );
    });
    items = items.sort((a, b) => {
      if (sort === "budget_desc") return b.budgetMinor - a.budgetMinor;
      if (sort === "budget_asc") return a.budgetMinor - b.budgetMinor;
      if (sort === "date_asc") return a.startDate.localeCompare(b.startDate);
      if (sort === "date_desc") return b.startDate.localeCompare(a.startDate);
      return 0;
    });
    return items;
  }, [query, sort]);

  return (
    <div className="grid gap-6">
      <div className="section flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold text-[var(--brand-blue)]">Create Trip</div>
          <div className="text-sm text-[var(--muted)]">AI‑powered packages will appear here once the backend is ready. Explore mock results below.</div>
        </div>
        <div className="flex gap-2">
          <input className="input" placeholder="Search packages…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="input w-48" value={sort} onChange={(e)=>setSort(e.target.value as any)}>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
            <option value="date_asc">Start date: Earliest</option>
            <option value="date_desc">Start date: Latest</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="card icon-card overflow-hidden">
            <div className="p-4">
              <div className="font-semibold text-[var(--brand-blue)]">{p.title}</div>
              <p className="mt-1 text-sm text-[var(--muted)]">{p.summary}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="section p-2 flex items-center justify-center text-xs">
                  <span className="opacity-80">{new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}</span>
                </div>
                <div className="section p-2 flex items-center justify-center text-xs">
                  <span className="font-semibold">{formatMoneyMinor(p.budgetMinor, p.currency)}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn btn-primary">Select package</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Link className="btn btn-ghost" href="/trips">Back to Trips</Link>
      </div>
    </div>
  );
} 