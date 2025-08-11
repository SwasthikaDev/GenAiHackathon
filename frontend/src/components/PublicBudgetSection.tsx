"use client";
import BudgetChart from "@/components/BudgetChart";
import { formatMoneyMinor } from "@/lib/format";

export default function PublicBudgetSection({ breakdown }: { breakdown: Record<string, number> }) {
  if (!breakdown) return null;
  return (
    <div className="section">
      <h3 className="text-lg font-semibold mb-3">Budget breakdown</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="card p-4">
          <BudgetChart data={breakdown} />
        </div>
        <ul className="card p-4 text-sm">
          {Object.entries(breakdown).map(([k,v]) => (
            <li key={k} className="flex justify-between">
              <span className="capitalize">{k}</span>
              <span className="opacity-70">{formatMoneyMinor(v, "USD")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


