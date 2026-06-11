"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAggregertLedertavle, type LedertavleRad } from "@/lib/data";
import { beregnPoeng } from "@/lib/types";
import { POENG } from "@/lib/vm-data";
import {
  localBrukere,
  localFasit,
  localKamper,
  localSpesialTips,
  localTips,
} from "@/lib/local-store";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";
import SideHeader from "@/components/SideHeader";

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
    .trim()
    .split(/[\s\-]+/)
    .filter((d) => d.length > 0)
    .map((d) => d[0])
    .join("")
    .toUpperCase();
}

type RadMedStats = LedertavleRad;

// Demo-modus regner ut ledertavlen lokalt fra nettleserens lagrede data
// (ingen Firestore-lesing). I Firebase-modus leser vi i stedet det
// ferdig-aggregerte dokumentet (1 read), så vi holder oss innenfor
// gratis-kvoten selv med mange brukere. Aggregeringen kjøres automatisk
// etter hver resultat-sync, så tallene er ferske innen ~10 min.
function useDemoLedertavle(aktiv: boolean): RadMedStats[] {
  const [rader, setRader] = useState<RadMedStats[]>([]);
  useEffect(() => {
    if (!aktiv) {
      setRader([]);
      return;
    }
    const norm = (s: string) => s.trim().toLowerCase();
    const regnUt = () => {
      const brukere = Object.values(localBrukere.get());
      const kamper = localKamper.get();
      const tips = Object.values(localTips.get());
      const spesial = Object.values(localSpesialTips.get());
      const fasit = localFasit.get();

      const ferdige = new Map(
        kamper.filter((k) => k.resultat).map((k) => [k.id, k]),
      );
      const map = new Map<string, RadMedStats>();
      for (const b of brukere) {
        map.set(b.uid, {
          uid: b.uid,
          navn: b.navn,
          avdeling: "",
          klubbRolle: b.klubbRolle,
          poeng: 0,
          kampPoeng: 0,
          spesialPoeng: 0,
          eksakte: 0,
          utfall: 0,
          feil: 0,
        });
      }
      for (const t of tips) {
        const rad = map.get(t.uid);
        if (!rad) continue;
        const k = ferdige.get(t.matchId);
        if (!k || !k.resultat) continue;
        const bonus = k.bonusFaktor || 1;
        const p = beregnPoeng(t, k.resultat, bonus);
        rad.kampPoeng += p;
        if (p === 3 * bonus) rad.eksakte += 1;
        else if (p === 1 * bonus) rad.utfall += 1;
        else rad.feil += 1;
      }
      for (const s of spesial) {
        const rad = map.get(s.uid);
        if (!rad) continue;
        if (fasit.vmVinner && fasit.vmVinner === s.vmVinner)
          rad.spesialPoeng += POENG.vmVinner;
        if (
          fasit.toppscorer &&
          s.toppscorer &&
          norm(s.toppscorer) === norm(fasit.toppscorer)
        )
          rad.spesialPoeng += POENG.toppscorer;
        if (
          fasit.toppassist &&
          s.toppassist &&
          norm(s.toppassist) === norm(fasit.toppassist)
        )
          rad.spesialPoeng += POENG.toppassist;
      }
      const liste = Array.from(map.values())
        .map((r) => ({ ...r, poeng: r.kampPoeng + r.spesialPoeng }))
        .sort((a, b) => b.poeng - a.poeng);
      setRader(liste);
    };
    const unsub = [
      localBrukere.subscribe(regnUt),
      localKamper.subscribe(regnUt),
      localTips.subscribe(regnUt),
      localSpesialTips.subscribe(regnUt),
      localFasit.subscribe(regnUt),
    ];
    return () => unsub.forEach((u) => u());
  }, [aktiv]);
  return rader;
}

