"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

type Rec = {
  bannerTitle: string;
  blurb: string;
  topSelections: Array<{ name: string; country: string; reason: string; imageUrl?: string }>;
  groupings: string[];
  sortOptions: string[];
};

export default function DashboardPage() {
  const [rec, setRec] = useState<Rec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await authFetch<Rec>(`/recs/personalized/`, { method: "POST" });
        setRec(data);
      } catch (e: unknown) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AuthGuard>
      {loading ? (
        <div className="grid gap-6">
          <div className="section h-56 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="h-6 w-2/3 bg-black/10 rounded animate-pulse" />
              <div className="mt-3 h-4 w-1/2 bg-black/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="section">
            <div className="flex items-center gap-3">
              <div className="input h-10 animate-pulse" />
              <div className="input w-40 h-10 animate-pulse" />
              <div className="input w-40 h-10 animate-pulse" />
            </div>
          </div>
          <div className="section">
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="h-28 w-full bg-black/10 animate-pulse" />
                  <div className="p-3">
                    <div className="h-4 w-2/3 bg-black/10 rounded animate-pulse" />
                    <div className="mt-2 h-3 w-1/2 bg-black/10 rounded animate-pulse" />
                    <div className="mt-2 h-3 w-5/6 bg-black/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="section h-56 flex items-center justify-center text-center anim-up">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] anim-fade delay-100">
                <span>✨</span>
                <span>Personalized for you</span>
              </div>
              <div className="text-3xl font-semibold text-[var(--brand-blue)] tracking-tight anim-up delay-200">{rec?.bannerTitle || "Discover your next trip"}</div>
              <div className="opacity-90 mt-2 text-[var(--muted)] anim-fade delay-300">{rec?.blurb || "Personalised picks based on your profile"}</div>
            </div>
          </div>

          {/* CTA under hero */}
          <div className="flex justify-end anim-fade delay-200">
            <Link className="btn btn-primary" href="/trips">+ Plan a trip</Link>
          </div>

          <div className="section anim-up">
            <div className="flex items-center gap-3 bg-[var(--muted-2)] p-2 rounded-full">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-blue)] opacity-70">🔍</span>
                <input className="input pl-9 bg-white shadow-sm placeholder:opacity-70 border-[color:rgba(0,0,0,0.18)]" placeholder="Search destinations…" />
              </div>
              <select className="input w-40">
                {rec?.groupings?.map((g) => (<option key={g}>{g}</option>))}
              </select>
              <select className="input w-40">
                {rec?.sortOptions?.map((s) => (<option key={s}>{s}</option>))}
              </select>
            </div>
          </div>

          <div className="section">
            <h3 className="text-lg font-semibold mb-3 text-[var(--brand-blue)] anim-fade">Top regional selections</h3>
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(rec?.topSelections || []).map((d, i) => (
                <div key={i} className="card icon-card overflow-hidden anim-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
                  {d.imageUrl && (
                    <img src={d.imageUrl + "?auto=compress&cs=tinysrgb&w=600"} alt={d.name} className="h-28 w-full object-cover" />
                  )}
                  <div className="p-3">
                    <div className="font-medium text-[var(--brand-blue)]">{d.name}</div>
                    <div className="text-xs opacity-70">{d.country}</div>
                    <div className="text-xs mt-1 text-[var(--muted)]">{d.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section anim-up">
            <h3 className="text-lg font-semibold mb-3 text-[var(--brand-blue)]">Previous trips</h3>
            {/* Hydrate from /trips/ later */}
          </div>
        </div>
      )}
    </AuthGuard>
  );
}


