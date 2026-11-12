"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, Person, SearchResult, Site, Visit } from "@/lib/api";

type Entry = {
  address: string;
  site: Site | null;
  scrollY: number;
  key: number;
};
type Section = "browser" | "search" | "publish" | "history";

const initialHtml =
  "<h1>Welcome to the Small Web</h1><p>This is a collection of small websites written by people and stored in a database.</p><p>Try visiting <a href='ocean.zz'>ocean.zz</a>, <a href='forest.zz'>forest.zz</a>, or search for words like <strong>climate</strong>, <strong>ocean</strong>, and <strong>forest</strong>.</p><p>You can publish your own page using the Publish section.</p>";

export default function Home() {
  const [section, setSection] = useState<Section>("browser");
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState("nasir");
  const [address, setAddress] = useState("welcome.zz");
  const [entries, setEntries] = useState<Entry[]>([
    {
      address: "welcome.zz",
      site: {
        address: "welcome.zz",
        title: "Welcome to the Small Web",
        html: initialHtml,
        authorId: "system",
        authorName: "Small Web",
      },
      scrollY: 0,
      key: 0,
    },
  ]);
  const [index, setIndex] = useState(0);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [publishAddress, setPublishAddress] = useState("");
  const [publishTitle, setPublishTitle] = useState("");
  const [publishHtml, setPublishHtml] = useState(
    "<h1>My first website</h1>\n<p>Welcome to my page.</p>\n<p>Visit <a href='ocean.zz'>Ocean Conservation</a>.</p>",
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const current = entries[index];

  useEffect(() => {
    api
      .people()
      .then((r) => setPeople(r.data))
      .catch((e) => setMessage(e.message));
  }, []);
  useEffect(() => {
    if (people.length && !people.some((p) => p.personId === personId))
      setPersonId(people[0].personId);
  }, [people, personId]);
  useEffect(() => {
    if (personId)
      api
        .visits(personId)
        .then((r) => setVisits(r.data))
        .catch(() => {});
  }, [personId]);

  const loadAddress = useCallback(
    async (raw: string, source = "typed", push = true) => {
      const clean = raw
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "");
      if (!clean) return;
      setAddress(clean);
      setBusy(true);
      setMessage("");
      let site: Site | null = null;
      try {
        site = (await api.site(clean)).data;
      } catch {
        site = null;
      }
      if (push) {
        setEntries((prev) => {
          const branch = prev.slice(0, index + 1);
          return [
            ...branch,
            { address: clean, site, scrollY: 0, key: Date.now() },
          ];
        });
        setIndex((i) => i + 1);
      } else {
        setEntries((prev) =>
          prev.map((entry, i) =>
            i === index
              ? { ...entry, address: clean, site, scrollY: 0 }
              : entry,
          ),
        );
      }
      try {
        await api.recordVisit({ personId, address: clean, source });
        const history = await api.visits(personId);
        setVisits(history.data);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not record visit");
      }
      setBusy(false);
      if (!site)
        setMessage(
          `No website exists at ${clean}. This address was added to your history.`,
        );
    },
    [index, personId],
  );

  const navigateTo = (raw: string, source = "typed") =>
    loadAddress(raw, source, true);
  const back = () => {
    if (index <= 0) return;
    const y = frameRef.current?.contentWindow?.scrollY || 0;
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, scrollY: y } : e)),
    );
    const target = entries[index - 1];
    setIndex(index - 1);
    setAddress(target.address);
    api
      .recordVisit({ personId, address: target.address, source: "back" })
      .then(() => api.visits(personId).then((r) => setVisits(r.data)))
      .catch(() => {});
  };
  const forward = () => {
    if (index >= entries.length - 1) return;
    const y = frameRef.current?.contentWindow?.scrollY || 0;
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, scrollY: y } : e)),
    );
    const target = entries[index + 1];
    setIndex(index + 1);
    setAddress(target.address);
    api
      .recordVisit({ personId, address: target.address, source: "forward" })
      .then(() => api.visits(personId).then((r) => setVisits(r.data)))
      .catch(() => {});
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !current?.site) return;
    const onLoad = () => {
      try {
        frame.contentWindow?.scrollTo(0, current.scrollY);
        const doc = frame.contentDocument;
        if (!doc) return;
        doc.addEventListener("click", (event) => {
          const target = event.target as HTMLElement;
          const anchor = target.closest("a");
          if (!anchor) return;
          const href = anchor.getAttribute("href");
          if (!href) return;
          event.preventDefault();
          navigateTo(href, "link");
        });
      } catch {
        /* sandbox prevents access if browser policy changes */
      }
    };
    frame.addEventListener("load", onLoad);
    return () => frame.removeEventListener("load", onLoad);
  }, [current?.key, current?.site?.html, current?.scrollY]);

  const doSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      setResults((await api.search(query)).data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Search failed");
    }
    setBusy(false);
  };
  const doPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await api.publish({
        address: publishAddress,
        title: publishTitle,
        html: publishHtml,
        authorId: personId,
      });
      setMessage(`${result.data.address} published successfully.`);
      setPublishAddress("");
      setPublishTitle("");
      setSection("browser");
      await navigateTo(result.data.address);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Publishing failed");
    }
    setBusy(false);
  };
  const restore = (v: Visit) => {
    setSection("browser");
    navigateTo(v.address, "history");
  };

  const srcDoc = current?.site
    ? `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px/1.7 Arial,sans-serif;color:#17233e;margin:0;padding:32px;max-width:900px}h1,h2{color:#123d75;line-height:1.2}a{color:#075fe8;font-weight:600}p{margin:14px 0}blockquote{border-left:4px solid #1680ee;padding-left:16px;color:#52627b}pre{white-space:pre-wrap;background:#f0f4fa;padding:12px;border-radius:8px}</style></head><body>${current.site.html}</body></html>`
    : `<!doctype html><html><body style="font-family:Arial;padding:40px;color:#26334d"><h1>Address not found</h1><p>No site exists at <strong>${address.replace(/[&<>"']/g, "")}</strong>.</p><p>Check the address or search the small web.</p></body></html>`;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">◎</span>
          <div>
            <b>Small Web</b>
            <small>Mini Browser</small>
          </div>
        </div>
        <nav className="nav">
          {(["browser", "search", "publish", "history"] as Section[]).map(
            (s) => (
              <button
                key={s}
                className={section === s ? "active" : ""}
                onClick={() => setSection(s)}
              >
                <span>
                  {
                    (
                      {
                        browser: "◫",
                        search: "⌕",
                        publish: "＋",
                        history: "◷",
                      } as Record<string, string>
                    )[s]
                  }
                </span>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ),
          )}
        </nav>
        <div className="person-box">
          <label>Browsing as</label>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.personId} value={p.personId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sidebar-note">
          <b>Your own small web</b>
          <p>
            Browse pages written by people, search their words, and publish a
            page of your own.
          </p>
        </div>
        <div className="sidebar-footer">Local web · No external network</div>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <div className="browser-controls">
            <button title="Back" disabled={index === 0} onClick={back}>
              ←
            </button>
            <button
              title="Forward"
              disabled={index === entries.length - 1}
              onClick={forward}
            >
              →
            </button>
            <button title="Reload" onClick={() => navigateTo(address)}>
              ↻
            </button>
          </div>
          <form
            className="address-form"
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(address);
            }}
          >
            <span>◎</span>
            <input
              aria-label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter an address, e.g. ocean.zz"
            />
            <button>Go</button>
          </form>
          <form
            className="quick-search"
            onSubmit={(e) => {
              e.preventDefault();
              setSection("search");
              doSearch();
            }}
          >
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search page content..."
            />
          </form>
        </header>

        {section === "browser" && (
          <div className="browser-grid">
            <section className="page-panel">
              <div className="page-meta">
                <span className="live-dot"></span>
                {current?.site ? current.site.title : "Nowhere"}
                <small>
                  {current?.site?.authorName
                    ? `by ${current.site.authorName}`
                    : "No site at this address"}
                </small>
              </div>
              {busy && <div className="loading-line">Loading address…</div>}
              <iframe
                key={current?.key}
                ref={frameRef}
                title="Published website content"
                sandbox="allow-same-origin"
                srcDoc={srcDoc}
                className="site-frame"
              />
              <div className="page-status">
                {current?.site
                  ? "Page loaded from the Small Web database."
                  : "Nowhere — this address does not exist."}
              </div>
            </section>
            <aside className="history-panel">
              <div className="panel-heading">
                <h3>Recent visits</h3>
                <button onClick={() => setSection("history")}>
                  View all →
                </button>
              </div>
              {visits.slice(0, 7).map((v) => (
                <button
                  className="visit-row"
                  key={v._id}
                  onClick={() => restore(v)}
                >
                  <span className="visit-mark">◷</span>
                  <span>
                    <b>{v.title}</b>
                    <small>{v.address}</small>
                  </span>
                  <time>
                    {new Date(v.visitedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </button>
              ))}
              {!visits.length && (
                <p className="empty">
                  No visits yet. Browse a site to start your history.
                </p>
              )}
            </aside>
          </div>
        )}

        {section === "search" && (
          <section className="content-page">
            <div className="section-title">
              <div>
                <span className="eyebrow">DISCOVER</span>
                <h1>Search the small web</h1>
                <p>
                  Find words and ideas across every published page, not just
                  titles.
                </p>
              </div>
            </div>
            <form className="large-search" onSubmit={doSearch}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “ocean”, “forest”, or “climate”"
              />
              <button disabled={busy}>Search</button>
            </form>
            <p className="result-count">
              {results.length} result{results.length === 1 ? "" : "s"} found
            </p>
            <div className="result-list">
              {results.map((r) => (
                <button
                  className="result-card"
                  key={r.address}
                  onClick={() => {
                    setSection("browser");
                    navigateTo(r.address, "link");
                  }}
                >
                  <span className="result-globe">◎</span>
                  <span>
                    <b>{r.title}</b>
                    <small>
                      {r.address} · by {r.authorName}
                    </small>
                    <p>{r.snippet}</p>
                  </span>
                  <strong>Open →</strong>
                </button>
              ))}
            </div>
            {!results.length && (
              <div className="empty-state">
                Search the text inside published pages to find matching sites.
              </div>
            )}
          </section>
        )}

        {section === "publish" && (
          <section className="content-page">
            <div className="section-title">
              <div>
                <span className="eyebrow">CONTRIBUTE</span>
                <h1>Publish a website</h1>
                <p>
                  Create a new address and write a page of HTML for others to
                  explore.
                </p>
              </div>
            </div>
            <form className="publish-form" onSubmit={doPublish}>
              <div className="form-row">
                <label>
                  Website address
                  <input
                    required
                    value={publishAddress}
                    onChange={(e) => setPublishAddress(e.target.value)}
                    placeholder="my-site.zz"
                  />
                </label>
                <label>
                  Page title
                  <input
                    required
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder="My new website"
                  />
                </label>
              </div>
              <label>
                Author
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                >
                  {people.map((p) => (
                    <option key={p.personId} value={p.personId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                HTML content
                <textarea
                  required
                  rows={14}
                  maxLength={30000}
                  value={publishHtml}
                  onChange={(e) => setPublishHtml(e.target.value)}
                  spellCheck={false}
                />
              </label>
              <div className="editor-hint">
                Allowed content is sanitized before display. Scripts, event
                handlers, forms and embedded content are removed.
              </div>
              <button className="primary" disabled={busy}>
                ＋ Publish website
              </button>
            </form>
          </section>
        )}

        {section === "history" && (
          <section className="content-page">
            <div className="section-title">
              <div>
                <span className="eyebrow">YOUR TRAIL</span>
                <h1>Browsing history</h1>
                <p>
                  Visits recorded for the selected person. Select any entry to
                  revisit that address.
                </p>
              </div>
              <span className="history-person">
                {people.find((p) => p.personId === personId)?.name ||
                  "Selected person"}
              </span>
            </div>
            <div className="timeline">
              {visits.map((v) => (
                <button
                  key={v._id}
                  className="timeline-row"
                  onClick={() => restore(v)}
                >
                  <span className="timeline-dot"></span>
                  <time>{new Date(v.visitedAt).toLocaleString()}</time>
                  <span>
                    <b>{v.title}</b>
                    <small>
                      {v.address} · via {v.source}
                    </small>
                  </span>
                  <strong>Visit →</strong>
                </button>
              ))}
            </div>
            {!visits.length && (
              <div className="empty-state">
                No browsing history for this person yet.
              </div>
            )}
          </section>
        )}
        {message && (
          <div className="toast" role="status">
            <span>●</span>
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}
      </section>
    </main>
  );
}
