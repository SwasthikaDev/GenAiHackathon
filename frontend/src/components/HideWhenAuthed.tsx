"use client";
import { ReactNode, useEffect, useState } from "react";
import { isAuthed } from "@/lib/api";

export default function HideWhenAuthed({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => { setAuthed(isAuthed()); }, []);
  if (authed === null) return null; // avoid flash
  if (authed) return null;
  return <>{children}</>;
} 