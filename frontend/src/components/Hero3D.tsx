"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const DynamicSpline = dynamic(() => import("@splinetool/react-spline").then(m => m.default), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-white/5 rounded-xl" />,
});

export function Hero3D() {
  const scene = useMemo(() => process.env.NEXT_PUBLIC_SPLINE_SCENE, []);

  if (!scene) {
    return (
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-16 h-[480px] w-[720px] opacity-60 [background:radial-gradient(560px_220px_at_70%_60%,rgba(168,85,247,0.18),transparent)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-[480px] w-[720px] opacity-50 [background:radial-gradient(560px_220px_at_30%_40%,rgba(236,72,153,0.14),transparent)]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 -z-10">
      <DynamicSpline scene={scene as string} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(11,15,26,0.6)] via-transparent to-[rgba(11,15,26,0.6)]" />
    </div>
  );
}

export default Hero3D;


