export type PostKind = "buy" | "sell";

export const UNIT_OPTIONS = [
  "Kg",
  "Quintal",
  "Ton",
  "Piece",
  "Dozen",
  "Litre",
  "Head", // livestock/animal count
  "Bag",
];

export const STATE_DISTRICTS: Record<string, string[]> = {
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Junagadh"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  Maharashtra: ["Pune", "Nashik", "Nagpur", "Kolhapur", "Satara"],
  "Uttar Pradesh": ["Lucknow", "Meerut", "Varanasi", "Kanpur", "Agra"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer"],
  Karnataka: ["Bengaluru", "Mysuru", "Belagavi", "Hubballi", "Mangaluru"],
};

export const STATE_OPTIONS = Object.keys(STATE_DISTRICTS);
