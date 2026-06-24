/* TOOB website — vintage local components (no pipe imagery).
   Drop-in replacements for the steel TubeEnd / TubeCard / ProgressTube /
   StageStrip / Wordmark, re-skinned as old-paper, leather & wood/brass.
   These keep the DS components untouched for other consumers; only this
   UI kit swaps them in. */
(function () {
  const DS = window.TOOBDesignSystem_7cdcf9;

  /* ---- VNumDisc: embossed leather/brass medallion (was TubeEnd) ---- */
  function VNumDisc({ size = 38, glow = false, children, style = {} }) {
    return (
      <div style={{
        position: "relative", width: size, height: size, borderRadius: "50%",
        background: glow
          ? "radial-gradient(circle at 38% 32%, #f3d488 0%, #b8862f 55%, #6f4f17 100%)"
          : "radial-gradient(circle at 38% 32%, #8a5e34 0%, #5a3a1d 60%, #3a230f 100%)",
        border: "2px solid " + (glow ? "#caa14a" : "#3a230f"),
        boxShadow: "0 2px 5px rgba(0,0,0,.35), 0 2px 3px rgba(255,255,255,.22) inset, 0 -2px 5px rgba(0,0,0,.45) inset",
        display: "grid", placeItems: "center", flex: "none", ...style,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: size * 0.36, lineHeight: 1,
          color: glow ? "#fff8e6" : "var(--steel-50)", textShadow: "0 1px 1px rgba(0,0,0,.5)",
        }}>{children}</span>
      </div>
    );
  }

  /* ---- VWordmark: TOOB with hand-drawn ring "OO" (was metal tubes) ---- */
  function VWordmark({ size = 48, color = "var(--ink-brown)", tagline = false, style = {} }) {
    const ring = Math.round(size * 0.8);
    const stroke = Math.max(3, Math.round(ring * 0.16));
    const letter = { fontFamily: "var(--font-marker)", fontSize: size, lineHeight: 1, color, display: "inline-block" };
    const O = (rot) => (
      <span style={{
        width: ring, height: ring, borderRadius: "50%", flex: "none", display: "inline-block",
        border: stroke + "px solid " + color,
        boxShadow: "0 1px 2px rgba(0,0,0,.22), 0 1px 1px rgba(255,255,255,.3) inset",
        transform: "translateY(" + (size * 0.05) + "px) rotate(" + rot + "deg)",
      }} />
    );
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: size * 0.12, ...style }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.07 }}>
          <span style={{ ...letter, transform: "rotate(-3deg)" }}>T</span>
          {O(-2)}
          {O(3)}
          <span style={{ ...letter, transform: "rotate(4deg)" }}>B</span>
        </span>
        {tagline && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: Math.max(10, size * 0.2), letterSpacing: "0.12em",
            color: color === "var(--ink-brown)" ? "var(--text-soft)" : "var(--text-on-dark-soft)",
            textTransform: "lowercase",
          }}>the other one · book club</span>
        )}
      </span>
    );
  }

  /* ---- VCard: paper tag on a leather spine band (was TubeCard) ---- */
  function VCard({ tab, stamped = false, stampLabel = "SELECTED", dim = false, glowTab = false, onClick, children, style = {}, ...rest }) {
    const Stamp = DS.Stamp;
    const clickable = !!onClick;
    return (
      <div onClick={onClick} style={{
        position: "relative", display: "flex", alignItems: "stretch", overflow: "hidden",
        background: "var(--surface-card)", color: "var(--text-body)", borderRadius: "var(--r-xs)",
        border: "var(--bw) solid var(--line)", boxShadow: "var(--shadow-card)",
        opacity: dim ? 0.55 : 1, cursor: clickable ? "pointer" : "default",
        transition: "transform .12s ease, box-shadow .12s ease", ...style,
      }}
        onMouseEnter={(e) => { if (clickable) e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { if (clickable) e.currentTarget.style.transform = ""; }}
        {...rest}>
        {tab != null && (
          <div style={{
            flex: "none", width: 56, display: "grid", placeItems: "center",
            background: "var(--grad-wood)", borderRight: "var(--bw) solid rgba(0,0,0,.3)",
            boxShadow: "1px 0 0 rgba(255,255,255,.08) inset, -2px 0 6px rgba(0,0,0,.22) inset",
          }}>
            <VNumDisc size={38} glow={glowTab}>{tab}</VNumDisc>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, padding: "var(--sp-3) var(--sp-4)" }}>{children}</div>
        {stamped && (
          <div style={{ position: "absolute", right: 10, top: 10, pointerEvents: "none" }}>
            <Stamp>{stampLabel}</Stamp>
          </div>
        )}
      </div>
    );
  }

  /* ---- VProgress: aged-paper track, leather fill (was ProgressTube) ---- */
  function VProgress({ value = 0, leader = false, height = 12, style = {}, ...rest }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
      <div style={{
        position: "relative", height, borderRadius: "var(--r-pill)",
        background: "linear-gradient(180deg,#d8c4a0,#e8d9bb 45%,#cbb488)",
        border: "var(--bw) solid var(--line-strong)",
        boxShadow: "0 1px 2px rgba(0,0,0,.2) inset", overflow: "hidden", ...style,
      }} {...rest}>
        <div style={{
          width: pct + "%", height: "100%", borderRadius: "var(--r-pill)",
          background: leader
            ? "linear-gradient(180deg, color-mix(in srgb,var(--accent) 68%,#fff3d0), var(--accent) 55%, var(--accent-press))"
            : "linear-gradient(180deg,#9a6a3e,#6f4421 55%,#573418)",
          boxShadow: "0 1px 0 rgba(255,255,255,.35) inset",
          transition: "width .5s cubic-bezier(.2,.8,.3,1)",
        }} />
      </div>
    );
  }

  /* ---- VStage: numbered discs joined by leather/brass rails (was StageStrip) ---- */
  function VStage({
    stages = [
      { id: "submission", label: "Recommend" },
      { id: "voting", label: "Vote" },
      { id: "results", label: "Verdict" },
    ],
    current, style = {}, ...rest
  }) {
    const idx = stages.findIndex((s) => s.id === current);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, ...style }} {...rest}>
        {stages.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          const reached = i <= idx;
          return (
            <React.Fragment key={s.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
                <div style={{ filter: reached ? "none" : "grayscale(1) opacity(.45)" }}>
                  <VNumDisc size={26} glow={active}>{done ? "✓" : i + 1}</VNumDisc>
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", letterSpacing: "0.1em",
                  textTransform: "uppercase", fontWeight: active ? 700 : 400,
                  color: active ? "var(--text-on-dark)" : "var(--text-on-dark-soft)",
                }}>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div style={{
                  flex: 1, minWidth: 24, height: 5, margin: "0 10px", borderRadius: "var(--r-pill)",
                  background: i < idx
                    ? "linear-gradient(180deg, var(--accent), var(--accent-press))"
                    : "linear-gradient(180deg,#7a5a3a,#553d24)",
                  boxShadow: "0 1px 0 rgba(255,255,255,.18) inset",
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  Object.assign(window, { TOOB_VNumDisc: VNumDisc, TOOB_VWordmark: VWordmark, TOOB_VCard: VCard, TOOB_VProgress: VProgress, TOOB_VStage: VStage });
})();
