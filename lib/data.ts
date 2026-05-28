"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { fbDb, isFirebaseConfigured } from "./firebase";
import {
  localBrukere,
  localFasit,
  localKamper,
  localSpesialTips,
  localTips,
} from "./local-store";
import {
  Bruker,
  Fasit,
  Match,
  Prediction,
  SpesialTip,
} from "./types";

function bruker() {
  return isFirebaseConfigured();
}

export function useKamper(): Match[] {
  const [kamper, setKamper] = useState<Match[]>([]);
  useEffect(() => {
    if (bruker()) {
      const q = query(collection(fbDb(), "kamper"), orderBy("starttid", "asc"));
      return onSnapshot(q, (snap) => {
        setKamper(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match));
      });
    }
    return localKamper.subscribe((k) =>
      setKamper([...k].sort((a, b) => a.starttid - b.starttid)),
    );
  }, []);
  return kamper;
}

export function useMineTips(uid: string | undefined): Record<string, Prediction> {
  const [tips, setTips] = useState<Record<string, Prediction>>({});
  useEffect(() => {
    if (!uid) {
      setTips({});
      return;
    }
    if (bruker()) {
      const q = query(collection(fbDb(), "tips"), where("uid", "==", uid));
      return onSnapshot(q, (snap) => {
        const m: Record<string, Prediction> = {};
        snap.docs.forEach((d) => {
          const p = d.data() as Prediction;
          m[p.matchId] = p;
        });
        setTips(m);
      });
    }
    return localTips.subscribe((alle) => {
      const m: Record<string, Prediction> = {};
      Object.values(alle).forEach((p) => {
        if (p.uid === uid) m[p.matchId] = p;
      });
      setTips(m);
    });
  }, [uid]);
  return tips;
}

export function useAlleTips(): Prediction[] {
  const [tips, setTips] = useState<Prediction[]>([]);
  useEffect(() => {
    if (bruker()) {
      return onSnapshot(collection(fbDb(), "tips"), (s) =>
        setTips(s.docs.map((d) => d.data() as Prediction)),
      );
    }
    return localTips.subscribe((alle) => setTips(Object.values(alle)));
  }, []);
  return tips;
}

export function useBrukere(): Bruker[] {
  const [brukere, setBrukere] = useState<Bruker[]>([]);
  useEffect(() => {
    if (bruker()) {
      return onSnapshot(collection(fbDb(), "brukere"), (s) =>
        setBrukere(s.docs.map((d) => d.data() as Bruker)),
      );
    }
    return localBrukere.subscribe((b) => setBrukere(Object.values(b)));
  }, []);
  return brukere;
}

export function useMittSpesialTip(uid: string | undefined): SpesialTip | null {
  const [tip, setTip] = useState<SpesialTip | null>(null);
  useEffect(() => {
    if (!uid) {
      setTip(null);
      return;
    }
    if (bruker()) {
      return onSnapshot(doc(fbDb(), "spesialtips", uid), (s) =>
        setTip(s.exists() ? (s.data() as SpesialTip) : null),
      );
    }
    return localSpesialTips.subscribe((alle) => setTip(alle[uid] || null));
  }, [uid]);
  return tip;
}

export function useAlleSpesialTips(): SpesialTip[] {
  const [tips, setTips] = useState<SpesialTip[]>([]);
  useEffect(() => {
    if (bruker()) {
      return onSnapshot(collection(fbDb(), "spesialtips"), (s) =>
        setTips(s.docs.map((d) => d.data() as SpesialTip)),
      );
    }
    return localSpesialTips.subscribe((alle) => setTips(Object.values(alle)));
  }, []);
  return tips;
}

export function useFasit(): Fasit {
  const [fasit, setFasit] = useState<Fasit>({
    gruppeVinner: {},
    gruppeToer: {},
    vmVinner: "",
    vmFinalist: "",
    toppscorer: "",
    toppassist: "",
    mestRødeKort: "",
  });
  useEffect(() => {
    if (bruker()) {
      return onSnapshot(doc(fbDb(), "fasit", "vm"), (s) => {
        if (s.exists()) setFasit(s.data() as Fasit);
      });
    }
    return localFasit.subscribe(setFasit);
  }, []);
  return fasit;
}

export async function lagreTip(p: Prediction) {
  if (bruker()) {
    const id = `${p.uid}_${p.matchId}`;
    await setDoc(doc(fbDb(), "tips", id), p);
    return;
  }
  const id = `${p.uid}_${p.matchId}`;
  const alle = localTips.get();
  localTips.set({ ...alle, [id]: p });
}

export async function lagreSpesialTip(t: SpesialTip) {
  if (bruker()) {
    await setDoc(doc(fbDb(), "spesialtips", t.uid), t);
    return;
  }
  const alle = localSpesialTips.get();
  localSpesialTips.set({ ...alle, [t.uid]: t });
}

export async function lagreFasit(f: Fasit) {
  if (bruker()) {
    await setDoc(doc(fbDb(), "fasit", "vm"), f);
    return;
  }
  localFasit.set(f);
}

export async function leggTilKamp(k: Omit<Match, "id">) {
  if (bruker()) {
    await addDoc(collection(fbDb(), "kamper"), k);
    return;
  }
  const liste = localKamper.get();
  const id = `lokal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  localKamper.set([...liste, { ...k, id }]);
}

export async function settResultat(
  matchId: string,
  hjemme: number,
  borte: number,
) {
  if (bruker()) {
    await updateDoc(doc(fbDb(), "kamper", matchId), {
      resultat: { hjemme, borte },
    });
    return;
  }
  const liste = localKamper.get();
  localKamper.set(
    liste.map((k) =>
      k.id === matchId ? { ...k, resultat: { hjemme, borte } } : k,
    ),
  );
}