function Ledertavle() {
  const { user, demoModus } = useAuth();
  const aggregert = useAggregertLedertavle();
  const demoRader = useDemoLedertavle(demoModus);
  const [rolleFilter, setRolleFilter] = useState<
    "alle" | "trener" | "spiller" | "annet"
  >("alle");

  const rader: RadMedStats[] = useMemo(() => {
    const kilde = demoModus ? demoRader : aggregert?.rader ?? [];
    return kilde
      .map((r) => ({ ...r, utfall: r.utfall ?? 0, feil: r.feil ?? 0 }))
      .sort((a, b) => b.poeng - a.poeng);
  }, [demoModus, demoRader, aggregert]);

  const synlige =
    rolleFilter === "alle"
      ? rader
      : rader.filter((r) => r.klubbRolle === rolleFilter);

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
      <SideHeader
        tittel="Ledertavle"
        undertittel={
          <>
            {aggregert
              ? `${aggregert.kamperSpilt}/${aggregert.kamperTotalt} kamper spilt`
              : `${rader.length} medlemmer`}
            {oppdatert && <span className="ml-1">· oppdatert {oppdatert}</span>}
          </>
        }
      />

      {!aggregert && !demoModus && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-xs rounded-2xl px-3 py-2.5 flex items-center gap-2">
          <span>⏳</span>
          Ledertavlen oppdateres automatisk etter hver fullførte kamp. Henter
          poeng…
        </div>
      )}

      {minRad && minPlass > 3 && (
        <DinPlasseringKort
          rad={minRad}
          plass={minPlass}
          total={rader.length}
        />
      )}

      <FilterBar rolleFilter={rolleFilter} onFilter={setRolleFilter} />

      {top3.length > 0 && (
        <Podium top3={top3} egenUid={user?.uid} ledersum={leder} />
      )}

      <ListeKort
        rader={resten}
        egenUid={user?.uid}
        startPlass={4}
        ledersum={leder}
      />
    </div>
  );
}

function FilterBar({
  rolleFilter,
  onFilter,
}: {
  rolleFilter: "alle" | "trener" | "spiller" | "annet";
  onFilter: (v: "alle" | "trener" | "spiller" | "annet") => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5 bg-surface border border-border rounded-2xl p-1.5">
      {FILTRE.map((f) => (
        <button
          key={f.v}
          onClick={() => onFilter(f.v)}
          className={`h-10 rounded-xl text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5 ${
            rolleFilter === f.v
              ? "bg-primary text-primaryFg"
              : "text-muted hover:text-text"
          }`}
        >
          <span className="text-sm leading-none">{f.ikon}</span>
          <span className="leading-none">{f.t}</span>
        </button>
      ))}
    </div>
  );
}

const FILTRE = [
  { v: "alle", t: "Alle", ikon: "👥" },
  { v: "trener", t: "Trener", ikon: "🧥" },
  { v: "spiller", t: "Spiller", ikon: "⚽" },
  { v: "annet", t: "Annet", ikon: "✨" },
] as const;

function RolleBadge({
  rolle,
}: {
  rolle: "trener" | "spiller" | "annet";
}) {
  const v = {
    trener: { ikon: "🧥", label: "Trener" },
    spiller: { ikon: "⚽", label: "Spiller" },
    annet: { ikon: "👥", label: "Annet" },
  }[rolle];
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-elevated border border-border text-muted font-semibold uppercase tracking-wider inline-flex items-center gap-1">
      <span>{v.ikon}</span>
      {v.label}
    </span>
  );
}

function StatLinje({ rad }: { rad: RadMedStats }) {
  return (
    <div className="text-[11px] flex items-center gap-2 mt-0.5 font-semibold">
      <span className="text-success">✓ {rad.eksakte}</span>
      <span className="text-accent">≈ {rad.utfall}</span>
      <span className="text-muted">✗ {rad.feil}</span>
    </div>
  );
}

function DinPlasseringKort({
  rad,
  plass,
  total,
}: {
  rad: RadMedStats;
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
          Din plassering · av {total}
        </div>
        <div className="font-bold leading-tight flex items-center gap-2 flex-wrap">
          <span>{rad.navn}</span>
          {rad.klubbRolle && <RolleBadge rolle={rad.klubbRolle} />}
        </div>
        <StatLinje rad={rad} />
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
  top3: RadMedStats[];
  egenUid: string | undefined;
  ledersum: number;
}) {
  // Klassisk podium: #2 venstre, #1 sentralt og høyere, #3 høyre
  const har1 = top3[0];
  const har2 = top3[1];
  const har3 = top3[2];

  return (
    <div className="relative">
      {/* Gulvglød under pallen */}
      <div className="absolute inset-x-8 bottom-0 h-20 bg-gold/10 blur-3xl pointer-events-none" />
      <div className="relative grid grid-cols-3 gap-2 items-end border-b-2 border-border/70">
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
    </div>
  );
}

