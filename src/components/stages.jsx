/* TOOB website — stages: Submission, Voting, Results, Admin, modal */
(function () {
  const DS = window.TOOBDesignSystem_7cdcf9;
  const { Button, Field, Input, Badge } = DS;
  const TubeCard = window.TOOB_VCard;        // vintage paper-on-leather card
  const ProgressTube = window.TOOB_VProgress; // vintage aged-paper bar
  const Icon = window.TOOB_Icon;
  const { computeBallot, computeResults } = window.TOOB_DATA;

  /* ---- a local color "spine" instead of a fetched cover ---- */
  function Spine({ book, w = 46 }) {
    return (
      <div style={{
        width: w, height: w * 1.42, flex: "none", borderRadius: 2, overflow: "hidden",
        background: book.color || "var(--steel-400)",
        border: "1px solid rgba(0,0,0,.35)",
        boxShadow: "1px 0 0 rgba(255,255,255,.25) inset, 0 2px 5px rgba(0,0,0,.3)",
        display: "flex", alignItems: "flex-end", padding: 5,
      }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: w * 0.18, lineHeight: 1.05, color: "rgba(255,255,255,.92)", textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>{book.title}</span>
      </div>
    );
  }
  function BookLines({ book, snippet }) {
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", lineHeight: 1.15 }}>{book.title}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-soft)", marginTop: 3 }}>
          {(book.authors || []).join(", ") || "Unknown author"}{book.year ? ` · ${book.year}` : ""}
        </div>
        {snippet && book.desc && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", opacity: 0.85, marginTop: 7, lineHeight: 1.45 }}>{book.desc}</div>
        )}
      </div>
    );
  }

  const Eyebrow = ({ children }) => (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--magenta-soft)" }}>{children}</div>
  );
  const PageHead = ({ children }) => (
    <h2 style={{ fontFamily: "var(--font-marker)", fontSize: 32, color: "var(--steel-50)", margin: "2px 0 0", transform: "rotate(-1.5deg)" }}>{children}</h2>
  );

  /* ---- Stage 1: Submission ---- */
  function Submission({ meta, mySubs, members, allSubs, onAdd, onRemove, onDetails }) {
    const [q, setQ] = React.useState("");
    const limit = meta.limit;
    const atLimit = mySubs.length >= limit;
    const mineIds = new Set(mySubs.map((s) => s.book.id));
    const results = q.trim()
      ? window.TOOB_DATA.BOOKS.filter((b) => (b.title + " " + b.authors.join(" ")).toLowerCase().includes(q.toLowerCase()))
      : [];
    const submitted = new Set(allSubs.map((s) => s.username)).size;

    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 18px 60px" }}>
        <div style={{ marginBottom: 22 }}>
          <PageHead>Recommend your books</PageHead>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-on-dark-soft)", marginTop: 8 }}>At least one, up to {limit}.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--magenta-soft)", marginBottom: 10 }}>Your picks — {mySubs.length}/{limit}</div>
          {mySubs.length === 0 && (
            <div style={{ padding: 16, borderRadius: "var(--r-xs)", background: "var(--surface-card)", border: "1px dashed var(--line-strong)", fontFamily: "var(--font-sans)", color: "var(--text-soft)", fontSize: 14 }}>
              You haven't added a book yet. Search below to make your first recommendation.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {mySubs.map((s) => (
              <TubeCard key={s.book.id}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Spine book={s.book} w={42} />
                  <BookLines book={s.book} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button variant="steel" size="sm" onClick={() => onDetails(s.book)}>Details</Button>
                  <Button variant="danger" size="sm" onClick={() => onRemove(s.book.id)}><Icon n="trash-2" size={13} /> Remove</Button>
                </div>
              </TubeCard>
            ))}
          </div>
        </div>

        {!atLimit ? (
          <div style={{ padding: 16, borderRadius: "var(--r-xs)", background: "var(--surface-card)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", display: "inline-flex" }}><Icon n="search" size={16} /></span>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or author…" style={{ paddingLeft: 36 }} />
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflow: "auto" }}>
              {results.map((b) => {
                const have = mineIds.has(b.id);
                return (
                  <div key={b.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 8, borderRadius: "var(--r-xs)", background: "var(--surface-inset)", border: "1px solid var(--line)" }}>
                    <Spine book={b} w={32} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-soft)" }}>{b.authors.join(", ")} · {b.year}</div>
                    </div>
                    <button onClick={() => onDetails(b)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-brown)" }}>info</button>
                    <Button variant="steel" size="sm" disabled={have} onClick={() => onAdd(b)}>{have ? <Icon n="check" size={13} /> : <Icon n="plus" size={13} />} {have ? "Added" : "Add"}</Button>
                  </div>
                );
              })}
              {q.trim() && results.length === 0 && (
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-soft)", padding: "4px 2px" }}>Nothing matched “{q}”. Try another title.</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, borderRadius: "var(--r-xs)", background: "var(--surface-card)", border: "1px solid var(--line)", fontFamily: "var(--font-sans)", color: "var(--text-strong)" }}>
            <Icon n="check" size={16} color="var(--ink-brown)" /> You've hit your limit of {limit}. Remove one to swap it out.
          </div>
        )}

        <div style={{ marginTop: 22, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-on-dark-soft)" }}>
          <Icon n="users" size={12} /> {submitted}/{members.length} members have submitted
        </div>
      </div>
    );
  }

  /* ---- Stage 2: Voting ---- */
  function Voting({ meta, subs, myRanking, onSave, onDetails }) {
    const ballot = computeBallot(subs);
    const byId = Object.fromEntries(ballot.map((b) => [b.bookId, b]));
    const init = () => {
      const ids = ballot.map((b) => b.bookId);
      let o = (myRanking || []).filter((id) => ids.includes(id));
      return o.concat(ids.filter((id) => !o.includes(id)));
    };
    const [order, setOrder] = React.useState(init);
    const [saved, setSaved] = React.useState(!!(myRanking && myRanking.length));
    const [dragI, setDragI] = React.useState(null);
    const move = (from, to) => {
      if (to < 0 || to >= order.length) return;
      const next = [...order]; const [m] = next.splice(from, 1); next.splice(to, 0, m);
      setOrder(next); setSaved(false);
    };
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 18px 60px" }}>
        <div style={{ marginBottom: 22 }}>
          <PageHead>Rank the ballot</PageHead>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-on-dark-soft)", marginTop: 8 }}>Drag — or use the arrows — so your top choice sits at №1.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {order.map((id, i) => {
            const entry = byId[id]; if (!entry) return null; const b = entry.book;
            return (
              <div key={id} draggable
                onDragStart={() => setDragI(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragI !== null && dragI !== i) move(dragI, i); setDragI(null); }}
                onDragEnd={() => setDragI(null)}
                style={{ opacity: dragI === i ? 0.4 : 1 }}>
                <TubeCard tab={i + 1}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", margin: "-4px 0" }}>
                      <button onClick={() => move(i, i - 1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: i === 0 ? 0.25 : 1 }}><Icon n="chevron-up" size={16} color="var(--text-soft)" /></button>
                      <span style={{ display: "grid", placeItems: "center", cursor: "grab", color: "var(--line-strong)" }}><Icon n="grip-vertical" size={14} /></span>
                      <button onClick={() => move(i, i + 1)} disabled={i === order.length - 1} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: i === order.length - 1 ? 0.25 : 1 }}><Icon n="chevron-down" size={16} color="var(--text-soft)" /></button>
                    </div>
                    <Spine book={b} w={40} />
                    <div style={{ flex: 1, minWidth: 0 }}><BookLines book={b} /></div>
                    <Button variant="steel" size="sm" onClick={() => onDetails(b)}>Details</Button>
                  </div>
                </TubeCard>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
          <Button variant="accent" onClick={() => { onSave(order); setSaved(true); }}>
            {saved ? <><Icon n="check" size={16} /> Ballot saved</> : "Lock in my ranking"}
          </Button>
          {saved && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-on-dark-soft)" }}>edit and re-save anytime until voting closes</span>}
        </div>
      </div>
    );
  }

  /* ---- Stage 3: Results ---- */
  function Results({ subs, votes, onDetails }) {
    const { results, ballotsCast } = computeResults(subs, votes);
    const winner = results[0];
    const maxPts = Math.max(1, results[0].points);
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 18px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Eyebrow>{ballotsCast} ballot{ballotsCast === 1 ? "" : "s"} counted</Eyebrow>
          <PageHead>The club will read…</PageHead>
        </div>
        <TubeCard tab={1} glowTab stamped stampLabel="WINNER" onClick={() => onDetails(winner.book)}>
          <div style={{ display: "flex", gap: 16, paddingRight: 84 }}>
            <Spine book={winner.book} w={64} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "var(--font-marker)", fontSize: 24, color: "var(--text-strong)", lineHeight: 1.05 }}>{winner.book.title}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-soft)", marginTop: 4 }}>{winner.book.authors.join(", ")}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-soft)", marginTop: 10 }}>{winner.points} pts · {winner.firsts} first-place {winner.firsts === 1 ? "vote" : "votes"}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-soft)", marginTop: 3 }}>recommended by {winner.recommenders.join(", ")}</div>
            </div>
          </div>
        </TubeCard>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--magenta-soft)", margin: "26px 0 10px" }}>Full standings</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((r, i) => (
            <div key={r.bookId} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: "var(--r-xs)", background: "var(--surface-card)", border: "1px solid var(--line)" }}>
              <div style={{ width: 22, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: i === 0 ? "var(--magenta-dark)" : "var(--text-soft)" }}>{i + 1}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.book.title}</div>
                <div style={{ marginTop: 7 }}><ProgressTube value={(r.points / maxPts) * 100} leader={i === 0} /></div>
              </div>
              <div style={{ width: 52, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-soft)" }}>{r.points} pts</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-on-dark-soft)", marginTop: 20 }}>
          Scored by Borda count — each rank position earns points, summed across every ballot.
        </div>
      </div>
    );
  }

  /* ---- Host controls (slide-over) ---- */
  function AdminPanel({ meta, members, subs, onClose, onAdvance, onReset }) {
    const counts = {}; subs.forEach((s) => counts[s.username] = (counts[s.username] || 0) + 1);
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end", background: "rgba(20,18,14,.6)" }} onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, height: "100%", overflow: "auto", padding: 20, background: "var(--grad-wood)", borderLeft: "1px solid #1c1208" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-marker)", fontSize: 20, color: "var(--steel-50)" }}><Icon n="crown" size={18} color="var(--magenta-soft)" /> Host controls</div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--magenta-soft)" }}><Icon n="x" size={18} /></button>
          </div>

          {meta.stage === "submission" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: "var(--r-xs)", background: "var(--surface-card)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-soft)", marginBottom: 8 }}>Who's submitted</div>
                {members.map((u) => (
                  <div key={u} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-strong)", padding: "2px 0" }}>
                    <span>{u}</span><span style={{ color: counts[u] ? "var(--text-strong)" : "var(--danger)" }}>{counts[u] || 0} book{counts[u] === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
              <Button full onClick={() => onAdvance("voting")}>Close submissions, open voting <Icon n="arrow-right" size={16} /></Button>
            </div>
          )}
          {meta.stage === "voting" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: "var(--r-xs)", background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)" }}>Reveal the verdict when everyone's ballot is in.</div>
              <Button variant="accent" full onClick={() => onAdvance("results")}>Close voting, reveal verdict <Icon n="award" size={16} /></Button>
              <Button variant="ghost" size="sm" full onClick={() => onAdvance("submission")}>← reopen submissions</Button>
            </div>
          )}
          {meta.stage === "results" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: "var(--r-xs)", background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)" }}>The verdict is in. Start a fresh round to clear all books and votes, keeping everyone signed in.</div>
              <Button variant="danger" full onClick={onReset}><Icon n="rotate-ccw" size={15} /> Start a new round</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---- Book details modal ---- */
  function DetailsModal({ book, onClose }) {
    if (!book) return null;
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(20,18,14,.7)" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", background: "var(--surface-card)", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", boxShadow: "var(--shadow-pop)" }}>
          <div style={{ display: "flex", gap: 16, padding: 20, borderBottom: "1px dashed var(--line)" }}>
            <Spine book={book} w={72} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "var(--font-marker)", fontSize: 22, color: "var(--text-strong)", lineHeight: 1.05 }}>{book.title}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-soft)", marginTop: 4 }}>{book.authors.join(", ")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {book.year && <Badge>{book.year}</Badge>}
                {book.pages && <Badge>{book.pages} pp.</Badge>}
                {(book.categories || []).slice(0, 2).map((c) => <Badge key={c}>{c}</Badge>)}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-soft)", height: 24 }}><Icon n="x" size={18} /></button>
          </div>
          <div style={{ padding: 20, fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.55, color: "var(--text-body)" }}>{book.desc}</div>
        </div>
      </div>
    );
  }

  Object.assign(window, { TOOB_Submission: Submission, TOOB_Voting: Voting, TOOB_Results: Results, TOOB_Admin: AdminPanel, TOOB_Details: DetailsModal });
})();
