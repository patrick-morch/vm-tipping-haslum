"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips, lagreTip, slettTip } from "@/lib/data";
import { Match, Prediction } from "@/lib/types";
import { erNorgeKamp, LÅS_FØR_KAMP_MS } from "@/lib/vm-data";
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

function erKnockout(kamp: Match) {
  return !kamp.runde.startsWith("Gruppe");
}

function Kamper() {
  const { user, bruker } = useAuth();
  const kamper = useKamper();
  const tips = useMineTips(user?.uid);

  const nå = Date.now();
  const kommende = kamper
    .filter((k) => k.starttid > nå)
    .sort((a, b) => a.starttid - b.starttid);
  const neste = kommende.slice(0, ANTALL);
  const utenTip = neste.filter((k) => erKnockout(k) && !tips[k.id]).length;
  const harKnockout = neste.some(erKnockout);

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

  async function slett(id: string) {
    if (!user) return;
    await slettTip(id, user.uid);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Neste kamper</h1>
        <p className="text-muted text-sm">
          {neste.length === 0
            ? "Ingen kommende kamper akkurat nå."
            : harKnockout && utenTip > 0
              ? `${utenTip} knockout-kamp${utenTip === 1 ? "" : "er"} igjen å tippe.`
              : harKnockout
                ? "Du har tippet alle knockout-kampene foran."
                : "Gruppespill — tipp gruppevinner på Bracket."}
        </p>
      </div>

      <div className="space-y-3">
        {neste.map((kamp) =>
          erKnockout(kamp) ? (
            <KnockoutKort
              key={kamp.id}
              kamp={kamp}
              tip={tips[kamp.id]}
              onLagre={(h, b) => lagre(kamp.id, h, b)}
              onSlett={() => slett(kamp.id)}
            />
          ) : (
            <GruppeInfoKort key={kamp.id} kamp={kamp} />
          ),
        )}
      </div>

      {kommende.length > ANTALL && (
        <Link
          href="/sluttspill"
          className="block text-center bg-surface border border-border hover:border-primary rounded-2xl py-3 text-sm font-medium transition"
        >
          Se alle {kommende.length} kommende kamper →
        </Link>
      )}
    </div>
  );
}

function GruppeInfoKort({ kamp }: { kamp: Match }) {
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
  const norge = erNorgeKamp(kamp);

  return (
    <div
      className={`bg-surface border rounded-2xl p-4 ${
        norge ? "border-norge/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>{kamp.runde}</span>
        <span>
          {datoStr} · {klokke}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right font-semibold">{kamp.hjemmelag}</div>
        <div className="text-muted text-lg">vs</div>
        <div className="text-left font-semibold">{kamp.bortelag}</div>
      </div>
    </div>
  );
}

function KnockoutKort({
  kamp,
  tip,
  onLagre,
  onSlett,
}: {
  kamp: Match;
  tip?: Prediction;
  onLagre: (h: number, b: number) => Promise<void>;
  onSlett: () => Promise<void>;
}) {
  const [hjem, setHjem] = useState(tip ? String(tip.hjemme) : "");
  const [bort, setBort] = useState(tip ? String(tip.borte) : "");
  useEffect(() => {
    if (tip) {
      setHjem(String(tip.hjemme));
      setBort(String(tip.borte));
    } else {
      setHjem("");
      setBort("");
    }
  }, [tip]);

  const låst = Date.now() >= kamp.starttid - LÅS_FØR_KAMP_MS;
  const gyldig =
    hjem !== "" && bort !== "" && Number(hjem) >= 0 && Number(bort) >= 0;
  const tom = hjem === "" && bort === "";
  const uendret =
    tip && gyldig && Number(hjem) === tip.hjemme && Number(bort) === tip.borte;

  useEffect(() => {
    if (låst || uendret) return;
    if (gyldig) {
      const t = setTimeout(() => onLagre(Number(hjem), Number(bort)), 500);
      return () => clearTimeout(t);
    }
    if (tom && tip) {
      const t = setTimeout(() => onSlett(), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hjem, bort, gyldig, tom, uendret, låst, Boolean(tip)]);

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
    <div className="bg-surface border border-primary/30 rounded-2xl p-4">
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <div className="flex items-center gap-2">
          <span>{kamp.runde}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">
            TIPP
          </span>
        </div>
        <span>
          {datoStr} · {klokke}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right font-semibold">{kamp.hjemmelag}</div>
        <div className="flex items-center gap-2">
          <Sc verdi={hjem} onChange={setHjem} låst={låst} />
          <span className="text-muted">–</span>
          <Sc verdi={bort} onChange={setBort} låst={låst} />
        </div>
        <div className="text-left font-semibold">{kamp.bortelag}</div>
      </div>
    </div>
  );
}

function Sc({
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
