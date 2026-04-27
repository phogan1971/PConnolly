import { PrismaClient, Role, VehicleStatus, FuelType, Transmission, BodyType, ServiceHistory, ChannelType, PublicationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  const passwordHash = await bcrypt.hash("dealerops", 10);

  const dealership = await prisma.dealership.upsert({
    where: { id: "demo-dealership" },
    update: {},
    create: {
      id: "demo-dealership",
      name: "Connolly Motors",
      tradingName: "Connolly Motors",
      address: "Main Street, Galway, Ireland",
      phone: "+353 91 555 0100",
      email: "info@connollymotors.ie",
      websiteUrl: "https://connollymotors.example",
      vatNumber: "IE1234567T",
      openingHours: { mon: "9-18", tue: "9-18", wed: "9-18", thu: "9-18", fri: "9-18", sat: "10-16", sun: "closed" },
    },
  });

  const users = [
    { email: "owner@dealerops.local",   name: "Owner",         role: Role.ADMIN },
    { email: "manager@dealerops.local", name: "Sales Manager", role: Role.MANAGER },
    { email: "office@dealerops.local",  name: "Office Admin",  role: Role.OFFICE },
    { email: "sales@dealerops.local",   name: "Salesperson",   role: Role.SALES },
    { email: "viewer@dealerops.local",  name: "Read-only",     role: Role.VIEWER },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name },
      create: { ...u, dealershipId: dealership.id, passwordHash, emailVerified: new Date() },
    });
  }

  // Channels
  const websiteChannel = await prisma.channel.upsert({
    where: { key: "website" },
    update: {},
    create: {
      key: "website",
      name: "Own Website",
      type: ChannelType.OWN_WEBSITE,
      isEnabled: true,
      configJson: { adapter: "website" },
    },
  });
  const carzoneChannel = await prisma.channel.upsert({
    where: { key: "carzone" },
    update: {},
    create: {
      key: "carzone",
      name: "Carzone.ie",
      type: ChannelType.EXTERNAL_FEED,
      isEnabled: true,
      configJson: { adapter: process.env.CARZONE_ADAPTER ?? "export" },
    },
  });

  const demoVehicles: Array<{
    stockNumber: string;
    registration: string;
    make: string;
    model: string;
    variant: string;
    year: number;
    mileageKm: number;
    fuelType: FuelType;
    transmission: Transmission;
    bodyType: BodyType;
    engineSizeCc: number;
    colour: string;
    doors: number;
    seats: number;
    previousOwners: number;
    serviceHistory: ServiceHistory;
    priceRetailCents: number;
    location: string;
    features: string[];
    descriptionShort: string;
    status: VehicleStatus;
    primaryImage: string;
  }> = [
    {
      stockNumber: "S-1001",
      registration: "232-G-12345",
      make: "Volkswagen", model: "Golf", variant: "1.0 TSI Life",
      year: 2023, mileageKm: 21500,
      fuelType: FuelType.PETROL, transmission: Transmission.MANUAL, bodyType: BodyType.HATCHBACK,
      engineSizeCc: 999, colour: "Pure White", doors: 5, seats: 5, previousOwners: 1,
      serviceHistory: ServiceHistory.FULL, priceRetailCents: 2599000,
      location: "Galway", features: ["Apple CarPlay", "Adaptive Cruise", "LED Headlights", "Lane Assist"],
      descriptionShort: "One-owner Golf Life with full VW service history.",
      status: VehicleStatus.PUBLISHED,
      primaryImage: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1600",
    },
    {
      stockNumber: "S-1002",
      registration: "222-D-98765",
      make: "Toyota", model: "Corolla", variant: "1.8 Hybrid Sol",
      year: 2022, mileageKm: 38900,
      fuelType: FuelType.HYBRID, transmission: Transmission.AUTOMATIC, bodyType: BodyType.SALOON,
      engineSizeCc: 1798, colour: "Silver Metallic", doors: 4, seats: 5, previousOwners: 1,
      serviceHistory: ServiceHistory.FULL, priceRetailCents: 2849000,
      location: "Galway", features: ["Heated Seats", "Reversing Camera", "Toyota Safety Sense", "Wireless Charging"],
      descriptionShort: "Reliable Hybrid Corolla with low running costs.",
      status: VehicleStatus.PUBLISHED,
      primaryImage: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600",
    },
    {
      stockNumber: "S-1003",
      registration: "212-G-44221",
      make: "BMW", model: "3 Series", variant: "320d M Sport",
      year: 2021, mileageKm: 64500,
      fuelType: FuelType.DIESEL, transmission: Transmission.AUTOMATIC, bodyType: BodyType.SALOON,
      engineSizeCc: 1995, colour: "Mineral Grey", doors: 4, seats: 5, previousOwners: 2,
      serviceHistory: ServiceHistory.FULL, priceRetailCents: 3895000,
      location: "Galway", features: ["Leather Seats", "Sat Nav", "M Sport Pack", "Heated Steering"],
      descriptionShort: "Stunning M Sport with full BMW service history.",
      status: VehicleStatus.READY,
      primaryImage: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600",
    },
    {
      stockNumber: "S-1004",
      registration: "242-G-00111",
      make: "Hyundai", model: "Tucson", variant: "1.6 PHEV Executive",
      year: 2024, mileageKm: 9800,
      fuelType: FuelType.PHEV, transmission: Transmission.AUTOMATIC, bodyType: BodyType.SUV,
      engineSizeCc: 1598, colour: "Phantom Black", doors: 5, seats: 5, previousOwners: 1,
      serviceHistory: ServiceHistory.FULL, priceRetailCents: 4495000,
      location: "Galway", features: ["360 Camera", "Panoramic Roof", "Krell Audio", "Heated/Cooled Seats"],
      descriptionShort: "Top-spec Tucson PHEV with virtually every option.",
      status: VehicleStatus.PUBLISHED,
      primaryImage: "https://images.unsplash.com/photo-1606664922998-f180b39989be?w=1600",
    },
    {
      stockNumber: "S-1005",
      registration: "201-D-55512",
      make: "Skoda", model: "Octavia", variant: "1.6 TDI Ambition",
      year: 2020, mileageKm: 95400,
      fuelType: FuelType.DIESEL, transmission: Transmission.MANUAL, bodyType: BodyType.ESTATE,
      engineSizeCc: 1598, colour: "Race Blue", doors: 5, seats: 5, previousOwners: 2,
      serviceHistory: ServiceHistory.PARTIAL, priceRetailCents: 1695000,
      location: "Galway", features: ["Air Con", "Cruise Control", "Bluetooth", "Roof Rails"],
      descriptionShort: "Workhorse Octavia Estate, ideal family or rep car.",
      status: VehicleStatus.IN_PREP,
      primaryImage: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1600",
    },
    {
      stockNumber: "S-1006",
      registration: "232-G-77889",
      make: "Tesla", model: "Model 3", variant: "Long Range AWD",
      year: 2023, mileageKm: 28100,
      fuelType: FuelType.EV, transmission: Transmission.AUTOMATIC, bodyType: BodyType.SALOON,
      engineSizeCc: 0, colour: "Pearl White", doors: 4, seats: 5, previousOwners: 1,
      serviceHistory: ServiceHistory.FULL, priceRetailCents: 4795000,
      location: "Galway", features: ["Autopilot", "Premium Audio", "Glass Roof", "Heated Front+Rear"],
      descriptionShort: "Long Range Model 3, well-specced and immaculate.",
      status: VehicleStatus.DRAFT,
      primaryImage: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1600",
    },
  ];

  for (const v of demoVehicles) {
    const slug = slugify(`${v.year}-${v.make}-${v.model}-${v.stockNumber}`);
    const vehicle = await prisma.vehicle.upsert({
      where: { dealershipId_stockNumber: { dealershipId: dealership.id, stockNumber: v.stockNumber } },
      update: {},
      create: {
        dealershipId: dealership.id,
        status: v.status,
        stockNumber: v.stockNumber,
        registration: v.registration,
        slug,
        make: v.make,
        model: v.model,
        variant: v.variant,
        year: v.year,
        mileageKm: v.mileageKm,
        fuelType: v.fuelType,
        transmission: v.transmission,
        bodyType: v.bodyType,
        engineSizeCc: v.engineSizeCc,
        colour: v.colour,
        doors: v.doors,
        seats: v.seats,
        previousOwners: v.previousOwners,
        serviceHistory: v.serviceHistory,
        priceRetailCents: v.priceRetailCents,
        vatIncluded: true,
        financeAvailable: true,
        location: v.location,
        features: v.features,
        descriptionShort: v.descriptionShort,
        descriptionLong:
          `${v.descriptionShort} Trade-ins welcome and finance available subject to lender approval. ` +
          `Contact Connolly Motors today to arrange a viewing or test drive.`,
        dateAcquired: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        datePublished: v.status === VehicleStatus.PUBLISHED ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) : null,
      },
    });

    // Single placeholder image per vehicle (real upload UI added later).
    await prisma.vehicleMedia.upsert({
      where: { id: `${vehicle.id}-primary` },
      update: {},
      create: {
        id: `${vehicle.id}-primary`,
        vehicleId: vehicle.id,
        url: v.primaryImage,
        sortOrder: 0,
        isPrimary: true,
        altText: `${v.year} ${v.make} ${v.model} ${v.variant}`,
      },
    });

    // Channel publication rows for both channels.
    await prisma.vehicleChannelPublication.upsert({
      where: { vehicleId_channelId: { vehicleId: vehicle.id, channelId: websiteChannel.id } },
      update: {},
      create: {
        vehicleId: vehicle.id,
        channelId: websiteChannel.id,
        status: v.status === VehicleStatus.PUBLISHED ? PublicationStatus.PUBLISHED : PublicationStatus.NOT_READY,
        lastPublishedAt: v.status === VehicleStatus.PUBLISHED ? new Date() : null,
      },
    });
    await prisma.vehicleChannelPublication.upsert({
      where: { vehicleId_channelId: { vehicleId: vehicle.id, channelId: carzoneChannel.id } },
      update: {},
      create: {
        vehicleId: vehicle.id,
        channelId: carzoneChannel.id,
        status: PublicationStatus.NOT_READY,
      },
    });
  }

  console.log(`Seed complete. Demo dealership: ${dealership.name}. Login with any of: ${users.map(u => u.email).join(", ")} / dealerops`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
