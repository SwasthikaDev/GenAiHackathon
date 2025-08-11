"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

type Rec = {
  bannerTitle: string;
  blurb: string;
  topSelections: Array<{ name: string; country: string; reason: string }>;
  groupings: string[];
  sortOptions: string[];
};

export default function MarketingHomePage() {
  const [rec, setRec] = useState<Rec | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Public marketing page now; no auth fetch here
  useEffect(() => {}, []);

  return (
    <div className="grid gap-6">
      <div className="section h-56 flex items-center justify-center text-center">
        <div>
          <div className="text-3xl font-semibold">Welcome to GlobalTrotters</div>
          <div className="opacity-80 mt-2">Sign in to see your personalized dashboard</div>
        </div>
      </div>
      <div className="flex justify-center">
        <a className="btn btn-primary" href="/login">Sign in</a>
      </div>
    </div>
  );
}


