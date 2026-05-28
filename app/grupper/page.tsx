"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMineGruppeTips, lagreGruppeTip } from "@/lib/data";
import { GRUPPER, NORGE } from "@/lib/vm-data";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function GrupperSide() {
  return (
    <Beskytt>
      <Skall>
        <Grupper />
      </Skall>
    </Beskytt>
  );
}

function Grupper() {
  const { user, bruker } = useAuth();
  const tips = useMineGruppeTips(user?.uid);
  const ferdig = GRUPPER.filter((g) => tips[g.id]).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Grupper</h1>
        <p className="text-muted text-sm">
          Tipp vinner og 2.-plass for hver gruppe. {ferdig}/{GRUPPER.length}{" "}
          tippet · 5p for riktig vinner, 3p for riktig 2.-plass.
        </p>
      </div>

      <div className="space-y-3">
        {GRUPPER.map((g) => (
          <GruppeKort
            key={g.id}
            gruppe={g}
            tip={tips[g.id]}
            onLagre={async (vinner, toer) => {
              if (!user || !bruker) return;
              await lagreGruppeTip({
                uid: user.uid,
                gruppe: g.id,
                vinner,
                toer,
                lagretTid: Date.now(),
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function GruppeKort({
  gruppe,
  tip,
  onLagre,
}: {
  gruppe: { id: string; lag: string[] };
  tip?: { vinner: string; toer: string };
  onLagre: (vinner: string, toer: string) => Promise<void>;
}) {
  const [vinner, setVinner] = useState(tip?.vinner || "");
  const [toer, setToer] = useState(tip?.toer || "");
  const [lagret, setLagret] = useState(false);
  const inneholderNorge = gruppe.lag.includes(NORGE);
  const gyldig = vinner && toer && vinner !== toer;

  async function lagre() {
    if (!gyldig) return;
    await onLagre(vinner, toer);
    setLagret(true);
    setTimeout(() => setLagret(false), 1500);
  }

  return (
    <div
      className={`bg-surface border rounded-2xl p-4 ${
        inneholderNorge ? "border-norge/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-elevated border border-border flex items-center justify-center font-bold">
            {gruppe.id}
          </div>
          <span className="font-semibold">Gruppe {gruppe.id}</span>
          {inneholderNorge && (
            <span className="px-2 py-0.5 rounded-full bg-norge/15 text-norge text-[10px] font-semibold">
              Norge
            </span>
          )}
        </div>
        {tip && (
          <span className="text-xs text-muted">Tippet</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {gruppe.lag.map((lag) => (
          <div
            key={lag}
            className={`px-3 py-2 rounded-xl text-sm ${
              lag === NORGE
                ? "bg-norge/10 border border-norge/30 font-semibold text-norge"
                : "bg-elevated border border-border"
            }`}
          >
            {lag}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs text-muted mb-1">Vinner (5p)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {gruppe.lag.map((lag) => (
              <button
                key={lag}
                onClick={() => {
                  setVinner(lag);
                  if (toer === lag) setToer("");
                }}
                className={`h-9 px-2 rounded-lg text-sm border transition ${
                  vinner === lag
                    ? "bg-primary border-primary text-primaryFg font-semibold"
                    : "bg-elevated border-border hover:border-primary/50"
                }`}
              >
                {lag}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">2.-plass (3p)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {gruppe.lag.map((lag) => (
              <button
                key={lag}
                disabled={lag === vinner}
                onClick={() => setToer(lag)}
                className={`h-9 px-2 rounded-lg text-sm border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                  toer === lag
                    ? "bg-accent border-accent text-white font-semibold"
                    : "bg-elevated border-border hover:border-accent/50"
                }`}
              >
                {lag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={lagre}
        disabled={!gyldig}
        className={`mt-3 w-full h-10 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
          lagret
            ? "bg-success text-white"
            : "bg-primary text-primaryFg hover:bg-primaryDark disabled:opacity-40"
        }`}
      >
        {lagret ? "Lagret" : tip ? "Oppdater tipp" : "Lagre tipp"}
      </button>
    </div>
  );
}
