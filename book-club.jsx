import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen, Search, Plus, X, Check, Copy, LogOut, Settings, Trash2,
  GripVertical, ChevronUp, ChevronDown, Lock, Unlock, Clock, Crown,
  Star, ExternalLink, ArrowRight, RotateCcw, Users, Award, AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Palette — "card catalog": walnut drawer, manila cards, rubber stamp
 * ------------------------------------------------------------------ */
const C = {
  wood: "#33302A",
  woodDark: "#26241F",
  manila: "#EDE4D1",
  manilaEdge: "#DDCFB1",
  ink: "#241E16",
  inkSoft: "#6A5C44",
  brass: "#9C7A1E",
  brassLight: "#C9A23F",
  stamp: "#B23A2E",
  cream: "#F7F2E6",
  line: "#CBB88E",
};
const MONO = "'Courier New', ui-monospace, Menlo, monospace";
const SERIF = "Georgia, 'Times New Roman', serif";

/* ------------------------------------------------------------------ *
 *  Storage — uses the artifact shared store; falls back to in-memory
 * ------------------------------------------------------------------ */
const mem = {};
const shim = {
  get: async (k) => (k in mem ? { key: k, value: mem[k] } : null),
  set: async (k, v) => ((mem[k] = v), { key: k, value: v }),
  delete: async (k) => { const had = k in mem; delete mem[k]; return { key: k, deleted: had }; },
  list: async (p = "") => ({ keys: Object.keys(mem).filter((k) => k.startsWith(p)) }),
};
const STORE = (typeof window !== "undefined" && window.storage) ? window.storage : shim;
const USING_SHIM = !(typeof window !== "undefined" && window.storage);

async function sGet(key, shared = true) {
  try { const r = await STORE.get(key, shared); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function sSet(key, val, shared = true) {
  try { const r = await STORE.set(key, JSON.stringify(val), shared); return !!r; }
  catch (e) { console.error("storage.set", e); return false; }
}
async function sDel(key, shared = true) { try { await STORE.delete(key, shared); } catch {} }
async function sList(prefix, shared = true) {
  try { const r = await STORE.list(prefix, shared); return r?.keys || []; } catch { return []; }
}

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = (n = 5) =>
  Array.from({ length: n }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

async function hashPass(p) {
  if (!p) return null;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 0; for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0;
    return "f" + h;
  }
}

function normalizeBook(item) {
  const v = item.volumeInfo || {};
  const img = v.imageLinks || {};
  return {
    id: item.id,
    title: v.title || "Untitled",
    subtitle: v.subtitle || "",
    authors: v.authors || [],
    year: (v.publishedDate || "").slice(0, 4),
    description: v.description || "",
    pageCount: v.pageCount || null,
    categories: v.categories || [],
    rating: v.averageRating || null,
    ratingsCount: v.ratingsCount || null,
    publisher: v.publisher || "",
    thumbnail: (img.thumbnail || img.smallThumbnail || "").replace("http://", "https://"),
    infoLink: v.infoLink || v.canonicalVolumeLink || "",
  };
}
async function searchBooks(q) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("search failed");
  const d = await r.json();
  return (d.items || []).map(normalizeBook);
}

const key = (code, suffix) => `bc:room:${code}:${suffix}`;

function computeBallot(subs) {
  const map = new Map();
  for (const s of subs) {
    const id = s.book.id;
    if (!map.has(id)) map.set(id, { bookId: id, book: s.book, recommenders: [] });
    if (!map.get(id).recommenders.includes(s.username)) map.get(id).recommenders.push(s.username);
  }
  return Array.from(map.values());
}
function computeResults(subs, votes) {
  const ballot = computeBallot(subs);
  const ids = ballot.map((b) => b.bookId);
  const points = Object.fromEntries(ids.map((id) => [id, 0]));
  const firsts = Object.fromEntries(ids.map((id) => [id, 0]));
  let cast = 0;
  for (const v of votes) {
    let ranking = (v.ranking || []).filter((id) => ids.includes(id));
    const missing = ids.filter((id) => !ranking.includes(id));
    ranking = ranking.concat(missing);
    if ((v.ranking || []).length) cast++;
    const M = ranking.length;
    ranking.forEach((id, i) => { points[id] += M - 1 - i; if (i === 0) firsts[id]++; });
  }
  const results = ballot
    .map((b) => ({ ...b, points: points[b.bookId], firsts: firsts[b.bookId] }))
    .sort((a, b) => b.points - a.points || b.firsts - a.firsts || a.book.title.localeCompare(b.book.title));
  return { results, ballotsCast: cast, total: ballot.length };
}

function fmtDeadline(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function timeLeft(ts) {
  const ms = ts - Date.now();
  if (ms <= 0) return "closing…";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m % 60}m left`;
  return `${m}m left`;
}

/* ------------------------------------------------------------------ *
 *  Small UI atoms
 * ------------------------------------------------------------------ */
function Btn({ children, onClick, kind = "primary", small, disabled, type = "button", full }) {
  const base = {
    primary: { background: C.brass, color: C.cream, border: `1px solid ${C.brass}` },
    ghost: { background: "transparent", color: C.cream, border: `1px solid ${C.brassLight}55` },
    dark: { background: C.ink, color: C.manila, border: `1px solid ${C.ink}` },
    danger: { background: "transparent", color: C.stamp, border: `1px solid ${C.stamp}88` },
    cardprimary: { background: C.ink, color: C.manila, border: `1px solid ${C.ink}` },
    cardghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
  }[kind];
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all ${small ? "px-3 py-1.5 text-sm" : "px-4 py-2.5"} ${full ? "w-full" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-px active:translate-y-0"}`}
      style={{ ...base, fontFamily: SERIF }}
    >
      {children}
    </button>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs uppercase tracking-widest" style={{ color: C.inkSoft, fontFamily: MONO }}>{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs" style={{ color: C.inkSoft, fontFamily: SERIF }}>{hint}</div>}
    </label>
  );
}
const inputStyle = {
  fontFamily: MONO, background: C.cream, color: C.ink,
  border: `1px solid ${C.line}`, borderRadius: 2,
};

