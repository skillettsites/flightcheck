# FlightDelayCheck (working brand; domain not yet registered, flightdelaycheck.co.uk was available on 19 Sep 2026)

UK261 / EU261 flight compensation checker. Free verdict built from three public records, then a paid claim letter (£4.99) or claim pack (£9.99). The AppealAFine model aimed at claims firms that take 35 to 50%.

## Stack
Next.js 16 App Router, TypeScript strict, Tailwind v4 (mostly hand CSS in `globals.css`), Vercel (team `skillettsites-projects`), Supabase shared project `noxczmrnyyosgvvjlqca` with `fcc_` tables, Stripe (AppealAFine's account by value), Resend, Anthropic `claude-sonnet-5` for letters.

## Data sources
- **AeroDataBox via RapidAPI** (`RAPIDAPI_KEY`): flight by number + date. Account `skillettsites` on RapidAPI (skillettsites@gmail.com), Basic plan: free, 400 units/month, 1,600 requests, data within ±365 days, attribution REQUIRED (footer credits it), caching 7 days. Flight status endpoint costs 2 units, so ~200 checks a month. Upgrade path: Pro $8 (5k units, but only ±180 days) or Ultra $40 (50k units, ±210 days); direct Growth $99 keeps 365 days plus extended caching.
- **Eurocontrol PRU** airport arrival ATFM delay by cause, daily since 2019: ingested into `fcc_apt_delay_daily` (only days with delay > 0; ~57k rows) and `fcc_airports_covered` by `scripts/ingest-eurocontrol.py` (re-run monthly; the xlsx is ~97 MB at eurocontrol.int/performance/data/download/xls/Airport_Arrival_ATFM_Delay.xlsx). Anon SELECT policy.
- **IEM METAR archive** (`mesonet.agron.iastate.edu/cgi-bin/request/asos.py`): free, no key, but rate-limits bursts (429/503). Calls are sequential with backoff. Arrival window = 4h before scheduled arrival to 1h after actual.
- **OurAirports** compact extract in `src/data/airports.min.json` (4,030 airports with IATA + scheduled service).

## Key rules encoded (`src/lib/eu261.ts`, `check.ts`)
- Arrival time = the LATER of `revisedTime` (gate) and `runwayTime`. AeroDataBox often leaves gate = schedule while touchdown carries the truth (27 Jun 2026 Gatwick: ten easyJet flights 3 to 6 h late showed gate on time). Basis is surfaced as "gate" or "runway".
- Coverage: dep UK => UK261 any carrier; arr UK on UK/EU carrier => UK261; dep EU/EEA/CH => EU261 any carrier; arr EU on EU carrier => EU261. Both can apply.
- Bands: UK £220/£350/£520 (£260 for 3 to 4h over 3,500 km); EU €250/€400/€600 (€300), intra-EU > 1,500 km = €400.
- Defence risk graded from Eurocontrol cause codes (W, I, N, S, C, T, R, M, D "likely extraordinary") and METAR severity.
- Never mention section 75, credit cards, insurance or chargebacks anywhere (financial-services claims are inside the FCA perimeter; flight delay is not).

## Supabase
Tables `fcc_apt_delay_daily`, `fcc_airports_covered` (anon read), `fcc_checks`, `fcc_purchases` (anon INSERT only). Reads of customer rows go through SECURITY DEFINER RPCs: `fcc_get_check(token)`, `fcc_get_purchase(token)`, `fcc_get_purchase_by_session(id)`, `fcc_complete_purchase(...)`, `fcc_attach_session(token, session)`. Schema in the 19 Sep session scratchpad `fcc_schema.sql` (re-create from this description if lost). Never use the service-role key here.

## Fulfilment
`/api/checkout` creates a pending `fcc_purchases` row + Stripe session (inline price_data, `metadata.site = flightdelaycheck`, promo codes on). Both `/api/webhook` and `/api/purchase-status` (polled by `/r/[token]`) call `lib/fulfil.ts`, which is idempotent: generate letter (+ escalation for the pack), email via Resend if `FROM_EMAIL` is set, mark ready.

## Env
`RAPIDAPI_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (server-only names; the NEXT_PUBLIC_ variants also work), `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` (AppealAFine account), `STRIPE_WEBHOOK_SECRET`, `FROM_EMAIL` (unset until a domain is verified in Resend), `NEXT_PUBLIC_SITE_URL`, `LETTER_MODEL`, `IP_HASH_SALT`.

## Commit identity
Always `git -c user.name="skillettsites" -c user.email="davidskillett@hotmail.co.uk" commit ...` (Vercel blocks other authors). Production branch: `main`.

## Flight Watch (added 19 Sep, evening)
`/watch` sign-up (paste a booking confirmation -> `/api/watch/parse` extracts flights with claude-haiku-4-5; or type them), rows in `fcc_watches` keyed by a per-signup `token`; `/watch/[token]` manages every watch for that email (RPC joins by email), `?confirm=1` confirms. Double opt-in only when `FROM_EMAIL` is set; otherwise watches go live directly. `/api/cron/watch` (every 2h, `Authorization: Bearer CRON_SECRET`, key also stored in `fcc_secrets` for the SECURITY DEFINER RPCs) runs `runCheck` on watches whose flight_date is before today (UTC), stores a `fcc_checks` row and emails the verdict (`lib/emails.ts`); the pay link prefills email and passengers on `/check/[token]?email=&pax=`.

## Follow-ups
`/api/cron/followups` daily 09:00: stage 1 at 28 days (did they reply), stage 2 at 56 (ADR is open, pre-filled link), stage 3 at 84 (outcome survey). Stops when `fcc_purchases.outcome` is set via `/api/outcome?token&outcome=`.

## Airport disruption pages (the SEO engine)
`/airport-delays` (index), `/airport-delays/[slug]` (airport hub: worst 25 days, recent 45, cause mix, airlines based there), `/airport-delays/[slug]/[YYYY-MM-DD]` (day page: Eurocontrol record, whole-day METAR, rank since 2019, other airports that day, FAQPage schema, check form prefilled with the date). Slugs live in `fcc_airports_covered.slug` (from the Eurocontrol name: "London - Gatwick" -> london-gatwick). A day page exists when `isSignificant()`: UK/IE >= 300 min, elsewhere >= 1000 min, or 40+ flights held. ~11,400 pages, ISR 30 days, top 150 pre-rendered. Sitemap: `/sitemap.xml` is an index over `/sitemaps/sitemap/{0..n}.xml` (0 = core + airlines + airport hubs, then 5,000 day URLs per file). Supabase caps responses at 1,000 rows: use `sbSelectAll` (Range pagination) for anything bigger.

## Design (redesigned 19 Sep, late)
Vocabulary comes from the subject: a boarding pass (`.pass` / `.pass-main` / `.pass-stub` with the perforated edge and notches) for the check form and the buy form, a departure board (`.board`, amber flap values, `.flap-in` reveal) for verdicts, a ticker (`.tape`) of real recent disruption days on the home page, hairline ledgers (`.ledger`) instead of pricing cards, a typographic index (`.index`) instead of airline chips, a numbered FAQ record (`details` styling; add `className="plain"` to any `<details>` that is not an FAQ). Archivo is loaded as a variable font with the `wdth` axis: h1 is condensed (wdth 76), h2 86, `.cond` / `.wide` helpers. Only the board and the pass are boxes; everything else is rules on paper. No emoji, no tick lists, no three-card rows.

## The form asks two things only
Flight number and date. The record decides delayed vs cancelled vs diverted (`runCheck` promotes to "cancellation" when the status says so). The two facts the record cannot hold are asked afterwards, on the result: `CancellationRefine` (notice given, re-route offered) for a cancelled flight, and `DeniedBoardingLink` on no-claim results for a flight that ran. Both post to `/api/check/refine`, which re-evaluates the STORED result with `refineCheck()` (no AeroDataBox/METAR spend) and files a new `fcc_checks` row with a new token.

## Caching
Public reads in `lib/disruption.ts` pass `revalidate = 86400` so `/airport-delays` and the day pages are really static/ISR (a `cache: "no-store"` fetch anywhere in a page makes the whole route dynamic, which is what was happening before). METAR fetches for days that ended 48h+ ago are cached for 30 days. Customer reads (`fcc_get_check` etc.) stay `no-store`.

## Not done yet
Domain + Resend sender (`FROM_EMAIL`), GSC/Bing/IndexNow submission (needs the domain), separate Stripe account (checkout shows "Appeal A Fine"), GA4, per-airline success-rate pages from `fcc_purchases.outcome`, Canada APPR engine, EU-language versions, FlightAware for flights older than 12 months, pack upgrade product for letter-only buyers, monthly Eurocontrol re-ingest (cron or manual).
