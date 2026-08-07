/**
 * Fixture vocabulary — the raw material the generator draws from.
 *
 * Deliberately plausible rather than random: real listing titles, real EU
 * market spread, second-hand price bands that make the amounts believable.
 * Nothing here names a tenant, so the same catalogue serves both.
 */

export const FIRST_NAMES = [
  'Ieva', 'Lukas', 'Camille', 'Mathis', 'Lena', 'Jonas', 'Zofia', 'Kacper',
  'Marta', 'Andrea', 'Sofia', 'Matteo', 'Emma', 'Daan', 'Noor', 'Lars',
  'Elin', 'Tomas', 'Klara', 'Petr', 'Anouk', 'Rúben', 'Alba', 'Hugo',
  'Nina', 'Sven', 'Julia', 'Milan', 'Eva', 'Adam', 'Chloé', 'Théo',
  'Greta', 'Rasa', 'Mila', 'Otto', 'Sara', 'Bruno', 'Lea', 'Viktor',
  'Aiste', 'Pierre', 'Katrin', 'Joris', 'Maja', 'Filip', 'Ana', 'Erik',
];

export const LAST_NAMES = [
  'Kazlauskas', 'Petrauskiene', 'Dubois', 'Moreau', 'Fischer', 'Weber',
  'Nowak', 'Wojcik', 'Rossi', 'Ferrari', 'Garcia', 'Fernandez', 'de Vries',
  'Jansen', 'Novak', 'Svoboda', 'Horvath', 'Kovacs', 'Andersson', 'Lindberg',
  'Silva', 'Costa', 'Bakker', 'Visser', 'Schmitt', 'Braun', 'Lefevre',
  'Girard', 'Marino', 'Greco', 'Ruiz', 'Ortega', 'Vasiliauskas', 'Butkute',
  'Meyer', 'Klein', 'Laurent', 'Simon', 'Conti', 'Bruno', 'Serrano', 'Blanco',
];

export const SELLER_HANDLES = [
  'vintage_vault', 'preloved_paris', 'atelier_nord', 'closet_curated',
  'secondlife_ldn', 'retro_riga', 'denim_district', 'thrift_theory',
  'archive_amsterdam', 'lux_resell', 'kilo_klub', 'sartoria_milano',
  'nordic_knits', 'boho_bruxelles', 'urban_upcycle', 'silk_road_vintage',
  'pop_prague', 'les_trouvailles', 'wardrobe_warsaw', 'grams_berlin',
  'the_hem_house', 'bags_of_bilbao', 'tweed_and_co', 'sneaker_syndicate',
  'maison_seconde', 'attic_antwerp', 'coast_and_cloth', 'peony_preloved',
];

