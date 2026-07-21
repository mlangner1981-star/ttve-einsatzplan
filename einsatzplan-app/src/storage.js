import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const COLLECTION = "einsatzplan_shared_storage";
const TIMEOUT_MS = 8000;

// Verhindert, dass ein hängendes Firestore-Promise die App für immer im
// Zustand "Speichert…"/"Lädt…" belässt. Statt endlos zu warten, wird nach
// TIMEOUT_MS ein klarer, sichtbarer Fehler ausgelöst.
function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Zeitüberschreitung bei ${label} (${TIMEOUT_MS / 1000}s) – bitte erneut versuchen.`)),
        TIMEOUT_MS
      )
    ),
  ]);
}

export async function getShared(key) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, COLLECTION, key);
  const snap = await withTimeout(getDoc(ref), "Laden");
  if (!snap.exists()) return null;
  return { key, value: snap.data().value, shared: true };
}

export async function setShared(key, value) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, COLLECTION, key);
  await withTimeout(setDoc(ref, { value, updatedAt: Date.now() }), "Speichern");
  return { key, value, shared: true };
}
