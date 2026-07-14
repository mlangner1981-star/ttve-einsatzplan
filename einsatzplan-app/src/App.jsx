import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  RotateCcw,
  MapPin,
  Home,
  Loader2,
  AlertTriangle,
  User,
  Clock,
  HelpCircle,
  CircleDashed,
  Navigation,
  Users,
  CalendarDays,
  Sun,
  Moon,
  Shield,
  LogOut,
  Lock,
} from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getShared, setShared } from "./storage.js";
import { configIsMissing, auth } from "./firebase.js";

const HOME_ADDRESS =
  "Franziskus-Schule Viersen, Josef-Deilmann-Str. 1, 41749 Viersen-Süchteln";

const TEAMS = [
  {
    id: "t1",
    label: "1. Mannschaft",
    league: "Bezirksoberliga 3 (Niederrhein)",
    players: [
      "Matthias Christen",
      "Marcel Brunner",
      "Benjamin Tullmin",
      "David Ender",
      "Thomas Fischer",
      "Sven Brinkmann",
    ],
    matches: [
      { id: 1, date: "06.09.2026", weekday: "So", time: "11:00", home: true, opponent: "TTC Meerbusch", address: HOME_ADDRESS },
      { id: 2, date: "11.09.2026", weekday: "Fr", time: "19:30", home: false, opponent: "TTC DJK Neukirchen", address: "Jakobus-Schule (große Halle), An den Hecken 4, 41516 Grevenbroich" },
      { id: 3, date: "20.09.2026", weekday: "So", time: "11:00", home: true, opponent: "TuS Rheydt-Wetschewell", address: HOME_ADDRESS },
      { id: 4, date: "02.10.2026", weekday: "Fr", time: "19:30", home: false, opponent: "DJK VfL Willich", address: "Wilhelmhalle, Wilhelmstr. (Ecke Grunewallstr.), 47877 Willich" },
      { id: 5, date: "18.10.2026", weekday: "So", time: "11:00", home: false, opponent: "Kempener LC", address: "Gesamtschule Kempen, Pestalozzistr. 3-5, 47906 Kempen" },
      { id: 6, date: "08.11.2026", weekday: "So", time: "11:00", home: true, opponent: "TTC GW Vanikum", address: HOME_ADDRESS },
      { id: 7, date: "14.11.2026", weekday: "Sa", time: "18:30", home: true, opponent: "1. TTC BW Breyell", address: HOME_ADDRESS },
      { id: 8, date: "21.11.2026", weekday: "Sa", time: "17:30", home: false, opponent: "TuS Wickrath II", address: "Realschule Wickrath, Am Antoniushügel, 41189 Mönchengladbach-Wickrath" },
      { id: 9, date: "29.11.2026", weekday: "So", time: "11:00", home: true, opponent: "SV DJK Holzbüttgen III", address: HOME_ADDRESS },
      { id: 10, date: "04.12.2026", weekday: "Fr", time: "19:30", home: false, opponent: "TTC Dormagen", address: "Bettina-von-Arnim-Gymnasium, Haberlandstr. 14, 41539 Dormagen" },
    ],
  },
  {
    id: "t2",
    label: "2. Mannschaft",
    league: "1. Bezirksliga 2",
    players: [
      "Tim Schrangs",
      "Michael Domnik",
      "Andre Skott",
      "Marcel Langner",
      "Jan-Dieter Brüggemann",
      "Hanna Fretz",
      "Thomas Smit",
    ],
    matches: [
      { id: 1, date: "12.09.2026", weekday: "Sa", time: "18:30", home: false, opponent: "ASV Einigkeit Süchteln II", address: "Gemeinschaftshauptschule Viersen-Süchteln, Hindenburgstr. 128, 41749 Viersen" },
      { id: 2, date: "19.09.2026", weekday: "Sa", time: "18:30", home: true, opponent: "KTSV Preussen Krefeld", address: HOME_ADDRESS },
      { id: 3, date: "10.10.2026", weekday: "Sa", time: "18:30", home: true, opponent: "SC BW Mülhausen", address: HOME_ADDRESS },
      { id: 4, date: "17.10.2026", weekday: "Sa", time: "18:30", home: false, opponent: "Anrather TK RW III", address: "Gottfried-Kricker-Halle, Hochheideweg 34-36, 47877 Willich-Anrath" },
      { id: 5, date: "07.11.2026", weekday: "Sa", time: "18:30", home: true, opponent: "Hülser SV II", address: HOME_ADDRESS },
      { id: 6, date: "14.11.2026", weekday: "Sa", time: "18:30", home: true, opponent: "TTC Waldniel III", address: HOME_ADDRESS },
      { id: 7, date: "21.11.2026", weekday: "Sa", time: "18:30", home: false, opponent: "TTC Straelen/Wachtendonk", address: "Grundschule Straelen, Fontanestraße 1, 47638 Straelen" },
      { id: 8, date: "28.11.2026", weekday: "Sa", time: "18:30", home: true, opponent: "DJK VfL Willich II", address: HOME_ADDRESS },
      { id: 9, date: "04.12.2026", weekday: "Fr", time: "19:00", home: false, opponent: "TTF Rhenania Königshof", address: "Winand-Teusch-Halle, Wilhelmstr./Kölner Str., 47807 Krefeld" },
    ],
  },
];

