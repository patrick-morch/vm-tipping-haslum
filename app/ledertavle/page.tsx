"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAlleTips, useBrukere, useKamper } from "@/lib/data";
import { beregnPoeng } from "@/lib/types";
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
  eksakte: number;
  utfall: number;
};

function Ledertavle() {
  const { user } = useAuth();
  const brukere = useBrukere();
  const kamper = useKamper();
  const tips = useAlleTips();
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
        eksakte: 0,
        utfall: 0,
      }),
    );
    tips.forEach((t) => {
      const rad = map.get(t.uid);
      if (!rad) return;
      const kamp = kampMap.get(t.matchId);
      if (!kamp || !kamp.resultat) return;
      const p = beregnPoeng(t, kamp.resultat, kamp.bonusFaktor || 1);
      rad.poeng += p;
      if (p >= 3) rad.eksakte += 1;
      else if (p >= 1) rad.utfall += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.poeng - a.poeng);
  }, [brukere, kamper, tips]);

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
          {kamper.filter((k) => k.resultat).length} kamper avgjort
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
                  ? "bg-primary text-bg font-semibold"
                  : "bg-elevated border border-border text-muted hover:text-text"
              }`}
            >
              {a === "alle" ? "Alle" : a}
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[36px_1fr_60px_60px] gap-2 px-4 py-3 text-xs text-muted border-b border-border">
          <span>#</span>
          <span>Navn</span>
          <span className="text-right">3p</span>
          <span className="text-right">Poeng</span>
        </div>
        {synlige.length === 0 && (
          <div className="px-4 py-6 text-center text-muted text-sm">
            Ingen medlemmer i denne avdelingen ennå.
          </div>
        )}
        {synlige.map((rad, i) => {
          const minRad = rad.uid === user?.uid;
          return (
            <div
              key={rad.uid}
              className={`grid grid-cols-[36px_1fr_60px_60px] gap-2 px-4 py-3 items-center border-b border-border last:border-b-0 ${
                minRad ? "bg-primary/5" : ""
              }`}
            >
              <span
                className={`text-sm font-bold ${
                  i === 0
                    ? "text-primary"
                    : i < 3
                      ? "text-text"
                      : "text-muted"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {rad.navn}
                  {minRad && (
                    <span className="ml-2 text-xs text-primary">(deg)</span>
                  )}
                </div>
                {rad.avdeling && (
                  <div className="text-xs text-muted truncate">
                    {rad.avdeling}
                  </div>
                )}
              </div>
              <span className="text-right text-sm text-muted">
                {rad.eksakte}
              </span>
              <span className="text-right font-bold">{rad.poeng}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted text-center">
        3p = nøyaktig resultat · 1p = riktig utfall · Sluttspill teller dobbelt
      </p>
    </div>
  );
}
