import { Match } from "./types";

export type Gruppe = {
  id: string; // "A", "B", ...
  lag: string[]; // 4 lag
};

export const GRUPPER: Gruppe[] = [
  { id: "A", lag: ["Mexico", "Sør-Korea", "Sør-Afrika", "Tsjekkia"] },
  { id: "B", lag: ["Canada", "Sveits", "Qatar", "Bosnia-Hercegovina"] },
  { id: "C", lag: ["Brasil", "Marokko", "Skottland", "Haiti"] },
  { id: "D", lag: ["USA", "Australia", "Paraguay", "Tyrkia"] },
  { id: "E", lag: ["Tyskland", "Ecuador", "Elfenbenskysten", "Curaçao"] },
  { id: "F", lag: ["Nederland", "Japan", "Tunisia", "Sverige"] },
  { id: "G", lag: ["Belgia", "Iran", "Egypt", "New Zealand"] },
  { id: "H", lag: ["Spania", "Uruguay", "Saudi-Arabia", "Kapp Verde"] },
  { id: "I", lag: ["Frankrike", "Senegal", "Norge", "Irak"] },
  { id: "J", lag: ["Argentina", "Østerrike", "Algerie", "Jordan"] },
  { id: "K", lag: ["Portugal", "Colombia", "Usbekistan", "DR Kongo"] },
  { id: "L", lag: ["England", "Kroatia", "Panama", "Ghana"] },
];

export const NORGE = "Norge";

export function erNorgeKamp(k: { hjemmelag: string; bortelag: string }) {
  return k.hjemmelag === NORGE || k.bortelag === NORGE;
}

// Norges 3 gruppekamper (datoer fra norske medier, alle med Norge-bonus ×2)
// Tidspunkter er i norsk tid og kan justeres når FIFA bekrefter eksakt
export const NORGE_KAMPER: Omit<Match, "id">[] = [
  {
    hjemmelag: "Norge",
    bortelag: "Irak",
    starttid: new Date("2026-06-17T00:00:00+02:00").getTime(),
    runde: "Gruppe I",
    bonusFaktor: 2,
    resultat: null,
  },
  {
    hjemmelag: "Norge",
    bortelag: "Senegal",
    starttid: new Date("2026-06-23T02:00:00+02:00").getTime(),
    runde: "Gruppe I",
    bonusFaktor: 2,
    resultat: null,
  },
  {
    hjemmelag: "Frankrike",
    bortelag: "Norge",
    starttid: new Date("2026-06-26T21:00:00+02:00").getTime(),
    runde: "Gruppe I",
    bonusFaktor: 2,
    resultat: null,
  },
];

// Eksempelkamper for de andre gruppene (datoer er omtrentlige innenfor 11.–27. juni)
export const ANDRE_DEMOKAMPER: Omit<Match, "id">[] = [
  {
    hjemmelag: "Mexico",
    bortelag: "Tsjekkia",
    starttid: new Date("2026-06-11T20:00:00+02:00").getTime(),
    runde: "Gruppe A",
    bonusFaktor: 1,
    resultat: null,
  },
  {
    hjemmelag: "Brasil",
    bortelag: "Marokko",
    starttid: new Date("2026-06-14T21:00:00+02:00").getTime(),
    runde: "Gruppe C",
    bonusFaktor: 1,
    resultat: null,
  },
  {
    hjemmelag: "USA",
    bortelag: "Paraguay",
    starttid: new Date("2026-06-12T21:00:00+02:00").getTime(),
    runde: "Gruppe D",
    bonusFaktor: 1,
    resultat: null,
  },
  {
    hjemmelag: "Spania",
    bortelag: "Uruguay",
    starttid: new Date("2026-06-15T21:00:00+02:00").getTime(),
    runde: "Gruppe H",
    bonusFaktor: 1,
    resultat: null,
  },
  {
    hjemmelag: "England",
    bortelag: "Kroatia",
    starttid: new Date("2026-06-16T20:00:00+02:00").getTime(),
    runde: "Gruppe L",
    bonusFaktor: 1,
    resultat: null,
  },
  {
    hjemmelag: "Argentina",
    bortelag: "Algerie",
    starttid: new Date("2026-06-13T21:00:00+02:00").getTime(),
    runde: "Gruppe J",
    bonusFaktor: 1,
    resultat: null,
  },
];

export const SLUTTSPILL_RUNDER = [
  { id: "32del", navn: "32-delsfinale", antall: 16 },
  { id: "16del", navn: "16-delsfinale", antall: 8 },
  { id: "kvart", navn: "Kvartfinale", antall: 4 },
  { id: "semi", navn: "Semifinale", antall: 2 },
  { id: "bronse", navn: "Bronsefinale", antall: 1 },
  { id: "finale", navn: "Finale", antall: 1 },
];

// Poeng for ulike tipstyper
export const POENG = {
  eksakt: 3,
  utfall: 1,
  gruppeVinner: 5,
  gruppeToer: 3,
  vmVinner: 25,
  vmFinalist: 10,
  toppscorer: 15,
  toppassist: 10,
  mestRødeKort: 5,
};
