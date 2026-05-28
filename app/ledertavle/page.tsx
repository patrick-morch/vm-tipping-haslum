"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAlleSpesialTips,
  useAlleTips,
  useBrukere,
  useFasit,
  useKamper,
} from "@/lib/data";
import { beregnPoeng } from "@/lib/types";
import { beregnTabell } from "@/lib/standings";
import { GRUPPER, POENG } from "@/lib/vm-data";
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

type Rad = {
  uid: string;
  navn: string;
  avdeling: string;
  poeng: number;
  kampPoeng: number;
  gruppePoeng: number;
  spesialPoeng: number;
  eksakte: number;
};

function Ledertavle() {
  const { user } = useAuth();
  const brukere = useBrukere();
  const kamper = useKamper();
  const tips = useAlleTips();
  const spesialTips = useAlleSpesialTips();
  const fasit = useFasit();
  const [avdFilter, setAvdFilter] = useState<string>("alle");

  const rader = useMemo<Rad[]>(() => {
    const kampMap = new Map(kamper.map((k) => [k.id, k]));
    const map = new Map<string, Rad>();
    brukere.forEach((b) =>
      map.set(b.uid, {
        uid: b.uid,
        navn: b.navn,
        avdeling: b.avdeling || "",
        poeng: 0,
        kampPoeng: 0,
        gruppePoeng: 0,
        spesialPoeng: 0,
        eksakte: 0,
      }),
    );

    // Kamp-poeng (resultater)
    tips.forEach((t) => {
      const rad = map.get(t.uid);
      if (!rad) return;
      const kamp = kampMap.get(t.matchId);
      if (!kamp || !kamp.resultat) return;
      const p = beregnPoeng(t, kamp.resultat, kamp.bonusFaktor || 1);
      rad.kampPoeng += p;
      if (p >= 3 * (kamp.bonusFaktor || 1)) rad.eksakte += 1;
    });

    // Gruppe-poeng: beregn brukerens predikerte tabell og sammenlign med fasit
    if (Object.keys(fasit.gruppeVinner).length > 0) {
      const tipsPerUid = new Map<string, Map<string, { hjemme: number; borte: number }>>();
      tips.forEach((t) => {
        let m = tipsPerUid.get(t.uid);
        if (!m) {
          m = new Map();
          tipsPerUid.set(t.uid, m);
        }
        m.set(t.matchId, { hjemme: t.hjemme, borte: t.borte });
      });
      brukere.forEach((b) => {
        const rad = map.get(b.uid);
        if (!rad) return;
        const mineTips = tipsPerUid.get(b.uid) || new Map();
        GRUPPER.forEach((g) => {
          const fasitVinner = fasit.gruppeVinner[g.id];
          const fasitToer = fasit.gruppeToer[g.id];
          if (!fasitVinner) return;
          const gruppeKamper = kamper
            .filter((k) => k.runde === `Gruppe ${g.id}`)
            .map((k) => ({
              hjemmelag: k.hjemmelag,
              bortelag: k.bortelag,
              resultat: mineTips.get(k.id) ?? null,
            }));
          const tabell = beregnTabell(g.lag, gruppeKamper);
          if (tabell[0]?.lag === fasitVinner) rad.gruppePoeng += POENG.gruppeVinner;
          if (fasitToer && tabell[1]?.lag === fasitToer)
            rad.gruppePoeng += POENG.gruppeToer;
        });
      });
    }

    // Spesial-poeng
    spesialTips.forEach((s) => {
      const rad = map.get(s.uid);
      if (!rad) return;
      if (fasit.vmVinner && fasit.vmVinner === s.vmVinner)
        rad.spesialPoeng += POENG.vmVinner;
      if (fasit.vmFinalist && fasit.vmFinalist === s.vmFinalist)
        rad.spesialPoeng += POENG.vmFinalist;
      if (
        fasit.toppscorer &&
        s.toppscorer.trim().toLowerCase() ===
          fasit.toppscorer.trim().toLowerCase()
      )
        rad.spesialPoeng += POENG.toppscorer;
      if (
        fasit.toppassist &&
        s.toppassist.trim().toLowerCase() ===
          fasit.toppassist.trim().toLowerCase()
      )
        rad.spesialPoeng += POENG.toppassist;
      if (
        fasit.mestRødeKort &&
        s.mestRødeKort.trim().toLowerCase() ===
          fasit.mestRødeKort.trim().toLowerCase()
      )
        rad.spesialPoeng += POENG.mestRødeKort;
    });

    map.forEach((r) => {
      r.poeng = r.kampPoeng + r.gruppePoeng + r.spesialPoeng;
    });
    return Array.from(map.values()).sort((a, b) => b.poeng - a.poeng);
  }, [brukere, kamper, tips, spesialTips, fasit]);

  const avdelinger = useMemo(() => {
    const set = new Set<string>();
    brukere.forEach((b) => b.avdeling && set.add(b.avdeling));
    return ["alle", ...Array.from(set).sort()];
  }, [brukere]);

  const synlige =
    avdFilter === "alle"
      ? rader
      : rader.filter((r) => r.avdeling === avdFilter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ledertavle</h1>
        <p className="text-muted text-sm">
          {brukere.length} medlemmer ·{" "}
          {kamper.filter((k) => k.resultat).length}/{kamper.length} kamper
          avgjort
        </p>
      </div>

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

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[36px_1fr_64px] gap-2 px-4 py-3 text-xs text-muted border-b border-border font-medium">
          <span>#</span>
          <span>Navn</span>
          <span className="text-right">Poeng</span>
        </div>
        {synlige.length === 0 && (
          <div className="px-4 py-6 text-center text-muted text-sm">
            Ingen medlemmer å vise.
          </div>
        )}
        {synlige.map((rad, i) => {
          const minRad = rad.uid === user?.uid;
          const medalje = ["🥇", "🥈", "🥉"][i];
          return (
            <div
              key={rad.uid}
              className={`grid grid-cols-[36px_1fr_64px] gap-2 px-4 py-3 items-center border-b border-border last:border-b-0 ${
                minRad ? "bg-primary/5" : ""
              }`}
            >
              <span
                className={`text-sm font-bold ${
                  i === 0 ? "text-gold" : i < 3 ? "text-text" : "text-muted"
                }`}
              >
                {medalje || i + 1}
              </span>
              <div className="min-w-0">
                <div className="font-medium truncate flex items-center gap-2">
                  {rad.navn}
                  {minRad && (
                    <span className="text-xs text-primary">(deg)</span>
                  )}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {rad.avdeling && <span>{rad.avdeling} · </span>}
                  Kamp {rad.kampPoeng} · Gruppe {rad.gruppePoeng} · Spesial{" "}
                  {rad.spesialPoeng}
                </div>
              </div>
              <span className="text-right font-bold text-lg">{rad.poeng}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted text-center">
        Norge-kamper ×2 · Gruppe 5p/3p · VM-vinner 25p · Toppscorer 15p
      </p>
    </div>
  );
}
