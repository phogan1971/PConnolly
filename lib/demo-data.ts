/**
 * Demo data — used when DATABASE_URL is not configured.
 * Wire up real DB by replacing imports in public pages with `lib/db` queries.
 */

export const DEMO_DEALERSHIP = {
  id: "demo",
  name: "Connolly Motors",
  tradingName: "Connolly Motors",
  address: "Main Street, Galway, Ireland",
  phone: "+353 91 555 0100",
  email: "info@connollymotors.ie",
  websiteUrl: "https://connollymotors.example",
  vatNumber: "IE1234567T",
  openingHours: { mon: "9-18", tue: "9-18", wed: "9-18", thu: "9-18", fri: "9-18", sat: "10-16", sun: "closed" },
  createdAt: new Date("2024-01-01"),
};

export type DemoVehicle = {
  id: string;
  slug: string;
  stockNumber: string;
  registration: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  engineSizeCc: number;
  colour: string;
  doors: number;
  seats: number;
  previousOwners: number;
  serviceHistory: string;
  priceRetailCents: number;
  priceWasCents: number | null;
  vatIncluded: boolean;
  financeAvailable: boolean;
  monthlyPaymentFromCents: number | null;
  location: string;
  features: string[];
  descriptionShort: string;
  descriptionLong: string;
  nctExpiry: Date | null;
  taxExpiry: Date | null;
  warrantyMonths: number | null;
  internalNotes: null;
  media: { id: string; url: string; altText: string; isPrimary: boolean; sortOrder: number; type: string }[];
};

