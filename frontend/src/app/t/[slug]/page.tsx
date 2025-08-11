import { API_BASE } from "@/lib/api";
import { buildRouteSummary, formatMoneyMinor } from "@/lib/format";
import PublicBudgetSection from "@/components/PublicBudgetSection";

async function fetchPublic(slug: string) {
  const res = await fetch(`${API_BASE}/public/itineraries/${slug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export default async function PublicTripPage({ params }: { params: { slug: string } }) {
  const data = await fetchPublic(params.slug);
  return (
    <div className="grid gap-4">
      <div className="card p-4">
        <h2 className="text-xl font-semibold">{data.name}</h2>
        <div className="opacity-70">{data.start_date} → {data.end_date}</div>
        {data.origin_city ? (
          <div className="text-sm mt-1 opacity-80">Origin: {data.origin_city.name}, {data.origin_city.country}</div>
        ) : null}
        <div className="text-sm mt-1 opacity-80">Route: {buildRouteSummary(data.origin_city, data.stops)}</div>
        {data.best_time_to_visit && (
          <div className="mt-2"><span className="label">Best time to visit:</span> {data.best_time_to_visit}</div>
        )}
      </div>
      {data.budget_breakdown_minor && <PublicBudgetSection breakdown={data.budget_breakdown_minor} />}
      {data.stops?.map((s: any) => (
        <div key={s.id} className="card p-4">
          <div className="font-medium">{s.city?.name} ({s.city?.country})</div>
          <div className="text-sm opacity-70">{s.start_date} → {s.end_date}</div>
          {s.activities?.length ? (
            <ul className="mt-2 grid gap-1 text-sm">
              {s.activities.map((a: any) => (
                <li key={a.id} className="flex justify-between">
                  <span>{a.title}</span>
                  <span className="opacity-70">{formatMoneyMinor(a.cost_amount, a.currency)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
      {Array.isArray(data.tips) && data.tips.length > 0 && (
        <div className="section">
          <h3 className="text-lg font-semibold mb-3">Tips</h3>
          <ul className="list-disc pl-6 text-sm">
            {data.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

