import { doc, getDocFromServer, setDoc, deleteDoc, collection, getDocsFromServer } from "firebase/firestore";
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
  // getDocFromServer statt getDoc: erzwingt IMMER eine frische Anfrage an
  // Firestore, statt möglicherweise eine im Browser zwischengespeicherte
  // (veraltete) Version derselben Sitzung zu verwenden.
  const snap = await withTimeout(getDocFromServer(ref), "Laden");
  if (!snap.exists()) return null;
  return { key, value: snap.data().value, shared: true };
}

export async function setShared(key, value) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, COLLECTION, key);
  await withTimeout(setDoc(ref, { value, updatedAt: Date.now() }), "Speichern");
  return { key, value, shared: true };
}

// Read-only Brücke zur Vereinsverwaltungs-App: funktioniert nur, wenn beide
// Apps im selben Firebase-Projekt laufen (dieselbe Datenbank, andere
// Sammlung). Wird genutzt, um z. B. Vereinstermine im Einsatzplan
// mit anzuzeigen, ohne die Vereinsverwaltung selbst zu verändern.
const VEREINSVERWALTUNG_COLLECTION = "vereinsverwaltung_storage";

export async function getFromVereinsverwaltung(key) {
  if (!db) return null;
  try {
    const ref = doc(db, VEREINSVERWALTUNG_COLLECTION, key);
    const snap = await withTimeout(getDocFromServer(ref), "Laden (Vereinsverwaltung)");
    if (!snap.exists()) return null;
    return { key, value: snap.data().value };
  } catch (e) {
    // Kein Fehler werfen: Falls die Vereinsverwaltung (noch) nicht im
    // gleichen Projekt läuft, soll der Einsatzplan trotzdem normal
    // funktionieren - die Vereinstermine bleiben dann einfach leer.
    return null;
  }
}

// Schreibender Gegenpart - bewusst nur für die Rollen-Verwaltung gedacht
// (Administratoren im Einsatzplan sollen Rechte vergeben können, ohne in
// die Vereinsverwaltung wechseln zu müssen). Schreibt in dieselbe Sammlung,
// die auch die Vereinsverwaltung nutzt - beide Apps sehen denselben Stand.
export async function setToVereinsverwaltung(key, value) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, VEREINSVERWALTUNG_COLLECTION, key);
  await withTimeout(setDoc(ref, { value, updatedAt: Date.now() }), "Speichern (Vereinsverwaltung)");
  return { key, value };
}

// --- Rollen (echte Dokumente, ein Dokument pro E-Mail) - dieselbe Sammlung,
// die auch die Vereinsverwaltung nutzt, damit Rollen zuverlässig geteilt sind
// UND die Firestore-Sicherheitsregeln sie direkt prüfen können.
const ROLES_COLLECTION = "vv_roles";

export async function getAllVvRoles() {
  if (!db) return {};
  try {
    const snap = await withTimeout(getDocsFromServer(collection(db, ROLES_COLLECTION)), "Rollen laden");
    const map = {};
    snap.forEach((d) => {
      map[d.id] = d.data().roles || [];
    });
    return map;
  } catch (e) {
    return {};
  }
}

export async function setVvUserRoles(email, roles) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, ROLES_COLLECTION, email);
  await withTimeout(setDoc(ref, { roles, updatedAt: Date.now() }), "Rolle speichern");
}

export async function deleteVvUserRoles(email) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, ROLES_COLLECTION, email);
  await withTimeout(deleteDoc(ref), "Rolle löschen");
}

// --- Öffentliche Sichtbarkeit einzelner Vereinsverwaltungs-Bereiche -----
// Echtes Dokument mit echten Feldern (kein Text-Blob), damit die
// Firestore-Regeln direkt prüfen können, ob ein Bereich freigegeben ist.
const PUBLIC_VISIBILITY_DOC = "oeffentlich";

export async function getPublicVisibility() {
  if (!db) return {};
  try {
    const ref = doc(db, VEREINSVERWALTUNG_COLLECTION, PUBLIC_VISIBILITY_DOC);
    const snap = await withTimeout(getDocFromServer(ref), "Sichtbarkeit laden");
    if (!snap.exists()) return {};
    return snap.data() || {};
  } catch (e) {
    return {};
  }
}

export async function setPublicVisibility(fields) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, VEREINSVERWALTUNG_COLLECTION, PUBLIC_VISIBILITY_DOC);
  await withTimeout(setDoc(ref, fields, { merge: true }), "Sichtbarkeit speichern");
}
