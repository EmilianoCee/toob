/* TOOB website — app orchestrator */
(function () {
  const { Backdrop: BD, Header, Landing, SignIn } = {
    Backdrop: window.TOOB_Backdrop, Header: window.TOOB_Header,
    Landing: window.TOOB_Landing, SignIn: window.TOOB_SignIn,
  };
  const { TOOB_Submission: Submission, TOOB_Voting: Voting, TOOB_Results: Results, TOOB_Admin: Admin, TOOB_Details: Details } = window;
  const D = window.TOOB_DATA;

  function makeCode() {
    const C = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 5 }, () => C[Math.floor(Math.random() * C.length)]).join("");
  }

  function App() {
    const [screen, setScreen] = React.useState("landing");
    const [meta, setMeta] = React.useState(null);
    const [user, setUser] = React.useState(null);
    const [subs, setSubs] = React.useState(D.SUBS);
    const [votes, setVotes] = React.useState(D.VOTES);
    const [details, setDetails] = React.useState(null);
    const [showAdmin, setShowAdmin] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    // (re)draw lucide icons after every render
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const isHost = meta && user && meta.host === user;
    const mySubs = subs.filter((s) => s.username === user);
    const myVote = votes.find((v) => v.username === user);

    function create({ name, limit }) {
      setMeta({ name, code: makeCode(), limit, stage: "submission", host: null });
      setScreen("signin");
    }
    function join(code) {
      setMeta({ name: "June Reads", code: code.toUpperCase(), limit: 3, stage: "submission", host: "mara" });
      setScreen("signin");
      return true;
    }
    function signIn(name) {
      setMeta((m) => ({ ...m, host: m.host || name }));
      setUser(name);
      setScreen("room");
    }
    function leave() { setScreen("landing"); setMeta(null); setUser(null); setShowAdmin(false); }

    function addBook(book) {
      if (mySubs.length >= meta.limit) return;
      setSubs((s) => [...s, { username: user, book }]);
    }
    function removeBook(id) { setSubs((s) => s.filter((x) => !(x.username === user && x.book.id === id))); }
    function saveVote(ranking) { setVotes((v) => [...v.filter((x) => x.username !== user), { username: user, ranking }]); }
    function advance(stage) { setMeta((m) => ({ ...m, stage })); setShowAdmin(false); }
    function reset() { setSubs(D.SUBS.filter(() => false)); setVotes([]); advance("submission"); }

    const members = Array.from(new Set([...(D.MEMBERS), user].filter(Boolean)));

    return (
      <BD>
        {screen === "landing" && <Landing onCreate={create} onJoin={join} />}
        {screen === "signin" && meta && (
          <SignIn meta={meta} members={D.MEMBERS.filter((m) => m !== "you")} onSignIn={signIn} onLeave={leave} />
        )}
        {screen === "room" && meta && (
          <>
            <Header meta={meta} user={user} isHost={isHost} copied={copied}
              onCopy={() => { try { navigator.clipboard.writeText(meta.code); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1400); }}
              onLeave={leave} onAdmin={() => setShowAdmin(true)} onJump={advance} />
            {meta.stage === "submission" && (
              <Submission meta={meta} mySubs={mySubs} members={members} allSubs={subs}
                onAdd={addBook} onRemove={removeBook} onDetails={setDetails} />
            )}
            {meta.stage === "voting" && (
              <Voting meta={meta} subs={subs} myRanking={myVote?.ranking} onSave={saveVote} onDetails={setDetails} />
            )}
            {meta.stage === "results" && <Results subs={subs} votes={votes} onDetails={setDetails} />}
            {showAdmin && isHost && (
              <Admin meta={meta} members={members} subs={subs} onClose={() => setShowAdmin(false)} onAdvance={advance} onReset={reset} />
            )}
          </>
        )}
        <Details book={details} onClose={() => setDetails(null)} />
      </BD>
    );
  }

  /* ---------- Tweaks (vintage knobs) ---------- */
  const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle } = window;

  const TWEAK_DEFAULTS = { leather: "Walnut", accent: "#4e6b3a", grain: true, heading: "Serif" };

  const BENCHES = {
    Tan:     "linear-gradient(165deg,#4a3321 0%,#2e2014 100%)",
    Oxblood: "linear-gradient(165deg,#4a2420 0%,#2a1210 100%)",
    Walnut:  "linear-gradient(165deg,#3a2c1c 0%,#211610 100%)",
  };
  const WOODS = {
    Tan:     "linear-gradient(180deg,#5a3e25 0%,#382716 100%)",
    Oxblood: "linear-gradient(180deg,#5e2b25 0%,#341714 100%)",
    Walnut:  "linear-gradient(180deg,#46321f 0%,#2a1d10 100%)",
  };
  const ACCENTS = {
    "#a87c34": ["#a87c34", "#7d5a22", "#dcbd80"], // Brass
    "#8c3b2e": ["#8c3b2e", "#6a2a20", "#d59b8f"], // Oxblood
    "#4e6b3a": ["#4e6b3a", "#384e29", "#a8c08a"], // Forest
    "#5a3819": ["#5a3819", "#3e2510", "#b8966f"], // Ink
  };
  const HEADINGS = {
    Marker: "'Permanent Marker','Comic Sans MS',cursive",
    Serif:  "'Iowan Old Style','Palatino Linotype','Georgia',serif",
  };

  function Root() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    React.useEffect(() => {
      const r = document.documentElement;
      r.style.setProperty("--grad-bench", BENCHES[t.leather] || BENCHES.Tan);
      r.style.setProperty("--grad-wood", WOODS[t.leather] || WOODS.Tan);
      const a = ACCENTS[t.accent] || ACCENTS["#a87c34"];
      r.style.setProperty("--magenta", a[0]);
      r.style.setProperty("--magenta-dark", a[1]);
      r.style.setProperty("--magenta-soft", a[2]);
      r.style.setProperty("--font-marker", HEADINGS[t.heading] || HEADINGS.Marker);
      r.setAttribute("data-grain", t.grain ? "on" : "off");
    }, [t.leather, t.accent, t.grain, t.heading]);

    return (
      <>
        <App />
        <TweaksPanel>
          <TweakSection label="Binding" />
          <TweakRadio label="Leather" value={t.leather} options={["Tan", "Oxblood", "Walnut"]} onChange={(v) => setTweak("leather", v)} />
          <TweakColor label="Accent" value={t.accent} options={["#a87c34", "#8c3b2e", "#4e6b3a", "#5a3819"]} onChange={(v) => setTweak("accent", v)} />
          <TweakSection label="Paper" />
          <TweakToggle label="Paper grain" value={t.grain} onChange={(v) => setTweak("grain", v)} />
          <TweakRadio label="Headings" value={t.heading} options={["Marker", "Serif"]} onChange={(v) => setTweak("heading", v)} />
        </TweaksPanel>
      </>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();
