/**
 * Fixture vocabulary — the raw material the case generator draws from.
 *
 * Deliberately plausible rather than random: real listing titles, real EU
 * market spread, second-hand price bands that make the amounts believable.
 * Nothing here is tenant-branded, so the same catalogue serves both tenants.
 */

export const FIRST_NAMES = [
  'Ieva', 'Lukas', 'Camille', 'Mathis', 'Lena', 'Jonas', 'Zofia', 'Kacper',
  'Marta', 'Andrea', 'Sofia', 'Matteo', 'Emma', 'Daan', 'Noor', 'Lars',
  'Elin', 'Tomas', 'Klara', 'Petr', 'Anouk', 'Rúben', 'Alba', 'Hugo',
  'Nina', 'Sven', 'Julia', 'Milan', 'Eva', 'Adam', 'Chloé', 'Théo',
  'Greta', 'Rasa', 'Mila', 'Otto', 'Sara', 'Bruno', 'Lea', 'Viktor',
];

export const LAST_NAMES = [
  'Kazlauskas', 'Petrauskienė', 'Dubois', 'Moreau', 'Fischer', 'Weber',
  'Nowak', 'Wójcik', 'Rossi', 'Ferrari', 'García', 'Fernández', 'de Vries',
  'Jansen', 'Novák', 'Svoboda', 'Horváth', 'Kovács', 'Andersson', 'Lindberg',
  'Silva', 'Costa', 'Bakker', 'Visser', 'Schmitt', 'Braun', 'Lefèvre',
  'Girard', 'Marino', 'Greco', 'Ruiz', 'Ortega', 'Vasiliauskas', 'Butkutė',
];

export const SELLER_HANDLES = [
  'vintage_vault', 'preloved_paris', 'atelier_nord', 'closet_curated',
  'secondlife_ldn', 'retro_riga', 'denim_district', 'thrift_theory',
  'archive_amsterdam', 'lux_resell', 'kilo_klub', 'sartoria_milano',
  'nordic_knits', 'boho_bruxelles', 'urban_upcycle', 'silk_road_vintage',
  'pop_prague', 'les_trouvailles', 'wardrobe_warsaw', 'grams_berlin',
  'the_hem_house', 'bags_of_bilbao', 'tweed_and_co', 'sneaker_syndicate',
];

export const CATEGORIES = [
  'Women — Outerwear',
  'Women — Dresses',
  'Women — Bags',
  'Men — Outerwear',
  'Men — Footwear',
  'Men — Tailoring',
  'Kids — Clothing',
  'Accessories — Watches',
  'Accessories — Jewellery',
  'Home — Textiles',
];

/** Titles are grouped so an item lines up with a sensible category and price. */
export const ITEMS = [
  { title: 'Acne Studios wool scarf, oversized', category: 'Accessories — Jewellery', low: 45, high: 130 },
  { title: 'Levi’s 501 vintage straight, W30', category: 'Men — Tailoring', low: 25, high: 70 },
  { title: 'The North Face Nuptse 700 puffer', category: 'Men — Outerwear', low: 120, high: 310 },
  { title: 'Ganni floral midi dress, EU 38', category: 'Women — Dresses', low: 60, high: 180 },
  { title: 'Nike Air Max 1 Patta, UK 9', category: 'Men — Footwear', low: 90, high: 340 },
  { title: 'Burberry trench, sand, EU 40', category: 'Women — Outerwear', low: 240, high: 720 },
  { title: 'Longchamp Le Pliage tote, medium', category: 'Women — Bags', low: 40, high: 110 },
  { title: 'Carhartt WIP Detroit jacket', category: 'Men — Outerwear', low: 85, high: 220 },
  { title: 'Cos merino crewneck, navy', category: 'Women — Outerwear', low: 30, high: 75 },
  { title: 'Dr. Martens 1460, EU 41', category: 'Men — Footwear', low: 55, high: 140 },
  { title: 'Omega Seamaster strap, leather', category: 'Accessories — Watches', low: 70, high: 210 },
  { title: 'Prada Re-Nylon shoulder bag', category: 'Women — Bags', low: 380, high: 980 },
  { title: 'Arket lambswool cardigan', category: 'Women — Outerwear', low: 28, high: 68 },
  { title: 'Stone Island overshirt, badge', category: 'Men — Outerwear', low: 160, high: 420 },
  { title: 'Reformation linen slip dress', category: 'Women — Dresses', low: 55, high: 145 },
  { title: 'Polo Ralph Lauren oxford shirt', category: 'Men — Tailoring', low: 22, high: 60 },
  { title: 'Mulberry Bayswater, oak', category: 'Women — Bags', low: 320, high: 850 },
  { title: 'Patagonia Better Sweater fleece', category: 'Men — Outerwear', low: 45, high: 105 },
  { title: 'Cartier Love bangle, boxed', category: 'Accessories — Jewellery', low: 900, high: 2400 },
  { title: 'Petit Bateau kids set, 4Y', category: 'Kids — Clothing', low: 12, high: 38 },
  { title: 'Massimo Dutti wool coat, EU 42', category: 'Women — Outerwear', low: 70, high: 190 },
  { title: 'New Balance 990v5, UK 8', category: 'Men — Footwear', low: 80, high: 195 },
  { title: 'Hay linen bedding set, double', category: 'Home — Textiles', low: 60, high: 160 },
  { title: 'Tag Heuer Formula 1, quartz', category: 'Accessories — Watches', low: 450, high: 1150 },
  { title: 'Zara faux-leather blazer, S', category: 'Women — Outerwear', low: 18, high: 46 },
  { title: 'Filippa K silk blouse, EU 36', category: 'Women — Dresses', low: 40, high: 95 },
  { title: 'Barbour Bedale waxed jacket', category: 'Men — Outerwear', low: 95, high: 245 },
  { title: 'Vagabond Chelsea boots, EU 39', category: 'Men — Footwear', low: 35, high: 90 },
];

