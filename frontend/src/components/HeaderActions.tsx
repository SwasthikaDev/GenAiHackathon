"use client";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { isAuthed, logout } from "@/lib/api";

export default function HeaderActions() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(isAuthed()); }, []);

  function CalendarIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2zm13 8H4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10zM5 9h14V7H5v2z"/>
      </svg>
    );
  }

  const CalendarLink = (
    <Link href="/calendar" className="btn btn-ghost h-8 w-8 p-0 grid place-items-center" aria-label="Calendar" title="Calendar">
      <CalendarIcon />
    </Link>
  );

  return (
    <div className="flex items-center gap-2">
      {authed ? (
        <>
          {CalendarLink}
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/community">Community</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/trips/list">Trip Listing</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/dashboard">Dashboard</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/trips">My trips</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/user-profiles">My Account</Link>
          <ThemeToggle />
          <button
            className="btn btn-ghost h-8 px-3 text-sm"
            onClick={async () => { await logout(); window.location.href = "/"; }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          {CalendarLink}
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/community">Community</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/trips/list">Trip Listing</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/user-profiles">My Account</Link>
          <ThemeToggle />
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/login">Sign in</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/signup">Sign up</Link>
        </>
      )}
    </div>
  );
}


