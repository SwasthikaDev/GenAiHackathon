import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="card p-6 sm:p-8 w-full max-w-md shadow-xl">
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
        {subtitle ? (
          <p className="text-sm opacity-70 mb-6">{subtitle}</p>
        ) : (
          <div className="h-4" />
        )}
        {children}
      </div>
    </div>
  );
}


