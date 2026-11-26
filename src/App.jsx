import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { cities, category, plan, answerFor } from "./planner.js";

const options = {
  household: ["Family with children", "Older adults", "Adults"],
  commute: [
    "Private car",
    "Two-wheeler",
    "Public transport",
    "Walk or cycle",
    "Work from home",
  ],
  filter: ["No purifier", "HEPA purifier"],
};
const chapters = [
  ["Before leaving", "dawn", 0],
  ["On the road", "commute", 2],
  ["Back at home", "home", 1],
];
const demoValues = [
  325, 318, 302, 278, 246, 219, 172, 154, 142, 131, 120, 112, 97, 94, 102, 113,
  128, 148, 171, 195, 219, 240, 267, 295,
];
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function clock(t, zone) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
  }).format(t * 1000);
}
function Wind() {
  return (
    <svg
      className="wind"
      viewBox="0 0 600 70"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          style={{ animationDelay: -i * 0.41 + "s" }}
          d={`M-20 ${18 + i * 4} C110 ${80 - i * 4} 155 ${-45 + i * 7} 280 ${24 + i * 3} S470 ${75 - i * 4} 620 ${8 + i * 5}`}
        />
      ))}
    </svg>
  );
}
function Cover() {
  const film = useRef(null),
    [paused, setPaused] = useState(true);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (q.matches) film.current.pause();
      else film.current.play().catch(() => {});
    };
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  return (
    <section className="cover">
      <div className="lead">
        <div className="kicker">
          <i /> WINTER FIELD REPORT
        </div>
        <h1>
          The air <br />
          outside<span>.</span>
        </h1>
        <p>
          School runs, shared rides, evenings at home. Plan the day around the
          air your family will breathe.
        </p>
        <a className="button" href="#forecast">
          Check my forecast
        </a>
        <Wind />
      </div>
      <figure className="coverPhoto">
        <video
          ref={film}
          muted
          loop
          playsInline
          poster="/media/hero.jpg"
          src="/media/hero.mp4"
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
        <figcaption>
          In the open air{" "}
          <button
            onClick={() =>
              paused
                ? film.current.play().catch(() => {})
                : film.current.pause()
            }
          >
            {paused ? "Play film" : "Pause film"}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
function Assistant({ context }) {
  const [q, setQ] = useState(""),
    [reply, setReply] = useState(""),
    [busy, setBusy] = useState(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function ask(question) {
    if (!question.trim()) return;
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    setQ(question);
    setBusy(true);
    setReply("");
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, question }),
        signal: c.signal,
      });
      if (!r.ok) throw Error();
      const data = await r.json();
      if (!c.signal.aborted)
        setReply(
          (data.mode === "ai" ? "AI response" : "Built-in guide") +
            "\n" +
            data.answer,
        );
    } catch {
      if (!c.signal.aborted)
        setReply("Built-in guide\n" + answerFor(question, context));
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  return (
    <section id="ask">
      <div className="kicker">HOUSEHOLD Q&A</div>
      <h2>Ask Saans.</h2>
      <p>Ask about a real decision in your day.</p>
      <div className="topics">
        {["School pickup", "Cooking indoors", "Community transport"].map(
          (v) => (
            <button key={v} onClick={() => ask(v)}>
              {v}
            </button>
          ),
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input
          aria-label="Your question"
          maxLength={500}
          required
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What can we do without a purifier?"
        />
        <button className="button" disabled={busy}>
          Ask
        </button>
      </form>
      <small>When AI is enabled, your question and profile go to OpenAI.</small>
      <p className="reply" role="status">
        {busy ? "Preparing your answer…" : reply}
      </p>
    </section>
  );
}
function calendar(hour, card) {
  const stamp = (t) =>
    new Date(t * 1000)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const escape = (s) =>
    s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Saans//Winter routines//EN",
    "BEGIN:VEVENT",
    "UID:" + crypto.randomUUID() + "@saans",
    "DTSTAMP:" + stamp(Date.now() / 1000),
    "DTSTART:" + stamp(hour.time),
    "DURATION:PT30M",
    "SUMMARY:" + escape(card.title),
    "DESCRIPTION:" +
      escape(card.action + " Check current air quality before leaving."),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(
    new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "saans-routine.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function App() {
  const old = read("saans-profile");
  const [city, setCity] = useState(
      Object.hasOwn(cities, old.city) ? old.city : "Indore",
    ),
    [coords, setCoords] = useState(null),
    [geo, setGeo] = useState(""),
    [demo, setDemo] = useState(false),
    [air, setAir] = useState(null),
    [status, setStatus] = useState("Loading estimate…"),
    [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(() =>
    Object.fromEntries(
      Object.entries(options).map(([k, values]) => [
        k,
        values.includes(old[k]) ? old[k] : values[0],
      ]),
    ),
  );
  const [scene, setScene] = useState(0),
    [playing, setPlaying] = useState(false),
    [checks, setChecks] = useState(() => read("saans-actions")),
    [note, setNote] = useState("");
  const geoId = useRef(0),
    place = city === "Nearby" ? "Near you" : city;
  useEffect(
    () =>
      save("saans-profile", {
        ...profile,
        city: city === "Nearby" ? old.city : city,
      }),
    [profile, city],
  );
  useEffect(() => {
    const c = new AbortController();
    setSelected(null);
    setAir(null);
    setNote("");
    if (demo) {
      const time = Math.floor(Date.now() / 3600000) * 3600;
      setAir({
        aqi: 325,
        pm: 207,
        time,
        timezone: "Asia/Kolkata",
        hours: demoValues.map((aqi, i) => ({ aqi, time: time + i * 3600 })),
      });
      setStatus("Simulation · illustrative readings");
      return;
    }
    setStatus("Loading local estimate…");
    const params = new URLSearchParams({ city });
    if (city === "Nearby" && coords) {
      params.set("lat", coords.lat);
      params.set("lon", coords.lon);
    }
    fetch("/api/air?" + params, { signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const data = await r.json();
        if (!c.signal.aborted) {
          setAir(data);
          setStatus("CAMS model · " + clock(data.time, data.timezone));
        }
      })
      .catch(() => {
        if (!c.signal.aborted)
          setStatus(
            "Estimate unavailable. Check local advisories or explore the demo.",
          );
      });
    return () => c.abort();
  }, [city, coords, demo]);
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (scene === 2) setPlaying(false);
      else setScene(scene + 1);
    }, 9000);
    return () => clearTimeout(id);
  }, [playing, scene]);
  function locate() {
    const id = ++geoId.current;
    if (!navigator.geolocation) {
      setGeo("Choose a city to continue.");
      return;
    }
    setGeo("Locating…");
    navigator.geolocation.getCurrentPosition(
      ({ coords: p }) => {
        if (id !== geoId.current) return;
        setCoords({ lat: p.latitude.toFixed(2), lon: p.longitude.toFixed(2) });
        setCity("Nearby");
        setDemo(false);
        setGeo("Approximate location for this visit.");
      },
      () => {
        if (id === geoId.current)
          setGeo("Location unavailable. Choose a city.");
      },
      { timeout: 9000 },
    );
  }
  const zone = air?.timezone || "Asia/Kolkata",
    hour = air?.hours.find((h) => h.time === selected),
    aqi = hour?.aqi ?? air?.aqi ?? null;
  const context = { ...profile, city, aqi, demo, forecast: !!hour },
    cards = plan(context),
    [chapter, image, index] = chapters[scene],
    card = cards[index];
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: zone }).format(
    new Date(),
  );
  const key = (c) => JSON.stringify([day, city, demo, c.title, c.action]);
  function tab(i) {
    setScene(i);
    setPlaying(false);
  }
  async function share() {
    const message =
      place +
      " winter air note · " +
      (demo ? "Simulation. " : "") +
      (air
        ? "US AQI " +
          air.aqi +
          " · " +
          category(air.aqi) +
          " · " +
          clock(air.time, zone)
        : "Estimate unavailable") +
      ". Check local advisories. Avoid idling while parked and coordinate shared trips.";
    try {
      await navigator.clipboard.writeText(message);
      setNote("Copied to clipboard.");
    } catch {
      setNote(message);
    }
  }
  return (
    <>
      <header>
        <a className="brand" href="#top">
          saans<span>●</span>
        </a>
        <nav>
          <a href="#forecast">Forecast</a>
          <a href="#routine">Daily routine</a>
          <a href="#ask">Ask Saans</a>
        </nav>
      </header>
      <main id="top">
        <Cover />
        <section className="forecast" id="forecast">
          <div className="heading">
            <div>
              <div className="kicker">LOCAL FORECAST</div>
              <h2>Air desk</h2>
            </div>
            <div className="location">
              <select
                aria-label="City"
                value={city}
                onChange={(e) => {
                  geoId.current++;
                  setCity(e.target.value);
                  setGeo("");
                }}
              >
                {Object.keys(cities).map((c) => (
                  <option key={c}>{c}</option>
                ))}
                {city === "Nearby" && <option value="Nearby">Near you</option>}
              </select>
              <button onClick={locate}>Locate me</button>
            </div>
          </div>
          <small role="status">{geo}</small>
          <div className="desk">
            <div className="number">
              <div className="kicker">
                {place.toUpperCase()} / CURRENT US AQI
              </div>
              <strong>{air?.aqi ?? "—"}</strong>
              <b>{category(air?.aqi)}</b>
              <p>PM₂.₅ · {air?.pm ?? "—"} µg/m³</p>
              <small>{status}</small>
            </div>
            <div className="chart">
              <div className="chartHead">
                <h3>Next 24 hours</h3>
                <button onClick={() => setDemo(!demo)}>
                  {demo ? "Use live forecast" : "Try smog demo"}
                </button>
              </div>
              {air?.hours.length ? (
                <>
                  <div className="bars">
                    {air.hours.map((h) => (
                      <button
                        key={h.time}
                        aria-label={clock(h.time, zone) + " US AQI " + h.aqi}
                        aria-pressed={selected === h.time}
                        onClick={() => setSelected(h.time)}
                      >
                        <b>{h.aqi}</b>
                        <i
                          style={{
                            height: Math.max(5, Math.min(92, h.aqi / 4)) + "px",
                            background: h.aqi > 150 ? "#c44527" : "#406853",
                          }}
                        />
                        <small>
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: zone,
                          }).format(h.time * 1000)}
                        </small>
                      </button>
                    ))}
                  </div>
                  <p>
                    {hour
                      ? clock(hour.time, zone) + " · " + category(hour.aqi)
                      : "Select an hour to adapt your routine."}{" "}
                    {hour && (
                      <button onClick={() => setSelected(null)}>Reset</button>
                    )}
                  </p>
                </>
              ) : (
                <div className="empty">
                  <Wind />
                  <p>{status}</p>
                </div>
              )}
            </div>
          </div>
        </section>
        <section id="routine">
          <div className="heading">
            <div>
              <div className="kicker">THE DAILY ROUTINE</div>
              <h2>Through the day</h2>
            </div>
            <span>
              {cards.filter((c) => checks[key(c)]).length} / 3 completed
            </span>
          </div>
          <div className="settings">
            {Object.entries(options).map(([k, values], i) => (
              <label key={k}>
                {["Household", "Commute", "Home setup"][i]}
                <select
                  value={profile[k]}
                  onChange={(e) =>
                    setProfile({ ...profile, [k]: e.target.value })
                  }
                >
                  {values.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="sceneTabs">
            {chapters.map(([name], i) => (
              <button
                key={name}
                aria-pressed={i === scene}
                onClick={() => tab(i)}
              >
                {name}
              </button>
            ))}
          </div>
          <article className="scene">
            <figure key={image}>
              <img src={"/media/" + image + ".jpg"} alt={chapter} />
            </figure>
            <div className="script" key={card.title}>
              <div className="kicker">
                {demo ? "SIMULATION · " : ""}
                {hour ? clock(hour.time, zone) : "Current conditions"} ·{" "}
                {aqi == null ? "AQI unavailable" : "US AQI " + aqi}
              </div>
              <h3>{card.title}</h3>
              <p>{card.action}</p>
              <blockquote>{card.impact}</blockquote>
              <label>
                <input
                  type="checkbox"
                  checked={!!checks[key(card)]}
                  onChange={(e) => {
                    const next = { ...checks, [key(card)]: e.target.checked };
                    setChecks(next);
                    save("saans-actions", next);
                  }}
                />{" "}
                Done today
              </label>
              {hour && !demo && (
                <button onClick={() => calendar(hour, card)}>
                  Add to calendar
                </button>
              )}
            </div>
          </article>
          <div className="transport">
            <button
              onClick={() => {
                if (!playing && scene === 2) setScene(0);
                setPlaying(!playing);
              }}
            >
              {playing ? "Pause walkthrough" : "Play walkthrough"}
            </button>
            <div className="track">
              <i key={scene + ":" + playing} className={playing ? "run" : ""} />
            </div>
            <button onClick={() => tab((scene + 1) % 3)}>
              {scene === 2 ? "Start again" : "Next scene"}
            </button>
          </div>
        </section>
        <div className="bottom">
          <Assistant key={JSON.stringify(context)} context={context} />
          <aside>
            <img
              src="/media/neighbours.jpg"
              alt="Neighbours gathering in a shared courtyard"
            />
            <h3>Share a smog-day plan</h3>
            <p>Pass a short air report to your school or residents’ group.</p>
            <button onClick={share}>Copy community note</button>
            <small role="status">{note}</small>
          </aside>
        </div>
      </main>
      <footer>
        Saans · Winter air field guide{" "}
        <a href="https://open-meteo.com/en/docs/air-quality-api">
          Open-Meteo / CAMS
        </a>
        <a href="https://www.airnow.gov/aqi/aqi-basics/">US AQI scale</a>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
