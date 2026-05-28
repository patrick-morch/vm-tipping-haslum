"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips, lagreTip } from "@/lib/data";
import { Match, Prediction } from "@/lib/types";
import { erNorgeKamp } from "@/lib/vm-data";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function KamperSide() {
  return (
    <Beskytt>
      <Skall>
        <Kamper />
      </Skall>
    </Beskytt>
  );
}

function Kamper() {
  const { user, bruker } = useAuth();
  const kamper = useKamper();
  const tips = useMineTips(user?.uid);

  async function lagre(matchId: string, hjemme: number, borte: number) {
    if (!user || !bruker) return;
    await lagreTip({
      matchId,
      uid: user.uid,
      navn: bruker.navn,
      hjemme,
      borte,
      lagretTid: Date.now(),
    });
  }

  const nå = Date.now();
  const kommende = kamper.filter((k) => k.starttid > nå);
  const utenTip = kommende.filter((k) => !tips[k.id]).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kamper</h1>
        <p className="text-muted text-sm">
          {utenTip > 0
            ? `Du har ${utenTip} kamp${utenTip === 1 ? "" : "er"} igjen å tippe på.`
            : kommende.length === 0
              ? "Ingen kommende kamper akkurat nå."
              : "Alle kommende kamper er tippet. Bra jobba."}
        </p>
      </div>

      {kamper.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm">
            Ingen kamper er lagt inn ennå. Spør admin om å legge til kamper.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {kamper.map((kamp) => (
          <KampKort
            key={kamp.id}
            kamp={kamp}
            tip={tips[kamp.id]}
            låst={kamp.starttid <= nå}
            onLagre={(h, b) => lagre(kamp.id, h, b)}
          />
        ))}
      </div>
    </div>
  );
}

function KampKort({
  kamp,
  tip,
  låst,
  onLagre,
}: {
  kamp: Match;
  tip?: Prediction;
  låst: boolean;
  onLagre: (h: number, b: number) => Promise<void>;
}) {
  const [hjemme, setHjemme] = useState<string>(tip ? String(tip.hjemme) : "");
  const [borte, setBorte] = useState<string>(tip ? String(tip.borte) : "");
  const [lagrer, setLagrer] = useState(false);
  const [lagret, setLagret] = useState(false);

  useEffect(() => {
    if (tip) {
      setHjemme(String(tip.hjemme));
      setBorte(String(tip.borte));
    }
  }, [tip]);

  const gyldig =
    hjemme !== "" &&
    borte !== "" &&
    Number(hjemme) >= 0 &&
    Number(borte) >= 0;

  async function lagre() {
    if (!gyldig || låst) return;
    setLagrer(true);
    try {
      await onLagre(Number(hjemme), Number(borte));
      setLagret(true);
      setTimeout(() => setLagret(false), 1500);
    } finally {
      setLagrer(false);
    }
  }

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

  return (
    <div
      className={`bg-surface border rounded-2xl p-4 ${
        erNorgeKamp(kamp)
          ? "border-norge/40 shadow-[0_0_0_1px_rgb(var(--norge)/0.15)]"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <div className="flex items-center gap-2">
          <span>{kamp.runde}</span>
          {kamp.bonusFaktor > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-norge/15 text-norge font-semibold text-[10px]">
              ×{kamp.bonusFaktor} poeng
            </span>
          )}
        </div>
        <span>
          {datoStr} · {klokke}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <div className="font-semibold">{kamp.hjemmelag}</div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreInput verdi={hjemme} onChange={setHjemme} låst={låst} />
          <span className="text-muted">–</span>
          <ScoreInput verdi={borte} onChange={setBorte} låst={låst} />
        </div>
        <div className="text-left">
          <div className="font-semibold">{kamp.bortelag}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted">
          {låst ? (
            kamp.resultat ? (
              <span>
                Resultat:{" "}
                <span className="text-text font-semibold">
                  {kamp.resultat.hjemme}–{kamp.resultat.borte}
                </span>
              </span>
            ) : (
              "Tipping låst — kampen er i gang"
            )
          ) : tip ? (
            "Tipset er lagret. Du kan endre frem til kampstart."
          ) : (
            "Velg resultat og lagre"
          )}
        </div>
        {!låst && (
          <button
            onClick={lagre}
            disabled={!gyldig || lagrer}
            className={`h-9 px-4 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
              lagret
                ? "bg-primary text-bg"
                : "bg-elevated border border-border hover:border-primary disabled:opacity-50"
            }`}
          >
            {lagret ? "Lagret" : lagrer ? "Lagrer…" : tip ? "Oppdater" : "Lagre"}
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreInput({
  verdi,
  onChange,
  låst,
}: {
  verdi: string;
  onChange: (v: string) => void;
  låst: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={20}
      disabled={låst}
      value={verdi}
      onChange={(e) =>
        onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
      }
      className="w-14 h-12 text-center text-xl font-bold rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    />
  );
}
