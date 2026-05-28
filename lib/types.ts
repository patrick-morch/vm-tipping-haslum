export type Match = {
  id: string;
  hjemmelag: string;
  bortelag: string;
  starttid: number; // unix ms
  runde: string; // "Gruppespill R1", "Åttedelsfinale", "Finale" osv.
  bonusFaktor: number; // 1 for gruppespill, 2 for semi/finale
  resultat?: { hjemme: number; borte: number } | null;
};

export type Prediction = {
  matchId: string;
  uid: string;
  navn: string;
  hjemme: number;
  borte: number;
  lagretTid: number;
};

export type Bruker = {
  uid: string;
  epost: string;
  navn: string;
  avdeling?: string;
  rolle: "medlem" | "admin";
  poeng: number;
  opprettet: number;
};

export function beregnPoeng(
  tip: { hjemme: number; borte: number },
  resultat: { hjemme: number; borte: number },
  bonus: number = 1,
): number {
  const eksakt = tip.hjemme === resultat.hjemme && tip.borte === resultat.borte;
  if (eksakt) return 3 * bonus;
  const utfallTip = Math.sign(tip.hjemme - tip.borte);
  const utfallRes = Math.sign(resultat.hjemme - resultat.borte);
  if (utfallTip === utfallRes) return 1 * bonus;
  return 0;
}
