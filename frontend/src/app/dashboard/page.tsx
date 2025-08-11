"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

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

  useEffect(() => {
    async function load() {
      try {
        const data = await authFetch(`/recs/personalized/`, { method: "POST" });
        setRec(data as any);
      } catch (e: any) {
        setError(String(e));
      }
    }
    load();
  }, []);

  return (
    <AuthGuard>
      <div className="grid gap-6">
        <div className="section h-56 flex items-center justify-center text-center">
          <div>
            <div className="text-3xl font-semibold">{rec?.bannerTitle || "Discover your next trip"}</div>
            <div className="opacity-80 mt-2">{rec?.blurb || "Personalised picks based on your profile"}</div>
          </div>
        </div>

        <div className="section">
          <div className="flex items-center gap-3">
            <input className="input flex-1" placeholder="Search destinations…" />
            <select className="input w-40">
              {rec?.groupings?.map((g) => (<option key={g}>{g}</option>))}
            </select>
            <select className="input w-40">
              {rec?.sortOptions?.map((s) => (<option key={s}>{s}</option>))}
            </select>
          </div>
        </div>

        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Top regional selections</h3>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(rec?.topSelections || []).map((d, i) => (
              <div key={i} className="card overflow-hidden">
                {d.imageUrl && (
                  <img src={d.imageUrl + "?auto=compress&cs=tinysrgb&w=600"} alt={d.name} className="h-28 w-full object-cover" />
                )}
                <div className="p-3">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs opacity-70">{d.country}</div>
                  <div className="text-xs mt-1">{d.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Previous trips</h3>
          {/* Hydrate from /trips/ later */}
        </div>

        <div className="flex justify-end">
          <a className="btn btn-primary" href="/trips">+ Plan a trip</a>
        </div>
      </div>
    </AuthGuard>
  );
}


