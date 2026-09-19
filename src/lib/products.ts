export type ProductId = "letter" | "pack";

export const PRODUCTS: Record<ProductId, { id: ProductId; name: string; pricePence: number; priceLabel: string; description: string; includes: string[] }> = {
  letter: {
    id: "letter",
    name: "Claim Letter",
    pricePence: 499,
    priceLabel: "£4.99",
    description: "A ready-to-send compensation claim to the airline, written from your flight's verified record.",
    includes: [
      "Claim letter citing the regulation, the article and the amount per passenger",
      "Your flight's verified times, delay and distance band written in",
      "The airport delay and weather record for that day, so you can answer an extraordinary-circumstances reply before it comes",
      "Where to send it and how long the airline has to respond",
    ],
  },
  pack: {
    id: "pack",
    name: "Claim Pack",
    pricePence: 999,
    priceLabel: "£9.99",
    description: "The claim letter plus everything for when the airline says no or says nothing.",
    includes: [
      "Everything in the Claim Letter",
      "Follow-up letter for when the airline pleads extraordinary circumstances, with the case law that limits that defence",
      "Escalation guide and pre-filled details for the airline's ADR scheme (CEDR or AviationADR, free to use)",
      "Evidence appendix: flight record, Eurocontrol delay causes and METAR weather for the day",
      "Deadline sheet: 8-week ADR trigger, limitation date, what to keep",
    ],
  },
};
