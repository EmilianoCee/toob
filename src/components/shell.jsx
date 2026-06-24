/* TOOB website — shell: Icon helper, Backdrop, Header, Landing, SignIn */
(function () {
  const DS = window.TOOBDesignSystem_7cdcf9;
  const { Button, Field, Input, Badge } = DS;
  const Wordmark = window.TOOB_VWordmark;   // vintage ring-O logotype
  const StageStrip = window.TOOB_VStage;    // vintage numbered stepper

  /* ---- Lucide icon (vanilla UMD, replaced after render) ---- */
  function Icon({ n, size = 16, color = "currentColor", style = {} }) {
    return (
      <span className="ico" style={{ fontSize: size, color, display: "inline-flex", ...style }}>
        <i data-lucide={n}></i>
      </span>
    );
  }

  /* ---- Aged-library desk backdrop ---- */
  function Backdrop({ children }) {
    return (
      <div style={{ minHeight: "100%", background: "var(--grad-bench)", position: "relative" }}>
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background: "radial-gradient(120% 90% at 50% -10%, rgba(255,236,200,.10), transparent 55%), radial-gradient(140% 120% at 50% 120%, rgba(0,0,0,.35), transparent 60%)",
        }} />
        <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
      </div>
    );
  }

  /* ---- Header (sticky steel bar) ---- */
  function Header({ meta, user, isHost, copied, onCopy, onLeave, onAdmin, onJump }) {
    return (
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--grad-wood)",
        borderBottom: "1px solid #1c1208",
        boxShadow: "0 2px 10px rgba(0,0,0,.4)",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <Wordmark size={26} color="var(--steel-50)" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--steel-50)", fontSize: 15, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.name}</div>
                <button onClick={onCopy} style={{ marginTop: 2, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--magenta-soft)" }}>
                  <Icon n={copied ? "check" : "copy"} size={12} /> code {meta.code}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
              {isHost && (
                <button onClick={onAdmin} title="Host controls" style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "var(--r-xs)", cursor: "pointer", background: "transparent", color: "var(--magenta-soft)", border: "1px solid rgba(240,168,228,.3)" }}>
                  <Icon n="settings" size={16} />
                </button>
              )}
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--steel-50)" }}>
                  {isHost && <Icon n="crown" size={12} color="var(--magenta-soft)" />}{user}
                </div>
                <button onClick={onLeave} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-on-dark-soft)" }}>
                  <Icon n="log-out" size={10} /> leave
                </button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, cursor: "pointer" }} title="(demo) jump between stages" onClick={(e) => {
            // demo affordance: click a stage node to jump
            const order = ["submission", "voting", "results"];
            const cur = order.indexOf(meta.stage);
            onJump(order[(cur + 1) % order.length]);
          }}>
            <StageStrip current={meta.stage} />
          </div>
        </div>
      </div>
    );
  }

  /* ---- Landing (create / join) ---- */
  function Landing({ onCreate, onJoin }) {
    const [mode, setMode] = React.useState(null);
    const [roomName, setRoomName] = React.useState("");
    const [limit, setLimit] = React.useState(3);
    const [joinCode, setJoinCode] = React.useState("");
    const [err, setErr] = React.useState("");

    const Choice = ({ icon, title, sub, onClick }) => (
      <button onClick={onClick} style={{
        width: "100%", textAlign: "left", padding: "16px 18px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 14,
        background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--r-xs)",
        boxShadow: "var(--shadow-card)", transition: "transform .12s ease",
      }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = ""}>
        <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: "var(--r-pill)", background: "var(--grad-steel)", border: "1px solid var(--steel-500)", color: "var(--ink-brown)" }}>
          <Icon n={icon} size={20} />
        </span>
        <span>
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--text-strong)" }}>{title}</span>
          <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>{sub}</span>
        </span>
      </button>
    );

    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "56px 18px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Wordmark size={68} color="var(--steel-50)" tagline />
        </div>

        {!mode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Choice icon="plus-circle" title="Start a new round" sub="You host it and get a code to share." onClick={() => setMode("create")} />
            <Choice icon="log-in" title="Join with a code" sub="A friend already started one." onClick={() => setMode("join")} />
          </div>
        )}

        {mode === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--r-xs)", boxShadow: "var(--shadow-card)" }}>
            <Field label="Club / round name">
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. June Reads" />
            </Field>
            <Field label="Books per person (max)" hint="Everyone submits at least one; this caps the most they can add.">
              <Input type="number" min={1} max={10} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>Back</Button>
              <Button full onClick={() => onCreate({ name: roomName.trim() || "Book Club", limit })}>
                Create round <Icon n="arrow-right" size={16} />
              </Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--r-xs)", boxShadow: "var(--shadow-card)" }}>
            <Field label="Room code">
              <Input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="5 characters" maxLength={6} invalid={!!err} style={{ letterSpacing: "0.3em", fontSize: 18 }} />
            </Field>
            {err && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", fontFamily: "var(--font-mono)", fontSize: 13 }}><Icon n="alert-circle" size={14} />{err}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>Back</Button>
              <Button full onClick={() => { if (!joinCode.trim()) return; const ok = onJoin(joinCode.trim()); if (!ok) setErr("No round found with that code."); }}>
                Find round <Icon n="arrow-right" size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---- Sign-in (borrower card) ---- */
  function SignIn({ meta, members, onSignIn, onLeave }) {
    const [name, setName] = React.useState("");
    const [pass, setPass] = React.useState("");
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "56px 18px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--magenta-soft)" }}>{meta.name}</div>
          <h1 style={{ fontFamily: "var(--font-marker)", fontSize: 34, color: "var(--steel-50)", margin: "6px 0 0", transform: "rotate(-2deg)" }}>Sign the borrower card</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "var(--r-xs)", boxShadow: "var(--shadow-card)" }}>
          <Field label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="what should the club call you?" />
          </Field>
          <Field label="Password (optional)" hint="Set one to keep your name yours. The room code already gates the room.">
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="optional" />
          </Field>
          <Button full onClick={() => onSignIn(name.trim() || "you")}>Enter the room <Icon n="arrow-right" size={16} /></Button>
        </div>
        {members.length > 0 && (
          <div style={{ marginTop: 16, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--magenta-soft)" }}>
            Already inside: {members.join(" · ")}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button onClick={onLeave} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-on-dark-soft)" }}>← different room</button>
        </div>
      </div>
    );
  }

  Object.assign(window, { TOOB_Icon: Icon, TOOB_Backdrop: Backdrop, TOOB_Header: Header, TOOB_Landing: Landing, TOOB_SignIn: SignIn });
})();
