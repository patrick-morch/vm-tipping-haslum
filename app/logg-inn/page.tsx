"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Modus = "logg-inn" | "registrer" | "glemt";

export default function LoggInn() {
  const { loggInn, registrer, glemtPassord, demoModus } = useAuth();
  const router = useRouter();
  const [modus, setModus] = useState<Modus>("logg-inn");
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [navn, setNavn] = useState("");
  const [avdeling, setAvdeling] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [laster, setLaster] = useState(false);

  async function sendInn(e: React.FormEvent) {
    e.preventDefault();
    setFeil(null);
    setMelding(null);
    setLaster(true);
    try {
      if (modus === "logg-inn") {
        await loggInn(epost.trim(), passord);
        router.push("/kamper");
      } else if (modus === "registrer") {
        if (passord.length < 8) {
          throw new Error("Passord må være minst 8 tegn.");
        }
        if (navn.trim().length < 2) {
          throw new Error("Skriv inn fullt navn.");
        }
        await registrer(epost.trim(), passord, navn.trim(), avdeling.trim());
        router.push("/kamper");
      } else {
        await glemtPassord(epost.trim());
        setMelding("E-post for tilbakestilling er sendt.");
      }
    } catch (err: any) {
      const kode = err?.code || "";
      if (kode.includes("invalid-credential") || kode.includes("wrong-password"))
        setFeil("Feil e-post eller passord.");
      else if (kode.includes("email-already-in-use"))
        setFeil("E-posten er allerede registrert.");
      else if (kode.includes("invalid-email"))
        setFeil("Ugyldig e-postadresse.");
      else setFeil(err?.message || "Noe gikk galt. Prøv igjen.");
    } finally {
      setLaster(false);
    }
  }

  const tittel =
    modus === "logg-inn"
      ? "Logg inn"
      : modus === "registrer"
        ? "Opprett bruker"
        : "Glemt passord";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-bg font-bold">
            VM
          </div>
          <span className="text-xl font-semibold">VM-tipping</span>
        </div>

        {demoModus && (
          <div className="mb-4 text-xs text-warning bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 text-center">
            Demo-modus — data lagres bare i nettleseren din
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h1 className="text-2xl font-semibold mb-1">{tittel}</h1>
          <p className="text-muted text-sm mb-6">
            {modus === "logg-inn" && "Velkommen tilbake."}
            {modus === "registrer" && "Bli med i klubbens VM-tipping."}
            {modus === "glemt" && "Vi sender deg en lenke på e-post."}
          </p>

          <form onSubmit={sendInn} className="space-y-3">
            {modus === "registrer" && (
              <>
                <Felt
                  etikett="Fullt navn"
                  type="text"
                  verdi={navn}
                  onChange={setNavn}
                  autoComplete="name"
                  required
                />
                <Felt
                  etikett="Avdeling i klubben (valgfritt)"
                  type="text"
                  verdi={avdeling}
                  onChange={setAvdeling}
                  autoComplete="organization"
                />
              </>
            )}
            <Felt
              etikett="E-post"
              type="email"
              verdi={epost}
              onChange={setEpost}
              autoComplete="email"
              required
            />
            {modus !== "glemt" && (
              <Felt
                etikett="Passord"
                type="password"
                verdi={passord}
                onChange={setPassord}
                autoComplete={
                  modus === "registrer" ? "new-password" : "current-password"
                }
                required
              />
            )}

            {feil && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
                {feil}
              </div>
            )}
            {melding && (
              <div className="text-sm text-primary bg-primary/10 border border-primary/30 rounded-xl px-3 py-2">
                {melding}
              </div>
            )}

            <button
              type="submit"
              disabled={laster}
              className="w-full h-11 rounded-xl bg-primary text-bg font-semibold hover:bg-primaryDark transition disabled:opacity-50 active:scale-[0.98]"
            >
              {laster
                ? "Vent…"
                : modus === "logg-inn"
                  ? "Logg inn"
                  : modus === "registrer"
                    ? "Opprett bruker"
                    : "Send lenke"}
            </button>
          </form>

          <div className="mt-5 text-sm text-muted text-center space-y-2">
            {modus === "logg-inn" && (
              <>
                <button
                  onClick={() => setModus("glemt")}
                  className="hover:text-text"
                >
                  Glemt passord?
                </button>
                <div>
                  Ingen bruker?{" "}
                  <button
                    onClick={() => setModus("registrer")}
                    className="text-primary hover:underline"
                  >
                    Opprett en
                  </button>
                </div>
              </>
            )}
            {modus === "registrer" && (
              <button
                onClick={() => setModus("logg-inn")}
                className="hover:text-text"
              >
                Har du allerede bruker? Logg inn
              </button>
            )}
            {modus === "glemt" && (
              <button
                onClick={() => setModus("logg-inn")}
                className="hover:text-text"
              >
                Tilbake til innlogging
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type FeltProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  etikett: string;
  verdi: string;
  onChange: (v: string) => void;
};

function Felt({ etikett, verdi, onChange, ...rest }: FeltProps) {
  return (
    <label className="block">
      <span className="text-xs text-muted mb-1 block">{etikett}</span>
      <input
        {...rest}
        value={verdi}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-xl bg-elevated border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
      />
    </label>
  );
}
