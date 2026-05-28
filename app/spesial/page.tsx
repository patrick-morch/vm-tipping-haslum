"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { lagreSpesialTip, useMittSpesialTip } from "@/lib/data";
import {
  GRUPPER,
  POENG,
  SPESIAL_LÅS_TID,
  spesialErLåst,
} from "@/lib/vm-data";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";
import SpillerVelger from "@/components/SpillerVelger";

export default function SpesialSide() {
  return (
    <Beskytt>
      <Skall>
        <Spesial />
      </Skall>
    </Beskytt>
  );
}

const ALLE_LAG = GRUPPER.flatMap((g) => g.lag).sort();

function Spesial() {
  const { user } = useAuth();
  const lagret = useMittSpesialTip(user?.uid);
  const [vmVinner, setVmVinner] = useState("");
  const [toppscorer, setToppscorer] = useState("");
  const [toppassist, setToppassist] = useState("");
  const [låst, setLåst] = useState(() => spesialErLåst());
  const klar = useRef(false);

  useEffect(() => {
    const sjekk = () => setLåst(spesialErLåst());
    sjekk();
    const t = setInterval(sjekk, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!lagret) {
      klar.current = true;
      return;
    }
    setVmVinner(lagret.vmVinner);
    setToppscorer(lagret.toppscorer);
    setToppassist(lagret.toppassist);
    klar.current = true;
  }, [lagret]);

  useEffect(() => {
    if (!user || !klar.current || låst) return;
    if (
      lagret &&
      lagret.vmVinner === vmVinner &&
      lagret.toppscorer === toppscorer &&
      lagret.toppassist === toppassist
    )
      return;
    if (!lagret && !vmVinner && !toppscorer && !toppassist) return;
    const t = setTimeout(() => {
      lagreSpesialTip({
        uid: user.uid,
        vmVinner,
        vmFinalist: lagret?.vmFinalist || "",
        toppscorer,
        toppassist,
        mestRødeKort: lagret?.mestRødeKort || "",
        lagretTid: Date.now(),
      });
    }, 600);
    return () => clearTimeout(t);
  }, [vmVinner, toppscorer, toppassist, user, lagret, låst]);

  const låsTekst = new Date(SPESIAL_LÅS_TID).toLocaleString("nb-NO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Spesialtips</h1>
        <p className="text-muted text-sm">
          {låst
            ? "Spesialtipsene er låst — VM har begynt."
            : `Kan endres frem til ${låsTekst}.`}
        </p>
      </div>

      {låst && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-2xl px-3 py-2.5 flex items-center gap-2">
          🔒 Tipsene dine er låst og kan ikke endres.
        </div>
      )}

      <fieldset
        disabled={låst}
        className={låst ? "space-y-4 opacity-70" : "space-y-4"}
      >
        <Boks
          tittel="Hvem vinner VM?"
          ikon="🏆"
          poeng={POENG.vmVinner}
          farge="gold"
        >
          <LagVelger verdi={vmVinner} onVelg={setVmVinner} disabled={låst} />
        </Boks>

        <Boks
          tittel="Toppscorer (Gullstøvelen)"
          ikon="⚽"
          poeng={POENG.toppscorer}
          farge="primary"
        >
          <SpillerVelger
            verdi={toppscorer}
            onVelg={setToppscorer}
            placeholder="Søk spiller, f.eks. Haaland…"
            posFilter={["FW", "MF"]}
          />
        </Boks>

        <Boks
          tittel="Toppassist"
          ikon="🎯"
          poeng={POENG.toppassist}
          farge="primary"
        >
          <SpillerVelger
            verdi={toppassist}
            onVelg={setToppassist}
            placeholder="Søk spiller, f.eks. Ødegaard…"
            posFilter={["FW", "MF", "DF"]}
          />
        </Boks>
      </fieldset>
    </div>
  );
}

function Boks({
  tittel,
  ikon,
  poeng,
  farge,
  children,
}: {
  tittel: string;
  ikon: string;
  poeng: number;
  farge: "primary" | "accent" | "gold" | "danger";
  children: React.ReactNode;
}) {
  const farger = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    gold: "bg-gold/15 text-gold",
    danger: "bg-danger/10 text-danger",
  } as const;
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{ikon}</span>
          <span className="font-semibold">{tittel}</span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${farger[farge]}`}
        >
          {poeng}p
        </span>
      </div>
      {children}
    </div>
  );
}

function LagVelger({
  verdi,
  onVelg,
  disabled,
}: {
  verdi: string;
  onVelg: (l: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={verdi}
      onChange={(e) => onVelg(e.target.value)}
      disabled={disabled}
      className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none disabled:cursor-not-allowed"
    >
      <option value="">Velg lag…</option>
      {ALLE_LAG.map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}

