"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useKamper,
  useMineGruppeTips,
  lagreGruppeTip,
} from "@/lib/data";
import {
  GRUPPER,
  NORGE,
  erNorgeKamp,
  spesialErLåst,
  SPESIAL_LÅS_TID,
} from "@/lib/vm-data";
import { beregnTabell } from "@/lib/standings";
import { Match } from "@/lib/types";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function GruppeDetaljSide() {
  return (
    <Beskytt>
      <Skall>
        <GruppeDetalj />
      </Skall>
    </Beskytt>
  );
}

function GruppeDetalj() {
  const params = useParams();
  const router = useRouter();
  const gruppeId = String(params.gruppe).toUpperCase();
  const gruppe = GRUPPER.find((g) => g.id === gruppeId);
  const { user, bruker } = useAuth();
  const alleKamper = useKamper();
  const gruppeTips = useMineGruppeTips(user?.uid);

  const [låst, setLåst] = useState(() => spesialErLåst());
  useEffect(() => {
    const t = setInterval(() => setLåst(spesialErLåst()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!gruppe) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/sluttspill")}
          className="text-sm text-muted hover:text-text"
        >
          ← Tilbake
        </button>
        <div className="bg-surface border border-border rounded-2xl p-6 text-center text-muted text-sm">
          Fant ingen gruppe {gruppeId}.
        </div>
      </div>
    );
  }

  const kamper = alleKamper
    .filter((k) => k.runde === `Gruppe ${gruppe.id}`)
    .sort((a, b) => a.starttid - b.starttid);

  // ACTUAL standings basert på reelle resultater (ikke tipps)
  const tabell = beregnTabell(gruppe.lag, kamper);
  const harNorge = gruppe.lag.includes(NORGE);
  const mittTip = gruppeTips[gruppe.id];

  async function lagre(vinner: string, toer: string) {
    if (!user || !bruker || låst || !gruppe) return;
    await lagreGruppeTip({
      uid: user.uid,
      gruppe: gruppe.id,
      vinner,
      toer,
      lagretTid: Date.now(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/sluttspill")}
          className="w-9 h-9 rounded-full bg-elevated border border-border flex items-center justify-center text-sm hover:border-primary transition"
          aria-label="Tilbake"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Gruppe {gruppe.id}
            {harNorge && (
              <span className="px-2 py-0.5 rounded-full bg-norge/15 text-norge text-[10px] font-bold">
                NORGE
              </span>
            )}
          </h1>
          <p className="text-muted text-xs">Faktisk tabell</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_36px_36px_36px_44px_44px] gap-1 px-3 py-2 text-[10px] text-muted border-b border-border font-semibold uppercase">
          <span>#</span>
          <span>Lag</span>
          <span className="text-center">S</span>
          <span className="text-center">U</span>
          <span className="text-center">T</span>
          <span className="text-center">Mål</span>
          <span className="text-right">Pts</span>
        </div>
        {tabell.map((s) => (
          <div
            key={s.lag}
            className={`grid grid-cols-[28px_1fr_36px_36px_36px_44px_44px] gap-1 px-3 py-2.5 items-center text-sm border-b border-border last:border-b-0 ${
              s.lag === NORGE ? "bg-norge/5" : ""
            }`}
          >
            <span
              className={`font-bold text-xs ${
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
            <span
              className={`truncate font-medium ${s.lag === NORGE ? "text-norge" : ""}`}
            >
              {s.lag}
            </span>
            <span className="text-center text-xs text-muted">{s.seier}</span>
            <span className="text-center text-xs text-muted">{s.uavgjort}</span>
            <span className="text-center text-xs text-muted">{s.tap}</span>
            <span className="text-center text-xs font-mono text-muted">
              {s.målFor}-{s.målMot}
            </span>
            <span className="text-right font-bold">{s.poeng}</span>
          </div>
        ))}
      </div>

      <TippeBoks
        lag={gruppe.lag}
        tip={mittTip}
        låst={låst}
        låsTid={SPESIAL_LÅS_TID}
        onLagre={lagre}
      />

      <div className="space-y-2">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">
          Kamper
        </h2>
        {kamper.map((k) => (
          <KampInfo key={k.id} kamp={k} />
        ))}
      </div>
    </div>
  );
}

function TippeBoks({
  lag,
  tip,
  låst,
  låsTid,
  onLagre,
}: {
  lag: string[];
  tip?: { vinner: string; toer: string };
  låst: boolean;
  låsTid: number;
  onLagre: (vinner: string, toer: string) => Promise<void>;
}) {
  const [vinner, setVinner] = useState(tip?.vinner || "");
  const [toer, setToer] = useState(tip?.toer || "");
  const [lagret, setLagret] = useState(false);

  useEffect(() => {
    setVinner(tip?.vinner || "");
    setToer(tip?.toer || "");
  }, [tip]);

  const gyldig = vinner && toer && vinner !== toer;
  const endret =
    gyldig && (tip?.vinner !== vinner || tip?.toer !== toer);

  useEffect(() => {
    if (låst || !endret) return;
    const t = setTimeout(async () => {
      await onLagre(vinner, toer);
      setLagret(true);
      setTimeout(() => setLagret(false), 1500);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinner, toer, endret, låst]);

  const låsTekst = new Date(låsTid).toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Mitt tipp</h3>
          <p className="text-xs text-muted">
            {låst
              ? "Tippet er låst — VM har startet."
              : `Kan endres til ${låsTekst}.`}
          </p>
        </div>
        {lagret && (
          <span className="text-xs text-success font-semibold">✓ Lagret</span>
        )}
      </div>

      <fieldset disabled={låst} className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>Vinner</span>
            <span className="text-success font-semibold">5 poeng</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {lag.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setVinner(l);
                  if (toer === l) setToer("");
                }}
                className={`h-10 px-2 rounded-lg text-sm border transition disabled:opacity-50 ${
                  vinner === l
                    ? "bg-success border-success text-white font-semibold"
                    : "bg-elevated border-border hover:border-success/50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>2.-plass</span>
            <span className="text-accent font-semibold">3 poeng</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {lag.map((l) => (
              <button
                key={l}
                type="button"
                disabled={l === vinner}
                onClick={() => setToer(l)}
                className={`h-10 px-2 rounded-lg text-sm border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                  toer === l
                    ? "bg-accent border-accent text-white font-semibold"
                    : "bg-elevated border-border hover:border-accent/50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  );
}

function KampInfo({ kamp }: { kamp: Match }) {
  const dato = new Date(kamp.starttid);
  const datoStr = dato.toLocaleDateString("nb-NO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const klokke = dato.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const ferdig = Boolean(kamp.resultat);

  return (
    <div
      className={`bg-surface border rounded-2xl p-3 ${
        erNorgeKamp(kamp) ? "border-norge/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-muted mb-2">
        <span>
          {datoStr} · {klokke}
        </span>
        {ferdig ? (
          <span className="text-success font-semibold">Ferdig</span>
        ) : (
          <span>Kommer</span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="text-right font-medium text-sm truncate">
          {kamp.hjemmelag}
        </div>
        <div className="flex items-center gap-2 font-bold text-lg tabular-nums">
          <span className={ferdig ? "text-text" : "text-muted"}>
            {ferdig ? kamp.resultat!.hjemme : "–"}
          </span>
          <span className="text-muted">:</span>
          <span className={ferdig ? "text-text" : "text-muted"}>
            {ferdig ? kamp.resultat!.borte : "–"}
          </span>
        </div>
        <div className="text-left font-medium text-sm truncate">
          {kamp.bortelag}
        </div>
      </div>
    </div>
  );
}
