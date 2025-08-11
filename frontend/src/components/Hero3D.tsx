"use client";

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-16 h-[480px] w-[720px] opacity-60 [background:radial-gradient(560px_220px_at_70%_60%,rgba(168,85,247,0.18),transparent)]" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-[480px] w-[720px] opacity-50 [background:radial-gradient(560px_220px_at_30%_40%,rgba(236,72,153,0.14),transparent)]" />
    </div>
  );
}


