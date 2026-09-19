// Where a UK passenger goes if the airline refuses or ignores the claim.
// AviationADR and CEDR are the two CAA-approved schemes; both are free to the passenger.
// Membership lists change; this table is the working set and every entry links to the scheme's own checker.

export interface AdrRoute {
  scheme: "CEDR" | "AviationADR" | "CAA PACT" | "unknown";
  url: string;
  note: string;
}

const CEDR_AIRLINES = new Set(["BA", "CJ", "CX", "SK"]);
const AVIATION_ADR_AIRLINES = new Set(["U2", "EC", "DS", "FR", "RK", "BY", "W6", "W9", "VS", "KL", "AF", "TK", "DL", "LS", "EI", "EW", "LH", "LX", "OS", "SN", "IB", "VY", "TP", "AZ", "AY", "DY", "D8", "LO", "A3", "TO", "HV", "DE", "X3", "BT", "FI", "EK", "QR", "EY", "AA", "UA", "AC", "WS", "TS", "PC", "XQ", "SU", "LY", "MS", "RJ", "SV", "KQ", "AI", "UL", "SQ", "CX", "QF", "NZ", "JL", "NH", "KE"]);

export function adrFor(airlineCode: string): AdrRoute {
  const c = airlineCode.toUpperCase();
  if (CEDR_AIRLINES.has(c)) return { scheme: "CEDR", url: "https://www.cedr.com/consumer/aviation/", note: "British Airways disputes go to CEDR. Free to you; the airline pays the case fee." };
  if (AVIATION_ADR_AIRLINES.has(c)) return { scheme: "AviationADR", url: "https://www.aviationadr.org.uk/", note: "Free to you, decisions are binding on the airline, and you can go there once the airline has given a final answer or ignored you for 8 weeks." };
  return { scheme: "CAA PACT", url: "https://www.caa.co.uk/passengers/resolving-travel-problems/how-the-caa-can-help/", note: "If the airline is not in an ADR scheme, the CAA's Passenger Advice and Complaints Team can review the case, or you can use the small claims track." };
}

export const AIRLINE_CLAIM_PAGES: Record<string, string> = {
  BA: "https://www.britishairways.com/en-gb/information/delayed-or-cancelled-flights/compensation",
  U2: "https://www.easyjet.com/en/help/boarding-and-flying/delays-and-cancellations",
  EC: "https://www.easyjet.com/en/help/boarding-and-flying/delays-and-cancellations",
  FR: "https://www.ryanair.com/gb/en/useful-info/help-centre/faq-overview/Flight-Disruptions",
  RK: "https://www.ryanair.com/gb/en/useful-info/help-centre/faq-overview/Flight-Disruptions",
  LS: "https://www.jet2.com/en/delays-and-cancellations",
  BY: "https://www.tui.co.uk/destinations/info/flight-delay-compensation",
  VS: "https://help.virginatlantic.com/gb/en/booking/delays-cancellations.html",
  W6: "https://wizzair.com/en-gb/information-and-services/travel-information/delays-and-cancellations",
  W9: "https://wizzair.com/en-gb/information-and-services/travel-information/delays-and-cancellations",
  EI: "https://www.aerlingus.com/support/forms/eu-compensation/",
  KL: "https://www.klm.co.uk/information/legal/passenger-rights",
  AF: "https://wwws.airfrance.co.uk/information/legal/droits-des-passagers",
  LH: "https://www.lufthansa.com/gb/en/passenger-rights",
  EK: "https://www.emirates.com/uk/english/help/forms/flight-delay-cancellation-compensation/",
  QR: "https://www.qatarairways.com/en-gb/legal/eu-regulation.html",
  TK: "https://www.turkishairlines.com/en-int/any-questions/passenger-rights/",
  IB: "https://www.iberia.com/gb/customer-service/passenger-rights/",
  VY: "https://www.vueling.com/en/customer-services/passenger-rights",
  TP: "https://www.flytap.com/en-gb/customer-support",
  AZ: "https://www.ita-airways.com/en_gb/support/passenger-rights.html",
  SK: "https://www.flysas.com/en/customer-service/delayed-or-cancelled-flights/",
  DY: "https://www.norwegian.com/uk/travel-info/delays-and-cancellations/",
  LM: "https://www.loganair.co.uk/travel-help/passenger-rights/",
  DE: "https://www.condor.com/eu/flight-preparation/customer-service/passenger-rights.jsp",
  EW: "https://www.eurowings.com/en/information/passenger-rights.html",
};
