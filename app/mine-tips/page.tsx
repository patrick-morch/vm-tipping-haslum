"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { fbDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Match, Prediction, beregnPoeng } from "@/lib/types";
import Skall from "@/components/Skall";
import Beskytt from "@/components/Beskytt";

export default function MineTipsSide() {
  return (
    <Beskytt>
      <Skall>
        <MineTips />
      </Skall>
    </Beskytt>
  );
}

function MineTips() {
  const { user } = useAuth();
  const [kamper, setKamper] = useState<Match[]>([]);
  const [tips, setTips] = useState<Record<string, Prediction>>({});

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(fbDb(), "kamper"), orderBy("starttid", "asc")),
      (snap) =>
        setKamper(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match)),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(fbDb(), "tips"), where("uid", "==", user.uid)),
      (snap) => {
        const m: Record<string, Prediction> = {};
        snap.docs.forEach((d) => {
          const p = d.data() as Prediction;
          m[p.matchId] = p;
        });
        setTips(m);
      },
    );
    return () => unsub();
  }, [user]);

  const mineKamper = kamper.filter((k) => tips[k.id]);
  const totalPoeng = mineKamper.reduce((sum, k) => {
    if (!k.resultat) return sum;
    return sum + beregnPoeng(tips[k.id], k.resultat, k.bonusFaktor || 1);
  }, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mine tips</h1>
        <p className="text-muted text-sm">Du har {totalPoeng} poeng totalt.</p>
      </div>

      {mineKamper.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm">
            Du har ikke tippet noen kamper ennå. Gå til Kamper for å begynne.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {mineKamper.map((kamp) => {
          const tip = tips[kamp.id];
          const poeng = kamp.resultat
            ? beregnPoeng(tip, kamp.resultat, kamp.bonusFaktor || 1)
            : null;
          return (
            <div
              key={kamp.id}
              className="bg-surface border border-border rounded-2xl p-4"
            >
              <div className="flex justify-between text-xs text-muted mb-2">
                <span>{kamp.runde}</span>
                <span>
                  {new Date(kamp.starttid).toLocaleDateString("nb-NO", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right font-medium">{kamp.hjemmelag}</div>
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center font-bold">
                    {tip.hjemme}
                  </span>
                  <span className="text-muted">–</span>
                  <span className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center font-bold">
                    {tip.borte}
                  </span>
                </div>
                <div className="text-left font-medium">{kamp.bortelag}</div>
              </div>
              {kamp.resultat && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    Fasit:{" "}
                    <span className="text-text">
                      {kamp.resultat.hjemme}–{kamp.resultat.borte}
                    </span>
                  </span>
                  <span
                    className={`font-semibold ${
                      poeng && poeng > 0 ? "text-primary" : "text-muted"
                    }`}
                  >
                    {poeng} poeng
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
