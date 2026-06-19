/* TOOB website UI kit — mock data + helpers (no network).
   Faithful to book-club.jsx data shapes; covers are local color spines. */
(function () {
  const BOOKS = [
    { id: "b1", title: "Piranesi", authors: ["Susanna Clarke"], year: "2020", color: "#3b6e8c",
      pages: 245, categories: ["Fiction", "Fantasy"],
      desc: "A man lives in an endless house of statues and tides, keeping a careful journal of its halls." },
    { id: "b2", title: "Pachinko", authors: ["Min Jin Lee"], year: "2017", color: "#9c4a3c",
      pages: 496, categories: ["Historical Fiction"],
      desc: "Four generations of a Korean family make a life in twentieth-century Japan." },
    { id: "b3", title: "The Bee Sting", authors: ["Paul Murray"], year: "2023", color: "#caa12e",
      pages: 656, categories: ["Literary Fiction"],
      desc: "An Irish family's fortunes unravel with dark comedy and real tenderness." },
    { id: "b4", title: "Babel", authors: ["R. F. Kuang"], year: "2022", color: "#5b4a8c",
      pages: 560, categories: ["Fantasy"],
      desc: "At an Oxford translation institute, language is literal magic — and empire." },
    { id: "b5", title: "Tomorrow, and Tomorrow, and Tomorrow", authors: ["Gabrielle Zevin"], year: "2022",
      color: "#2f7d6b", pages: 416, categories: ["Fiction"],
      desc: "Two friends spend thirty years making video games, and missing each other." },
    { id: "b6", title: "Crime and Punishment", authors: ["Fyodor Dostoevsky"], year: "1866", color: "#6a3030",
      pages: 671, categories: ["Classics"],
      desc: "A destitute student talks himself into a murder, then into his own conscience." },
    { id: "b7", title: "Klara and the Sun", authors: ["Kazuo Ishiguro"], year: "2021", color: "#c8842e",
      pages: 320, categories: ["Science Fiction"],
      desc: "An artificial friend watches the human world with patient, solar devotion." },
    { id: "b8", title: "The Overstory", authors: ["Richard Powers"], year: "2018", color: "#3f6e3a",
      pages: 502, categories: ["Fiction"],
      desc: "Nine strangers are drawn together by the slow, vast lives of trees." },
  ];

  // a pre-populated room so Voting and Verdict have something to show
  const MEMBERS = ["you", "mara", "theo", "priya"];
  const SUBS = [
    { username: "you",   book: BOOKS[0] },
    { username: "mara",  book: BOOKS[2] },
    { username: "theo",  book: BOOKS[3] },
    { username: "priya", book: BOOKS[4] },
    { username: "mara",  book: BOOKS[6] },
  ];
  // rankings (arrays of book ids, best first)
  const VOTES = [
    { username: "mara",  ranking: ["b1", "b3", "b5", "b4", "b7"] },
    { username: "theo",  ranking: ["b1", "b4", "b3", "b7", "b5"] },
    { username: "priya", ranking: ["b3", "b1", "b5", "b7", "b4"] },
  ];

  function computeBallot(subs) {
    const map = new Map();
    for (const s of subs) {
      if (!map.has(s.book.id)) map.set(s.book.id, { bookId: s.book.id, book: s.book, recommenders: [] });
      if (!map.get(s.book.id).recommenders.includes(s.username)) map.get(s.book.id).recommenders.push(s.username);
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
      ranking = ranking.concat(ids.filter((id) => !ranking.includes(id)));
      if ((v.ranking || []).length) cast++;
      const M = ranking.length;
      ranking.forEach((id, i) => { points[id] += M - 1 - i; if (i === 0) firsts[id]++; });
    }
    const results = ballot
      .map((b) => ({ ...b, points: points[b.bookId], firsts: firsts[b.bookId] }))
      .sort((a, b) => b.points - a.points || b.firsts - a.firsts || a.book.title.localeCompare(b.book.title));
    return { results, ballotsCast: cast, total: ballot.length };
  }

  window.TOOB_DATA = { BOOKS, MEMBERS, SUBS, VOTES, computeBallot, computeResults };
})();
