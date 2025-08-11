"use client";

import { useRef, useState } from "react";

const DUMMY_USER = {
  name: "Ahaan Rao",
  email: "ahaan.rao@example.com",
  phone: "+91 98765 43210",
  city: "Bengaluru",
  country: "India",
  avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop",
};

const PREPLANNED = [
  { id: 1, title: "Island Time: Andaman", summary: "Snorkeling and island hopping.", dates: "2025-10-08 → 2025-10-15", budget: "₹91,000" },
  { id: 2, title: "Royal Rajasthan", summary: "Palaces and forts.", dates: "2025-12-12 → 2025-12-19", budget: "₹78,000" },
];

const PREVIOUS = [
  { id: 3, title: "Himalayan Getaway", summary: "Cafes, pine forests, and hikes.", dates: "2025-03-10 → 2025-03-16", budget: "₹45,000" },
  { id: 4, title: "Backwaters", summary: "Houseboat in Alleppey.", dates: "2025-04-18 → 2025-04-21", budget: "₹39,000" },
];

export default function UserProfilesPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatar, setAvatar] = useState<string>(DUMMY_USER.avatar);

  function onPick() {
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(f);
  }

  return (
    <div className="grid gap-6">
      <div className="section">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={avatar} alt="Avatar" className="h-20 w-20 rounded-full object-cover border border-[var(--border)]" />
            <button className="btn btn-primary h-7 px-3 text-xs absolute -bottom-2 left-1/2 -translate-x-1/2" onClick={onPick}>Change</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          <div>
            <div className="text-xl font-semibold text-[var(--brand-blue)]">My Account</div>
            <div className="text-sm text-[var(--muted)]">Update your profile and review your trips</div>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="label">Name</span>
            <input className="input" defaultValue={DUMMY_USER.name} placeholder="Name" />
          </label>
          <label className="grid gap-1">
            <span className="label">Email</span>
            <input className="input" defaultValue={DUMMY_USER.email} placeholder="Email" />
          </label>
          <label className="grid gap-1">
            <span className="label">Phone</span>
            <input className="input" defaultValue={DUMMY_USER.phone} placeholder="Phone" />
          </label>
          <label className="grid gap-1">
            <span className="label">City</span>
            <input className="input" defaultValue={DUMMY_USER.city} placeholder="City" />
          </label>
          <label className="grid gap-1">
            <span className="label">Country</span>
            <input className="input" defaultValue={DUMMY_USER.country} placeholder="Country" />
          </label>
        </div>
      </div>

      <div className="section">
        <div className="text-lg font-semibold mb-3 text-[var(--brand-blue)]">Pre‑planned Trips</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PREPLANNED.map(t => (
            <div key={t.id} className="card icon-card p-4">
              <div className="font-medium text-[var(--brand-blue)]">{t.title}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{t.summary}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="section p-2 text-center opacity-80">{t.dates}</div>
                <div className="section p-2 text-center font-semibold">{t.budget}</div>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn btn-ghost">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="text-lg font-semibold mb-3 text-[var(--brand-blue)]">Previous Trips</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PREVIOUS.map(t => (
            <div key={t.id} className="card icon-card p-4">
              <div className="font-medium text-[var(--brand-blue)]">{t.title}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{t.summary}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="section p-2 text-center opacity-80">{t.dates}</div>
                <div className="section p-2 text-center font-semibold">{t.budget}</div>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn btn-ghost">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 