"use client";

import { Bruker, Match, Prediction } from "./types";

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

const seedKamper = (): Match[] => {
  const idag = new Date();
  idag.setHours(20, 0, 0, 0);
  const dag = 24 * 60 * 60 * 1000;
  return [
    {
      id: "demo-1",
      hjemmelag: "Norge",
      bortelag: "Brasil",
      starttid: idag.getTime() + dag,
      runde: "Gruppespill",
      bonusFaktor: 1,
      resultat: null,
    },
    {
      id: "demo-2",
      hjemmelag: "Frankrike",
      bortelag: "Argentina",
      starttid: idag.getTime() + 2 * dag,
      runde: "Gruppespill",
      bonusFaktor: 1,
      resultat: null,
    },
    {
      id: "demo-3",
      hjemmelag: "Tyskland",
      bortelag: "Spania",
      starttid: idag.getTime() + 3 * dag,
      runde: "Gruppespill",
      bonusFaktor: 1,
      resultat: null,
    },
    {
      id: "demo-4",
      hjemmelag: "Sverige",
      bortelag: "Danmark",
      starttid: idag.getTime() - dag,
      runde: "Gruppespill",
      bonusFaktor: 1,
      resultat: { hjemme: 1, borte: 2 },
    },
  ];
};

export const localBrukere = new Store<Record<string, Bruker>>("vmt.brukere", {});
export const localKamper = new Store<Match[]>("vmt.kamper", []);
export const localTips = new Store<Record<string, Prediction>>("vmt.tips", {});
export const localCurrent = new Store<string | null>("vmt.current", null);
export const localPassord = new Store<Record<string, string>>(
  "vmt.passord",
  {},
);

export function seedDemo() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("vmt.kamper")) {
    localKamper.set(seedKamper());
  }
}