/** Titles are grouped so an item lines up with a sensible category and price. */
export const ITEMS = [
  { title: 'Acne Studios wool scarf, oversized', category: 'Accessories', low: 45, high: 130 },
  { title: 'Levi’s 501 vintage straight, W30', category: 'Men — Jeans', low: 25, high: 70 },
  { title: 'The North Face Nuptse 700 puffer', category: 'Men — Outerwear', low: 120, high: 310 },
  { title: 'Ganni floral midi dress, EU 38', category: 'Women — Dresses', low: 60, high: 180 },
  { title: 'Nike Air Max 1 Patta, UK 9', category: 'Men — Footwear', low: 90, high: 340 },
  { title: 'Burberry trench, sand, EU 40', category: 'Women — Outerwear', low: 240, high: 720 },
  { title: 'Longchamp Le Pliage tote, medium', category: 'Women — Bags', low: 40, high: 110 },
  { title: 'Carhartt WIP Detroit jacket', category: 'Men — Outerwear', low: 85, high: 220 },
  { title: 'COS merino crewneck, navy', category: 'Women — Knitwear', low: 30, high: 75 },
  { title: 'Dr. Martens 1460, EU 41', category: 'Men — Footwear', low: 55, high: 140 },
  { title: 'Omega Seamaster strap, leather', category: 'Accessories — Watches', low: 70, high: 210 },
  { title: 'Prada Re-Nylon shoulder bag', category: 'Women — Bags', low: 380, high: 980 },
  { title: 'Arket lambswool cardigan', category: 'Women — Knitwear', low: 28, high: 68 },
  { title: 'Stone Island overshirt, badge', category: 'Men — Outerwear', low: 160, high: 420 },
  { title: 'Reformation linen slip dress', category: 'Women — Dresses', low: 55, high: 145 },
  { title: 'Polo Ralph Lauren oxford shirt', category: 'Men — Shirts', low: 22, high: 60 },
  { title: 'Mulberry Bayswater, oak', category: 'Women — Bags', low: 320, high: 850 },
  { title: 'Patagonia Better Sweater fleece', category: 'Men — Outerwear', low: 45, high: 105 },
  { title: 'Cartier Love bangle, boxed', category: 'Accessories — Jewellery', low: 900, high: 2400 },
  { title: 'Petit Bateau kids set, 4Y', category: 'Kids — Clothing', low: 12, high: 38 },
  { title: 'Massimo Dutti wool coat, EU 42', category: 'Women — Outerwear', low: 70, high: 190 },
  { title: 'New Balance 990v5, UK 8', category: 'Men — Footwear', low: 80, high: 195 },
  { title: 'HAY linen bedding set, double', category: 'Home — Textiles', low: 60, high: 160 },
  { title: 'TAG Heuer Formula 1, quartz', category: 'Accessories — Watches', low: 450, high: 1150 },
  { title: 'Zara faux-leather blazer, S', category: 'Women — Outerwear', low: 18, high: 46 },
  { title: 'Filippa K silk blouse, EU 36', category: 'Women — Tops', low: 40, high: 95 },
  { title: 'Barbour Bedale waxed jacket', category: 'Men — Outerwear', low: 95, high: 245 },
  { title: 'Vagabond Chelsea boots, EU 39', category: 'Women — Footwear', low: 35, high: 90 },
  { title: 'Isabel Marant Étoile knit, S', category: 'Women — Knitwear', low: 85, high: 230 },
  { title: 'Adidas Samba OG, UK 7', category: 'Women — Footwear', low: 60, high: 130 },
];

export const CONDITIONS = ['New with tags', 'New without tags', 'Very good', 'Good', 'Satisfactory'];

export const MARKET_CITIES = {
  FR: ['Paris', 'Lyon', 'Marseille', 'Bordeaux'],
  DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne'],
  LT: ['Vilnius', 'Kaunas', 'Klaipeda'],
  PL: ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  IT: ['Milan', 'Rome', 'Turin', 'Bologna'],
  NL: ['Amsterdam', 'Rotterdam', 'Utrecht'],
  BE: ['Brussels', 'Antwerp', 'Ghent'],
  CZ: ['Prague', 'Brno'],
  SK: ['Bratislava', 'Kosice'],
  US: ['New York', 'Chicago', 'Austin', 'Denver'],
  CA: ['Toronto', 'Montreal', 'Vancouver'],
  GB: ['London', 'Manchester', 'Bristol', 'Leeds'],
  AU: ['Sydney', 'Melbourne', 'Brisbane'],
  PT: ['Lisbon', 'Porto'],
};

export const CARRIERS = ['DPD', 'InPost', 'DHL', 'Mondial Relay', 'Colissimo', 'GLS', 'Evri'];

export const LAST_NOTES = [
  'Awaiting seller documents',
  'Represented — pending scheme response',
  'Escalated to supervisor',
  'Docs received, in review',
  'Buyer contacted issuer directly',
  'Partial refund applied',
  'Tracking confirms delivery to pickup point',
  'Return label issued, awaiting despatch',
  'Authentication report requested',
  'Below write-off threshold',
  '—',
];

export const TRANSACTION_TYPES = ['Sale', 'Refund', 'Authorization', 'Recurring'];
export const SALES_METHODS = ['Ecommerce', 'Mobile App', 'MOTO', 'Recurring Billing'];
export const FRAUD_MARKERS = ['Confirmed Fraud', 'Suspected Fraud', 'No Fraud Marker', 'Fraud Reported by Issuer'];
