"use client";

import {
  Bruker,
  Fasit,
  GruppeTip,
  Match,
  Prediction,
  SpesialTip,
} from "./types";
import { NORGE_KAMPER, ANDRE_DEMOKAMPER } from "./vm-data";

type Listener<T> = (val: T) => void;

class Store<T> {
  private listeners = new Set<Listener<T>>();

  constructor(
    private key: string,
    private fallback: T,
  ) {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === this.key) this.notify();
      });
    }
  }

  get(): T {
    if (typeof window === "undefined") return this.fallback;
    const raw = localStorage.getItem(this.key);
    if (!raw) return this.fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return this.fallback;
    }
  }

  set(val: T) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.key, JSON.stringify(val));
    this.notify();
  }

  private notify() {
    const val = this.get();
    this.listeners.forEach((l) => l(val));
  }

  subscribe(l: Listener<T>): () => void {
    this.listeners.add(l);
    if (typeof window !== "undefined") l(this.get());
    return () => {
      this.listeners.delete(l);
    };
  }
}

const SEED_VERSJON = 2;

export const localBrukere = new Store<Record<string, Bruker>>("vmt.brukere", {});
export const localKamper = new Store<Match[]>("vmt.kamper", []);
export const localTips = new Store<Record<string, Prediction>>("vmt.tips", {});
export const localGruppeTips = new Store<Record<string, GruppeTip>>(
  "vmt.gruppetips",
  {},
);
export const localSpesialTips = new Store<Record<string, SpesialTip>>(
  "vmt.spesialtips",
  {},
);
export const localFasit = new Store<Fasit>("vmt.fasit", {
  gruppeVinner: {},
  gruppeToer: {},
  vmVinner: "",
  vmFinalist: "",
  toppscorer: "",
  toppassist: "",
  mestRødeKort: "",
});
export const localCurrent = new Store<string | null>("vmt.current", null);
export const localPassord = new Store<Record<string, string>>(
  "vmt.passord",
  {},
);

export function seedDemo() {
  if (typeof window === "undefined") return;
  const versjon = Number(localStorage.getItem("vmt.seed") || "0");
  if (versjon >= SEED_VERSJON) return;
  const alle = [...NORGE_KAMPER, ...ANDRE_DEMOKAMPER].map((k, i) => ({
    ...k,
    id: `vm-${i + 1}`,
  }));
  localKamper.set(alle);
  localStorage.setItem("vmt.seed", String(SEED_VERSJON));
}
