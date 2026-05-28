"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useKamper, leggTilKamp, settResultat } from "@/lib/data";
import { Match } from "@/lib/types";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function AdminSide() {
  return (
    <Beskytt>
      <Skall>
        <Admin />
      </Skall>
    </Beskytt>
  );
}

function Admin() {
  const { bruker } = useAuth();
  const router = useRouter();
  const kamper = useKamper();

  useEffect(() => {
    if (bruker && bruker.rolle !== "admin") router.replace("/kamper");
  }, [bruker, router]);

  const [hjem, setHjem] = useState("");
  const [bort, setBort] = useState("");
  const [dato, setDato] = useState("");
  const [runde, setRunde] = useState("Gruppespill");
  const [bonus, setBonus] = useState(1);

  async function nyKamp(e: React.FormEvent) {
    e.preventDefault();
    if (!hjem || !bort || !dato) return;
    await leggTilKamp({
      hjemmelag: hjem,
      bortelag: bort,
      starttid: new Date(dato).getTime(),
      runde,
      bonusFaktor: bonus,
      resultat: null,
    });
    setHjem("");
    setBort("");
    setDato("");
  }

  if (!bruker || bruker.rolle !== "admin") {
    return <div className="text-muted text-sm">Sjekker tilgang…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <section className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Legg til kamp</h2>
        <form onSubmit={nyKamp} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Hjemmelag"
              value={hjem}
              onChange={(e) => setHjem(e.target.value)}
              className="h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
            />
            <input
              placeholder="Bortelag"
              value={bort}
              onChange={(e) => setBort(e.target.value)}
              className="h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
            />
          </div>
          <input
            type="datetime-local"
            value={dato}
            onChange={(e) => setDato(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={runde}
              onChange={(e) => setRunde(e.target.value)}
              className="h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
            >
              <option>Gruppespill</option>
              <option>Åttedelsfinale</option>
              <option>Kvartfinale</option>
              <option>Semifinale</option>
              <option>Bronsefinale</option>
              <option>Finale</option>
            </select>
            <select
              value={bonus}
              onChange={(e) => setBonus(Number(e.target.value))}
              className="h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none"
            >
              <option value={1}>Normal (×1)</option>
              <option value={2}>Bonus (×2)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-bg font-semibold hover:bg-primaryDark transition"
          >
            Legg til kamp
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Sett resultat</h2>
        {kamper.map((k) => (
          <ResultatRad key={k.id} kamp={k} onLagre={settResultat} />
        ))}
      </section>
    </div>
  );
}

function ResultatRad({
  kamp,
  onLagre,
}: {
  kamp: Match;
  onLagre: (id: string, h: number, b: number) => Promise<void>;
}) {
  const [h, setH] = useState(kamp.resultat ? String(kamp.resultat.hjemme) : "");
  const [b, setB] = useState(kamp.resultat ? String(kamp.resultat.borte) : "");
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {kamp.hjemmelag} – {kamp.bortelag}
        </div>
        <div className="text-xs text-muted">
          {kamp.runde} ·{" "}
          {new Date(kamp.starttid).toLocaleDateString("nb-NO", {
            day: "2-digit",
            month: "short",
          })}
        </div>
      </div>
      <input
        type="number"
        min={0}
        value={h}
        onChange={(e) => setH(e.target.value)}
        className="w-12 h-10 text-center rounded-lg bg-elevated border border-border"
      />
      <span className="text-muted">–</span>
      <input
        type="number"
        min={0}
        value={b}
        onChange={(e) => setB(e.target.value)}
        className="w-12 h-10 text-center rounded-lg bg-elevated border border-border"
      />
      <button
        onClick={() => onLagre(kamp.id, Number(h), Number(b))}
        disabled={h === "" || b === ""}
        className="h-10 px-3 rounded-xl bg-primary text-bg text-sm font-semibold disabled:opacity-50"
      >
        Lagre
      </button>
    </div>
  );
}
