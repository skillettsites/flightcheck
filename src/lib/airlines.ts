// Operating carriers by IATA code, with the country of the operating licence.
// "UK or EU carrier" status matters for flights INTO the UK or EU from elsewhere.
// Unknown codes fall back to "unknown" and the engine says so rather than guessing.
export interface Airline {
  name: string;
  country: string; // ISO country of the air operator certificate
}

export const AIRLINES: Record<string, Airline> = {
  // United Kingdom
  BA: { name: "British Airways", country: "GB" }, CJ: { name: "BA CityFlyer", country: "GB" }, U2: { name: "easyJet UK", country: "GB" },
  LS: { name: "Jet2.com", country: "GB" }, BY: { name: "TUI Airways", country: "GB" }, VS: { name: "Virgin Atlantic", country: "GB" },
  LM: { name: "Loganair", country: "GB" }, T3: { name: "Eastern Airways", country: "GB" }, RK: { name: "Ryanair UK", country: "GB" },
  W9: { name: "Wizz Air UK", country: "GB" }, ZB: { name: "Air Albania", country: "AL" }, BE: { name: "Flybe", country: "GB" }, GR: { name: "Aurigny", country: "GG" },
  SI: { name: "Blue Islands", country: "JE" }, ZT: { name: "Titan Airways", country: "GB" }, NO: { name: "Neos", country: "IT" },
  // Ireland and EU
  EI: { name: "Aer Lingus", country: "IE" }, EG: { name: "Aer Lingus UK", country: "GB" }, FR: { name: "Ryanair", country: "IE" }, RR: { name: "Buzz (Ryanair)", country: "PL" },
  AL: { name: "Malta Air (Ryanair)", country: "MT" }, EC: { name: "easyJet Europe", country: "AT" }, DS: { name: "easyJet Switzerland", country: "CH" },
  AF: { name: "Air France", country: "FR" }, KL: { name: "KLM", country: "NL" }, LH: { name: "Lufthansa", country: "DE" }, CL: { name: "Lufthansa CityLine", country: "DE" },
  LX: { name: "SWISS", country: "CH" }, OS: { name: "Austrian Airlines", country: "AT" }, SN: { name: "Brussels Airlines", country: "BE" },
  IB: { name: "Iberia", country: "ES" }, I2: { name: "Iberia Express", country: "ES" }, VY: { name: "Vueling", country: "ES" }, UX: { name: "Air Europa", country: "ES" },
  TP: { name: "TAP Air Portugal", country: "PT" }, AZ: { name: "ITA Airways", country: "IT" }, SK: { name: "SAS", country: "SE" }, AY: { name: "Finnair", country: "FI" },
  DY: { name: "Norwegian", country: "NO" }, D8: { name: "Norwegian Air Sweden", country: "SE" }, W6: { name: "Wizz Air", country: "HU" }, W4: { name: "Wizz Air Malta", country: "MT" },
  LO: { name: "LOT Polish Airlines", country: "PL" }, OK: { name: "Czech Airlines", country: "CZ" }, RO: { name: "TAROM", country: "RO" }, A3: { name: "Aegean Airlines", country: "GR" },
  OA: { name: "Olympic Air", country: "GR" }, HV: { name: "Transavia", country: "NL" }, TO: { name: "Transavia France", country: "FR" }, EW: { name: "Eurowings", country: "DE" },
  DE: { name: "Condor", country: "DE" }, X3: { name: "TUI fly Deutschland", country: "DE" }, OR: { name: "TUI fly Netherlands", country: "NL" }, TB: { name: "TUI fly Belgium", country: "BE" },
  BT: { name: "airBaltic", country: "LV" }, FI: { name: "Icelandair", country: "IS" }, KM: { name: "KM Malta Airlines", country: "MT" }, OU: { name: "Croatia Airlines", country: "HR" },
  JU: { name: "Air Serbia", country: "RS" }, V7: { name: "Volotea", country: "ES" },
  EN: { name: "Air Dolomiti", country: "IT" }, LG: { name: "Luxair", country: "LU" }, WX: { name: "CityJet", country: "IE" },
  VF: { name: "AJet", country: "TR" }, PC: { name: "Pegasus Airlines", country: "TR" }, TK: { name: "Turkish Airlines", country: "TR" }, XQ: { name: "SunExpress", country: "TR" },
  // Rest of world (not UK or EU carriers)
  EK: { name: "Emirates", country: "AE" }, QR: { name: "Qatar Airways", country: "QA" }, EY: { name: "Etihad Airways", country: "AE" },
  AA: { name: "American Airlines", country: "US" }, UA: { name: "United Airlines", country: "US" }, DL: { name: "Delta Air Lines", country: "US" }, B6: { name: "JetBlue", country: "US" },
  AS: { name: "Alaska Airlines", country: "US" }, WN: { name: "Southwest", country: "US" }, AC: { name: "Air Canada", country: "CA" }, WS: { name: "WestJet", country: "CA" }, TS: { name: "Air Transat", country: "CA" }, PD: { name: "Porter Airlines", country: "CA" },
  SU: { name: "Aeroflot", country: "RU" }, LY: { name: "El Al", country: "IL" }, ET: { name: "Ethiopian Airlines", country: "ET" }, KE: { name: "Korean Air", country: "KR" }, OZ: { name: "Asiana", country: "KR" },
  JL: { name: "Japan Airlines", country: "JP" }, NH: { name: "ANA", country: "JP" }, CX: { name: "Cathay Pacific", country: "HK" }, SQ: { name: "Singapore Airlines", country: "SG" }, QF: { name: "Qantas", country: "AU" },
  VA: { name: "Virgin Australia", country: "AU" }, NZ: { name: "Air New Zealand", country: "NZ" }, MS: { name: "EgyptAir", country: "EG" }, RJ: { name: "Royal Jordanian", country: "JO" },
  SV: { name: "Saudia", country: "SA" }, KQ: { name: "Kenya Airways", country: "KE" }, SA: { name: "South African Airways", country: "ZA" }, LA: { name: "LATAM", country: "CL" },
  AV: { name: "Avianca", country: "CO" }, AM: { name: "Aeroméxico", country: "MX" }, CM: { name: "Copa Airlines", country: "PA" }, AI: { name: "Air India", country: "IN" },
  UL: { name: "SriLankan Airlines", country: "LK" }, MH: { name: "Malaysia Airlines", country: "MY" }, TG: { name: "Thai Airways", country: "TH" }, VN: { name: "Vietnam Airlines", country: "VN" },
  CA: { name: "Air China", country: "CN" }, MU: { name: "China Eastern", country: "CN" }, CZ: { name: "China Southern", country: "CN" }, HU: { name: "Hainan Airlines", country: "CN" },
  GF: { name: "Gulf Air", country: "BH" }, WY: { name: "Oman Air", country: "OM" }, KU: { name: "Kuwait Airways", country: "KW" }, AT: { name: "Royal Air Maroc", country: "MA" }, TU: { name: "Tunisair", country: "TN" },
  PK: { name: "Pakistan International Airlines", country: "PK" }, BG: { name: "Biman Bangladesh", country: "BD" }, ME: { name: "Middle East Airlines", country: "LB" },
  FZ: { name: "flydubai", country: "AE" }, G9: { name: "Air Arabia", country: "AE" },
  WK: { name: "Edelweiss Air", country: "CH" }, GQ: { name: "Sky Express", country: "GR" },
  PS: { name: "Ukraine International", country: "UA" },
  VB: { name: "Viva Aerobus", country: "MX" },
  BW: { name: "Caribbean Airlines", country: "TT" },
  DT: { name: "TAAG Angola", country: "AO" },
};

export function parseFlightNumber(input: string): { airline: string; number: string; full: string } | null {
  const s = input.toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^([A-Z0-9]{2})(\d{1,4})[A-Z]?$/);
  if (!m) return null;
  return { airline: m[1], number: String(parseInt(m[2], 10)), full: `${m[1]}${parseInt(m[2], 10)}` };
}

export function airlineByCode(code: string): Airline | undefined {
  return AIRLINES[code.toUpperCase()];
}
