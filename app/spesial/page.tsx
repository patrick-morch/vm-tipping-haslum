"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { lagreSpesialTip, useMittSpesialTip } from "@/lib/data";
import { GRUPPER, POENG } from "@/lib/vm-data";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

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
  const [vmFinalist, setVmFinalist] = useState("");
  const [toppscorer, setToppscorer] = useState("");
  const [toppassist, setToppassist] = useState("");
  const [mestRødeKort, setMestRødeKort] = useState("");
  const [status, setStatus] = useState<"idle" | "lagrer" | "lagret">("idle");
  const klar = useRef(false);

  useEffect(() => {
    if (!lagret) {
      klar.current = true;
      return;
    }
    setVmVinner(lagret.vmVinner);
    setVmFinalist(lagret.vmFinalist);
    setToppscorer(lagret.toppscorer);
    setToppassist(lagret.toppassist);
    setMestRødeKort(lagret.mestRødeKort);
    klar.current = true;
  }, [lagret]);

  useEffect(() => {
    if (!user || !klar.current) return;
    // Hopp over hvis ingenting er endret
    if (
      lagret &&
      lagret.vmVinner === vmVinner &&
      lagret.vmFinalist === vmFinalist &&
      lagret.toppscorer === toppscorer &&
      lagret.toppassist === toppassist &&
      lagret.mestRødeKort === mestRødeKort
    )
      return;
    if (
      !lagret &&
      !vmVinner &&
      !vmFinalist &&
      !toppscorer &&
      !toppassist &&
      !mestRødeKort
    )
      return;
    const t = setTimeout(async () => {
      setStatus("lagrer");
      await lagreSpesialTip({
        uid: user.uid,
        vmVinner,
        vmFinalist,
        toppscorer,
        toppassist,
        mestRødeKort,
        lagretTid: Date.now(),
      });
      setStatus("lagret");
      setTimeout(() => setStatus("idle"), 1500);
    }, 600);
    return () => clearTimeout(t);
  }, [
    vmVinner,
    vmFinalist,
    toppscorer,
    toppassist,
    mestRødeKort,
    user,
    lagret,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Spesialtips</h1>
          <p className="text-muted text-sm">
            Lagres automatisk. Kan endres frem til VM starter.
          </p>
        </div>
        <div className="h-5">
          {status === "lagrer" && (
            <span className="text-xs text-muted">Lagrer…</span>
          )}
          {status === "lagret" && (
            <span className="text-xs text-success font-semibold">✓ Lagret</span>
          )}
        </div>
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
        tittel="Hvem taper finalen?"
        ikon="🥈"
        poeng={POENG.vmFinalist}
        farge="accent"
      >
        <LagVelger
          verdi={vmFinalist}
          onVelg={setVmFinalist}
          skjul={vmVinner ? [vmVinner] : []}
        />
      </Boks>

      <Boks
        tittel="Toppscorer (Gullstøvelen)"
        ikon="⚽"
        poeng={POENG.toppscorer}
        farge="primary"
      >
        <TekstFelt
          verdi={toppscorer}
          onChange={setToppscorer}
          placeholder="F.eks. Erling Haaland"
        />
      </Boks>

      <Boks
        tittel="Toppassist"
        ikon="🎯"
        poeng={POENG.toppassist}
        farge="primary"
      >
        <TekstFelt
          verdi={toppassist}
          onChange={setToppassist}
          placeholder="F.eks. Martin Ødegaard"
        />
      </Boks>

      <Boks
        tittel="Flest røde kort"
        ikon="🟥"
        poeng={POENG.mestRødeKort}
        farge="danger"
      >
        <TekstFelt
          verdi={mestRødeKort}
          onChange={setMestRødeKort}
          placeholder="Spillernavn"
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
  skjul = [],
}: {
  verdi: string;
  onVelg: (l: string) => void;
  skjul?: string[];
}) {
  return (
    <select
      value={verdi}
      onChange={(e) => onVelg(e.target.value)}
      className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
    >
      <option value="">Velg lag…</option>
      {ALLE_LAG.filter((l) => !skjul.includes(l)).map((l) => (
        <option key={l} value={l}>
          {l}
        </option>
      ))}
    </select>
  );
}

function TekstFelt({
  verdi,
  onChange,
  placeholder,
}: {
  verdi: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={verdi}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
    />
  );
}
