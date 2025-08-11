import Link from "next/link";
import HideWhenAuthed from "@/components/HideWhenAuthed";

export default function Home() {
  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Hero with background image and overlay CTA */}
      <section className="relative overflow-hidden rounded-2xl" style={{boxShadow: "0 16px 40px rgba(0,0,0,0.12)"}}>
        <img
          src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1600&auto=format&fit=crop"
          alt="Travel destination"
          className="h-[360px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.30),rgba(0,0,0,0.10))]" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <section className="section flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-[var(--brand-blue)]">Plan, book, and go.</div>
              <div className="text-sm text-[var(--muted)]">Everything you need for your next journey in one place.</div>
            </div>
            <div className="flex gap-3">
              <Link className="btn btn-primary" href="/trips">Start planning</Link>
              <HideWhenAuthed>
                <Link className="btn btn-secondary" href="/login">Sign in</Link>
              </HideWhenAuthed>
            </div>
          </section>
        </div>
      </section>

      {/* Services grid */}
      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: "Flights", desc: "Book domestic & international flights", icon: "✈️" },
            { title: "Hotels", desc: "Find stays across the globe", icon: "🏨" },
            { title: "Trains", desc: "Reserve seats on major routes", icon: "🚆" },
            { title: "Buses", desc: "Comfortable intercity bus tickets", icon: "🚌" },
            { title: "Cabs", desc: "Local & outstation rentals", icon: "🚗" },
            { title: "Holidays", desc: "Curated packages for every budget", icon: "🧳" },
          ].map((s) => (
            <div key={s.title} className="card icon-card p-4">
              <div className="flex items-start gap-3">
                <div className="icon-circle text-lg">{s.icon}</div>
                <div>
                  <div className="font-semibold text-[var(--brand-blue)]">{s.title}</div>
                  <div className="text-sm text-[var(--muted)]">{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip removed from bottom as it's now in hero */}
    </div>
  );
}
