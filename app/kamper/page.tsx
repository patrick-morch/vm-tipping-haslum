"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips, lagreTip } from "@/lib/data";
import { Match, Prediction } from "@/lib/types";
import { erNorgeKamp } from "@/lib/vm-data";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

const ANTALL = 5;

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

  const nå = Date.now();
  const neste = kamper
    .filter((k) => k.starttid > nå)
    .sort((a, b) => a.starttid - b.starttid)
    .slice(0, ANTALL);
  const totalKommende = kamper.filter((k) => k.starttid > nå).length;
  const utenTip = neste.filter((k) => !tips[k.id]).length;

  async function lagre(id: string, h: number, b: number) {
    if (!user || !bruker) return;
    await lagreTip({
      matchId: id,
      uid: user.uid,
      navn: bruker.navn,
      hjemme: h,
      borte: b,
      lagretTid: Date.now(),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Neste kamper</h1>
        <p className="text-muted text-sm">
          {utenTip > 0
            ? `${utenTip} av de neste ${ANTALL} er ikke tippet ennå.`
            : neste.length === 0
              ? "Ingen kommende kamper akkurat nå."
              : "Du har tippet alle de nærmeste kampene."}
        </p>
      </div>

      <div className="space-y-3">
        {neste.map((kamp) => (
          <KampKort
            key={kamp.id}
            kamp={kamp}
            tip={tips[kamp.id]}
            onLagre={(h, b) => lagre(kamp.id, h, b)}
          />
        ))}
      </div>

      {totalKommende > ANTALL && (
        <Link
          href="/sluttspill"
          className="block text-center bg-surface border border-border hover:border-primary rounded-2xl py-3 text-sm font-medium transition"
        >
          Se alle {totalKommende} kommende kamper i gruppespill →
        </Link>
      )}
    </div>
  );
}

function KampKort({
  kamp,
  tip,
  onLagre,
}: {
  kamp: Match;
  tip?: Prediction;
  onLagre: (h: number, b: number) => Promise<void>;
}) {
  const [hjem, setHjem] = useState(tip ? String(tip.hjemme) : "");
  const [bort, setBort] = useState(tip ? String(tip.borte) : "");
  const [lagrer, setLagrer] = useState(false);
  const [lagret, setLagret] = useState(false);

  useEffect(() => {
    if (tip) {
      setHjem(String(tip.hjemme));
      setBort(String(tip.borte));
    }
  }, [tip]);

  const gyldig = hjem !== "" && bort !== "" && Number(hjem) >= 0 && Number(bort) >= 0;
  const erNorge = erNorgeKamp(kamp);
  const uendret =
    tip && Number(hjem) === tip.hjemme && Number(bort) === tip.borte;

  useEffect(() => {
    if (!gyldig || uendret) return;
    const t = setTimeout(async () => {
      setLagrer(true);
      try {
        await onLagre(Number(hjem), Number(bort));
        setLagret(true);
        setTimeout(() => setLagret(false), 1500);
      } finally {
        setLagrer(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hjem, bort, gyldig, uendret]);

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
        erNorge ? "border-norge/40" : "border-border"
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
          <Sc verdi={hjem} onChange={setHjem} />
          <span className="text-muted">–</span>
          <Sc verdi={bort} onChange={setBort} />
        </div>
        <div className="text-left">
          <div className="font-semibold">{kamp.bortelag}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end h-5">
        <Status lagrer={lagrer} lagret={lagret} tippet={Boolean(tip)} />
      </div>
    </div>
  );
}

function Status({
  lagrer,
  lagret,
  tippet,
}: {
  lagrer: boolean;
  lagret: boolean;
  tippet: boolean;
}) {
  if (lagrer)
    return <span className="text-xs text-muted">Lagrer…</span>;
  if (lagret)
    return (
      <span className="text-xs text-success font-semibold flex items-center gap-1">
        ✓ Lagret
      </span>
    );
  if (tippet)
    return <span className="text-xs text-muted">Tippet</span>;
  return <span className="text-xs text-muted">Skriv resultat</span>;
}

function Sc({
  verdi,
  onChange,
}: {
  verdi: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={20}
      value={verdi}
      onChange={(e) =>
        onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
      }
      className="w-14 h-12 text-center text-xl font-bold rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  );
}
