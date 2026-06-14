// Engangs-fiks: retter starttid for de 25 gruppekampene som lå med feil dato
// (UTC-dato i stedet for ET-dato → én dag for sent for kamper med avspark kl
// 20:00 ET eller senere). Oppdaterer KUN starttid-feltet, så resultat/lag/
// runde/ferdig bevares urørt. Idempotent — kan kjøres flere ganger.
//
// Kjør: FIREBASE_SERVICE_ACCOUNT="$(cat <vm-haslum-adminsdk>.json)" \
//       node scripts/fiks-starttider.mjs

import admin from "firebase-admin";

// [id, korrekt dato (ET), klokkeslett (ET)] — de 25 kampene som var feil.
const FIKSER = [
  ["A2", "06-11", "22:00"], // Tsjekkia–Sør-Korea
  ["A4", "06-18", "21:00"], // Sør-Korea–Mexico
  ["A5", "06-24", "21:00"], // Sør-Korea–Sør-Afrika
  ["A6", "06-24", "21:00"], // Mexico–Tsjekkia
  ["C2", "06-13", "21:00"], // Skottland–Haiti
  ["C4", "06-19", "20:30"], // Haiti–Brasil
  ["D1", "06-12", "21:00"], // Paraguay–USA
  ["D4", "06-19", "23:00"], // Paraguay–Tyrkia
  ["D5", "06-25", "22:00"], // USA–Tyrkia
  ["D6", "06-25", "22:00"], // Australia–Paraguay
  ["E4", "06-20", "20:00"], // Curaçao–Ecuador
  ["F2", "06-14", "22:00"], // Tunisia–Sverige
  ["G2", "06-15", "21:00"], // New Zealand–Iran
  ["G4", "06-21", "21:00"], // Egypt–New Zealand
  ["G5", "06-26", "23:00"], // Belgia–New Zealand
  ["G6", "06-26", "23:00"], // Iran–Egypt
  ["H5", "06-26", "20:00"], // Spania–Uruguay
  ["H6", "06-26", "20:00"], // Saudi-Arabia–Kapp Verde
  ["I4", "06-22", "20:00"], // Senegal–Norge
  ["J2", "06-16", "21:00"], // Algerie–Argentina
  ["J4", "06-22", "23:00"], // Algerie–Jordan
  ["J5", "06-27", "22:00"], // Østerrike–Algerie
  ["J6", "06-27", "22:00"], // Argentina–Jordan
  ["K2", "06-17", "22:00"], // Colombia–Usbekistan
  ["K4", "06-23", "22:00"], // DR Kongo–Colombia
];

function init() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT mangler i miljøet.");
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    json = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  }
  admin.initializeApp({ credential: admin.credential.cert(json) });
}

async function main() {
  init();
  const db = admin.firestore();
  let ok = 0;
  for (const [id, dato, tid] of FIKSER) {
    const starttid = new Date(`2026-${dato}T${tid}:00-04:00`).getTime();
    const ref = db.collection("kamper").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`  ⚠ ${id}: finnes ikke — hoppet over`);
      continue;
    }
    const k = snap.data();
    await ref.update({ starttid });
    ok++;
    const norsk = new Date(starttid).toLocaleString("nb-NO", {
      timeZone: "Europe/Oslo",
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(`  ✓ ${id} ${k.hjemmelag}–${k.bortelag} → ${norsk} norsk`);
  }
  console.log(`\nFerdig: rettet starttid for ${ok} kamper i vm-haslum.`);
}

main().catch((e) => {
  console.error("\nFeil:", e.message);
  process.exit(1);
});
