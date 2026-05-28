"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { fbAuth, fbDb, isFirebaseConfigured } from "./firebase";
import { Bruker } from "./types";

type AuthCtx = {
  user: User | null;
  bruker: Bruker | null;
  laster: boolean;
  konfigurert: boolean;
  loggInn: (epost: string, passord: string) => Promise<void>;
  registrer: (
    epost: string,
    passord: string,
    navn: string,
    avdeling?: string,
  ) => Promise<void>;
  loggUt: () => Promise<void>;
  glemtPassord: (epost: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const konfigurert = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [bruker, setBruker] = useState<Bruker | null>(null);
  const [laster, setLaster] = useState(true);

  useEffect(() => {
    if (!konfigurert) {
      setLaster(false);
      return;
    }
    const unsub = onAuthStateChanged(fbAuth(), async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(fbDb(), "brukere", u.uid));
        if (snap.exists()) setBruker(snap.data() as Bruker);
      } else {
        setBruker(null);
      }
      setLaster(false);
    });
    return () => unsub();
  }, [konfigurert]);

  async function loggInn(epost: string, passord: string) {
    await signInWithEmailAndPassword(fbAuth(), epost, passord);
  }

  async function registrer(
    epost: string,
    passord: string,
    navn: string,
    avdeling?: string,
  ) {
    const cred = await createUserWithEmailAndPassword(fbAuth(), epost, passord);
    await updateProfile(cred.user, { displayName: navn });
    const nyBruker: Bruker = {
      uid: cred.user.uid,
      epost,
      navn,
      avdeling: avdeling || "",
      rolle: "medlem",
      poeng: 0,
      opprettet: Date.now(),
    };
    await setDoc(doc(fbDb(), "brukere", cred.user.uid), nyBruker);
    setBruker(nyBruker);
  }

  async function loggUt() {
    if (!konfigurert) return;
    await signOut(fbAuth());
  }

  async function glemtPassord(epost: string) {
    await sendPasswordResetEmail(fbAuth(), epost);
  }

  return (
    <Ctx.Provider
      value={{
        user,
        bruker,
        laster,
        konfigurert,
        loggInn,
        registrer,
        loggUt,
        glemtPassord,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth må brukes inni AuthProvider");
  return ctx;
}
