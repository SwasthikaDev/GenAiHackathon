"use client";

import { useMemo, useState } from "react";

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function formatMonth(d: Date) { return d.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }

const SAMPLE_TRIPS: Array<{ date: string; title: string; details: string }>= [
  { date: "2025-07-01", title: "Goa Plan", details: "Arrival • Airport pickup" },
  { date: "2025-07-03", title: "Goa Plan", details: "Dudhsagar Falls day trip" },
  { date: "2025-08-15", title: "Jaipur Weekend", details: "City Palace & Hawa Mahal" },
];

export default function CalendarPage() {
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const out: Array<{ iso: string; day: number; padding?: boolean }>= [];
    const padStart = (start.getDay() + 6) % 7; // ISO: make Monday=0
    for (let i = 0; i < padStart; i++) out.push({ iso: "pad-"+i, day: 0, padding: true });
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push({ iso: new Date(d).toISOString().slice(0,10), day: d.getDate() });
    }
    return out;
  }, [cursor]);

  const tripsByDate = useMemo(() => {
    const m = new Map<string, Array<{title: string; details: string}>>();
    for (const t of SAMPLE_TRIPS) {
      if (!m.has(t.date)) m.set(t.date, []);
      m.get(t.date)!.push({ title: t.title, details: t.details });
    }
    return m;
  }, []);

  const monthLabel = formatMonth(cursor);

  return (
    <div className="grid gap-6">
      <div className="section flex items-center justify-between">
        <div className="text-xl font-semibold text-[var(--brand-blue)]">Calendar</div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={()=>setCursor(addMonths(cursor, -12))}>« Year</button>
          <button className="btn btn-ghost" onClick={()=>setCursor(addMonths(cursor, -1))}>‹ Month</button>
          <div className="section px-3 py-1">{monthLabel}</div>
          <button className="btn btn-ghost" onClick={()=>setCursor(addMonths(cursor, 1))}>Month ›</button>
          <button className="btn btn-ghost" onClick={()=>setCursor(addMonths(cursor, 12))}>Year »</button>
        </div>
      </div>

      <div className="section">
        <div className="grid grid-cols-7 text-xs font-medium text-center">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d)=> <div key={d} className="p-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, idx) => {
            const trips = !d.padding ? tripsByDate.get(d.iso) : undefined;
            const isSelected = selected === d.iso;
            return (
              <div key={d.iso+idx} className={`relative h-20 border border-[var(--border)] rounded-md p-1 ${d.padding ? 'opacity-40' : ''} ${isSelected ? 'ring-2 ring-[var(--brand-blue)]' : ''}`}
                   onClick={()=> !d.padding && setSelected(d.iso)}
                   title={trips?.map(t=>`${t.title}: ${t.details}`).join("\n")}
              >
                <div className="text-xs opacity-70 text-right">{d.day || ''}</div>
                {trips && trips.length > 0 && (
                  <div className="absolute inset-x-1 bottom-1 grid gap-1">
                    {trips.slice(0,2).map((t, i) => (
                      <div key={i} className="text-[10px] truncate px-1 py-0.5 rounded bg-[var(--muted-2)]">{t.title}</div>
                    ))}
                    {trips.length > 2 && <div className="text-[10px] opacity-70">+{trips.length - 2} more</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="font-semibold mb-2">Selected date</div>
        <div className="text-sm">{selected ? new Date(selected).toDateString() : "Click a date to view trips"}</div>
        {selected && tripsByDate.get(selected) && (
          <div className="mt-2 grid gap-2">
            {tripsByDate.get(selected)!.map((t, i) => (
              <div key={i} className="section p-2">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm opacity-80">{t.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 