// Henter siste VM-resultater fra TheSportsDB og oppdaterer Firestore.
// Trenger miljøvariabel FIREBASE_SERVICE_ACCOUNT (base64-encodet JSON).
//
// Kjøring lokalt:
//   FIREBASE_SERVICE_ACCOUNT=$(base64 < sa.json) node scripts/sync-resultater.mjs
//
// I GitHub Actions er FIREBASE_SERVICE_ACCOUNT en repository secret.

import admin from "firebase-admin";
import { tilNorsk } from "./lib/lag-mapping.mjs";
import { GRUPPER, gruppeForLag } from "./lib/grupper.mjs";
import {
  genererSluttspill32del,
  gruppeStanding,
} from "./lib/knockout.mjs";

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const LIGA_ID = "4429"; // FIFA World Cup

function init() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT mangler i miljøet.");
  }
  // Aksepterer både rå JSON og base64-JSON
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    json = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  }
  admin.initializeApp({
    credential: admin.credential.cert(json),
  });
}

async function hentEvents() {
  const url = `${SPORTSDB_BASE}/eventsseason.php?id=${LIGA_ID}&s=2026`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TheSportsDB svarte ${r.status}`);
  const data = await r.json();
  return data.events || [];
}

/**
 * Mapper et TheSportsDB-event til våre lagnavn + utledning av kamp-id.
 * Returnerer null hvis vi ikke kan matche.
 */
function tilNorske(event) {
  const h = tilNorsk(event.strHomeTeam);
  const b = tilNorsk(event.strAwayTeam);
  if (!h || !b) return null;
  const tid = new Date(event.strTimestamp + "Z").getTime();
  return {
    hjemmelag: h,
    bortelag: b,
    starttid: tid,
    resultat:
      event.intHomeScore != null && event.intAwayScore != null
        ? {
            hjemme: Number(event.intHomeScore),
            borte: Number(event.intAwayScore),
          }
        : null,
  };
}

/**
 * Finn vår kamp-id (A1..L6) som matcher et eksternt event.
 * Vi bruker lag (uavhengig av rekkefølge) + dato (samme dag).
 */
function finnVårKampId(våreKamper, ekstern) {
  for (const [id, k] of Object.entries(våreKamper)) {
    const sammeDag =
      Math.abs(k.starttid - ekstern.starttid) < 24 * 60 * 60 * 1000;
    const sammeLag =
      (k.hjemmelag === ekstern.hjemmelag &&
        k.bortelag === ekstern.bortelag) ||
      (k.hjemmelag === ekstern.bortelag &&
        k.bortelag === ekstern.hjemmelag);
    if (sammeDag && sammeLag) return { id, kamp: k, flippet: k.hjemmelag !== ekstern.hjemmelag };
  }
  return null;
}

async function syncResultater() {
  init();
  const db = admin.firestore();

  console.log("Henter VM-events fra TheSportsDB…");
  const events = await hentEvents();
  console.log(`Fant ${events.length} events`);

  const snap = await db.collection("kamper").get();
  const våreKamper = Object.fromEntries(
    snap.docs.map((d) => [d.id, d.data()]),
  );
  console.log(`Vi har ${Object.keys(våreKamper).length} kamper i Firestore`);
  if (Object.keys(våreKamper).length === 0) {
    console.log("Ingen kamper i databasen — kjør 'Seed VM-kamper' i admin først.");
    return { oppdatert: 0, fasit: false };
  }

  let oppdatert = 0;
  for (const e of events) {
    const norsk = tilNorske(e);
    if (!norsk) {
      console.log(`  ? Ukjent lag: ${e.strHomeTeam} vs ${e.strAwayTeam}`);
      continue;
    }
    const treff = finnVårKampId(våreKamper, norsk);
    if (!treff) {
      console.log(
        `  ? Ingen match: ${norsk.hjemmelag} vs ${norsk.bortelag} ${new Date(norsk.starttid).toISOString().slice(0, 16)}`,
      );
      continue;
    }
    if (!norsk.resultat) continue; // ikke spilt ennå

    // Hvis lagene er flippet i TheSportsDB sammenlignet med oss, snu scoren
    const skrivResultat = treff.flippet
      ? { hjemme: norsk.resultat.borte, borte: norsk.resultat.hjemme }
      : norsk.resultat;

    const eksisterende = treff.kamp.resultat;
    if (
      eksisterende &&
      eksisterende.hjemme === skrivResultat.hjemme &&
      eksisterende.borte === skrivResultat.borte
    ) {
      continue;
    }

    await db
      .collection("kamper")
      .doc(treff.id)
      .update({ resultat: skrivResultat });
    console.log(
      `  ✓ ${treff.id}: ${treff.kamp.hjemmelag} ${skrivResultat.hjemme}-${skrivResultat.borte} ${treff.kamp.bortelag}`,
    );
    oppdatert += 1;
  }

  // Hvis hele gruppespillet er ferdig, generér 32-delsfinaler
  const oppdatertSnap = await db.collection("kamper").get();
  const alleKamper = oppdatertSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const gruppeKamper = alleKamper.filter((k) => k.runde?.startsWith("Gruppe"));
  const ferdigeGruppeKamper = gruppeKamper.filter((k) => k.resultat);

  if (
    gruppeKamper.length === 72 &&
    ferdigeGruppeKamper.length === 72 &&
    !alleKamper.some((k) => k.runde === "32-delsfinale")
  ) {
    console.log("\nGruppespill ferdig — genererer 32-delsfinaler…");
    const grupperResultater = {};
    for (const g of GRUPPER) {
      const kamperGruppe = gruppeKamper.filter(
        (k) => k.runde === `Gruppe ${g.id}`,
      );
      grupperResultater[g.id] = gruppeStanding(g.lag, kamperGruppe);
    }
    const sluttspill = genererSluttspill32del(grupperResultater);
    if (sluttspill) {
      const batch = db.batch();
      for (const k of sluttspill) {
        batch.set(db.collection("kamper").doc(k.id), {
          hjemmelag: k.hjemmelag,
          bortelag: k.bortelag,
          starttid: 0, // settes manuelt av admin etter at FIFA bekrefter tider
          runde: k.runde,
          bonusFaktor: 1,
          resultat: null,
        });
      }
      await batch.commit();
      console.log(`  ✓ Skrev ${sluttspill.length} 32-delsfinaler`);
    }
  }

  return { oppdatert };
}

const resultat = await syncResultater();
console.log(`\n✓ Sync ferdig. Oppdatert ${resultat.oppdatert} kamper.`);
