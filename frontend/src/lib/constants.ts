export const SEGMENT_PALETTE = [
  "#4F8DF7", // Blue
  "#F5A524", // Amber
  "#2DD4BF", // Teal
  "#F0568C", // Rose
  "#A78BFA", // Violet
  "#84CC16", // Lime
  "#F97316", // Orange
  "#38BDF8", // Sky
  "#E879F9", // Pink
  "#94A3B8", // Slate
];

export const SEGMENT_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export interface RFMInfo {
  name: string;
  meaning: string;
  actions: [string, string, string];
}

export const RFM_SEGMENTS_MAP: Record<string, RFMInfo> = {
  "Champions": {
    name: "Champions",
    meaning: "Bought recently, often, and spend well.",
    actions: ["Reward with early access", "Ask for reviews and referrals", "Do not discount"]
  },
  "Loyal Customers": {
    name: "Loyal Customers",
    meaning: "Buy regularly and respond to offers.",
    actions: ["Upsell higher-value items", "Offer a loyalty programme", "Ask for feedback"]
  },
  "Potential Loyalists": {
    name: "Potential Loyalists",
    meaning: "Recent customers with a few purchases.",
    actions: ["Recommend related products", "Offer a membership", "Send a thank-you with a second-purchase incentive"]
  },
  "New Customers": {
    name: "New Customers",
    meaning: "First purchase very recently.",
    actions: ["Send a welcome series", "Make onboarding easy", "Invite a second purchase"]
  },
  "Promising": {
    name: "Promising",
    meaning: "Recent but low frequency.",
    actions: ["Build brand awareness", "Offer a small starter incentive", "Share best sellers"]
  },
  "Need Attention": {
    name: "Need Attention",
    meaning: "Average on all measures and slipping.",
    actions: ["Limited-time offers", "Personalised recommendations", "Re-engage with reminders"]
  },
  "About to Sleep": {
    name: "About to Sleep",
    meaning: "Below-average recency and frequency.",
    actions: ["Share useful content", "Offer a time-limited discount", "Recommend popular items"]
  },
  "At Risk": {
    name: "At Risk",
    meaning: "Used to buy often but not lately.",
    actions: ["Send personalised win-back messages", "Offer renewals or bundles", "Ask why they left"]
  },
  "Can't Lose Them": {
    name: "Can't Lose Them",
    meaning: "Top spenders who have gone quiet.",
    actions: ["Reach out personally", "Offer a strong win-back deal", "Ask for feedback urgently"]
  },
  "Hibernating": {
    name: "Hibernating",
    meaning: "Low activity and long inactive.",
    actions: ["Offer relevant products at low prices", "Run a reactivation campaign", "Remove from costly channels if no response"]
  },
  "Lost": {
    name: "Lost",
    meaning: "Lowest recency and frequency.",
    actions: ["Run one low-cost revival attempt", "Use for lookalike audiences", "Then suppress"]
  }
};
