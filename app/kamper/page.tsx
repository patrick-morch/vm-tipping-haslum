"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips, lagreTip, slettTip } from "@/lib/data";
import { Match, Prediction, beregnPoeng } from "@/lib/types";
import {
  erNorgeKamp,
  flagg,
  kortLagNavn,
  LÅS_FØR_KAMP_MS,
} from "@/lib/vm-data";
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
  const åpne = kamper
    .filter((k) => k.starttid - LÅS_FØR_KAMP_MS > nå)
    .sort((a, b) => a.starttid - b.starttid);
  const neste = åpne.slice(0, ANTALL);
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

  async function slett(id: string) {
    if (!user) return;
    await slettTip(id, user.uid);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Neste kamper</h1>
        <p className="text-muted text-sm">
          {utenTip > 0
            ? `${utenTip} av de neste ${ANTALL} er ikke tippet ennå.`
            : neste.length === 0
              ? "Ingen åpne kamper akkurat nå."
              : "Alle de nærmeste kampene er tippet."}
        </p>
      </div>

      <div className="space-y-3">
        {neste.map((kamp) => (
          <KampKort
            key={kamp.id}
            kamp={kamp}
            tip={tips[kamp.id]}
            onLagre={(h, b) => lagre(kamp.id, h, b)}
            onSlett={() => slett(kamp.id)}
          />
        ))}
      </div>

      {åpne.length > ANTALL && (
        <Link
          href="/sluttspill"
          className="block text-center bg-surface border border-border hover:border-primary rounded-2xl py-3 text-sm font-medium transition"
        >
          Se alle {åpne.length} åpne kamper →
        </Link>
      )}
    </div>
  );
}

function KampKort({
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

  const gyldig =
    hjem !== "" && bort !== "" && Number(hjem) >= 0 && Number(bort) >= 0;
  const tom = hjem === "" && bort === "";
  const erNorge = erNorgeKamp(kamp);
  const uendret =
    tip && gyldig && Number(hjem) === tip.hjemme && Number(bort) === tip.borte;

  useEffect(() => {
    if (uendret) return;
    if (gyldig) {
      const t = setTimeout(() => onLagre(Number(hjem), Number(bort)), 500);
      return () => clearTimeout(t);
    }
    if (tom && tip) {
      const t = setTimeout(() => onSlett(), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hjem, bort, gyldig, tom, uendret, Boolean(tip)]);

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

  // Fasit-sammenligning (vanligvis ikke aktuelt på Neste kamper siden de er fremtidige)
  let status: { tekst: string; farge: string } | null = null;
  if (kamp.resultat && tip) {
    const p = beregnPoeng(tip, kamp.resultat, kamp.bonusFaktor || 1);
    if (p >= 3) status = { tekst: `Eksakt! +${p}p`, farge: "text-success" };
    else if (p >= 1)
      status = { tekst: `Riktig utfall +${p}p`, farge: "text-accent" };
    else status = { tekst: "Feil tipp", farge: "text-danger" };
  }

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
        <div className="text-right font-semibold min-w-0 truncate">
          <span>{kortLagNavn(kamp.hjemmelag)}</span>{" "}
          <span className="text-lg">{flagg(kamp.hjemmelag)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sc verdi={hjem} onChange={setHjem} />
          <span className="text-muted">–</span>
          <Sc verdi={bort} onChange={setBort} />
        </div>
        <div className="text-left font-semibold min-w-0 truncate">
          <span className="text-lg">{flagg(kamp.bortelag)}</span>{" "}
          <span>{kortLagNavn(kamp.bortelag)}</span>
        </div>
      </div>

      {kamp.resultat && (
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Fasit:</span>
            <span className="font-bold tabular-nums">
              {kamp.resultat.hjemme} – {kamp.resultat.borte}
            </span>
          </div>
          {status && (
            <div className={`text-xs font-semibold ${status.farge}`}>
              {status.tekst}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
