"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAggregertLedertavle,
  useBrukere,
  type LedertavleRad,
} from "@/lib/data";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function LedertavleSide() {
  return (
    <Beskytt>
      <Skall>
        <Ledertavle />
      </Skall>
    </Beskytt>
  );
}

function initialer(navn: string): string {
  return navn
    .split(" ")
    .map((d) => d[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Ledertavle() {
  const { user, demoModus } = useAuth();
  const aggregert = useAggregertLedertavle();
  const brukere = useBrukere();
  const [avdFilter, setAvdFilter] = useState<string>("alle");

  const rader: LedertavleRad[] = useMemo(() => {
    if (aggregert?.rader && aggregert.rader.length > 0) return aggregert.rader;
    return brukere.map((b) => ({
      uid: b.uid,
      navn: b.navn,
      avdeling: b.avdeling || "",
      poeng: 0,
      kampPoeng: 0,
      spesialPoeng: 0,
      eksakte: 0,
    }));
  }, [aggregert, brukere]);

  const avdelinger = useMemo(() => {
    const set = new Set<string>();
    rader.forEach((r) => r.avdeling && set.add(r.avdeling));
    return ["alle", ...Array.from(set).sort()];
  }, [rader]);

  const synlige =
    avdFilter === "alle"
      ? rader
      : rader.filter((r) => r.avdeling === avdFilter);

  const top3 = synlige.slice(0, 3);
  const resten = synlige.slice(3);
  const leder = top3[0]?.poeng || 0;

  const minRad = rader.find((r) => r.uid === user?.uid);
  const minPlass = rader.findIndex((r) => r.uid === user?.uid) + 1;

  const oppdatert = aggregert?.oppdatert
    ? new Date(aggregert.oppdatert).toLocaleString("nb-NO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Ledertavle</h1>
        <p className="text-muted text-sm">
          {aggregert
            ? `${aggregert.kamperSpilt}/${aggregert.kamperTotalt} kamper spilt`
            : `${rader.length} medlemmer`}
          {oppdatert && <span className="ml-2">· oppdatert {oppdatert}</span>}
        </p>
      </div>

      {!aggregert && !demoModus && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-xs rounded-2xl px-3 py-2.5 flex items-center gap-2">
          <span>⏳</span>
          Ledertavlen oppdateres nattlig kl 03. Første aggregering kommer
          neste natt.
        </div>
      )}

      {minRad && minPlass > 3 && (
        <DinPlasseringKort
          rad={minRad}
          plass={minPlass}
          total={rader.length}
        />
      )}

      {top3.length > 0 && (
        <Podium top3={top3} egenUid={user?.uid} ledersum={leder} />
      )}

      {avdelinger.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {avdelinger.map((a) => (
            <button
              key={a}
              onClick={() => setAvdFilter(a)}
              className={`h-9 px-3 rounded-xl text-sm whitespace-nowrap transition ${
                avdFilter === a
                  ? "bg-primary text-primaryFg font-semibold"
                  : "bg-elevated border border-border text-muted hover:text-text"
              }`}
            >
              {a === "alle" ? "Alle" : a}
            </button>
          ))}
        </div>
      )}

      {resten.length > 0 && (
        <ListeKort
          rader={resten}
          egenUid={user?.uid}
          startPlass={4}
          ledersum={leder}
        />
      )}

      {synlige.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl px-4 py-8 text-center text-muted text-sm">
          Ingen medlemmer å vise.
        </div>
      )}

      <div className="bg-surface/50 border border-border/50 rounded-2xl p-3 text-[11px] text-muted text-center leading-relaxed">
        <span className="text-success font-semibold">3p</span> eksakt ·{" "}
        <span className="text-accent font-semibold">1p</span> riktig utfall ·{" "}
        <span className="text-norge font-semibold">×2</span> Norge-kamper ·{" "}
        <span className="text-gold font-semibold">25p</span> VM-vinner ·{" "}
        <span className="text-primary font-semibold">15p</span> toppscorer
      </div>
    </div>
  );
}

function DinPlasseringKort({
  rad,
  plass,
  total,
}: {
  rad: LedertavleRad;
  plass: number;
  total: number;
}) {
  return (
    <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
        #{plass}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-primary uppercase tracking-wider font-bold">
          Din plassering
        </div>
        <div className="font-bold truncate">{rad.navn}</div>
        <div className="text-[11px] text-muted">
          {rad.kampPoeng}p kamper · {rad.spesialPoeng}p spesial · av {total}{" "}
          medlemmer
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold leading-none">{rad.poeng}</div>
        <div className="text-[9px] text-muted uppercase tracking-wider mt-1">
          poeng
        </div>
      </div>
    </div>
  );
}