function PodiumKort({
  rad,
  plass,
  egen,
  ledersum,
}: {
  rad: RadMedStats;
  plass: 1 | 2 | 3;
  egen: boolean;
  ledersum: number;
}) {
  const stil = {
    1: {
      topp: "👑",
      toppKlasse: "text-4xl drop-shadow-[0_2px_12px_rgb(var(--gold)/0.6)]",
      avatar:
        "w-16 h-16 border-2 border-gold/70 shadow-[0_0_28px_rgb(var(--gold)/0.45)]",
      pall: "h-24 md:h-28 border-gold/60 bg-gradient-to-b from-gold/45 via-gold/20 to-gold/5 shadow-[0_-8px_40px_rgb(var(--gold)/0.25)]",
      tall: "text-gold text-3xl",
      poengKlasse: "text-3xl text-gold",
      tag: "MESTERTIPPEREN",
      tagKlasse: "bg-gold/20 text-gold border border-gold/40",
    },
    2: {
      topp: "🥈",
      toppKlasse: "text-2xl",
      avatar: "w-11 h-11 border border-accent/50",
      pall: "h-14 md:h-16 border-accent/40 bg-gradient-to-b from-accent/25 via-accent/10 to-transparent",
      tall: "text-accent text-2xl",
      poengKlasse: "text-lg",
      tag: null,
      tagKlasse: "",
    },
    3: {
      topp: "🥉",
      toppKlasse: "text-2xl",
      avatar: "w-11 h-11 border border-warning/50",
      pall: "h-9 md:h-11 border-warning/40 bg-gradient-to-b from-warning/25 via-warning/10 to-transparent",
      tall: "text-warning text-2xl",
      poengKlasse: "text-lg",
      tag: null,
      tagKlasse: "",
    },
  }[plass];

  const prosent = ledersum > 0 ? Math.round((rad.poeng / ledersum) * 100) : 100;
  const er1 = plass === 1;

  return (
    <div className="flex flex-col items-center justify-end min-w-0">
      {/* Personen på pallen */}
      <div className="flex flex-col items-center gap-1.5 pb-2.5 px-1 min-w-0 w-full">
        <div className={`leading-none ${stil.toppKlasse}`}>{stil.topp}</div>
        <div
          className={`rounded-full bg-elevated flex items-center justify-center font-bold ${stil.avatar} ${
            egen ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-bg" : ""
          }`}
          style={{
            fontSize:
              initialer(rad.navn).length <= 2
                ? er1
                  ? "18px"
                  : "13px"
                : initialer(rad.navn).length === 3
                  ? er1
                    ? "14px"
                    : "11px"
                  : "9px",
          }}
        >
          {initialer(rad.navn)}
        </div>
        {stil.tag && (
          <span
            className={`text-[8px] font-bold tracking-[0.14em] px-2 py-0.5 rounded-full ${stil.tagKlasse}`}
          >
            {stil.tag}
          </span>
        )}
        <div
          className="font-bold text-xs text-center leading-tight break-words w-full"
          title={rad.navn}
        >
          {rad.navn}
          {egen && <span className="text-primary text-[10px] ml-1">(deg)</span>}
        </div>
        {rad.klubbRolle && (
          <div className="text-[9px] text-muted uppercase tracking-wider">
            {rad.klubbRolle === "trener"
              ? "🧥 Trener"
              : rad.klubbRolle === "spiller"
                ? "⚽ Spiller"
                : "👥 Annet"}
          </div>
        )}
        <div
          className={`font-extrabold leading-none tabular-nums ${stil.poengKlasse}`}
        >
          {rad.poeng}
          <span className="text-[10px] text-muted font-normal ml-0.5">p</span>
        </div>
        {!er1 && (
          <div className="text-[9px] text-muted">{prosent}% av leder</div>
        )}
      </div>

      {/* Selve pallen */}
      <div
        className={`w-full rounded-t-2xl border border-b-0 flex items-start justify-center pt-1.5 ${stil.pall}`}
      >
        <span className={`font-extrabold opacity-90 ${stil.tall}`}>
          {plass}
        </span>
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
  rader: RadMedStats[];
  egenUid: string | undefined;
  startPlass: number;
  ledersum: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {rader.length === 0 && (
        <div className="px-4 py-8 text-center text-muted text-sm">
          Ingen medlemmer å vise.
        </div>
      )}
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
              <div className="font-semibold flex items-center gap-2 flex-wrap leading-tight">
                <span>{rad.navn}</span>
                {rad.klubbRolle && <RolleBadge rolle={rad.klubbRolle} />}
                {egen && (
                  <span className="text-[10px] text-primary font-bold">
                    DEG
                  </span>
                )}
              </div>
              <StatLinje rad={rad} />
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