const STORAGE_PREFIX = "ttv-suechteln-vorst-einsatzplan-";
const REQUIRED_PLAYERS = 6;

const emptyTeamData = (team) =>
  Object.fromEntries(team.matches.map((m) => [m.id, { availability: {}, notiz: "" }]));

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function computeMatchStatus(players, avail) {
  const no = players.filter((p) => avail[p] === "no");
  const yes = players.filter((p) => avail[p] === "yes");
  const unsicher = players.filter((p) => avail[p] === "request" || avail[p] === "unclear");
  const open = players.filter((p) => !avail[p]);
  const teamSize = players.length;

  let ersatz = null;
  let warning = null;
  if (teamSize - no.length < REQUIRED_PLAYERS) {
    warning = `Nur ${teamSize - no.length} Spieler fest zugesagt – externer Ersatz nötig!`;
  } else if (no.length === teamSize - REQUIRED_PLAYERS && no.length > 0) {
    ersatz = no.join(", ");
  }
  const complete = open.length === 0 && unsicher.length === 0 && !warning;
  return { no, yes, unsicher, open, ersatz, warning, complete };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function matchToDate(m) {
  const [day, month, year] = m.date.split(".").map(Number);
  const [hour, minute] = m.time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatICSDate(d) {
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

function downloadICS(team) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TTV Einigkeit Süchteln-Vorst//Einsatzplan//DE",
    "CALSCALE:GREGORIAN",
  ];
  team.matches.forEach((m) => {
    const start = matchToDate(m);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3 Std. angenommen
    lines.push(
      "BEGIN:VEVENT",
      `UID:${team.id}-${m.id}@ttve-einsatzplan`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${team.label} vs. ${m.opponent} (${m.home ? "Heim" : "Auswärts"})`,
      `LOCATION:${m.address.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${m.home ? "Heimspiel" : "Auswärtsspiel"} – ${team.league}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${team.label.replace(/\s+/g, "_")}_Spielplan.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Einsatzplan() {
  const [teamId, setTeamId] = useState("t2");
  const team = TEAMS.find((t) => t.id === teamId);

  const [data, setData] = useState(() => emptyTeamData(team));
  const [me, setMe] = useState("");
  const [view, setView] = useState("cards"); // "cards" | "leader"
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [openNote, setOpenNote] = useState(null);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("ttve-dark-mode");
    if (saved !== null) return saved === "1";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    window.localStorage.setItem("ttve-dark-mode", dark ? "1" : "0");
  }, [dark]);

  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err) {
      setLoginError("Anmeldung fehlgeschlagen – E-Mail oder Passwort falsch.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const storageKey = STORAGE_PREFIX + teamId;

  const load = useCallback(async (t) => {
    setStatus("loading");
    try {
      const result = await getShared(STORAGE_PREFIX + t.id);
      if (result && result.value) {
        const parsed = JSON.parse(result.value);
        setData({ ...emptyTeamData(t), ...parsed });
      } else {
        setData(emptyTeamData(t));
      }
      setStatus("ready");
    } catch (e) {
      setData(emptyTeamData(t));
      setStatus(configIsMissing ? "error" : "ready");
      if (configIsMissing) setErrorMsg("Firebase ist noch nicht konfiguriert (siehe README.md).");
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(`ttve-me-${teamId}`);
    setMe(saved && team.players.includes(saved) ? saved : "");
    load(team);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const chooseMe = (name) => {
    setMe(name);
    if (name) window.localStorage.setItem(`ttve-me-${teamId}`, name);
    else window.localStorage.removeItem(`ttve-me-${teamId}`);
  };

  const persist = async (next) => {
    setData(next);
    setStatus("saving");
    try {
      const result = await setShared(storageKey, JSON.stringify(next));
      if (!result) throw new Error("no result");
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        configIsMissing
          ? "Firebase ist noch nicht konfiguriert (siehe README.md)."
          : "Speichern fehlgeschlagen. Bitte erneut versuchen."
      );
    }
  };

  const setMyAvailability = (matchId, value) => {
    if (!me) return;
    const current = data[matchId] || { availability: {}, notiz: "" };
    const currentValue = current.availability[me];
    const nextValue = currentValue === value ? undefined : value;
    const nextAvailability = { ...current.availability };
    if (nextValue === undefined) delete nextAvailability[me];
    else nextAvailability[me] = nextValue;
    persist({ ...data, [matchId]: { ...current, availability: nextAvailability } });
  };

  const setNote = (matchId, text) => {
    if (!authUser) return;
    const current = data[matchId] || { availability: {}, notiz: "" };
    persist({ ...data, [matchId]: { ...current, notiz: text } });
  };

  const resetAll = () => {
    if (!authUser) return;
    if (confirm(`Wirklich alle Rückmeldungen der ${team.label} zurücksetzen?`)) {
      persist(emptyTeamData(team));
    }
  };

  return (
    <div className={dark ? "dark" : ""}>
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-16 transition-colors">
      {configIsMissing && (
        <div className="bg-red-600 text-white text-xs font-semibold text-center py-2 px-4">
          ⚠️ Firebase ist noch nicht konfiguriert – trage deine Config-Werte als Umgebungsvariablen
          ein (siehe README.md). Ohne das funktioniert das Speichern nicht.
        </div>
      )}
      {/* Header */}
      <header className="bg-emerald-900 text-white">
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-1">
                TTV Einigkeit Süchteln-Vorst
              </div>
              <h1 className="text-3xl font-black tracking-tight uppercase leading-none mb-1">
                Einsatzplan
              </h1>
              <div className="text-emerald-200 text-sm">Saison 2026/27</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!authLoading && (
                authUser ? (
                  <button
                    onClick={handleLogout}
                    title={`Eingeloggt als ${authUser.email} – zum Abmelden klicken`}
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-2 rounded-lg bg-emerald-700 text-white"
                  >
                    <Shield size={14} /> Mannschaftsführer <LogOut size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    title="Als Mannschaftsführer anmelden"
                    className="p-2 rounded-lg bg-emerald-800 text-emerald-200 hover:bg-emerald-700"
                  >
                    <Lock size={18} />
                  </button>
                )
              )}
              <button
                onClick={() => setDark((d) => !d)}
                title={dark ? "Heller Modus" : "Dunkler Modus"}
                className="p-2 rounded-lg bg-emerald-800 text-emerald-200 hover:bg-emerald-700"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* Team tabs */}
          <div className="mt-5 flex gap-1.5">
            {TEAMS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTeamId(t.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded uppercase tracking-wide ${
                  t.id === teamId
                    ? "bg-white text-emerald-900"
                    : "bg-emerald-800 text-emerald-200 hover:bg-emerald-700"
                }`}
              >
                <Users size={13} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-emerald-300 text-xs mt-2">{team.league}</div>
        </div>
      </header>

      {/* Login-Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-5">
          <div className="bg-white dark:bg-stone-900 rounded-lg p-5 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-emerald-700 dark:text-emerald-400" />
              <h2 className="font-bold text-stone-800 dark:text-stone-100">Mannschaftsführer-Login</h2>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
              <input
                type="email"
                required
                placeholder="E-Mail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-800 dark:text-stone-100"
              />
              <input
                type="password"
                required
                placeholder="Passwort"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-800 dark:text-stone-100"
              />
              {loginError && <div className="text-xs text-red-600 dark:text-red-400">{loginError}</div>}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setLoginError("");
                  }}
                  className="flex-1 text-sm font-bold py-2 rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 text-sm font-bold py-2 rounded bg-emerald-700 text-white"
                >
                  Anmelden
                </button>
              </div>
            </form>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-3">
              Zugang gibt's nicht automatisch – der Verein legt Mannschaftsführer-Konten in der
              Firebase-Konsole an (siehe README.md).
            </div>
          </div>
        </div>
      )}

      {/* Who am I */}
      <div className="max-w-2xl mx-auto px-5">
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 -mt-4 shadow-sm p-4 flex items-center gap-3">
          <User size={18} className="text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
              Ich bin ({team.label})
            </label>
            <select
              value={me}
              onChange={(e) => chooseMe(e.target.value)}
              className="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm font-semibold text-stone-800 dark:text-stone-100"
            >
              <option value="">– Spieler auswählen –</option>
              {team.players.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!me && (
          <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 mt-2">
            Wähle oben deinen Namen, damit du bei den Spielen zu- oder absagen kannst.
          </div>
        )}
      </div>

      {/* View toggle + Kalender-Export */}
      <div className="max-w-2xl mx-auto px-5">
        <div className="flex items-center gap-2 mt-3">
          <div className="flex bg-stone-200 dark:bg-stone-800 rounded-lg p-1 flex-1">
            <button
              onClick={() => setView("cards")}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md ${
                view === "cards"
                  ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              Meine Rückmeldung
            </button>
            <button
              onClick={() => setView("leader")}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md ${
                view === "leader"
                  ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              Führungsansicht
            </button>
          </div>
          <button
            onClick={() => downloadICS(team)}
            title="Alle Spiele als Kalender-Datei exportieren"
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
          >
            <CalendarDays size={14} /> .ics
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="max-w-2xl mx-auto px-5">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 py-3 mt-2 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-1.5">
            {status === "loading" && (
              <>
                <Loader2 size={13} className="animate-spin" /> Lädt Team-Daten…
              </>
            )}
            {status === "saving" && (
              <>
                <Loader2 size={13} className="animate-spin" /> Speichert…
              </>
            )}
            {status === "ready" && (
              <>
                <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> Für das ganze Team synchron
              </>
            )}
            {status === "error" && (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={13} /> {errorMsg}
              </span>
            )}
          </div>
          <button
            onClick={resetAll}
            disabled={!authUser}
            title={authUser ? "Alle Rückmeldungen zurücksetzen" : "Nur für Mannschaftsführer"}
            className={`flex items-center gap-1 text-stone-400 dark:text-stone-500 ${
              authUser ? "hover:text-stone-700 dark:hover:text-stone-300" : "opacity-30 cursor-not-allowed"
            }`}
          >
            <RotateCcw size={12} /> Zurücksetzen
          </button>
        </div>
      </div>

      {/* Match cards */}
      {view === "cards" && (
      <main className="max-w-2xl mx-auto px-5 mt-4 flex flex-col gap-3">
        {team.matches.map((m, idx) => {
          const entry = data[m.id] || { availability: {}, notiz: "" };
          const avail = entry.availability || {};
          const players = team.players;

          const { no, unsicher, open, ersatz, warning } = computeMatchStatus(players, avail);

          const myStatus = me ? avail[me] : undefined;

          return (
            <div
              key={m.id}
              className={`rounded-lg border bg-white dark:bg-stone-900 overflow-hidden ${
                warning ? "border-red-300 dark:border-red-800" : "border-stone-200 dark:border-stone-800"
              }`}
            >
              <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-stone-400 dark:text-stone-500 text-xs font-bold">#{idx + 1}</span>
                  <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                    {m.weekday} {m.date}
                  </span>
                  <span className="text-stone-400 dark:text-stone-500 text-xs flex items-center gap-0.5">
                    <Clock size={10} /> {m.time}
                  </span>
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                    m.home
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400"
                  }`}
                >
                  {m.home ? <Home size={11} /> : <MapPin size={11} />}
                  {m.home ? "Heim" : "Auswärts"}
                </span>
              </div>

              <div className="px-4 pt-1.5 pb-3">
                <div className="text-stone-900 dark:text-stone-100 font-semibold">{m.opponent}</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline"
                >
                  <Navigation size={12} className="flex-shrink-0 mt-0.5" />
                  <span>{m.address}</span>
                </a>
              </div>

              {/* My response */}
              <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-3">
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5 block">
                  Deine Rückmeldung
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!me}
                    onClick={() => setMyAvailability(m.id, "yes")}
                    className={`flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded border ${
                      myStatus === "yes"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                    } ${!me ? "opacity-40" : ""}`}
                  >
                    <Check size={15} /> Ich spiele
                  </button>
                  <button
                    disabled={!me}
                    onClick={() => setMyAvailability(m.id, "no")}
                    className={`flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded border ${
                      myStatus === "no"
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                    } ${!me ? "opacity-40" : ""}`}
                  >
                    <X size={15} /> Ich kann nicht
                  </button>
                  <button
                    disabled={!me}
                    onClick={() => setMyAvailability(m.id, "request")}
                    className={`flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded border ${
                      myStatus === "request"
                        ? "bg-sky-600 border-sky-600 text-white"
                        : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                    } ${!me ? "opacity-40" : ""}`}
                  >
                    <HelpCircle size={15} /> Auf Anfrage
                  </button>
                  <button
                    disabled={!me}
                    onClick={() => setMyAvailability(m.id, "unclear")}
                    className={`flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded border ${
                      myStatus === "unclear"
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                    } ${!me ? "opacity-40" : ""}`}
                  >
                    <CircleDashed size={15} /> In Klärung
                  </button>
                </div>
              </div>

              {/* Team overview */}
              <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-3 bg-stone-50 dark:bg-stone-950">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {players.map((p) => {
                    const st = avail[p];
                    const label =
                      st === "yes"
                        ? " – kann spielen"
                        : st === "no"
                        ? " – abgesagt"
                        : st === "request"
                        ? " – auf Anfrage"
                        : st === "unclear"
                        ? " – in Klärung"
                        : " – noch offen";
                    const style =
                      st === "yes"
                        ? "bg-emerald-600 border-emerald-700 text-white"
                        : st === "no"
                        ? "bg-red-600 border-red-700 text-white"
                        : st === "request"
                        ? "bg-sky-600 border-sky-700 text-white"
                        : st === "unclear"
                        ? "bg-amber-500 border-amber-600 text-white"
                        : "bg-stone-200 dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400";
                    return (
                      <span
                        key={p}
                        title={`${p}${label}`}
                        className={`text-[11px] font-bold px-2 py-1 rounded-full border ${style} ${
                          p === me ? "ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-1 dark:ring-offset-stone-950" : ""
                        }`}
                      >
                        {initials(p)}
                      </span>
                    );
                  })}
                </div>

                {warning ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded px-2.5 py-1.5">
                    <AlertTriangle size={13} /> {warning}
                  </div>
                ) : ersatz ? (
                  <div className="text-xs text-stone-600 dark:text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Ersatz:</span> {ersatz}
                    {(open.length > 0 || unsicher.length > 0) && (
                      <span className="text-stone-400 dark:text-stone-500">
                        {" · "}
                        {open.length > 0 && `${open.length} offen`}
                        {open.length > 0 && unsicher.length > 0 && ", "}
                        {unsicher.length > 0 && `${unsicher.length} unsicher`}
                      </span>
                    )}
                  </div>
                ) : (
                  (open.length > 0 || unsicher.length > 0) && (
                    <div className="text-xs text-stone-400 dark:text-stone-500">
                      {open.length > 0 && `${open.length} Rückmeldung${open.length > 1 ? "en" : ""} offen`}
                      {open.length > 0 && unsicher.length > 0 && " · "}
                      {unsicher.length > 0 && `${unsicher.length} unsicher (Anfrage/Klärung)`}
                    </div>
                  )
                )}

                {authUser && (
                  <button
                    onClick={() => setOpenNote(openNote === `${teamId}-${m.id}` ? null : `${teamId}-${m.id}`)}
                    className="text-xs text-stone-400 dark:text-stone-500 underline underline-offset-2 mt-2"
                  >
                    {entry.notiz ? "Notiz bearbeiten" : "+ Notiz"}
                  </button>
                )}
                {!authUser && entry.notiz && (
                  <div className="mt-2 text-sm text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded px-3 py-2">
                    📝 {entry.notiz}
                  </div>
                )}
                {authUser && (openNote === `${teamId}-${m.id}` || entry.notiz) && (
                  <textarea
                    value={entry.notiz}
                    onChange={(e) => setNote(m.id, e.target.value)}
                    placeholder="z. B. Ersatz von einer anderen Mannschaft, Fahrgemeinschaft…"
                    className="mt-2 w-full text-sm rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-stone-700 dark:text-stone-200"
                    rows={2}
                  />
                )}
              </div>
            </div>
          );
        })}
      </main>
      )}

      {/* Führungsansicht */}
      {view === "leader" && (
        <main className="max-w-2xl mx-auto px-5 mt-4">
          <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
            {team.matches.map((m, idx) => {
              const entry = data[m.id] || { availability: {}, notiz: "" };
              const avail = entry.availability || {};
              const s = computeMatchStatus(team.players, avail);
              const fest = team.players.length - s.open.length - s.unsicher.length - s.no.length;

              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-stone-400 dark:text-stone-500 font-bold">
                        #{idx + 1} · {m.weekday} {m.date} · {m.time}
                      </div>
                      <div className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
                        {m.opponent}
                      </div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 uppercase tracking-wide flex items-center gap-1">
                        {m.home ? <Home size={10} /> : <MapPin size={10} />}
                        {m.home ? "Heim" : "Auswärts"}
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        s.warning
                          ? "bg-red-600 text-white"
                          : s.complete
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {s.warning ? "⚠️ Zu wenig" : s.complete ? "✅ Komplett" : `${fest}/${team.players.length} fest`}
                    </span>
                  </div>

                  {(s.no.length > 0 || s.unsicher.length > 0 || s.open.length > 0) && (
                    <div className="mt-1.5 text-xs flex flex-wrap gap-x-3 gap-y-0.5">
                      {s.no.length > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          Abgesagt: {s.no.join(", ")}
                        </span>
                      )}
                      {s.unsicher.length > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">Unsicher: {s.unsicher.join(", ")}</span>
                      )}
                      {s.open.length > 0 && (
                        <span className="text-stone-400 dark:text-stone-500">Offen: {s.open.join(", ")}</span>
                      )}
                    </div>
                  )}

                  {entry.notiz && (
                    <div className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 italic">📝 {entry.notiz}</div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}

      <footer className="max-w-2xl mx-auto px-5 mt-8 text-center text-[11px] text-stone-400 dark:text-stone-600">
        Jeder Spieler meldet sich hier selbst zurück. Grün = kann spielen, Rot = abgesagt, Blau =
        auf Anfrage, Orange = in Klärung, Grau = noch offen. Spielpläne lt. WTTV, vorläufig bis
        17.07.2026. Adressen der Spielstätten nach bestem Wissen recherchiert – bitte vor
        Auswärtsfahrten sicherheitshalber im offiziellen Spielbericht prüfen.
      </footer>
    </div>
    </div>
  );
}