/* ------------------------------------------------------------------ *
 *  Catalog card — the signature element
 * ------------------------------------------------------------------ */
function CatalogCard({ book, tab, children, onClick, dim, stamped }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""} transition-transform`}
      style={{
        background: C.manila, color: C.ink, borderRadius: 3,
        border: `1px solid ${C.manilaEdge}`,
        boxShadow: "0 1px 0 rgba(255,255,255,.4) inset, 0 6px 14px rgba(0,0,0,.28)",
        opacity: dim ? 0.55 : 1,
      }}
    >
      {/* punched hole + ruled top, like a real catalog card */}
      <div className="flex items-stretch">
        {tab != null && (
          <div className="flex flex-col items-center justify-start pt-3 px-2 shrink-0"
            style={{ borderRight: `1px dashed ${C.line}`, minWidth: 46 }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.inkSoft, fontFamily: MONO }}>№</div>
            <div className="text-xl font-bold leading-none" style={{ fontFamily: MONO }}>{tab}</div>
          </div>
        )}
        <div className="flex-1 min-w-0 p-3">{children}</div>
      </div>
      {stamped && (
        <div className="stamp-press pointer-events-none absolute right-2 top-2"
          style={{
            color: C.stamp, border: `2.5px solid ${C.stamp}`, borderRadius: 4,
            padding: "2px 8px", transform: "rotate(-11deg)", fontFamily: MONO,
            fontWeight: 700, letterSpacing: "1px", opacity: 0.92,
          }}>
          SELECTED
        </div>
      )}
    </div>
  );
}
function BookLines({ book, snippet }) {
  return (
    <>
      <div className="font-bold leading-tight" style={{ fontFamily: MONO, fontSize: 15 }}>{book.title}</div>
      {book.subtitle && <div className="text-xs italic leading-tight mt-0.5" style={{ fontFamily: SERIF, color: C.inkSoft }}>{book.subtitle}</div>}
      <div className="text-xs mt-1" style={{ fontFamily: MONO, color: C.inkSoft }}>
        {book.authors.length ? book.authors.join(", ") : "Unknown author"}{book.year ? ` · ${book.year}` : ""}
      </div>
      {snippet && book.description && (
        <div className="text-xs mt-2 leading-snug" style={{ fontFamily: SERIF, color: C.ink, opacity: 0.8 }}>
          {book.description.replace(/<[^>]+>/g, "").slice(0, 120)}…
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 *  Book details modal
 * ------------------------------------------------------------------ */
function DetailsModal({ entry, onClose }) {
  if (!entry) return null;
  const b = entry.book;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(20,18,14,.7)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-auto"
        style={{ background: C.manila, color: C.ink, borderRadius: 4, border: `1px solid ${C.manilaEdge}` }}>
        <div className="flex items-start gap-4 p-5" style={{ borderBottom: `1px dashed ${C.line}` }}>
          {b.thumbnail
            ? <img src={b.thumbnail} alt="" className="w-20 rounded-sm shadow" style={{ border: `1px solid ${C.line}` }} />
            : <div className="w-20 h-28 flex items-center justify-center rounded-sm" style={{ background: C.cream, border: `1px solid ${C.line}` }}><BookOpen size={22} color={C.inkSoft} /></div>}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-lg leading-tight" style={{ fontFamily: SERIF }}>{b.title}</div>
            {b.subtitle && <div className="text-sm italic" style={{ fontFamily: SERIF, color: C.inkSoft }}>{b.subtitle}</div>}
            <div className="text-sm mt-1" style={{ fontFamily: MONO, color: C.inkSoft }}>{b.authors.join(", ") || "Unknown author"}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ fontFamily: MONO, color: C.inkSoft }}>
              {b.year && <span>{b.year}</span>}
              {b.pageCount && <span>{b.pageCount} pp.</span>}
              {b.rating && <span className="inline-flex items-center gap-1"><Star size={11} fill={C.brass} color={C.brass} />{b.rating} ({b.ratingsCount || 0})</span>}
              {b.publisher && <span className="truncate max-w-[160px]">{b.publisher}</span>}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded hover:bg-black/10"><X size={18} /></button>
        </div>
        <div className="p-5">
          {entry.recommenders?.length > 0 && (
            <div className="mb-3 text-xs" style={{ fontFamily: MONO, color: C.inkSoft }}>
              Recommended by {entry.recommenders.join(", ")}
            </div>
          )}
          {b.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {b.categories.slice(0, 4).map((c) => (
                <span key={c} className="text-[11px] px-2 py-0.5 rounded-sm" style={{ fontFamily: MONO, background: C.cream, border: `1px solid ${C.line}`, color: C.inkSoft }}>{c}</span>
              ))}
            </div>
          )}
          <div className="text-sm leading-relaxed" style={{ fontFamily: SERIF }}>
            {b.description ? b.description.replace(/<[^>]+>/g, "") : "No description available from the catalog."}
          </div>
          {b.infoLink && (
            <a href={b.infoLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm" style={{ fontFamily: MONO, color: C.brass }}>
              View on Google Books <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Landing — create or join
 * ------------------------------------------------------------------ */
function Landing({ onCreate, onJoin }) {
  const [mode, setMode] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [limit, setLimit] = useState(3);
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");

  return (
    <div className="max-w-md mx-auto pt-10 pb-16 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3" style={{ color: C.brassLight }}>
          <BookOpen size={26} />
        </div>
        <h1 className="text-4xl leading-none" style={{ fontFamily: SERIF, color: C.cream }}>The Card Catalog</h1>
        <p className="mt-3 text-sm" style={{ fontFamily: MONO, color: C.brassLight }}>
          recommend · rank · decide — a pick for your book club
        </p>
      </div>

      {!mode && (
        <div className="space-y-3">
          <button onClick={() => setMode("create")} className="w-full text-left p-4 rounded-sm hover:-translate-y-px transition-transform"
            style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
            <div className="font-bold" style={{ fontFamily: SERIF, color: C.ink }}>Start a new round</div>
            <div className="text-sm" style={{ fontFamily: MONO, color: C.inkSoft }}>You'll host it and get a code to share.</div>
          </button>
          <button onClick={() => setMode("join")} className="w-full text-left p-4 rounded-sm hover:-translate-y-px transition-transform"
            style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
            <div className="font-bold" style={{ fontFamily: SERIF, color: C.ink }}>Join with a code</div>
            <div className="text-sm" style={{ fontFamily: MONO, color: C.inkSoft }}>A friend already started one.</div>
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="p-5 rounded-sm space-y-4" style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
          <Field label="Club / round name">
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. June Reads"
              className="w-full px-3 py-2.5 outline-none focus:ring-2" style={inputStyle} />
          </Field>
          <Field label="Books per person (max)" hint="Everyone submits at least one; this caps the most they can add.">
            <input type="number" min={1} max={10} value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2.5 outline-none focus:ring-2" style={inputStyle} />
          </Field>
          <div className="flex gap-2 pt-1">
            <Btn kind="cardghost" onClick={() => setMode(null)} small>Back</Btn>
            <Btn kind="cardprimary" full onClick={() => onCreate({ roomName: roomName.trim() || "Book Club", limit })}>
              Create round <ArrowRight size={16} />
            </Btn>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div className="p-5 rounded-sm space-y-4" style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
          <Field label="Room code">
            <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setErr(""); }}
              placeholder="5 characters" maxLength={6}
              className="w-full px-3 py-2.5 outline-none focus:ring-2 tracking-[0.3em] text-lg" style={inputStyle} />
          </Field>
          {err && <div className="text-sm flex items-center gap-1.5" style={{ color: C.stamp, fontFamily: MONO }}><AlertCircle size={14} />{err}</div>}
          <div className="flex gap-2">
            <Btn kind="cardghost" onClick={() => setMode(null)} small>Back</Btn>
            <Btn kind="cardprimary" full onClick={async () => {
              const code = joinCode.trim().toUpperCase();
              if (!code) return;
              const ok = await onJoin(code);
              if (!ok) setErr("No round found with that code.");
            }}>Find round <ArrowRight size={16} /></Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Sign-in (when2meet style: username + optional password)
 * ------------------------------------------------------------------ */
function SignIn({ meta, users, onSignIn, onLeave }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const existing = users.find((u) => u.username.toLowerCase() === name.trim().toLowerCase());
  const locked = existing?.passHash;

  async function go() {
    const username = name.trim();
    if (!username) return setErr("Pick a name first.");
    setErr("");
    const res = await onSignIn(username, pass);
    if (res === "wrong") setErr("That name is protected and the password didn't match.");
    if (res === "needpass") setErr("This name has a password. Enter it to continue.");
  }

  return (
    <div className="max-w-md mx-auto pt-10 pb-16 px-4">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.3em]" style={{ fontFamily: MONO, color: C.brassLight }}>{meta.name}</div>
        <h1 className="text-3xl mt-1" style={{ fontFamily: SERIF, color: C.cream }}>Sign the borrower card</h1>
      </div>
      <div className="p-5 rounded-sm space-y-4" style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
        <Field label="Your name">
          <input value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="what should the club call you?"
            className="w-full px-3 py-2.5 outline-none focus:ring-2" style={inputStyle} />
        </Field>
        <Field label={locked ? "Password (required for this name)" : "Password (optional)"}
          hint={locked ? undefined : "Set one to keep your name yours. Leave blank to skip — the room code already gates the room."}>
          <div className="relative">
            <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }}
              placeholder={locked ? "enter your password" : "optional"}
              className="w-full px-3 py-2.5 pr-9 outline-none focus:ring-2" style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && go()} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">{locked ? <Lock size={15} color={C.inkSoft} /> : <Unlock size={15} color={C.inkSoft} />}</span>
          </div>
        </Field>
        {existing && !locked && <div className="text-xs" style={{ fontFamily: MONO, color: C.inkSoft }}>Welcome back — this name is open, no password set.</div>}
        {err && <div className="text-sm flex items-center gap-1.5" style={{ color: C.stamp, fontFamily: MONO }}><AlertCircle size={14} />{err}</div>}
        <Btn kind="cardprimary" full onClick={go}>Enter the room <ArrowRight size={16} /></Btn>
      </div>
      {users.length > 0 && (
        <div className="mt-4 text-center text-xs" style={{ fontFamily: MONO, color: C.brassLight }}>
          Already inside: {users.map((u) => u.username).join(" · ")}
        </div>
      )}
      <div className="text-center mt-6">
        <button onClick={onLeave} className="text-xs" style={{ fontFamily: MONO, color: C.brassLight }}>← different room</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Header + stage strip
 * ------------------------------------------------------------------ */
const STAGES = [
  { id: "submission", label: "Recommend" },
  { id: "voting", label: "Vote" },
  { id: "results", label: "Verdict" },
];
function Header({ meta, user, isHost, onLeave, onToggleAdmin, copied, onCopy }) {
  const idx = STAGES.findIndex((s) => s.id === meta.stage);
  return (
    <div className="sticky top-0 z-30" style={{ background: C.woodDark, borderBottom: `1px solid #00000040` }}>
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg leading-none truncate" style={{ fontFamily: SERIF, color: C.cream }}>{meta.name}</div>
            <button onClick={onCopy} className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ fontFamily: MONO, color: C.brassLight }}>
              {copied ? <Check size={12} /> : <Copy size={12} />} code {meta.code}
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isHost && (
              <button onClick={onToggleAdmin} className="p-2 rounded-sm" style={{ color: C.brassLight, border: `1px solid ${C.brassLight}40` }} title="Host controls">
                <Settings size={16} />
              </button>
            )}
            <div className="text-right">
              <div className="text-xs flex items-center gap-1 justify-end" style={{ fontFamily: MONO, color: C.cream }}>
                {isHost && <Crown size={12} color={C.brassLight} />}{user}
              </div>
              <button onClick={onLeave} className="text-[11px] inline-flex items-center gap-1" style={{ fontFamily: MONO, color: C.brassLight }}>
                <LogOut size={10} /> leave
              </button>
            </div>
          </div>
        </div>
        {/* stage strip */}
        <div className="flex items-center gap-2 mt-3">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{
                  fontFamily: MONO,
                  background: i <= idx ? C.brass : "transparent",
                  color: i <= idx ? C.cream : C.brassLight,
                  border: `1px solid ${i <= idx ? C.brass : C.brassLight + "55"}`,
                }}>{i < idx ? <Check size={12} /> : i + 1}</div>
                <span className="text-xs uppercase tracking-wider hidden sm:inline" style={{
                  fontFamily: MONO, color: i === idx ? C.cream : C.brassLight, fontWeight: i === idx ? 700 : 400,
                }}>{s.label}</span>
              </div>
              {i < STAGES.length - 1 && <div className="h-px flex-1" style={{ background: i < idx ? C.brass : C.brassLight + "33" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Host controls panel
 * ------------------------------------------------------------------ */
function AdminPanel({ meta, users, subs, onClose, onUpdate, onCloseSubs, onCloseVoting, onReset, onBack }) {
  const [limit, setLimit] = useState(meta.submissionLimit);
  const [subDeadline, setSubDeadline] = useState(meta.submissionDeadline ? toLocalInput(meta.submissionDeadline) : "");
  const [voteDeadline, setVoteDeadline] = useState(meta.votingDeadline ? toLocalInput(meta.votingDeadline) : "");
  const counts = {};
  subs.forEach((s) => { counts[s.username] = (counts[s.username] || 0) + 1; });
  const missing = users.filter((u) => !counts[u.username]).map((u) => u.username);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(20,18,14,.6)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm h-full overflow-auto p-5"
        style={{ background: C.wood, borderLeft: `1px solid #00000040` }}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg flex items-center gap-2" style={{ fontFamily: SERIF, color: C.cream }}><Crown size={18} color={C.brassLight} /> Host controls</div>
          <button onClick={onClose} className="p-1" style={{ color: C.brassLight }}><X size={18} /></button>
        </div>

        {meta.stage === "submission" && (
          <div className="space-y-4">
            <div className="p-4 rounded-sm" style={{ background: C.manila }}>
              <Field label="Books per person (max)">
                <input type="number" min={1} max={10} value={limit}
                  onChange={(e) => setLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  className="w-full px-3 py-2 outline-none focus:ring-2" style={inputStyle} />
              </Field>
              <div className="mt-3">
                <Field label="Submission deadline (optional)" hint="Voting opens automatically when this passes.">
                  <input type="datetime-local" value={subDeadline} onChange={(e) => setSubDeadline(e.target.value)}
                    className="w-full px-3 py-2 outline-none focus:ring-2" style={inputStyle} />
                </Field>
              </div>
              <div className="mt-3">
                <Btn kind="cardghost" small full onClick={() => onUpdate({
                  submissionLimit: limit,
                  submissionDeadline: subDeadline ? new Date(subDeadline).getTime() : null,
                })}>Save settings</Btn>
              </div>
            </div>

            <div className="p-4 rounded-sm" style={{ background: C.manila }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: MONO, color: C.inkSoft }}>Who's submitted</div>
              {users.length === 0 && <div className="text-sm" style={{ fontFamily: SERIF, color: C.inkSoft }}>No one yet.</div>}
              {users.map((u) => (
                <div key={u.username} className="flex justify-between text-sm py-0.5" style={{ fontFamily: MONO, color: C.ink }}>
                  <span>{u.username}</span>
                  <span style={{ color: counts[u.username] ? C.ink : C.stamp }}>{counts[u.username] || 0} book{counts[u.username] === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>

            <Btn kind="primary" full onClick={() => {
              if (missing.length && !confirm(`${missing.join(", ")} haven't submitted a book yet. Close submissions and open voting anyway?`)) return;
              onCloseSubs();
            }}>Close submissions, open voting <ArrowRight size={16} /></Btn>
          </div>
        )}

        {meta.stage === "voting" && (
          <div className="space-y-4">
            <div className="p-4 rounded-sm" style={{ background: C.manila }}>
              <Field label="Voting deadline (optional)" hint="Results reveal automatically when this passes.">
                <input type="datetime-local" value={voteDeadline} onChange={(e) => setVoteDeadline(e.target.value)}
                  className="w-full px-3 py-2 outline-none focus:ring-2" style={inputStyle} />
              </Field>
              <div className="mt-3">
                <Btn kind="cardghost" small full onClick={() => onUpdate({ votingDeadline: voteDeadline ? new Date(voteDeadline).getTime() : null })}>Save deadline</Btn>
              </div>
            </div>
            <Btn kind="primary" full onClick={() => { if (confirm("Close voting and reveal the verdict?")) onCloseVoting(); }}>
              Close voting, reveal verdict <Award size={16} />
            </Btn>
            <Btn kind="ghost" small full onClick={() => onUpdate({ stage: "submission" })}>← reopen submissions</Btn>
          </div>
        )}

        {meta.stage === "results" && (
          <div className="space-y-4">
            <div className="p-4 rounded-sm text-sm" style={{ background: C.manila, fontFamily: SERIF, color: C.ink }}>
              The verdict is in. Start a fresh round to clear all books and votes, keeping everyone signed in.
            </div>
            <Btn kind="ghost" small full onClick={() => onUpdate({ stage: "voting", finalBookId: null, results: null })}>← back to voting</Btn>
            <Btn kind="danger" full onClick={() => { if (confirm("Clear all submissions and votes and start a new round?")) onReset(); }}>
              <RotateCcw size={15} /> Start a new round
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
function toLocalInput(ts) {
  const d = new Date(ts - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

/* ------------------------------------------------------------------ *
 *  Stage 1 — submission
 * ------------------------------------------------------------------ */
function SubmissionStage({ meta, user, isHost, mySubs, allSubs, users, onAdd, onRemove, onDetails }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mAuthor, setMAuthor] = useState("");
  const tRef = useRef();

  const limit = meta.submissionLimit;
  const atLimit = mySubs.length >= limit;
  const mineIds = new Set(mySubs.map((s) => s.book.id));

  useEffect(() => {
    clearTimeout(tRef.current);
    if (!q.trim()) { setResults([]); setError(""); return; }
    tRef.current = setTimeout(async () => {
      setLoading(true); setError("");
      try { setResults(await searchBooks(q)); }
      catch { setError("Couldn't reach the book catalog. Try again, or add a title by hand below."); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(tRef.current);
  }, [q]);

  const submittedCount = new Set(allSubs.map((s) => s.username)).size;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h2 className="text-2xl" style={{ fontFamily: SERIF, color: C.cream }}>Recommend your books</h2>
        <p className="text-sm mt-1" style={{ fontFamily: MONO, color: C.brassLight }}>
          At least one, up to {limit}. {meta.submissionDeadline && <span><Clock size={11} className="inline -mt-0.5" /> {timeLeft(meta.submissionDeadline)}</span>}
        </p>
      </div>

      {/* my picks */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: MONO, color: C.brassLight }}>
          Your picks — {mySubs.length}/{limit}
        </div>
        {mySubs.length === 0 && (
          <div className="p-4 rounded-sm text-sm" style={{ background: C.manila, color: C.inkSoft, fontFamily: SERIF, border: `1px dashed ${C.line}` }}>
            You haven't added a book yet. Search below to make your first recommendation.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {mySubs.map((s) => (
            <CatalogCard key={s.book.id} book={s.book}>
              <div className="flex gap-3">
                {s.book.thumbnail
                  ? <img src={s.book.thumbnail} alt="" className="w-12 shrink-0 rounded-sm" style={{ border: `1px solid ${C.line}` }} />
                  : <div className="w-12 h-16 shrink-0 flex items-center justify-center rounded-sm" style={{ background: C.cream, border: `1px solid ${C.line}` }}><BookOpen size={16} color={C.inkSoft} /></div>}
                <div className="min-w-0 flex-1"><BookLines book={s.book} /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Btn kind="cardghost" small onClick={() => onDetails({ book: s.book })}>Details</Btn>
                <Btn kind="danger" small onClick={() => onRemove(s.book.id)}><Trash2 size={13} /> Remove</Btn>
              </div>
            </CatalogCard>
          ))}
        </div>
      </div>

      {/* search */}
      {!atLimit ? (
        <div className="p-4 rounded-sm" style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, author, ISBN…"
              className="w-full pl-9 pr-3 py-2.5 outline-none focus:ring-2" style={inputStyle} />
          </div>
          {loading && <div className="text-sm mt-3" style={{ fontFamily: MONO, color: C.inkSoft }}>Searching the catalog…</div>}
          {error && <div className="text-sm mt-3 flex items-center gap-1.5" style={{ color: C.stamp, fontFamily: MONO }}><AlertCircle size={14} />{error}</div>}

          <div className="mt-3 space-y-2 max-h-96 overflow-auto">
            {results.map((b) => {
              const have = mineIds.has(b.id);
              return (
                <div key={b.id} className="flex gap-3 p-2 rounded-sm items-center" style={{ background: C.cream, border: `1px solid ${C.line}` }}>
                  {b.thumbnail
                    ? <img src={b.thumbnail} alt="" className="w-10 shrink-0 rounded-sm" />
                    : <div className="w-10 h-14 shrink-0 flex items-center justify-center rounded-sm" style={{ background: C.manila }}><BookOpen size={14} color={C.inkSoft} /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm leading-tight truncate" style={{ fontFamily: MONO, color: C.ink }}>{b.title}</div>
                    <div className="text-xs truncate" style={{ fontFamily: MONO, color: C.inkSoft }}>{b.authors.join(", ") || "Unknown"}{b.year ? ` · ${b.year}` : ""}</div>
                  </div>
                  <button onClick={() => onDetails({ book: b })} className="text-xs px-2 py-1 shrink-0" style={{ fontFamily: MONO, color: C.brass }}>info</button>
                  <Btn kind="cardprimary" small disabled={have} onClick={() => onAdd(b)}>
                    {have ? <Check size={13} /> : <Plus size={13} />}{have ? "Added" : "Add"}
                  </Btn>
                </div>
              );
            })}
          </div>

          <button onClick={() => setManual(!manual)} className="mt-3 text-xs" style={{ fontFamily: MONO, color: C.brass }}>
            {manual ? "− hide manual entry" : "+ can't find it? add by hand"}
          </button>
          {manual && (
            <div className="mt-2 grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Title"
                className="px-3 py-2 outline-none focus:ring-2" style={inputStyle} />
              <input value={mAuthor} onChange={(e) => setMAuthor(e.target.value)} placeholder="Author"
                className="px-3 py-2 outline-none focus:ring-2" style={inputStyle} />
              <Btn kind="cardprimary" small disabled={!mTitle.trim()} onClick={() => {
                onAdd({ id: "manual-" + Math.random().toString(36).slice(2, 9), title: mTitle.trim(), subtitle: "", authors: mAuthor.trim() ? [mAuthor.trim()] : [], year: "", description: "", pageCount: null, categories: [], rating: null, thumbnail: "", infoLink: "" });
                setMTitle(""); setMAuthor("");
              }}>Add</Btn>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-sm text-sm flex items-center gap-2" style={{ background: C.manila, color: C.ink, fontFamily: SERIF, border: `1px solid ${C.manilaEdge}` }}>
          <Check size={16} color={C.brass} /> You've hit your limit of {limit}. Remove one to swap it out.
        </div>
      )}

      {/* room status */}
      <div className="mt-6 text-center text-xs" style={{ fontFamily: MONO, color: C.brassLight }}>
        <Users size={12} className="inline -mt-0.5" /> {submittedCount}/{users.length} member{users.length === 1 ? "" : "s"} have submitted
        {isHost && " · open the host panel to start voting"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Stage 2 — ranked voting
 * ------------------------------------------------------------------ */
function VotingStage({ meta, user, isHost, subs, myVote, onSaveVote, onDetails }) {
  const ballot = computeBallot(subs);
  const byId = Object.fromEntries(ballot.map((b) => [b.bookId, b]));
  const idsKey = ballot.map((b) => b.bookId).sort().join("|");

  const [order, setOrder] = useState([]);
  const [saved, setSaved] = useState(false);
  const [dragI, setDragI] = useState(null);

  // init order once per ballot composition
  useEffect(() => {
    const ids = ballot.map((b) => b.bookId);
    let init = (myVote?.ranking || []).filter((id) => ids.includes(id));
    init = init.concat(ids.filter((id) => !init.includes(id)));
    setOrder(init);
    setSaved(!!myVote?.ranking?.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const move = (from, to) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setOrder(next); setSaved(false);
  };

  const submitVote = () => { onSaveVote(order); setSaved(true); };

  if (ballot.length === 0) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center" style={{ fontFamily: SERIF, color: C.cream }}>No books were submitted this round.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h2 className="text-2xl" style={{ fontFamily: SERIF, color: C.cream }}>Rank the ballot</h2>
        <p className="text-sm mt-1" style={{ fontFamily: MONO, color: C.brassLight }}>
          Drag — or use the arrows — so your top choice sits at №1. {meta.votingDeadline && <span><Clock size={11} className="inline -mt-0.5" /> {timeLeft(meta.votingDeadline)}</span>}
        </p>
      </div>

      <div className="space-y-3">
        {order.map((id, i) => {
          const entry = byId[id];
          if (!entry) return null;
          const b = entry.book;
          return (
            <div key={id} draggable
              onDragStart={() => setDragI(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragI !== null && dragI !== i) move(dragI, i); setDragI(null); }}
              onDragEnd={() => setDragI(null)}
              style={{ opacity: dragI === i ? 0.4 : 1 }}>
              <CatalogCard book={b} tab={i + 1}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col -my-1">
                    <button onClick={() => move(i, i - 1)} disabled={i === 0} className="p-0.5 disabled:opacity-25"><ChevronUp size={16} color={C.inkSoft} /></button>
                    <span className="cursor-grab active:cursor-grabbing"><GripVertical size={14} color={C.line} /></span>
                    <button onClick={() => move(i, i + 1)} disabled={i === order.length - 1} className="p-0.5 disabled:opacity-25"><ChevronDown size={16} color={C.inkSoft} /></button>
                  </div>
                  {b.thumbnail
                    ? <img src={b.thumbnail} alt="" className="w-11 shrink-0 rounded-sm" style={{ border: `1px solid ${C.line}` }} />
                    : <div className="w-11 h-15 shrink-0 flex items-center justify-center rounded-sm" style={{ background: C.cream, border: `1px solid ${C.line}` }}><BookOpen size={15} color={C.inkSoft} /></div>}
                  <div className="min-w-0 flex-1"><BookLines book={b} /></div>
                  <Btn kind="cardghost" small onClick={() => onDetails(entry)}>Details</Btn>
                </div>
              </CatalogCard>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3 justify-center">
        <Btn kind="primary" onClick={submitVote}>{saved ? <><Check size={16} /> Ballot saved</> : <>Lock in my ranking</>}</Btn>
        {saved && <span className="text-xs" style={{ fontFamily: MONO, color: C.brassLight }}>edit and re-save anytime until voting closes</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Stage 3 — results
 * ------------------------------------------------------------------ */
function ResultsStage({ meta, subs, votes, onDetails }) {
  const { results, ballotsCast } = meta.results || computeResults(subs, votes);
  if (!results || results.length === 0) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center" style={{ fontFamily: SERIF, color: C.cream }}>No results to show.</div>;
  }
  const winner = results[0];
  const maxPts = Math.max(1, results[0].points);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.3em]" style={{ fontFamily: MONO, color: C.brassLight }}>{ballotsCast} ballot{ballotsCast === 1 ? "" : "s"} counted</div>
        <h2 className="text-3xl mt-1" style={{ fontFamily: SERIF, color: C.cream }}>The club will read…</h2>
      </div>

      {/* winner card with stamp */}
      <CatalogCard book={winner.book} stamped onClick={() => onDetails(winner)}>
        <div className="flex gap-4 pr-20">
          {winner.book.thumbnail
            ? <img src={winner.book.thumbnail} alt="" className="w-20 shrink-0 rounded-sm" style={{ border: `1px solid ${C.line}` }} />
            : <div className="w-20 h-28 shrink-0 flex items-center justify-center rounded-sm" style={{ background: C.cream, border: `1px solid ${C.line}` }}><BookOpen size={22} color={C.inkSoft} /></div>}
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold leading-tight" style={{ fontFamily: SERIF }}>{winner.book.title}</div>
            <div className="text-sm mt-0.5" style={{ fontFamily: MONO, color: C.inkSoft }}>{winner.book.authors.join(", ") || "Unknown author"}</div>
            <div className="text-xs mt-2" style={{ fontFamily: MONO, color: C.inkSoft }}>
              {winner.points} pts · {winner.firsts} first-place {winner.firsts === 1 ? "vote" : "votes"}
            </div>
            <div className="text-xs mt-1" style={{ fontFamily: MONO, color: C.inkSoft }}>recommended by {winner.recommenders.join(", ")}</div>
          </div>
        </div>
      </CatalogCard>

      {/* full standings */}
      <div className="text-xs uppercase tracking-widest mt-7 mb-2" style={{ fontFamily: MONO, color: C.brassLight }}>Full standings</div>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={r.bookId} className="flex items-center gap-3 p-3 rounded-sm" style={{ background: C.manila, border: `1px solid ${C.manilaEdge}` }}>
            <div className="w-6 text-center font-bold" style={{ fontFamily: MONO, color: i === 0 ? C.stamp : C.inkSoft }}>{i + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-tight truncate" style={{ fontFamily: MONO, color: C.ink }}>{r.book.title}</div>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: C.cream }}>
                <div style={{ width: `${(r.points / maxPts) * 100}%`, background: i === 0 ? C.stamp : C.brass, height: "100%" }} />
              </div>
            </div>
            <div className="text-xs shrink-0 w-12 text-right" style={{ fontFamily: MONO, color: C.inkSoft }}>{r.points} pts</div>
            <button onClick={() => onDetails(r)} className="text-xs shrink-0" style={{ fontFamily: MONO, color: C.brass }}>info</button>
          </div>
        ))}
      </div>
      <div className="text-center text-[11px] mt-5" style={{ fontFamily: MONO, color: C.brassLight }}>
        Scored by Borda count — each rank position earns points, summed across every ballot.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Root
 * ------------------------------------------------------------------ */
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | signin | room
  const [code, setCode] = useState(null);
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState(null);
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [votes, setVotes] = useState([]);
  const [details, setDetails] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [booted, setBooted] = useState(false);

  const isHost = meta && user && meta.hostUsername === user;

  /* ---- data loading ---- */
  const loadRoom = useCallback(async (rc) => {
    const m = await sGet(key(rc, "meta"));
    if (!m) return null;
    const uKeys = await sList(key(rc, "user:"));
    const us = (await Promise.all(uKeys.map((k) => sGet(k)))).filter(Boolean);
    const sKeys = await sList(key(rc, "subs:"));
    const sArr = (await Promise.all(sKeys.map((k) => sGet(k)))).filter(Boolean);
    const vKeys = await sList(key(rc, "vote:"));
    const vs = (await Promise.all(vKeys.map((k) => sGet(k)))).filter(Boolean);
    return { meta: m, users: us, subs: sArr.flat(), votes: vs };
  }, []);

  const refresh = useCallback(async (rc) => {
    const c = rc || code;
    if (!c) return;
    const data = await loadRoom(c);
    if (!data) return;
    let m = data.meta;
    // deadline-driven auto-advance (any client can flip it; last write wins)
    const now = Date.now();
    if (m.stage === "submission" && m.submissionDeadline && now > m.submissionDeadline) {
      m = { ...m, stage: "voting", votingStartedAt: now };
      await sSet(key(c, "meta"), m);
    } else if (m.stage === "voting" && m.votingDeadline && now > m.votingDeadline) {
      const res = computeResults(data.subs, data.votes);
      m = { ...m, stage: "results", results: res, finalBookId: res.results[0]?.bookId || null };
      await sSet(key(c, "meta"), m);
    }
    setMeta(m); setUsers(data.users); setSubs(data.subs); setVotes(data.votes);
  }, [code, loadRoom]);

  /* ---- restore session ---- */
  useEffect(() => {
    (async () => {
      const s = await sGet("bc:session", false);
      if (s?.code && s?.user) {
        const data = await loadRoom(s.code);
        if (data && data.users.some((u) => u.username === s.user)) {
          setCode(s.code); setUser(s.user);
          setMeta(data.meta); setUsers(data.users); setSubs(data.subs); setVotes(data.votes);
          setScreen("room");
        }
      }
      setBooted(true);
    })();
  }, [loadRoom]);

  /* ---- polling ---- */
  useEffect(() => {
    if (screen !== "room" || !code) return;
    const id = setInterval(() => refresh(code), 4000);
    return () => clearInterval(id);
  }, [screen, code, refresh]);

  /* ---- actions ---- */
  async function createRoom({ roomName, limit }) {
    let rc = makeCode();
    for (let i = 0; i < 5 && (await sGet(key(rc, "meta"))); i++) rc = makeCode();
    const m = {
      code: rc, name: roomName, hostUsername: null, stage: "submission",
      submissionLimit: limit, submissionDeadline: null, votingDeadline: null,
      createdAt: Date.now(), finalBookId: null, results: null,
    };
    await sSet(key(rc, "meta"), m);
    setCode(rc); setMeta(m); setUsers([]); setSubs([]); setVotes([]);
    setScreen("signin");
  }

  async function joinRoom(rc) {
    const data = await loadRoom(rc);
    if (!data) return false;
    setCode(rc); setMeta(data.meta); setUsers(data.users); setSubs(data.subs); setVotes(data.votes);
    setScreen("signin");
    return true;
  }

  async function signIn(username, pass) {
    const data = await loadRoom(code);
    const existing = (data?.users || []).find((u) => u.username.toLowerCase() === username.toLowerCase());
    const realName = existing ? existing.username : username;
    if (existing?.passHash) {
      if (!pass) return "needpass";
      if ((await hashPass(pass)) !== existing.passHash) return "wrong";
    } else if (!existing) {
      await sSet(key(code, "user:" + realName), { username: realName, passHash: await hashPass(pass), joinedAt: Date.now() });
    }
    // first signer-in becomes host
    let m = data.meta;
    if (!m.hostUsername) { m = { ...m, hostUsername: realName }; await sSet(key(code, "meta"), m); }
    setUser(realName);
    await sSet("bc:session", { code, user: realName }, false);
    await refresh(code);
    setScreen("room");
    return "ok";
  }

  function leave() {
    sDel("bc:session", false);
    setScreen("landing"); setCode(null); setUser(null); setMeta(null);
    setUsers([]); setSubs([]); setVotes([]); setShowAdmin(false);
  }

  const mySubs = subs.filter((s) => s.username === user);
  async function addBook(book) {
    if (mySubs.length >= meta.submissionLimit) return;
    if (mySubs.some((s) => s.book.id === book.id)) return;
    const next = [...mySubs, { username: user, book, createdAt: Date.now() }];
    await sSet(key(code, "subs:" + user), next);
    setSubs([...subs.filter((s) => s.username !== user), ...next]);
  }
  async function removeBook(bookId) {
    const next = mySubs.filter((s) => s.book.id !== bookId);
    await sSet(key(code, "subs:" + user), next);
    setSubs([...subs.filter((s) => s.username !== user), ...next]);
  }
  async function saveVote(ranking) {
    const v = { username: user, ranking, updatedAt: Date.now() };
    await sSet(key(code, "vote:" + user), v);
    setVotes([...votes.filter((x) => x.username !== user), v]);
  }

  async function updateMeta(patch) {
    const m = { ...meta, ...patch };
    await sSet(key(code, "meta"), m);
    setMeta(m);
  }
  async function closeSubs() { await updateMeta({ stage: "voting", votingStartedAt: Date.now() }); setShowAdmin(false); }
  async function closeVoting() {
    const res = computeResults(subs, votes);
    await updateMeta({ stage: "results", results: res, finalBookId: res.results[0]?.bookId || null });
    setShowAdmin(false);
  }
  async function resetRound() {
    for (const k of await sList(key(code, "subs:"))) await sDel(k);
    for (const k of await sList(key(code, "vote:"))) await sDel(k);
    await updateMeta({ stage: "submission", finalBookId: null, results: null });
    setSubs([]); setVotes([]); setShowAdmin(false);
  }

  const myVote = votes.find((v) => v.username === user);

  /* ---- render ---- */
  if (!booted) return <div style={{ minHeight: "100vh", background: C.wood }} />;

  return (
    <div style={{ minHeight: "100vh", background: C.wood }}>
      <style>{`
        *:focus-visible { outline: 2px solid ${C.brassLight}; outline-offset: 2px; }
        input::placeholder { color: ${C.inkSoft}88; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(.4); }
        @keyframes stampIn { 0%{transform:rotate(-11deg) scale(2.4);opacity:0} 60%{transform:rotate(-11deg) scale(.9);opacity:1} 100%{transform:rotate(-11deg) scale(1)} }
        .stamp-press { animation: stampIn .5s cubic-bezier(.2,1.4,.4,1) both; }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important; transition:none!important;} }
        ::-webkit-scrollbar{width:10px;height:10px} ::-webkit-scrollbar-thumb{background:${C.line};border-radius:6px}
      `}</style>

      {USING_SHIM && (
        <div className="text-center text-[11px] py-1.5 px-4" style={{ background: C.stamp, color: C.cream, fontFamily: MONO }}>
          Preview mode — shared storage isn't available here, so data won't sync between people or survive a refresh.
        </div>
      )}

      {screen === "landing" && <Landing onCreate={createRoom} onJoin={joinRoom} />}

      {screen === "signin" && meta && (
        <SignIn meta={meta} users={users} onSignIn={signIn} onLeave={leave} />
      )}

      {screen === "room" && meta && (
        <>
          <Header
            meta={meta} user={user} isHost={isHost} onLeave={leave}
            onToggleAdmin={() => setShowAdmin(true)}
            copied={copied}
            onCopy={() => { navigator.clipboard?.writeText(meta.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          />
          {meta.stage === "submission" && (
            <SubmissionStage
              meta={meta} user={user} isHost={isHost} mySubs={mySubs} allSubs={subs} users={users}
              onAdd={addBook} onRemove={removeBook} onDetails={setDetails}
            />
          )}
          {meta.stage === "voting" && (
            <VotingStage
              meta={meta} user={user} isHost={isHost} subs={subs} myVote={myVote}
              onSaveVote={saveVote} onDetails={setDetails}
            />
          )}
          {meta.stage === "results" && (
            <ResultsStage meta={meta} subs={subs} votes={votes} onDetails={setDetails} />
          )}

          {showAdmin && isHost && (
            <AdminPanel
              meta={meta} users={users} subs={subs}
              onClose={() => setShowAdmin(false)}
              onUpdate={updateMeta} onCloseSubs={closeSubs} onCloseVoting={closeVoting} onReset={resetRound}
            />
          )}
        </>
      )}

      <DetailsModal entry={details} onClose={() => setDetails(null)} />

      <div className="text-center py-6 text-[11px]" style={{ fontFamily: MONO, color: C.brassLight + "99" }}>
        book data via Google Books
      </div>
    </div>
  );
}