export const DEMO_VEHICLES: DemoVehicle[] = [
  {
    id: "s-1001",
    slug: "2023-volkswagen-golf-s-1001",
    stockNumber: "S-1001",
    registration: "232-G-12345",
    make: "Volkswagen", model: "Golf", variant: "1.0 TSI Life",
    year: 2023, mileageKm: 21500,
    fuelType: "PETROL", transmission: "MANUAL", bodyType: "HATCHBACK",
    engineSizeCc: 999, colour: "Pure White", doors: 5, seats: 5, previousOwners: 1,
    serviceHistory: "FULL", priceRetailCents: 2599000, priceWasCents: 2799000,
    vatIncluded: true, financeAvailable: true, monthlyPaymentFromCents: 28900,
    location: "Galway",
    features: ["Apple CarPlay", "Adaptive Cruise Control", "LED Headlights", "Lane Assist", "Rear Camera", "Heated Seats"],
    descriptionShort: "One-owner Golf Life with full VW service history. Excellent condition throughout.",
    descriptionLong: "One-owner Golf Life with full VW service history. Excellent condition throughout. This stunning Volkswagen Golf 1.0 TSI Life is presented in Pure White with a full black cloth interior. It comes with a comprehensive factory specification including Apple CarPlay & Android Auto, Adaptive Cruise Control, LED headlights, Lane Assist, and a rear-view camera. Trade-ins welcome and finance available subject to lender approval. Contact Connolly Motors today to arrange a viewing or test drive.",
    nctExpiry: new Date("2026-08-15"), taxExpiry: new Date("2025-12-31"), warrantyMonths: 12,
    internalNotes: null,
    media: [
      { id: "s1001-1", url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=80", altText: "2023 Volkswagen Golf Pure White front", isPrimary: true, sortOrder: 0, type: "IMAGE" },
      { id: "s1001-2", url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80", altText: "2023 Volkswagen Golf interior", isPrimary: false, sortOrder: 1, type: "IMAGE" },
      { id: "s1001-3", url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80", altText: "2023 Volkswagen Golf rear", isPrimary: false, sortOrder: 2, type: "IMAGE" },
    ],
  },
  {
    id: "s-1002",
    slug: "2022-toyota-corolla-s-1002",
    stockNumber: "S-1002",
    registration: "222-D-98765",
    make: "Toyota", model: "Corolla", variant: "1.8 Hybrid Sol",
    year: 2022, mileageKm: 38900,
    fuelType: "HYBRID", transmission: "AUTOMATIC", bodyType: "SALOON",
    engineSizeCc: 1798, colour: "Silver Metallic", doors: 4, seats: 5, previousOwners: 1,
    serviceHistory: "FULL", priceRetailCents: 2849000, priceWasCents: null,
    vatIncluded: true, financeAvailable: true, monthlyPaymentFromCents: 31500,
    location: "Galway",
    features: ["Heated Seats", "Reversing Camera", "Toyota Safety Sense", "Wireless Charging", "Blind Spot Monitor", "Sat Nav"],
    descriptionShort: "Reliable Hybrid Corolla with low running costs and full Toyota service history.",
    descriptionLong: "Reliable Hybrid Corolla with low running costs and full Toyota service history. The Corolla 1.8 Hybrid Sol is one of the most efficient and reliable cars on the road today. This one-owner example comes with Toyota Safety Sense as standard, plus heated front seats, wireless charging, and a factory sat nav. The self-charging hybrid system means no plugging in required. Trade-ins welcome and finance available. Contact us today.",
    nctExpiry: new Date("2026-06-20"), taxExpiry: new Date("2025-12-31"), warrantyMonths: 24,
    internalNotes: null,
    media: [
      { id: "s1002-1", url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80", altText: "2022 Toyota Corolla Hybrid Silver front", isPrimary: true, sortOrder: 0, type: "IMAGE" },
      { id: "s1002-2", url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&q=80", altText: "2022 Toyota Corolla interior", isPrimary: false, sortOrder: 1, type: "IMAGE" },
    ],
  },
  {
    id: "s-1003",
    slug: "2021-bmw-3-series-s-1003",
    stockNumber: "S-1003",
    registration: "212-G-44221",
    make: "BMW", model: "3 Series", variant: "320d M Sport",
    year: 2021, mileageKm: 64500,
    fuelType: "DIESEL", transmission: "AUTOMATIC", bodyType: "SALOON",
    engineSizeCc: 1995, colour: "Mineral Grey", doors: 4, seats: 5, previousOwners: 2,
    serviceHistory: "FULL", priceRetailCents: 3895000, priceWasCents: 4195000,
    vatIncluded: true, financeAvailable: true, monthlyPaymentFromCents: 43200,
    location: "Galway",
    features: ["Leather Seats", "Satellite Navigation", "M Sport Pack", "Heated Steering Wheel", "Parking Sensors", "Sunroof"],
    descriptionShort: "Stunning M Sport 320d with full BMW service history. Two owners from new.",
    descriptionLong: "Stunning M Sport 320d with full BMW service history. This Mineral Grey 320d M Sport is a head-turner in every sense. Equipped with the full M Sport body kit, 18-inch M Sport alloys, and a premium leather interior with heated seats and steering wheel. The 2.0L diesel engine delivers effortless motorway performance and excellent fuel economy. Full BMW service history with all stamps. Trade-ins welcome, finance available. Come view today.",
    nctExpiry: new Date("2026-04-10"), taxExpiry: new Date("2025-11-30"), warrantyMonths: 6,
    internalNotes: null,
    media: [
      { id: "s1003-1", url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80", altText: "2021 BMW 3 Series M Sport Mineral Grey", isPrimary: true, sortOrder: 0, type: "IMAGE" },
      { id: "s1003-2", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80", altText: "2021 BMW 3 Series rear", isPrimary: false, sortOrder: 1, type: "IMAGE" },
      { id: "s1003-3", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80", altText: "2021 BMW interior", isPrimary: false, sortOrder: 2, type: "IMAGE" },
    ],
  },
  {
    id: "s-1004",
    slug: "2024-hyundai-tucson-s-1004",
    stockNumber: "S-1004",
    registration: "242-G-00111",
    make: "Hyundai", model: "Tucson", variant: "1.6 PHEV Executive",
    year: 2024, mileageKm: 9800,
    fuelType: "PHEV", transmission: "AUTOMATIC", bodyType: "SUV",
    engineSizeCc: 1598, colour: "Phantom Black", doors: 5, seats: 5, previousOwners: 1,
    serviceHistory: "FULL", priceRetailCents: 4495000, priceWasCents: null,
    vatIncluded: true, financeAvailable: true, monthlyPaymentFromCents: 49900,
    location: "Galway",
    features: ["360° Camera", "Panoramic Sunroof", "Krell Audio System", "Heated & Cooled Seats", "Wireless CarPlay", "Head-up Display"],
    descriptionShort: "Top-spec Tucson PHEV Executive — virtually every factory option ticked.",
    descriptionLong: "Top-spec Tucson PHEV Executive — virtually every factory option ticked. This near-new 2024 Tucson PHEV Executive is loaded from the factory. Highlights include a 360° surround-view camera, panoramic sunroof, Krell premium audio, heated and ventilated front seats, wireless Apple CarPlay, and a head-up display. The plug-in hybrid drivetrain gives up to 50km of electric range, with the petrol engine for longer trips. Low mileage, one owner, full Hyundai service history. Finance available. Trade-ins welcome.",
    nctExpiry: null, taxExpiry: new Date("2025-12-31"), warrantyMonths: 48,
    internalNotes: null,
    media: [
      { id: "s1004-1", url: "https://images.unsplash.com/photo-1606664922998-f180b39989be?w=1200&q=80", altText: "2024 Hyundai Tucson PHEV Phantom Black", isPrimary: true, sortOrder: 0, type: "IMAGE" },
      { id: "s1004-2", url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80", altText: "2024 Hyundai Tucson interior", isPrimary: false, sortOrder: 1, type: "IMAGE" },
    ],
  },
  {
    id: "s-1005",
    slug: "2020-skoda-octavia-s-1005",
    stockNumber: "S-1005",
    registration: "201-D-55512",
    make: "Skoda", model: "Octavia", variant: "1.6 TDI Ambition Estate",
    year: 2020, mileageKm: 95400,
    fuelType: "DIESEL", transmission: "MANUAL", bodyType: "ESTATE",
    engineSizeCc: 1598, colour: "Race Blue", doors: 5, seats: 5, previousOwners: 2,
    serviceHistory: "PARTIAL", priceRetailCents: 1695000, priceWasCents: 1895000,
    vatIncluded: true, financeAvailable: true, monthlyPaymentFromCents: 18900,
    location: "Galway",
    features: ["Air Conditioning", "Cruise Control", "Bluetooth", "Roof Rails", "Alloy Wheels", "Parking Sensors"],
    descriptionShort: "Workhorse Octavia Estate — ideal family car or commercial rep. Great value.",
    descriptionLong: "Workhorse Octavia Estate — ideal family car or commercial rep. Great value. This practical Octavia Estate 1.6 TDI is one of the most versatile cars money can buy. With a huge boot, comfortable interior, and the frugal diesel engine returning over 55mpg, it's perfect for families or business use. Two owners, partial service history, freshly serviced. Finance available, trade-ins welcome. Priced to sell.",
    nctExpiry: new Date("2025-09-05"), taxExpiry: new Date("2025-08-31"), warrantyMonths: 3,
    internalNotes: null,
    media: [
      { id: "s1005-1", url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80", altText: "2020 Skoda Octavia Estate Race Blue", isPrimary: true, sortOrder: 0, type: "IMAGE" },
    ],
  },
  {
    id: "s-1006",
    slug: "2023-tesla-model-3-s-1006",
    stockNumber: "S-1006",
    registration: "232-G-77889",
    make: "Tesla", model: "Model 3", variant: "Long Range AWD",
    year: 2023, mileageKm: 28100,
    fuelType: "EV", transmission: "AUTOMATIC", bodyType: "SALOON",
    engineSizeCc: 0, colour: "Pearl White", doors: 4, seats: 5, previousOwners: 1,
    serviceHistory: "FULL", priceRetailCents: 4795000, priceWasCents: null,
    vatIncluded: true, financeAvailable: true, monthlyPaymentFromCents: 53200,
    location: "Galway",
    features: ["Autopilot", "Premium Audio", "Glass Roof", "Heated Front & Rear Seats", "15\" Touchscreen", "Over-the-Air Updates"],
    descriptionShort: "Immaculate Long Range Model 3 — 600km range, one owner, full Tesla history.",
    descriptionLong: "Immaculate Long Range Model 3 — 600km range, one owner, full Tesla history. This Pearl White Model 3 Long Range AWD represents Tesla ownership at its best. With a real-world range of over 600km on a full charge, dual-motor AWD, and Autopilot as standard, it's the complete electric package. The premium interior features a 15\" touchscreen, heated front and rear seats, and a panoramic glass roof. One owner from new, all Tesla software updates applied. Finance available, home charger setup advice included.",
    nctExpiry: null, taxExpiry: new Date("2025-12-31"), warrantyMonths: 36,
    internalNotes: null,
    media: [
      { id: "s1006-1", url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80", altText: "2023 Tesla Model 3 Pearl White", isPrimary: true, sortOrder: 0, type: "IMAGE" },
      { id: "s1006-2", url: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&q=80", altText: "2023 Tesla Model 3 interior", isPrimary: false, sortOrder: 1, type: "IMAGE" },
    ],
  },
];
