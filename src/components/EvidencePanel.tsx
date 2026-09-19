import type { CheckResult } from "@/lib/check";

function AirportDelay({ side, title }: { side: NonNullable<CheckResult["evidence"]["arrivalAirport"]>; title: string }) {
  return (
    <div className="card">
      <p className="eyebrow">{title} · {side.icao}</p>
      {!side.covered ? (
        <p className="small muted" style={{ margin: "8px 0 0" }}>This airport is outside the Eurocontrol network, so there is no daily air-traffic delay record to check.</p>
      ) : !side.row ? (
        <>
          <h3 style={{ marginTop: 6 }}>No air-traffic delay logged</h3>
          <p className="small muted">Eurocontrol attributes no ATFM arrival delay to {side.covered.name} on this day. Weather, ATC and airport restrictions show up here when they bite; a blank day is a strong point in your favour.</p>
        </>
      ) : (
        <>
          <h3 style={{ marginTop: 6 }}>{side.row.delay_min.toLocaleString()} minutes of ATFM delay</h3>
          <p className="small muted">Across {side.row.delayed_15 ?? side.row.delayed_flights ?? "?"} delayed arrivals out of {side.row.arrivals ?? "?"} at {side.covered.name}. Causes logged:</p>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {side.causes.map((c) => (
              <div key={c.code}>
                <div style={{ display: "flex", justifyContent: "space-between" }} className="small">
                  <span>{c.label} <span className="muted">({c.extraordinary === "likely" ? "airline will call this extraordinary" : c.extraordinary === "possible" ? "arguable" : "not extraordinary"})</span></span>
                  <span className="mono">{c.minutes} min · {c.share}%</span>
                </div>
                <div className="bar"><span style={{ width: `${c.share}%` }} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Weather({ wx, title }: { wx: NonNullable<CheckResult["evidence"]["weatherDeparture"]>; title: string }) {
  const tone = wx.severity === "adverse" ? "stop" : wx.severity === "marginal" ? "warn" : wx.severity === "clear" ? "go" : "warn";
  return (
    <div className="card">
      <p className="eyebrow">{title} · {wx.station}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
        <h3>{wx.observations === 0 ? "No observations" : wx.severity === "clear" ? "Nothing adverse observed" : wx.severity === "marginal" ? "Marginal conditions" : "Adverse weather observed"}</h3>
        <span className={`pill ${tone}`}>{wx.severity}</span>
      </div>
      {wx.observations > 0 ? (
        <dl className="kv" style={{ marginTop: 10 }}>
          <dt>Window (UTC)</dt><dd>{wx.windowUtc.from} to {wx.windowUtc.to}</dd>
          <dt>Observations</dt><dd>{wx.observations}</dd>
          <dt>Lowest visibility</dt><dd>{wx.minVisibilityM !== null ? `${wx.minVisibilityM.toLocaleString()} m` : "n/a"}</dd>
          <dt>Strongest gust</dt><dd>{wx.maxGustKt !== null ? `${wx.maxGustKt} kt` : "none reported"}</dd>
          <dt>Phenomena</dt><dd>{wx.phenomena.length ? wx.phenomena.join(", ") : "none"}</dd>
        </dl>
      ) : (
        <p className="small muted">This station did not report METARs in the window, so weather cannot be confirmed either way.</p>
      )}
      {wx.sampleMetar && wx.severity !== "clear" && <p className="mono small muted" style={{ marginTop: 8, wordBreak: "break-all" }}>{wx.sampleMetar}</p>}
    </div>
  );
}

export default function EvidencePanel({ r }: { r: CheckResult }) {
  const e = r.evidence;
  return (
    <section style={{ marginTop: 28 }}>
      <p className="eyebrow">The airline&apos;s possible defence, checked</p>
      <h2 style={{ margin: "8px 0 6px" }}>What the public record says about that day</h2>
      <p className="muted measure" style={{ marginBottom: 16 }}>{r.defenceRisk.summary}</p>
      <div className="ev">
        {e.arrivalAirport && <AirportDelay side={e.arrivalAirport} title="Arrival airport delay record" />}
        {e.departureAirport && <AirportDelay side={e.departureAirport} title="Departure airport delay record" />}
        {e.weatherDeparture && <Weather wx={e.weatherDeparture} title="Departure weather" />}
        {e.weatherArrival && <Weather wx={e.weatherArrival} title="Arrival weather" />}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Sources: Eurocontrol Performance Review Unit airport arrival ATFM delay by cause (daily, 2019 to last month); METAR observations via the Iowa Environmental Mesonet archive. These records show whether the conditions airlines cite existed; the airline must still prove they affected your flight.</p>
    </section>
  );
}
