"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips } from "@/lib/data";
import { GRUPPER, NORGE } from "@/lib/vm-data";
import { beregnTabell, kamperMedMineTips } from "@/lib/standings";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function SluttspillSide() {
  return (
    <Beskytt>
      <Skall>
        <Suspense fallback={<div className="text-muted text-sm">Laster…</div>}>
          <Sluttspill />
        </Suspense>
      </Skall>
    </Beskytt>
  );
}

function Sluttspill() {
  const search = useSearchParams();
  const router = useRouter();
  const fane = search.get("fane") === "knockout" ? "knockout" : "grupper";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sluttspill</h1>
        <p className="text-muted text-sm">
          Tipp resultatene i gruppespillet — tabellen oppdaterer seg
          automatisk.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 bg-surface border border-border rounded-2xl p-1.5">
        <button
          onClick={() => router.push("/sluttspill")}
          className={`h-10 rounded-xl text-sm font-semibold transition ${
            fane === "grupper"
              ? "bg-primary text-primaryFg"
              : "text-muted hover:text-text"
          }`}
        >
          Grupper
        </button>
        <button
          onClick={() => router.push("/sluttspill?fane=knockout")}
          className={`h-10 rounded-xl text-sm font-semibold transition ${
            fane === "knockout"
              ? "bg-primary text-primaryFg"
              : "text-muted hover:text-text"
          }`}
        >
          Knockout
        </button>
      </div>

      {fane === "grupper" ? <GrupperFane /> : <KnockoutFane />}
    </div>
  );
}

function GrupperFane() {
  const { user } = useAuth();
  const kamper = useKamper();
  const tips = useMineTips(user?.uid);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {GRUPPER.map((g) => {
        const gruppeKamper = kamper.filter((k) => k.runde === `Gruppe ${g.id}`);
        const tabell = beregnTabell(
          g.lag,
          kamperMedMineTips(gruppeKamper, tips),
        );
        const tippet = gruppeKamper.filter((k) => tips[k.id]).length;
        const harNorge = g.lag.includes(NORGE);
        return (
          <Link
            key={g.id}
            href={`/sluttspill/${g.id}`}
            className={`bg-surface border rounded-2xl p-3 transition hover:border-primary ${
              harNorge ? "border-norge/40" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-elevated border border-border flex items-center justify-center text-xs font-bold">
                  {g.id}
                </div>
                <span className="font-semibold text-sm">Gruppe {g.id}</span>
                {harNorge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-norge/15 text-norge text-[9px] font-bold">
                    NOR
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted">{tippet}/6 tippet</span>
            </div>
            <div className="space-y-1">
              {tabell.map((s) => (
                <div
                  key={s.lag}
                  className={`flex items-center justify-between text-xs ${
                    s.lag === NORGE ? "text-norge font-semibold" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 text-right font-bold ${
                        s.posisjon <= 2
                          ? "text-primary"
                          : s.posisjon === 3
                            ? "text-accent"
                            : "text-muted"
                      }`}
                    >
                      {s.posisjon}
                    </span>
                    <span className="truncate">{s.lag}</span>
                  </div>
                  <span className="font-mono text-muted">
                    {s.målFor}-{s.målMot} ·{" "}
                    <span className="text-text font-bold">{s.poeng}</span>
                  </span>
                </div>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function KnockoutFane() {
  // 2026: 32 lag i sluttspill (top 2 + 8 beste 3.-plass)
  const runder = [
    { id: "32del", navn: "32-dels", kamper: 16 },
    { id: "16del", navn: "16-dels", kamper: 8 },
    { id: "kvart", navn: "Kvart", kamper: 4 },
    { id: "semi", navn: "Semi", kamper: 2 },
    { id: "finale", navn: "Finale", kamper: 1 },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border rounded-2xl p-3">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {runder.map((r, i) => {
            const total = runder[0].kamper;
            const gap = (total / r.kamper) * 24 - 24;
            return (
              <div key={r.id} className="flex-shrink-0 w-[150px]">
                <div className="text-[10px] font-bold text-muted mb-2 text-center uppercase tracking-wider">
                  {r.navn}
                </div>
                <div
                  className="flex flex-col"
                  style={{
                    paddingTop: gap / 2,
                    gap,
                  }}
                >
                  {Array.from({ length: r.kamper }).map((_, j) => (
                    <BracketPar key={j} />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex-shrink-0 w-[140px]">
            <div className="text-[10px] font-bold text-muted mb-2 text-center uppercase tracking-wider">
              Vinner
            </div>
            <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/40 rounded-xl p-4 text-center mt-[50%]">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs text-muted">TBD</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 text-center text-sm text-muted">
        Knockout-runder fylles inn etter gruppespillet (27. juni). Tipp
        VM-vinner allerede nå under{" "}
        <Link href="/spesial" className="text-primary font-semibold">
          Spesial
        </Link>
        .
      </div>
    </div>
  );
}

function BracketPar() {
  return (
    <div className="bg-elevated border border-border rounded-xl p-2 text-xs">
      <div className="truncate text-muted">TBD</div>
      <div className="border-t border-border my-1" />
      <div className="truncate text-muted">TBD</div>
    </div>
  );
}
