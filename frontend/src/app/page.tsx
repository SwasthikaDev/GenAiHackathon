import Hero3D from "@/components/Hero3D";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative grid grid-cols-1 gap-6">
      <Hero3D />
      <section className="relative z-10 section">
        <h2 className="text-2xl font-semibold mb-3 tracking-tight">Plan multi‑city adventures, beautifully.</h2>
        <p className="max-w-2xl">Create personalized itineraries with stops and activities. Track costs, preview timelines, and share a link publicly.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn btn-primary" href="/trips">Start planning</a>
          <a className="btn btn-ghost" href="/t/sample">Explore a sample</a>
          <a className="btn" href="/login">Sign in</a>
        </div>
      </section>

      <section className="section">
        <h3 className="text-lg font-semibold mb-3">Why GlobalTrotters</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="card overflow-hidden">
            <img src="https://images.unsplash.com/photo-1526779259212-939e64788e3c?w=800" alt="Itinerary" className="h-32 w-full object-cover" />
            <div className="p-4">
              <div className="font-medium mb-1">Itineraries your way</div>
              <div className="label">Add stops, drag activities, and tailor each day.</div>
            </div>
          </div>
          <div className="card overflow-hidden">
            <img src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800" alt="Budget" className="h-32 w-full object-cover" />
            <div className="p-4">
              <div className="font-medium mb-1">Budget clarity</div>
              <div className="label">Track costs in one place and avoid surprises.</div>
            </div>
          </div>
          <div className="card overflow-hidden">
            <img src="https://images.unsplash.com/photo-1520975922215-230d0b8A6bCE?w=800" alt="Sharing" className="h-32 w-full object-cover" />
            <div className="p-4">
              <div className="font-medium mb-1">Share with a link</div>
              <div className="label">Inspire friends and plan together.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
