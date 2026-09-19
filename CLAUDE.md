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
`RAPIDAPI_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` (AppealAFine account), `STRIPE_WEBHOOK_SECRET`, `FROM_EMAIL` (unset until a domain is verified in Resend), `NEXT_PUBLIC_SITE_URL`, `LETTER_MODEL`, `IP_HASH_SALT`.

## Commit identity
Always `git -c user.name="skillettsites" -c user.email="davidskillett@hotmail.co.uk" commit ...` (Vercel blocks other authors). Production branch: `main`.

## Not done yet
Domain + Resend sender, airline landing pages (`/airlines/[code]`), EU-language versions, Canada APPR engine, FlightAware for flights older than 12 months, Bing/GSC submission, GA4.
