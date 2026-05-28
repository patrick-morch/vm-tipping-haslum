"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { lagreSpesialTip, useMittSpesialTip } from "@/lib/data";
import { GRUPPER, POENG } from "@/lib/vm-data";
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
  const klar = useRef(false);

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
    if (!user || !klar.current) return;
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
  }, [vmVinner, toppscorer, toppassist, user, lagret]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Spesialtips</h1>
        <p className="text-muted text-sm">
          Kan endres frem til VM starter.
        </p>
      </div>

      <Boks
        tittel="Hvem vinner VM?"
        ikon="🏆"
        poeng={POENG.vmVinner}
        farge="gold"
      >
        <LagVelger verdi={vmVinner} onVelg={setVmVinner} />
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
}: {
  verdi: string;
  onVelg: (l: string) => void;
}) {
  return (
    <select
      value={verdi}
      onChange={(e) => onVelg(e.target.value)}
      className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
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

