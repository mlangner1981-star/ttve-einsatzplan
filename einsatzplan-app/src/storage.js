import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const COLLECTION = "einsatzplan_shared_storage";

export async function getShared(key) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, COLLECTION, key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { key, value: snap.data().value, shared: true };
}

export async function setShared(key, value) {
  if (!db) throw new Error("Firebase ist nicht konfiguriert.");
  const ref = doc(db, COLLECTION, key);
  await setDoc(ref, { value, updatedAt: Date.now() });
  return { key, value, shared: true };
}
