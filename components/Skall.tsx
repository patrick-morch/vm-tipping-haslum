"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ReactNode } from "react";

export default function Skall({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { bruker, loggUt, demoModus } = useAuth();

  const initialer = bruker?.navn
    ?.split(" ")
    .map((d) => d[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navn = (p: string, t: string) => ({
    href: p,
    tittel: t,
    aktiv: path === p,
  });

  const nav = [
    navn("/kamper", "Kamper"),
    navn("/mine-tips", "Mine tips"),
    navn("/ledertavle", "Ledertavle"),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {demoModus && (
        <div className="bg-warning/10 text-warning text-center text-xs py-1.5 border-b border-warning/20">
          Demo-modus — data lagres bare i nettleseren
        </div>
      )}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-border">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/kamper" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-bg font-bold text-sm">
              VM
            </div>
            <span className="font-semibold">VM-tipping</span>
          </Link>
          <div className="flex items-center gap-3">
            {bruker?.rolle === "admin" && (
              <Link
                href="/admin"
                className="text-xs text-muted hover:text-text"
              >
                Admin
              </Link>
            )}
            <button
              onClick={async () => {
                await loggUt();
                router.push("/logg-inn");
              }}
              className="w-9 h-9 rounded-full bg-elevated border border-border text-sm font-medium hover:border-primary transition"
              title="Logg ut"
            >
              {initialer || "?"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[480px] w-full mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border">
        <div className="max-w-[480px] mx-auto grid grid-cols-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`py-3 text-center text-sm font-medium transition ${
                n.aktiv ? "text-primary" : "text-muted hover:text-text"
              }`}
            >
              {n.tittel}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
