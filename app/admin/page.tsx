"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  useKamper,
  useBrukere,
  leggTilKamp,
  settResultat,
  seedAlleKamper,
  slettBruker,
} from "@/lib/data";
import { Bruker, Match } from "@/lib/types";
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
  const brukere = useBrukere();

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

      <SeedSeksjon kamper={kamper} />

      <MedlemmerSeksjon brukere={brukere} egenUid={bruker.uid} />

      <section className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Legg til kamp manuelt</h2>
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

function MedlemmerSeksjon({
  brukere,
  egenUid,
}: {
  brukere: Bruker[];
  egenUid: string;
}) {
  const [skalSlette, setSkalSlette] = useState<Bruker | null>(null);
  const sortert = [...brukere].sort((a, b) =>
    a.navn.localeCompare(b.navn, "nb"),
  );

  return (
    <section className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Medlemmer ({brukere.length})</h2>
        <p className="text-xs text-muted">
          Sletting fjerner brukeren, alle tipps og spesialtips. Brukeren
          forsvinner fra ledertavlen. Handlingen kan ikke angres.
        </p>
      </div>
      <div className="space-y-1.5">
        {sortert.map((b) => {
          const erDeg = b.uid === egenUid;
          return (
            <div
              key={b.uid}
              className="flex items-center justify-between gap-3 bg-elevated border border-border rounded-xl px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-2">
                  {b.navn}
                  {b.rolle === "admin" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {b.epost}
                  {b.avdeling ? ` · ${b.avdeling}` : ""}
                </div>
              </div>
              <button
                onClick={() => setSkalSlette(b)}
                disabled={erDeg}
                className="h-8 px-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-semibold hover:bg-danger/15 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                title={erDeg ? "Du kan ikke slette deg selv" : "Slett medlem"}
              >
                Slett
              </button>
            </div>
          );
        })}
      </div>

      {skalSlette && (
        <SlettModal
          bruker={skalSlette}
          onAvbryt={() => setSkalSlette(null)}
          onSlett={async () => {
            await slettBruker(skalSlette.uid);
            setSkalSlette(null);
          }}
        />
      )}
    </section>
  );
}

function SlettModal({
  bruker,
  onAvbryt,
  onSlett,
}: {
  bruker: Bruker;
  onAvbryt: () => void;
  onSlett: () => Promise<void>;
}) {
  const [bekreftTekst, setBekreftTekst] = useState("");
  const [sletter, setSletter] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const kanSlette = bekreftTekst.trim() === bruker.navn.trim();

  async function utfør() {
    if (!kanSlette) return;
    setSletter(true);
    setFeil(null);
    try {
      await onSlett();
    } catch (e: any) {
      setFeil(e?.message || "Sletting feilet. Prøv igjen.");
      setSletter(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
      onClick={onAvbryt}
    >
      <div
        className="bg-surface border border-border rounded-2xl p-5 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold">Slett {bruker.navn}?</h3>
          <p className="text-sm text-muted mt-1">
            Dette sletter brukeren og alle deres tipps permanent. Handlingen
            kan ikke angres.
          </p>
        </div>

        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm space-y-2">
          <div className="text-danger font-semibold">Dette slettes:</div>
          <ul className="text-xs text-muted space-y-0.5 ml-4 list-disc">
            <li>Brukerprofil ({bruker.epost})</li>
            <li>Alle kamp-tipps</li>
            <li>Spesialtips</li>
            <li>Plassering på ledertavlen</li>
          </ul>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">
            Skriv <span className="text-text font-semibold">{bruker.navn}</span>{" "}
            for å bekrefte:
          </label>
          <input
            type="text"
            value={bekreftTekst}
            onChange={(e) => setBekreftTekst(e.target.value)}
            autoFocus
            placeholder={bruker.navn}
            className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
          />
        </div>

        {feil && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
            {feil}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onAvbryt}
            disabled={sletter}
            className="flex-1 h-11 rounded-xl border border-border bg-elevated text-sm font-semibold hover:border-primary transition disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={utfør}
            disabled={!kanSlette || sletter}
            className="flex-1 h-11 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sletter ? "Sletter…" : "Slett permanent"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SeedSeksjon({ kamper }: { kamper: Match[] }) {
  const [laster, setLaster] = useState(false);
  const [klart, setKlart] = useState(false);
  const tilstede = kamper.length;
  const trenger = 72;
  const ferdig = tilstede >= trenger;

  async function seed() {
    if (!confirm("Skriv alle 72 VM-kamper til databasen?")) return;
    setLaster(true);
    try {
      await seedAlleKamper();
      setKlart(true);
      setTimeout(() => setKlart(false), 2000);
    } finally {
      setLaster(false);
    }
  }

  return (
    <section
      className={`border rounded-2xl p-4 ${
        ferdig
          ? "bg-success/5 border-success/30"
          : "bg-warning/5 border-warning/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold flex items-center gap-2">
            {ferdig ? "✓" : "⚠"} VM-kamper i databasen
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {tilstede}/{trenger} kamper. {ferdig
              ? "Alt er på plass. Du kan kjøre seed igjen for å overskrive."
              : "Trykk på knappen for å legge til alle 72 gruppekamper."}
          </p>
        </div>
        <button
          onClick={seed}
          disabled={laster}
          className="h-10 px-4 rounded-xl bg-primary text-primaryFg text-sm font-semibold hover:bg-primaryDark disabled:opacity-50 whitespace-nowrap"
        >
          {laster ? "Skriver…" : klart ? "✓ Ferdig" : "Seed VM-kamper"}
        </button>
      </div>
    </section>
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
