"""Ingest Eurocontrol Airport_Arrival_ATFM_Delay.xlsx DATA sheet into fcc_apt_delay_daily.
Only days with recorded ATFM arrival delay are stored; absence of a row = no delay attributed that day.
Also fills fcc_airports_covered with coverage span per airport.
"""
import json, os, sys, time, urllib.request, datetime
import openpyxl

XLSX = 'Airport_Arrival_ATFM_Delay.xlsx'
API = "https://api.supabase.com/v1/projects/noxczmrnyyosgvvjlqca/database/query"
TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]  # Supabase personal access token (Management API), never commit it
CAUSE_COLS = ['A','C','D','E','G','I','M','N','O','P','R','S','T','V','W','NA']

def run_sql(sql):
    req = urllib.request.Request(API, data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}, method="POST")
    for attempt in range(4):
        try:
            r = urllib.request.urlopen(req, timeout=180)
            return r.status
        except Exception as e:
            print('sql error', attempt, str(e)[:200]); time.sleep(5 * (attempt + 1))
    raise SystemExit('sql failed')

def esc(s):
    return "'" + str(s).replace("'", "''") + "'"

t0 = time.time()
wb = openpyxl.load_workbook(XLSX, read_only=True)
ws = wb['DATA']
rows = ws.iter_rows(values_only=True)
header = next(rows)
idx = {h: i for i, h in enumerate(header) if h}
ci = {c: idx[f'DLY_APT_ARR_{c}_1'] for c in CAUSE_COLS}
i_date, i_icao, i_name, i_state = idx['FLT_DATE'], idx['APT_ICAO'], idx['APT_NAME'], idx['STATE_NAME']
i_arr, i_tot, i_dly, i_dly15 = idx['FLT_ARR_1'], idx['DLY_APT_ARR_1'], idx['FLT_ARR_1_DLY'], idx['FLT_ARR_1_DLY_15']

airports = {}
batch = []
n_scanned = n_kept = n_batches = 0

def flush():
    global batch, n_batches
    if not batch: return
    sql = ("insert into fcc_apt_delay_daily (icao, day, arrivals, delay_min, delayed_flights, delayed_15, causes) values "
           + ",".join(batch)
           + " on conflict (icao, day) do update set arrivals=excluded.arrivals, delay_min=excluded.delay_min, "
             "delayed_flights=excluded.delayed_flights, delayed_15=excluded.delayed_15, causes=excluded.causes;")
    run_sql(sql); n_batches += 1; batch = []

def num(v):
    if v is None: return 0
    try: return int(round(float(v)))
    except Exception: return 0

for r in rows:
    n_scanned += 1
    icao = r[i_icao]
    d = r[i_date]
    if not icao or not isinstance(d, (datetime.datetime, datetime.date)): continue
    day = d.date() if isinstance(d, datetime.datetime) else d
    a = airports.setdefault(icao, [r[i_name], r[i_state], day, day])
    if day < a[2]: a[2] = day
    if day > a[3]: a[3] = day
    tot = num(r[i_tot])
    if tot <= 0: continue
    causes = {c: num(r[ci[c]]) for c in CAUSE_COLS if num(r[ci[c]]) > 0}
    batch.append(f"({esc(icao)},'{day.isoformat()}',{num(r[i_arr])},{tot},{num(r[i_dly])},{num(r[i_dly15])},{esc(json.dumps(causes, separators=(',',':')))}::jsonb)")
    n_kept += 1
    if len(batch) >= 2500:
        flush()
        if n_batches % 10 == 0:
            print(f'scanned {n_scanned} kept {n_kept} batches {n_batches} {round(time.time()-t0)}s', flush=True)
flush()

vals = [f"({esc(k)},{esc(v[0])},{esc(v[1])},'{v[2].isoformat()}','{v[3].isoformat()}')" for k, v in airports.items()]
run_sql("insert into fcc_airports_covered (icao,name,state,first_day,last_day) values " + ",".join(vals)
        + " on conflict (icao) do update set name=excluded.name, state=excluded.state, first_day=excluded.first_day, last_day=excluded.last_day;")
print(f'DONE scanned {n_scanned} kept {n_kept} airports {len(airports)} batches {n_batches} in {round(time.time()-t0)}s')
