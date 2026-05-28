"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
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
  localCurrent,
  localFasit,
  localGruppeTips,
  localKamper,
  localPassord,
  localSpesialTips,
  localTips,
} from "./local-store";
import {
  Bruker,
  Fasit,
  GruppeTip,
  Match,
  Prediction,
  SpesialTip,
} from "./types";
import { alleGruppekamper } from "./vm-data";

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

export function useMineGruppeTips(
  uid: string | undefined,
): Record<string, GruppeTip> {
  const [tips, setTips] = useState<Record<string, GruppeTip>>({});
  useEffect(() => {
    if (!uid) {
      setTips({});
      return;
    }
    if (bruker()) {
      const q = query(
        collection(fbDb(), "gruppetips"),
        where("uid", "==", uid),
      );
      return onSnapshot(q, (snap) => {
        const m: Record<string, GruppeTip> = {};
        snap.docs.forEach((d) => {
          const t = d.data() as GruppeTip;
          m[t.gruppe] = t;
        });
        setTips(m);
      });
    }
    return localGruppeTips.subscribe((alle) => {
      const m: Record<string, GruppeTip> = {};
      Object.values(alle).forEach((t) => {
        if (t.uid === uid) m[t.gruppe] = t;
      });
      setTips(m);
    });
  }, [uid]);
  return tips;
}

export function useAlleGruppeTips(): GruppeTip[] {
  const [tips, setTips] = useState<GruppeTip[]>([]);
  useEffect(() => {
    if (bruker()) {
      return onSnapshot(collection(fbDb(), "gruppetips"), (s) =>
        setTips(s.docs.map((d) => d.data() as GruppeTip)),
      );
    }
    return localGruppeTips.subscribe((alle) => setTips(Object.values(alle)));
  }, []);
  return tips;
}

export async function lagreGruppeTip(t: GruppeTip) {
  const id = `${t.uid}_${t.gruppe}`;
  if (bruker()) {
    await setDoc(doc(fbDb(), "gruppetips", id), t);
    return;
  }
  const alle = localGruppeTips.get();
  localGruppeTips.set({ ...alle, [id]: t });
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

export async function slettTip(matchId: string, uid: string) {
  const id = `${uid}_${matchId}`;
  if (bruker()) {
    await deleteDoc(doc(fbDb(), "tips", id));
    return;
  }
  const alle = { ...localTips.get() };
  delete alle[id];
  localTips.set(alle);
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

/**
 * Skriver alle 72 VM-kamper med faste IDer (A1..L6) til Firestore eller
 * localStorage. Idempotent — kan kjøres flere ganger uten å lage duplikater,
 * men overskriver hvis admin har endret en kamp manuelt.
 */
export async function seedAlleKamper(): Promise<number> {
  const kamper = alleGruppekamper();
  if (bruker()) {
    await Promise.all(
      kamper.map((k) => {
        const { id, ...data } = k;
        return setDoc(doc(fbDb(), "kamper", id), data);
      }),
    );
  } else {
    localKamper.set(kamper);
  }
  return kamper.length;
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

/**
 * Sletter en bruker komplett — brukerdoc, alle kamptipps og spesialtips.
 * Krever admin-rettigheter i Firestore.
 */
export async function slettBruker(uid: string): Promise<void> {
  if (bruker()) {
    const db = fbDb();
    // Slett alle kamptipps
    const tipsSnap = await getDocs(
      query(collection(db, "tips"), where("uid", "==", uid)),
    );
    await Promise.all(tipsSnap.docs.map((d) => deleteDoc(d.ref)));
    // Slett spesialtip
    await deleteDoc(doc(db, "spesialtips", uid)).catch(() => undefined);
    // Slett brukerdoc
    await deleteDoc(doc(db, "brukere", uid));
    return;
  }
  // Demo-modus
  const brukere = { ...localBrukere.get() };
  delete brukere[uid];
  localBrukere.set(brukere);

  const passord = { ...localPassord.get() };
  delete passord[uid];
  localPassord.set(passord);

  const tipsAlle = { ...localTips.get() };
  for (const key of Object.keys(tipsAlle)) {
    if (tipsAlle[key].uid === uid) delete tipsAlle[key];
  }
  localTips.set(tipsAlle);

  const spesial = { ...localSpesialTips.get() };
  delete spesial[uid];
  localSpesialTips.set(spesial);

  if (localCurrent.get() === uid) localCurrent.set(null);
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
