// Airline landing pages. Each entry is specific to the carrier: which regulation covers its typical
// routes, where its claim form lives, which ADR scheme hears disputes, and the questions its passengers
// actually search. Search volumes are Keyword Planner UK 12-month averages pulled 19 Sep 2026.
export interface AirlinePage {
  slug: string;
  code: string;
  name: string;
  shortName: string;
  country: string;
  carrierType: "uk" | "eu" | "third";
  claimUrl: string;
  adr: "CEDR" | "AviationADR" | "CAA";
  monthlySearches: number;
  hubs: string[];
  typicalRoutes: { from: string; to: string; km: number; band: string }[];
  notes: string[]; // carrier-specific facts a passenger needs
  faqs: { q: string; a: string }[];
}

const CARE = "After two hours on a short-haul flight (three on medium-haul, four on long-haul) you are owed meals, drinks and two calls or emails, and a hotel with transfers if you are stuck overnight. Keep every receipt; these are refundable on top of any compensation.";

export const AIRLINE_PAGES: AirlinePage[] = [
  {
    slug: "easyjet", code: "U2", name: "easyJet", shortName: "easyJet", country: "GB", carrierType: "uk",
    claimUrl: "https://www.easyjet.com/en/help/boarding-and-flying/delays-and-cancellations", adr: "AviationADR", monthlySearches: 10200,
    hubs: ["Gatwick", "Luton", "Manchester", "Bristol", "Edinburgh"],
    typicalRoutes: [
      { from: "Gatwick", to: "Malaga", km: 1665, band: "£350" }, { from: "Luton", to: "Amsterdam", km: 370, band: "£220" },
      { from: "Manchester", to: "Alicante", km: 1770, band: "£350" }, { from: "Gatwick", to: "Tenerife South", km: 2960, band: "£350" },
    ],
    notes: [
      "easyJet UK (U2) is a UK carrier, so flights INTO the UK from anywhere are covered by UK261 as well as flights out of the UK. easyJet Europe (EC) flights from EU airports fall under EU261.",
      "easyJet handles claims through its online form and usually replies within 28 days. Refusals citing air traffic control or weather are common; the check shows whether Eurocontrol logged either at your airports that day.",
      "easyJet is a member of AviationADR. If the claim is refused or unanswered after 8 weeks, the referral is free to you and binding on easyJet.",
    ],
    faqs: [
      { q: "How much compensation does easyJet pay for a delay?", a: "£220 for flights up to 1,500 km (Gatwick to Amsterdam, Geneva, Paris), £350 for 1,500 to 3,500 km (Malaga, Alicante, Tenerife, Athens), per passenger, when you arrive 3 hours or more late and the cause was within easyJet's control. Under EU261, from an EU airport, the figures are €250 and €400." },
      { q: "How do I claim compensation from easyJet?", a: "Use easyJet's delays and cancellations page and choose the compensation form, or write to Customer Services. Quote the flight number, date, your booking reference, the arrival delay and the regulation article. Our free check gives you the verified delay; the letter option writes the claim for you." },
      { q: "easyJet refused my claim because of air traffic control. Is that right?", a: "Only if ATC restrictions actually affected your flight and easyJet took all reasonable steps to avoid the delay. The burden of proof is easyJet's. Eurocontrol publishes the air-traffic delay attributed to every European airport each day, by cause; our check shows what it recorded at your airports." },
      { q: "How long does easyJet take to pay?", a: "easyJet aims to respond within 28 days. If it refuses or goes quiet for 8 weeks, AviationADR takes the case free of charge and typically decides within 90 days." },
      { q: "What if easyJet cancelled the flight?", a: "Compensation is due unless you were told 14 or more days before departure, or you were re-routed close to the original times. You are separately entitled to a refund within 7 days or a replacement flight, plus care while you wait. " + CARE },
    ],
  },
  {
    slug: "ryanair", code: "FR", name: "Ryanair", shortName: "Ryanair", country: "IE", carrierType: "eu",
    claimUrl: "https://www.ryanair.com/gb/en/useful-info/help-centre/faq-overview/Flight-Disruptions", adr: "AviationADR", monthlySearches: 4300,
    hubs: ["Stansted", "Dublin", "Manchester", "Edinburgh", "Bristol"],
    typicalRoutes: [
      { from: "Stansted", to: "Dublin", km: 465, band: "£220" }, { from: "Stansted", to: "Malaga", km: 1720, band: "£350" },
      { from: "Manchester", to: "Faro", km: 1810, band: "£350" }, { from: "Dublin", to: "Alicante", km: 1830, band: "€400" },
    ],
    notes: [
      "Ryanair DAC is an Irish (EU) carrier, so a Ryanair flight into the UK from the EU is covered by both UK261 and EU261. Ryanair UK (RK) operates some UK domestic and third-country routes as a UK carrier.",
      "Ryanair requires claims through its own EU261 online form and will not deal with claims companies unless a signed authority is supplied, which is one more reason to send it yourself.",
      "Ryanair is a member of AviationADR for UK passengers. Passengers on EU departures can also complain to the Irish Aviation Authority or the national enforcement body of the departure country.",
    ],
    faqs: [
      { q: "How much does Ryanair pay for a delayed flight?", a: "€250 (or £220 under UK261) for flights up to 1,500 km and €400 (£350) for 1,500 to 3,500 km, per passenger, for arrival delays of 3 hours or more that were within Ryanair's control. Ryanair has no routes over 3,500 km." },
      { q: "Can I claim under UK261 or EU261 for a Ryanair flight?", a: "Flights departing the UK are covered by UK261. Flights departing the EU are covered by EU261. Flights from the EU into the UK on Ryanair (an EU carrier) are covered by both, and you can choose which to claim under; UK residents usually claim in sterling under UK261 because enforcement is through UK courts and AviationADR." },
      { q: "Ryanair says the delay was due to air traffic control strikes. Can I still claim?", a: "A genuine ATC strike that affected your flight is an extraordinary circumstance and no compensation is due for the delay it caused. But Ryanair must show the strike affected your specific flight and that it took all reasonable measures. Eurocontrol records industrial action by ATC as a distinct cause code per airport per day; our check shows whether any was logged." },
      { q: "Does Ryanair pay compensation for a cancelled flight?", a: "Yes, unless you were told at least 14 days before departure or were re-routed within the Article 5 time limits. Ryanair's own staff strikes and crew shortages are not extraordinary circumstances (Krüsemann v TUIfly, Airhelp v SAS). " + CARE },
    ],
  },
  {
    slug: "british-airways", code: "BA", name: "British Airways", shortName: "BA", country: "GB", carrierType: "uk",
    claimUrl: "https://www.britishairways.com/en-gb/information/delayed-or-cancelled-flights/compensation", adr: "CEDR", monthlySearches: 3700,
    hubs: ["Heathrow", "Gatwick", "London City"],
    typicalRoutes: [
      { from: "Heathrow", to: "New York JFK", km: 5555, band: "£520" }, { from: "Heathrow", to: "Edinburgh", km: 535, band: "£220" },
      { from: "Heathrow", to: "Athens", km: 2400, band: "£350" }, { from: "Gatwick", to: "Orlando", km: 7000, band: "£520" },
    ],
    notes: [
      "British Airways is a UK carrier. Every BA flight departing the UK is covered by UK261, and so is every BA flight arriving in the UK from anywhere in the world, including New York, Dubai and Singapore.",
      "Long-haul matters here: over 3,500 km the compensation is £520, reduced to £260 if you arrived between 3 and 4 hours late. Heathrow to New York is 5,555 km.",
      "BA disputes go to CEDR, not AviationADR. CEDR is free to the passenger and its decisions bind BA. BA CityFlyer and BA EuroFlyer flights are treated the same way.",
    ],
    faqs: [
      { q: "How much compensation does British Airways pay?", a: "£220 for flights up to 1,500 km, £350 for 1,500 to 3,500 km, £520 for over 3,500 km (or £260 if the long-haul arrival delay was between 3 and 4 hours), per passenger, for delays of 3 hours or more at arrival that were within BA's control." },
      { q: "Is a BA flight from the USA to London covered?", a: "Yes. UK261 covers flights arriving at a UK airport on a UK or EU carrier, so a BA flight from New York, Los Angeles or Miami to Heathrow qualifies. The same flight on American Airlines would not, because AA is not a UK or EU carrier." },
      { q: "BA blamed a technical fault. Do I still get compensation?", a: "Yes. Technical faults, including those discovered unexpectedly, are not extraordinary circumstances (Huzar v Jet2.com, decided by the Court of Appeal; van der Lans v KLM at the European Court). BA must prove something outside its control, such as ATC restrictions or severe weather, and our check shows what Eurocontrol and the airport weather records logged that day." },
      { q: "Where do I escalate a BA claim?", a: "CEDR's aviation scheme, once BA has given a final answer or 8 weeks have passed. It is free to you. The alternative is a small claim in the county court, which costs a fee you recover if you win." },
    ],
  },
  {
    slug: "jet2", code: "LS", name: "Jet2.com", shortName: "Jet2", country: "GB", carrierType: "uk",
    claimUrl: "https://www.jet2.com/en/delays-and-cancellations", adr: "AviationADR", monthlySearches: 1700,
    hubs: ["Leeds Bradford", "Manchester", "Birmingham", "Stansted", "Glasgow"],
    typicalRoutes: [
      { from: "Manchester", to: "Palma", km: 1490, band: "£220" }, { from: "Leeds Bradford", to: "Tenerife South", km: 3140, band: "£350" },
      { from: "Birmingham", to: "Antalya", km: 3010, band: "£350" }, { from: "Stansted", to: "Faro", km: 1780, band: "£350" },
    ],
    notes: [
      "Jet2.com is a UK carrier flying almost entirely from UK airports, so nearly every Jet2 flight is a UK261 claim in sterling. Return legs from the EU into the UK are also covered because Jet2 is a UK carrier.",
      "The distance bands bite on Jet2's network: Manchester to Palma is just under 1,500 km (£220) while Manchester to Malaga is over it (£350). The check uses the exact great-circle distance.",
      "Jet2 lost the leading UK case on technical faults (Huzar v Jet2.com, 2014), which is why 'unexpected technical problem' is not a defence to a Jet2 claim.",
    ],
    faqs: [
      { q: "How much is Jet2 delay compensation?", a: "£220 per passenger for flights up to 1,500 km and £350 for 1,500 to 3,500 km, for arrival delays of 3 hours or more within Jet2's control. Jet2 package holiday flights count the same as flight-only bookings." },
      { q: "Does a Jet2 package holiday change my rights?", a: "No. UK261 compensation applies to the flight regardless of how it was booked. Package Travel Regulations rights sit alongside it for the holiday as a whole, but the flight claim goes to Jet2.com as the operating carrier." },
      { q: "Jet2 said the delay was a technical fault. Can they refuse?", a: "No. The Court of Appeal decided in Huzar v Jet2.com [2014] EWCA Civ 791 that ordinary technical problems are inherent in running an airline and are not extraordinary circumstances." },
      { q: "Who handles Jet2 disputes?", a: "AviationADR, free to the passenger, after Jet2's final response or 8 weeks of silence." },
    ],
  },
  {
    slug: "tui", code: "BY", name: "TUI Airways", shortName: "TUI", country: "GB", carrierType: "uk",
    claimUrl: "https://www.tui.co.uk/destinations/info/flight-delay-compensation", adr: "AviationADR", monthlySearches: 1500,
    hubs: ["Manchester", "Gatwick", "Birmingham", "Bristol", "Glasgow"],
    typicalRoutes: [
      { from: "Gatwick", to: "Cancun", km: 8100, band: "£520" }, { from: "Manchester", to: "Lanzarote", km: 2950, band: "£350" },
      { from: "Birmingham", to: "Paphos", km: 3360, band: "£350" }, { from: "Gatwick", to: "Orlando Melbourne", km: 7050, band: "£520" },
    ],
    notes: [
      "TUI Airways (BY) is a UK carrier. Its long-haul holiday routes to Mexico, Florida, the Caribbean and the Maldives all exceed 3,500 km, so the £520 band applies to most of them.",
      "TUI publishes a flight delay compensation page and a form. Package holiday customers claim the flight compensation from TUI Airways exactly as flight-only passengers do.",
      "TUI Airways is an AviationADR member for UK passengers.",
    ],
    faqs: [
      { q: "How much does TUI pay for a delayed flight?", a: "£220 (up to 1,500 km), £350 (1,500 to 3,500 km) or £520 (over 3,500 km, reduced to £260 for a 3 to 4 hour arrival delay), per passenger, for delays of 3 hours or more within TUI's control. A family of four on a delayed Cancun flight is owed £2,080." },
      { q: "I booked a TUI package. Who do I claim from?", a: "TUI Airways as the operating carrier for the UK261 compensation. Your package rights against TUI as the organiser are separate and cover the holiday, not the fixed flight compensation." },
      { q: "Does TUI's delay compensation depend on the fare I paid?", a: "No. The amounts are fixed by distance and are the same whether the flight was part of a £300 package or a £3,000 one." },
      { q: "Where do I go if TUI refuses?", a: "AviationADR, free, after a final response or 8 weeks. " + CARE },
    ],
  },
  {
    slug: "wizz-air", code: "W6", name: "Wizz Air", shortName: "Wizz Air", country: "HU", carrierType: "eu",
    claimUrl: "https://wizzair.com/en-gb/information-and-services/travel-information/delays-and-cancellations", adr: "AviationADR", monthlySearches: 1000,
    hubs: ["Luton", "Gatwick", "Budapest", "Warsaw", "Bucharest"],
    typicalRoutes: [
      { from: "Luton", to: "Budapest", km: 1480, band: "£220" }, { from: "Luton", to: "Bucharest", km: 2110, band: "£350" },
      { from: "Gatwick", to: "Tel Aviv", km: 3580, band: "£520" }, { from: "Warsaw", to: "Luton", km: 1460, band: "€250" },
    ],
    notes: [
      "Wizz Air Hungary (W6) is an EU carrier; Wizz Air UK (W9) is a UK carrier. Both are covered on any flight out of the UK; W9 flights into the UK from anywhere and W6 flights into the UK from the EU are covered too.",
      "Wizz Air has been the subject of CAA enforcement action over unpaid compensation and a large backlog of upheld claims in 2023 and 2024. Persistence, and going to AviationADR promptly after 8 weeks, matters more with Wizz than most.",
      "Luton to Budapest is 1,480 km, just inside the £220 band; Luton to Bucharest is £350.",
    ],
    faqs: [
      { q: "How much compensation does Wizz Air owe for a delay?", a: "£220 (or €250 from EU airports) up to 1,500 km, £350 (€400) for 1,500 to 3,500 km, £520 (€600) over 3,500 km, per passenger, for arrival delays of 3 hours or more within the airline's control." },
      { q: "Wizz Air is ignoring my claim. What now?", a: "After 8 weeks with no substantive reply, refer it to AviationADR; the referral is free and Wizz Air is bound by the outcome. The CAA required Wizz Air to re-open thousands of wrongly refused claims in 2023, so refusals are worth challenging." },
      { q: "Is Wizz Air UK different from Wizz Air?", a: "Legally yes: Wizz Air UK is a UK carrier and Wizz Air Hungary is an EU carrier. It changes which regulation covers a flight INTO the UK from outside the EU. Flights departing the UK are covered either way." },
    ],
  },
  {
    slug: "virgin-atlantic", code: "VS", name: "Virgin Atlantic", shortName: "Virgin Atlantic", country: "GB", carrierType: "uk",
    claimUrl: "https://help.virginatlantic.com/gb/en/booking/delays-cancellations.html", adr: "AviationADR", monthlySearches: 170,
    hubs: ["Heathrow", "Manchester"],
    typicalRoutes: [
      { from: "Heathrow", to: "New York JFK", km: 5555, band: "£520" }, { from: "Heathrow", to: "Orlando", km: 6980, band: "£520" },
      { from: "Manchester", to: "Barbados", km: 6760, band: "£520" }, { from: "Heathrow", to: "Delhi", km: 6720, band: "£520" },
    ],
    notes: [
      "Every Virgin Atlantic route is long-haul, so every eligible claim is £520 per passenger (£260 if the arrival delay was between 3 and 4 hours), and because Virgin is a UK carrier the inbound leg from the USA or the Caribbean is covered as well as the outbound.",
      "Virgin Atlantic is an AviationADR member.",
    ],
    faqs: [
      { q: "How much does Virgin Atlantic pay for a 3-hour delay?", a: "£520 per passenger for arrival delays of 4 hours or more, £260 for delays between 3 and 4 hours, on any Virgin Atlantic route, when the cause was within Virgin's control." },
      { q: "Is my Virgin flight home from Orlando covered?", a: "Yes. UK261 covers flights into the UK on a UK carrier, and Virgin Atlantic is one. The same route on Delta would not be covered." },
    ],
  },
  {
    slug: "aer-lingus", code: "EI", name: "Aer Lingus", shortName: "Aer Lingus", country: "IE", carrierType: "eu",
    claimUrl: "https://www.aerlingus.com/support/forms/eu-compensation/", adr: "AviationADR", monthlySearches: 260,
    hubs: ["Dublin", "Cork", "Heathrow", "Manchester"],
    typicalRoutes: [
      { from: "Dublin", to: "Heathrow", km: 450, band: "€250 / £220" }, { from: "Dublin", to: "New York JFK", km: 5100, band: "€600" },
      { from: "Manchester", to: "Dublin", km: 265, band: "£220" }, { from: "Dublin", to: "Malaga", km: 2160, band: "€400" },
    ],
    notes: [
      "Aer Lingus is an Irish (EU) carrier. Dublin to Heathrow is covered by EU261 (departed the EU) and UK261 (arrived in the UK on an EU carrier); Heathrow to Dublin by UK261 and, arriving in the EU on an EU carrier, EU261. Aer Lingus UK (EG) operates some Belfast routes as a UK carrier.",
      "Transatlantic flights from Dublin fall under EU261 at €600. The return from the USA to Dublin is also covered because Aer Lingus is an EU carrier.",
    ],
    faqs: [
      { q: "How much does Aer Lingus pay for a delay?", a: "€250 up to 1,500 km, €400 for 1,500 to 3,500 km, €600 over 3,500 km under EU261; £220, £350 and £520 under UK261 where that applies. Dublin to New York at 5,100 km is €600 per passenger." },
      { q: "Should I claim in euro or sterling from Aer Lingus?", a: "Where both regulations apply you may choose. Irish residents claim under EU261 with the Irish Aviation Authority as enforcement body; UK residents usually claim under UK261 because AviationADR and the UK small claims track are the escalation routes." },
    ],
  },
  {
    slug: "vueling", code: "VY", name: "Vueling", shortName: "Vueling", country: "ES", carrierType: "eu",
    claimUrl: "https://www.vueling.com/en/customer-services/passenger-rights", adr: "AviationADR", monthlySearches: 200,
    hubs: ["Barcelona", "Gatwick", "Heathrow"],
    typicalRoutes: [{ from: "Gatwick", to: "Barcelona", km: 1130, band: "£220" }, { from: "Barcelona", to: "Heathrow", km: 1140, band: "€250 / £220" }, { from: "Gatwick", to: "Alicante", km: 1450, band: "£220" }],
    notes: [
      "Vueling is a Spanish (EU) carrier. Flights into the UK from Spain are covered by both regulations; flights out of the UK by UK261.",
      "Spain's enforcement body is AESA, which accepts online complaints, and Spanish courts have been notably passenger-friendly on EU261, so an EU261 claim is a realistic route for EU departures.",
    ],
    faqs: [
      { q: "How much does Vueling owe for a 3-hour delay from Gatwick to Barcelona?", a: "£220 per passenger under UK261 (1,130 km). The return from Barcelona is €250 under EU261 or £220 under UK261, your choice." },
    ],
  },
  {
    slug: "klm", code: "KL", name: "KLM", shortName: "KLM", country: "NL", carrierType: "eu",
    claimUrl: "https://www.klm.co.uk/information/legal/passenger-rights", adr: "AviationADR", monthlySearches: 300,
    hubs: ["Amsterdam Schiphol"],
    typicalRoutes: [{ from: "Manchester", to: "Amsterdam", km: 485, band: "£220" }, { from: "Amsterdam", to: "Heathrow", km: 370, band: "€250 / £220" }, { from: "Amsterdam", to: "New York JFK", km: 5850, band: "€600" }],
    notes: [
      "KLM is a Dutch (EU) carrier. UK regional flights into Schiphol are UK261; the return legs are EU261 and UK261. Connections through Amsterdam count as one journey to the final destination for the 3-hour test and the distance band (Folkerts v Air France).",
      "Missed connections at Schiphol on a single KLM booking: the delay is measured at your final destination, not at Amsterdam, and the distance is the whole journey.",
    ],
    faqs: [
      { q: "I missed my KLM connection at Amsterdam and arrived 4 hours late. Can I claim?", a: "Yes, if it was one booking. Compensation is assessed on the arrival delay at the final destination and the great-circle distance from origin to final destination (Air France v Folkerts, C-11/11). A Manchester to Nairobi via Amsterdam journey is a long-haul claim." },
    ],
  },
  {
    slug: "lufthansa", code: "LH", name: "Lufthansa", shortName: "Lufthansa", country: "DE", carrierType: "eu",
    claimUrl: "https://www.lufthansa.com/gb/en/passenger-rights", adr: "AviationADR", monthlySearches: 250,
    hubs: ["Frankfurt", "Munich"],
    typicalRoutes: [{ from: "Heathrow", to: "Frankfurt", km: 655, band: "£220" }, { from: "Munich", to: "Heathrow", km: 950, band: "€250 / £220" }, { from: "Frankfurt", to: "Singapore", km: 10250, band: "€600" }],
    notes: [
      "Lufthansa is a German (EU) carrier. Germany's SÖP (Schlichtungsstelle für den öffentlichen Personenverkehr) handles EU261 disputes free for flights touching Germany, and German courts apply EU261 strictly; the limitation period in Germany is 3 years to the end of the calendar year.",
    ],
    faqs: [
      { q: "Lufthansa pilots or cabin crew were on strike. Is that extraordinary?", a: "No. The European Court held in Airhelp v SAS (C-28/20) that a strike by the airline's own staff is inherent in running the business and not an extraordinary circumstance. Compensation is due." },
    ],
  },
  {
    slug: "emirates", code: "EK", name: "Emirates", shortName: "Emirates", country: "AE", carrierType: "third",
    claimUrl: "https://www.emirates.com/uk/english/help/forms/flight-delay-cancellation-compensation/", adr: "AviationADR", monthlySearches: 400,
    hubs: ["Dubai"],
    typicalRoutes: [{ from: "Heathrow", to: "Dubai", km: 5500, band: "£520" }, { from: "Manchester", to: "Dubai", km: 5620, band: "£520" }, { from: "Dubai", to: "Heathrow", km: 5500, band: "not covered" }],
    notes: [
      "Emirates is not a UK or EU carrier. That means only flights DEPARTING the UK (or the EU) are covered: Heathrow to Dubai qualifies at £520; Dubai to Heathrow does not, and neither does Dubai to Sydney.",
      "For the covered outbound leg, a delay on the onward connection from Dubai on the same booking still counts, because delay is measured at the final destination (Wegener v Royal Air Maroc, C-537/17).",
      "Emirates is an AviationADR member for UK-departing flights.",
    ],
    faqs: [
      { q: "Is my Emirates flight home from Dubai covered by UK261?", a: "No. UK261 covers flights arriving in the UK only when the airline is a UK or EU carrier, and Emirates is neither. Your outbound flight from the UK is covered." },
      { q: "How much is an Emirates delay from Heathrow worth?", a: "£520 per passenger for a delay of 4 hours or more at your final destination, £260 for 3 to 4 hours, when the cause was within Emirates' control. Heathrow to Dubai is 5,500 km." },
    ],
  },
  {
    slug: "qatar-airways", code: "QR", name: "Qatar Airways", shortName: "Qatar Airways", country: "QA", carrierType: "third",
    claimUrl: "https://www.qatarairways.com/en-gb/legal/eu-regulation.html", adr: "AviationADR", monthlySearches: 250,
    hubs: ["Doha"],
    typicalRoutes: [{ from: "Heathrow", to: "Doha", km: 5220, band: "£520" }, { from: "Manchester", to: "Doha", km: 5310, band: "£520" }, { from: "Doha", to: "Heathrow", km: 5220, band: "not covered" }],
    notes: [
      "Qatar Airways is a third-country carrier: only flights departing the UK or EU are covered. A delayed connection in Doha on a single booking that started in the UK still counts, measured at the final destination.",
    ],
    faqs: [
      { q: "My Qatar Airways flight from Heathrow connected in Doha and I arrived in Bangkok 5 hours late. Can I claim?", a: "Yes. The journey departed the UK on one booking, so UK261 applies to the whole journey and the delay is measured at Bangkok (Wegener v Royal Air Maroc). The band is £520 for the Heathrow to Bangkok distance." },
    ],
  },
  {
    slug: "turkish-airlines", code: "TK", name: "Turkish Airlines", shortName: "Turkish Airlines", country: "TR", carrierType: "third",
    claimUrl: "https://www.turkishairlines.com/en-int/any-questions/passenger-rights/", adr: "AviationADR", monthlySearches: 200,
    hubs: ["Istanbul"],
    typicalRoutes: [{ from: "Heathrow", to: "Istanbul", km: 2500, band: "£350" }, { from: "Manchester", to: "Istanbul", km: 2820, band: "£350" }, { from: "Istanbul", to: "Heathrow", km: 2500, band: "not covered (UK261); Turkish SHY rules apply" }],
    notes: [
      "Turkey is not in the EU or EEA and Turkish Airlines is a third-country carrier, so only flights departing the UK or EU are covered by UK261/EU261. Flights departing Turkey fall under Turkey's own SHY-YOLCU regulation, which mirrors EU261 amounts in euro.",
    ],
    faqs: [
      { q: "Is a Turkish Airlines delay from Istanbul to London covered?", a: "Not by UK261 or EU261. Turkey's SHY-YOLCU passenger regulation applies to departures from Turkey and pays similar amounts; claims go to Turkish Airlines and then to the Turkish DGCA." },
    ],
  },
  {
    slug: "loganair", code: "LM", name: "Loganair", shortName: "Loganair", country: "GB", carrierType: "uk",
    claimUrl: "https://www.loganair.co.uk/travel-help/passenger-rights/", adr: "AviationADR", monthlySearches: 90,
    hubs: ["Glasgow", "Aberdeen", "Inverness", "Kirkwall", "Sumburgh"],
    typicalRoutes: [{ from: "Glasgow", to: "Kirkwall", km: 330, band: "£220" }, { from: "Aberdeen", to: "Sumburgh", km: 300, band: "£220" }, { from: "Newcastle", to: "Southampton", km: 420, band: "£220" }],
    notes: [
      "Loganair is a UK carrier flying UK domestic and island routes, all under 1,500 km, so every eligible claim is £220. Weather is genuinely extraordinary more often on Highlands and Islands routes than anywhere else in the UK; the METAR record in the check matters here.",
      "Scottish claims: the limitation period is 5 years, and the small claims route is the Simple Procedure in the Sheriff Court.",
    ],
    faqs: [
      { q: "Loganair cancelled my Kirkwall flight for fog. Is that extraordinary?", a: "Fog that closed the airport or brought visibility below operating minima is an extraordinary circumstance and no compensation is due for it, though you are still owed care and a refund or re-routing. The airport METAR record shows the visibility at the time." },
    ],
  },
];

export function airlinePageBySlug(slug: string): AirlinePage | undefined {
  return AIRLINE_PAGES.find((a) => a.slug === slug);
}
