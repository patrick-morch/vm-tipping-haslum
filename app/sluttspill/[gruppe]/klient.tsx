"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKamper, useMineTips, lagreTip, slettTip } from "@/lib/data";
import { GRUPPER, NORGE, erNorgeKamp } from "@/lib/vm-data";
import { beregnTabell, kamperMedMineTips } from "@/lib/standings";
import { Match, Prediction } from "@/lib/types";
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
  const tips = useMineTips(user?.uid);

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

  const tabell = beregnTabell(gruppe.lag, kamperMedMineTips(kamper, tips));
  const harNorge = gruppe.lag.includes(NORGE);

  async function lagre(matchId: string, h: number, b: number) {
    if (!user || !bruker) return;
    await lagreTip({
      matchId,
      uid: user.uid,
      navn: bruker.navn,
      hjemme: h,
      borte: b,
      lagretTid: Date.now(),
    });
  }

  async function slett(matchId: string) {
    if (!user) return;
    await slettTip(matchId, user.uid);
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
                NORGE ×2
              </span>
            )}
          </h1>
          <p className="text-muted text-xs">
            Tippet tabell — oppdaterer seg automatisk
          </p>
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

      <div className="text-xs text-muted px-1">
        <span className="text-success font-semibold">1</span> og{" "}
        <span className="text-accent font-semibold">2</span> går direkte videre ·{" "}
        <span className="text-muted font-semibold">3</span> har sjanse som beste
        treer
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">
          Kamper
        </h2>
        {kamper.map((kamp) => (
          <KampRad
            key={kamp.id}
            kamp={kamp}
            tip={tips[kamp.id]}
            onLagre={(h, b) => lagre(kamp.id, h, b)}
            onSlett={() => slett(kamp.id)}
          />
        ))}
      </div>
    </div>
  );
}

function KampRad({
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

  const låst = kamp.starttid <= Date.now();
  const gyldig = hjem !== "" && bort !== "" && Number(hjem) >= 0 && Number(bort) >= 0;
  const tom = hjem === "" && bort === "";
  const erNorge = erNorgeKamp(kamp);
  const uendret =
    tip && gyldig && Number(hjem) === tip.hjemme && Number(bort) === tip.borte;

  useEffect(() => {
    if (låst || uendret) return;
    if (gyldig) {
      const t = setTimeout(() => {
        onLagre(Number(hjem), Number(bort));
      }, 500);
      return () => clearTimeout(t);
    }
    if (tom && tip) {
      const t = setTimeout(() => {
        onSlett();
      }, 500);
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
    <div
      className={`bg-surface border rounded-2xl p-3 ${
        erNorge ? "border-norge/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-muted mb-2">
        <div className="flex items-center gap-2">
          <span>
            {datoStr} · {klokke}
          </span>
          {kamp.bonusFaktor > 1 && (
            <span className="px-1.5 py-0.5 rounded-full bg-norge/15 text-norge font-bold text-[9px]">
              ×{kamp.bonusFaktor}
            </span>
          )}
        </div>
        {låst && kamp.resultat && (
          <span className="text-text font-semibold">
            {kamp.resultat.hjemme}–{kamp.resultat.borte}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="text-right font-medium text-sm truncate">
          {kamp.hjemmelag}
        </div>
        <div className="flex items-center gap-1.5">
          <ScoreIn verdi={hjem} onChange={setHjem} låst={låst} />
          <span className="text-muted text-xs">–</span>
          <ScoreIn verdi={bort} onChange={setBort} låst={låst} />
        </div>
        <div className="text-left font-medium text-sm truncate">
          {kamp.bortelag}
        </div>
      </div>
      {låst && (
        <div className="mt-2 flex items-center justify-end">
          <span className="text-[10px] text-muted">Låst</span>
        </div>
      )}
    </div>
  );
}

function ScoreIn({
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
      className="w-11 h-10 text-center text-lg font-bold rounded-lg bg-elevated border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    />
  );
}
