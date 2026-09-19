// Country groupings that decide which regulation covers a flight.
// EU261 covers the EU27 plus the EEA (Iceland, Norway, Liechtenstein) and Switzerland by agreement.
// The EU outermost regions carry their own ISO codes in the airports dataset, so they are listed too.
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // outermost regions (part of the EU)
  "RE", "GP", "MQ", "GF", "YT", "MF",
]);
export const EEA_CH = new Set(["IS", "NO", "LI", "CH"]);
export const UK = "GB";

export function isEuRegime(country: string): boolean {
  return EU_COUNTRIES.has(country) || EEA_CH.has(country);
}
export function isUk(country: string): boolean {
  return country === UK;
}

export const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom", IE: "Ireland", FR: "France", DE: "Germany", ES: "Spain", IT: "Italy", PT: "Portugal", NL: "Netherlands",
  BE: "Belgium", AT: "Austria", CH: "Switzerland", GR: "Greece", PL: "Poland", CZ: "Czechia", HU: "Hungary", DK: "Denmark",
  SE: "Sweden", NO: "Norway", FI: "Finland", IS: "Iceland", HR: "Croatia", CY: "Cyprus", MT: "Malta", BG: "Bulgaria", RO: "Romania",
  US: "United States", CA: "Canada", TR: "Turkey", AE: "United Arab Emirates", QA: "Qatar", EG: "Egypt", MA: "Morocco", TN: "Tunisia",
  IN: "India", AU: "Australia", NZ: "New Zealand", SG: "Singapore", HK: "Hong Kong", JP: "Japan", TH: "Thailand", MX: "Mexico",
  ZA: "South Africa", BR: "Brazil", AR: "Argentina", IL: "Israel", JO: "Jordan", SA: "Saudi Arabia", KE: "Kenya", LK: "Sri Lanka",
  MV: "Maldives", MU: "Mauritius", BB: "Barbados", JM: "Jamaica", CN: "China", KR: "South Korea", VN: "Vietnam", ID: "Indonesia",
  MY: "Malaysia", PH: "Philippines", PK: "Pakistan", BD: "Bangladesh", RS: "Serbia", ME: "Montenegro", AL: "Albania", MK: "North Macedonia",
  BA: "Bosnia and Herzegovina", UA: "Ukraine", MD: "Moldova", GE: "Georgia", AM: "Armenia", AZ: "Azerbaijan", KZ: "Kazakhstan",
  UZ: "Uzbekistan", LB: "Lebanon", OM: "Oman", BH: "Bahrain", KW: "Kuwait", GI: "Gibraltar", JE: "Jersey", GG: "Guernsey", IM: "Isle of Man",
  RE: "Réunion (France)", GP: "Guadeloupe (France)", MQ: "Martinique (France)", GF: "French Guiana", YT: "Mayotte (France)", MF: "Saint Martin (France)",
  CV: "Cape Verde", GM: "Gambia", SN: "Senegal", DO: "Dominican Republic", CU: "Cuba", AG: "Antigua and Barbuda", LC: "Saint Lucia",
  TT: "Trinidad and Tobago", BS: "Bahamas", KY: "Cayman Islands", BM: "Bermuda", CR: "Costa Rica", PA: "Panama", CO: "Colombia", PE: "Peru", CL: "Chile",
  EE: "Estonia", LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", SK: "Slovakia", SI: "Slovenia", LI: "Liechtenstein",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}
