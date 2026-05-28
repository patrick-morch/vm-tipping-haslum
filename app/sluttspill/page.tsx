"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips } from "@/lib/data";
import { GRUPPER, NORGE, flagg, kortLagNavn } from "@/lib/vm-data";
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
          Tipp resultatene — tabellen oppdaterer seg automatisk.
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {GRUPPER.map((g) => {
        const gruppeKamper = kamper.filter(
          (k) => k.runde === `Gruppe ${g.id}`,
        );
        const predikert = beregnTabell(
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
              {predikert.map((s) => (
                <div
                  key={s.lag}
                  className={`flex items-center justify-between text-xs ${
                    s.lag === NORGE ? "text-norge font-semibold" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 text-right font-bold ${
                        s.posisjon === 1
                          ? "text-success"
                          : s.posisjon === 2
                            ? "text-accent"
                            : s.posisjon === 3
                              ? "text-muted"
                              : "text-text/40"
                      }`}
                    >
                      {s.posisjon}
                    </span>
                    <span className="truncate">
                      <span className="mr-1">{flagg(s.lag)}</span>
                      {kortLagNavn(s.lag)}
                    </span>
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
  const SPOR = 16;
  const RAD_PX = 52;

  const runder = [
    { id: "32del", kort: "Sekstendedels", kamper: 16 },
    { id: "16del", kort: "Åttendedels", kamper: 8 },
    { id: "kvart", kort: "Kvart", kamper: 4 },
    { id: "semi", kort: "Semi", kamper: 2 },
    { id: "finale", kort: "Finale", kamper: 1 },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border rounded-2xl p-3 overflow-x-auto">
        <div className="flex gap-2.5 min-w-max">
          {runder.map((r) => {
            const radPerKamp = SPOR / r.kamper;
            return (
              <div key={r.id} className="flex-shrink-0 w-[148px]">
                <div className="text-[10px] font-bold text-muted mb-3 text-center uppercase tracking-[0.08em]">
                  {r.kort}
                </div>
                <div
                  className="grid"
                  style={{
                    gridTemplateRows: `repeat(${SPOR}, ${RAD_PX}px)`,
                  }}
                >
                  {Array.from({ length: r.kamper }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        gridRow: `${i * radPerKamp + 1} / span ${radPerKamp}`,
                      }}
                      className="flex items-center px-1"
                    >
                      <KampKort />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex-shrink-0 w-[160px]">
            <div className="text-[10px] font-bold text-gold mb-3 text-center uppercase tracking-[0.08em]">
              Verdensmester
            </div>
            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(${SPOR}, ${RAD_PX}px)`,
              }}
            >
              <div
                style={{ gridRow: `1 / span ${SPOR}` }}
                className="flex items-center px-1"
              >
                <VinnerKort />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-3 text-center text-xs text-muted">
        Knockout-kampene fylles inn automatisk når gruppespillet er ferdig 27.
        juni. Du kan tippe hver kamp på{" "}
        <Link href="/kamper" className="text-primary font-semibold">
          Kamper
        </Link>
        .
      </div>
    </div>
  );
}

function KampKort() {
  return (
    <div className="w-full bg-elevated border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-border flex-shrink-0" />
          <span className="text-[11px] text-muted truncate">TBD</span>
        </div>
        <span className="text-[11px] text-muted font-mono tabular-nums">–</span>
      </div>
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-border flex-shrink-0" />
          <span className="text-[11px] text-muted truncate">TBD</span>
        </div>
        <span className="text-[11px] text-muted font-mono tabular-nums">–</span>
      </div>
    </div>
  );
}

function VinnerKort() {
  return (
    <div className="w-full bg-gradient-to-br from-gold/25 via-gold/10 to-transparent border border-gold/50 rounded-xl p-3 text-center shadow-[0_0_0_1px_rgb(var(--gold)/0.1)]">
      <div className="text-3xl mb-1.5">🏆</div>
      <div className="text-[9px] text-gold uppercase tracking-[0.1em] mb-0.5 font-bold">
        Champion
      </div>
      <div className="text-sm font-bold text-text/70">TBD</div>
    </div>
  );
}