export const MARKET_CITIES = {
  FR: ['Paris', 'Lyon', 'Marseille', 'Bordeaux'],
  DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne'],
  LT: ['Vilnius', 'Kaunas', 'Klaipėda'],
  PL: ['Warsaw', 'Kraków', 'Gdańsk', 'Wrocław'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  IT: ['Milan', 'Rome', 'Turin', 'Bologna'],
  NL: ['Amsterdam', 'Rotterdam', 'Utrecht'],
  BE: ['Brussels', 'Antwerp', 'Ghent'],
  CZ: ['Prague', 'Brno'],
  SK: ['Bratislava', 'Košice'],
  US: ['New York', 'Chicago', 'Austin', 'Denver'],
  CA: ['Toronto', 'Montreal', 'Vancouver'],
  GB: ['London', 'Manchester', 'Bristol', 'Leeds'],
  AU: ['Sydney', 'Melbourne', 'Brisbane'],
};

/** Document types that show up in the Work case viewer. */
export const DOCUMENT_TYPES = [
  { id: 'proof_of_delivery', label: 'Proof of delivery', kind: 'pdf' },
  { id: 'tracking_export', label: 'Carrier tracking export', kind: 'pdf' },
  { id: 'listing_snapshot', label: 'Listing snapshot', kind: 'image' },
  { id: 'buyer_messages', label: 'Buyer–seller messages', kind: 'transcript' },
  { id: 'authentication_report', label: 'Authentication report', kind: 'pdf' },
  { id: 'refund_confirmation', label: 'Refund confirmation', kind: 'pdf' },
  { id: 'terms_accepted', label: 'Terms acceptance record', kind: 'pdf' },
  { id: 'issuer_letter', label: 'Issuer dispute letter', kind: 'pdf' },
  { id: 'condition_photos', label: 'Condition photos', kind: 'image' },
  { id: 'avs_cvv_result', label: 'AVS / CVV result', kind: 'data' },
];

export const CARRIERS = ['Vinted Go', 'DPD', 'InPost', 'DHL', 'Mondial Relay', 'Colissimo'];

export const HISTORY_ACTIONS = [
  'Case received from acquirer feed',
  'Auto-routed by rule',
  'Assigned to analyst',
  'Status changed',
  'Document attached',
  'Note added',
  'Evidence package generated',
  'Response submitted to scheme',
  'Issuer acknowledgement received',
  'Consolidation group detected',
];

export const NOTE_TEMPLATES = [
  'Tracking confirms delivery to the buyer’s pickup point; scan weight matches the listing.',
  'Buyer stopped responding after the return label was issued. Pending 5 days.',
  'Listing photos clearly show the wear described in the disputed condition claim.',
  'Seller supplied the original purchase receipt and authentication card.',
  'Issuer letter contradicts the AVS result on file — worth defending.',
  'Second dispute from this cardholder in a fortnight; flagged to fraud ops.',
  'Item returned to the seller but no refund was raised — chasing payments.',
  'Value below the write-off threshold once handling cost is included.',
  'Carrier confirmed the parcel was scanned as damaged in transit.',
  'Cardholder claims non-receipt but the drop-off signature is on file.',
];
