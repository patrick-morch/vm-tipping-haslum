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

function Ledertavle() {
  const { user, demoModus } = useAuth();
  const aggregert = useAggregertLedertavle();
  const brukere = useBrukere();
  const [avdFilter, setAvdFilter] = useState<string>("alle");

  // I demo-modus (eller før første aggregering) viser vi en tom liste
  // fra brukere-listen så folk i det minste ser navnene sine
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

  const oppdatert = aggregert?.oppdatert
    ? new Date(aggregert.oppdatert).toLocaleString("nb-NO", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ledertavle</h1>
        <p className="text-muted text-sm">
          {aggregert
            ? `${aggregert.kamperSpilt}/${aggregert.kamperTotalt} kamper spilt`
            : `${rader.length} medlemmer`}
          {oppdatert && (
            <span className="text-[11px] ml-2">· oppdatert {oppdatert}</span>
          )}
        </p>
      </div>

      {!aggregert && !demoModus && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-xs rounded-xl px-3 py-2">
          Ledertavlen oppdateres nattlig kl 03. Første aggregering kommer
          neste natt — eller admin kan trigge den manuelt.
        </div>
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
                  Kamper {rad.kampPoeng} ({rad.eksakte} eksakte) · Spesial{" "}
                  {rad.spesialPoeng}
                </div>
              </div>
              <span className="text-right font-bold text-lg">{rad.poeng}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted text-center">
        3p eksakt · 1p riktig utfall · Norge-kamper ×2 · VM-vinner 25p ·
        Toppscorer 15p · Toppassist 10p
      </p>
    </div>
  );
}