function Podium({
  top3,
  egenUid,
  ledersum,
}: {
  top3: LedertavleRad[];
  egenUid: string | undefined;
  ledersum: number;
}) {
  // Klassisk podium: #2 venstre, #1 sentralt og høyere, #3 høyre
  const har1 = top3[0];
  const har2 = top3[1];
  const har3 = top3[2];

  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      {har2 ? (
        <PodiumKort
          rad={har2}
          plass={2}
          egen={har2.uid === egenUid}
          ledersum={ledersum}
        />
      ) : (
        <div />
      )}
      {har1 ? (
        <PodiumKort
          rad={har1}
          plass={1}
          egen={har1.uid === egenUid}
          ledersum={ledersum}
        />
      ) : (
        <div />
      )}
      {har3 ? (
        <PodiumKort
          rad={har3}
          plass={3}
          egen={har3.uid === egenUid}
          ledersum={ledersum}
        />
      ) : (
        <div />
      )}
    </div>
  );
}

function PodiumKort({
  rad,
  plass,
  egen,
  ledersum,
}: {
  rad: LedertavleRad;
  plass: 1 | 2 | 3;
  egen: boolean;
  ledersum: number;
}) {
  const stil = {
    1: {
      tema: "bg-gradient-to-br from-gold/35 via-gold/15 to-transparent border-gold/50",
      tag: "bg-gold/25 text-gold",
      medalje: "🥇",
      glow: "shadow-[0_0_40px_rgb(var(--gold)/0.15)]",
      tagTekst: "VINNER",
      paddingTop: "pt-5",
    },
    2: {
      tema: "bg-gradient-to-br from-accent/20 via-accent/8 to-transparent border-accent/30",
      tag: "bg-accent/20 text-accent",
      medalje: "🥈",
      glow: "",
      tagTekst: "2. PLASS",
      paddingTop: "pt-3",
    },
    3: {
      tema: "bg-gradient-to-br from-warning/15 via-warning/5 to-transparent border-warning/30",
      tag: "bg-warning/15 text-warning",
      medalje: "🥉",
      glow: "",
      tagTekst: "3. PLASS",
      paddingTop: "pt-3",
    },
  }[plass];

  const prosent = ledersum > 0 ? Math.round((rad.poeng / ledersum) * 100) : 100;

  return (
    <div
      className={`relative ${stil.paddingTop} pb-3 px-2 rounded-2xl border ${stil.tema} ${stil.glow} ${
        egen ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <div className="text-center space-y-1.5">
        <div className={plass === 1 ? "text-3xl" : "text-2xl"}>
          {stil.medalje}
        </div>
        <div
          className={`w-10 h-10 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center text-xs font-bold`}
        >
          {initialer(rad.navn)}
        </div>
        <div className="font-bold text-xs truncate px-1" title={rad.navn}>
          {rad.navn}
          {egen && <span className="text-primary text-[10px] ml-1">(deg)</span>}
        </div>
        <div className={plass === 1 ? "text-2xl font-bold" : "text-lg font-bold"}>
          {rad.poeng}
          <span className="text-[10px] text-muted font-normal ml-0.5">p</span>
        </div>
        {plass !== 1 && (
          <div className="text-[9px] text-muted">{prosent}% av leder</div>
        )}
      </div>
    </div>
  );
}

function ListeKort({
  rader,
  egenUid,
  startPlass,
  ledersum,
}: {
  rader: LedertavleRad[];
  egenUid: string | undefined;
  startPlass: number;
  ledersum: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {rader.map((rad, i) => {
        const plass = startPlass + i;
        const egen = rad.uid === egenUid;
        const prosent = ledersum > 0 ? (rad.poeng / ledersum) * 100 : 0;
        return (
          <div
            key={rad.uid}
            className={`relative grid grid-cols-[44px_1fr_auto] gap-3 px-4 py-3 items-center border-b border-border last:border-b-0 ${
              egen ? "bg-primary/10" : ""
            }`}
          >
            {egen && (
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
            )}
            <div className="text-center">
              <div className="text-sm font-bold text-muted">{plass}</div>
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate flex items-center gap-2">
                {rad.navn}
                {egen && (
                  <span className="text-[10px] text-primary font-bold">DEG</span>
                )}
              </div>
              <div className="text-[11px] text-muted truncate flex items-center gap-1.5">
                {rad.avdeling && <span>{rad.avdeling}</span>}
                {rad.avdeling && <span>·</span>}
                <span>
                  K {rad.kampPoeng}{" "}
                  {rad.eksakte > 0 && (
                    <span className="text-success">({rad.eksakte}✓)</span>
                  )}
                </span>
                <span>·</span>
                <span>S {rad.spesialPoeng}</span>
              </div>
              {ledersum > 0 && (
                <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full transition-all"
                    style={{ width: `${prosent}%` }}
                  />
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-lg leading-none">{rad.poeng}</div>
              <div className="text-[9px] text-muted uppercase tracking-wider mt-0.5">
                poeng
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
