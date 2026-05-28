"use client";

import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function SluttspillSide() {
  return (
    <Beskytt>
      <Skall>
        <Sluttspill />
      </Skall>
    </Beskytt>
  );
}

const RUNDER = [
  { id: "32del", navn: "32-dels", antall: 16 },
  { id: "16del", navn: "16-dels", antall: 8 },
  { id: "kvart", navn: "Kvart", antall: 4 },
  { id: "semi", navn: "Semi", antall: 2 },
  { id: "finale", navn: "Finale", antall: 1 },
];

function Sluttspill() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sluttspill</h1>
        <p className="text-muted text-sm">
          Strukturell bracket. Vi kobler på matchups og prediksjoner når
          gruppespillet er ferdig 27. juni.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {RUNDER.map((r) => (
            <div
              key={r.id}
              className="flex-shrink-0"
              style={{ width: r.antall === 1 ? 140 : 130 }}
            >
              <div className="text-xs font-semibold text-muted mb-2 text-center uppercase tracking-wide">
                {r.navn}
              </div>
              <div
                className="space-y-2"
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${r.antall}, 1fr)`,
                  gap: r.antall === 1 ? 0 : 12,
                }}
              >
                {Array.from({ length: r.antall }).map((_, i) => (
                  <BracketKamp key={i} runde={r.id} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <div className="text-sm text-muted">
          Drømmen om Norge i finalen. Velg vinneren på{" "}
          <a href="/spesial" className="text-primary font-semibold">
            Spesialtips
          </a>
          .
        </div>
      </div>
    </div>
  );
}

function BracketKamp({ runde, index }: { runde: string; index: number }) {
  return (
    <div className="bg-elevated border border-border rounded-xl p-2 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted truncate">Lag A</span>
        <span className="font-bold">–</span>
      </div>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between">
        <span className="text-muted truncate">Lag B</span>
        <span className="font-bold">–</span>
      </div>
    </div>
  );
}
