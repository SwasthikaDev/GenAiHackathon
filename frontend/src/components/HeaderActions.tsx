"use client";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { isAuthed, logout } from "@/lib/api";

export default function HeaderActions() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(isAuthed()); }, []);

  return (
    <div className="flex items-center gap-2">
      {authed ? (
        <>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/dashboard">Dashboard</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/trips">My trips</Link>
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
          <ThemeToggle />
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/login">Sign in</Link>
          <Link className="btn btn-ghost h-8 px-3 text-sm" href="/signup">Sign up</Link>
        </>
      )}
    </div>
  );
}


