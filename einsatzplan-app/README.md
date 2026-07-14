# TTV Einigkeit Süchteln-Vorst – Einsatzplan

Eigenständige Web-App (React + Firebase), die du unabhängig von Claude hosten kannst.

---

## Schritt 1: Firebase-Projekt anlegen (kostenlos)

1. Gehe zu **https://console.firebase.google.com** und logge dich mit einem Google-Konto ein.
2. Klicke auf **„Projekt hinzufügen"**, gib einen Namen ein (z. B. `ttve-einsatzplan`), Google Analytics kannst du deaktivieren.
3. Im Projekt links im Menü auf **„Build" → „Firestore Database"** klicken → **„Datenbank erstellen"**.
   - Standort: `eur3 (europe-west)` (näher an Deutschland)
   - Modus: **„Testmodus starten"** (offene Regeln für 30 Tage) — wir passen die Regeln danach an.
4. Sobald die Datenbank erstellt ist, gehe zu **„Regeln"** (Tab oben) und ersetze den Inhalt durch:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /einsatzplan_shared_storage/{document} {
         allow read, write: if true;
       }
     }
   }
   ```

   ⚠️ Das erlaubt jedem mit dem Link Lese-/Schreibzugriff auf die Einsatzplan-Daten — für ein
   internes Vereins-Tool meist unkritisch, aber theoretisch offen im Internet. Der
   Mannschaftsführer-Login (Schritt 1b) schützt auf App-Ebene vor versehentlichem Bearbeiten,
   ist aber kein serverseitig erzwungener Zugriffsschutz.

5. Zurück zur Projektübersicht (Zahnrad oben links → **„Projekteinstellungen"**) → ganz unten bei
   **„Meine Apps"** auf das **Web-Symbol (`</>`)** klicken → App registrieren (Name z. B. „Einsatzplan").
6. Du bekommst einen Codeblock mit `firebaseConfig = {...}` — die Werte darin (`apiKey`,
   `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) brauchst du gleich.

---

## Schritt 1b: Mannschaftsführer-Zugang einrichten (optional, aber empfohlen)

Damit nur der Mannschaftsführer Notizen bearbeiten und Rückmeldungen zurücksetzen kann:

1. In der Firebase-Konsole → **„Build" → „Authentication"** → **„Los geht's"**.
2. Tab **„Sign-in method"** → **„E-Mail/Passwort"** auswählen → aktivieren → speichern.
3. Tab **„Users"** → **„Nutzer hinzufügen"** → E-Mail-Adresse und Passwort für den/die
   Mannschaftsführer eintragen (z. B. `fuehrer@ttve.de`).
4. Fertig — der/die Mannschaftsführer kann sich jetzt in der App über das Schloss-Symbol oben
   rechts anmelden. Ohne Login sehen alle bestehende Notizen nur lesend, können aber weiterhin
   normal ihre eigene Verfügbarkeit eintragen.

Für mehrere Mannschaftsführer einfach mehrere Nutzer in Schritt 3 anlegen.

---

## Schritt 2: Code auf GitHub hochladen

1. Falls noch nicht vorhanden: kostenlosen Account auf **https://github.com** anlegen.
2. Neues Repository erstellen (z. B. `ttve-einsatzplan`), **„Public"** oder **„Private"** — beides geht.
3. Diesen kompletten Ordner (den du von mir bekommen hast) in das Repository hochladen:
   - Einfachster Weg ohne Kommandozeile: Im leeren GitHub-Repo auf **„uploading an existing file"**
     klicken und alle Dateien/Ordner per Drag & Drop hochladen.
   - Alternativ mit Git: `git init`, `git add .`, `git commit -m "init"`, `git remote add origin <repo-url>`, `git push -u origin main`

---

## Schritt 3: Bei Vercel deployen (baut & hostet automatisch)

1. Kostenlosen Account auf **https://vercel.com** anlegen (Anmeldung direkt mit GitHub möglich).
2. **„Add New" → „Project"** → dein GitHub-Repo `ttve-einsatzplan` auswählen → **„Import"**.
3. Vercel erkennt automatisch, dass es ein Vite-Projekt ist. Vor dem Deploy bei
   **„Environment Variables"** die 6 Firebase-Werte aus Schritt 1.6 eintragen:

   | Name | Wert |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | ... |
   | `VITE_FIREBASE_AUTH_DOMAIN` | ... |
   | `VITE_FIREBASE_PROJECT_ID` | ... |
   | `VITE_FIREBASE_STORAGE_BUCKET` | ... |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | ... |
   | `VITE_FIREBASE_APP_ID` | ... |

4. Auf **„Deploy"** klicken. Nach 1–2 Minuten bekommst du einen Live-Link wie
   `https://ttve-einsatzplan.vercel.app` — den kannst du mit dem ganzen Team teilen.

---

## Später etwas ändern lassen?

Wenn du mir sagst „ändere XY in der App", passe ich `src/App.jsx` an, du lädst die neue Version
einfach wieder auf GitHub hoch (Datei ersetzen) — Vercel baut die Seite dann automatisch neu.

---

## Als App aufs Handy-Startbildschirm legen (PWA)

Die App hat ein eigenes Icon und lässt sich wie eine echte App installieren – kein App Store nötig.

**iPhone (Safari):**
1. Link öffnen → unten auf das **Teilen-Symbol** (Quadrat mit Pfeil) tippen
2. **„Zum Home-Bildschirm"** auswählen → **„Hinzufügen"**

**Android (Chrome):**
1. Link öffnen → oben rechts die **drei Punkte** antippen
2. **„App installieren"** bzw. **„Zum Startbildschirm hinzufügen"**

Danach startet die App mit eigenem Icon ohne Browserleiste, wie eine normale App.

---

## Lokal testen (optional, braucht Node.js)

```bash
npm install
cp .env.example .env.local   # dann die Firebase-Werte eintragen
npm run dev
```

Öffnet die App unter `http://localhost:5173`.
