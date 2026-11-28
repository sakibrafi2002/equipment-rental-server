import "dotenv/config";
import { connectDB, getDB } from "../config/db";
import {
  Equipment,
  Category,
  RentalType,
  EquipmentStatus,
} from "../types/equipment";

const OWNER_EMAIL = "owner@example.com";

const RENTAL_TERMS =
  "A refundable deposit is required. The equipment must be returned clean and in the same condition. Late returns are charged at the daily rate.";

function sample(
  name: string,
  category: Category,
  brand: string,
  model: string,
  rentalPrice: number,
  rentalType: RentalType,
  availableQuantity: number,
  location: string,
  status: EquipmentStatus = "approved"
) {
  return {
    name,
    description: `${brand} ${model}, well maintained and ready for ${rentalType.toLowerCase()} rental.`,
    category,
    location,
    rentalPrice,
    rentalType,
    availableQuantity,
    condition: "Excellent",
    brand,
    model,
    image: `https://placehold.co/800x600?text=${encodeURIComponent(name)}`,
    rentalTerms: RENTAL_TERMS,
    status,
  };
}

const SAMPLES = [
  sample("Hydraulic Excavator", "Construction Equipment", "Caterpillar", "320 GC", 450, "Daily", 3, "Houston, TX"),
  sample("Concrete Mixer", "Construction Equipment", "Stanley", "MX-350", 60, "Daily", 8, "Dallas, TX"),
  sample("Cinema Camera Kit", "Photography Equipment", "Sony", "FX6", 180, "Daily", 4, "Los Angeles, CA"),
  sample("Studio Lighting Set", "Photography Equipment", "Godox", "SL-60W Kit", 35, "Daily", 10, "Austin, TX"),
  sample("Cargo Van", "Vehicles & Transportation", "Ford", "Transit 250", 90, "Daily", 5, "Denver, CO"),
  sample("Flatbed Truck", "Vehicles & Transportation", "Isuzu", "NPR-HD", 1200, "Weekly", 2, "Atlanta, GA"),
  sample("Compact Tractor", "Agriculture Equipment", "Kubota", "L3301", 2400, "Monthly", 2, "Fresno, CA"),
  sample("Seed Drill", "Agriculture Equipment", "John Deere", "1590", 700, "Weekly", 3, "Des Moines, IA"),
  sample("Laptop Workstation Pack", "Electronics", "Dell", "Precision 5680", 300, "Weekly", 12, "Seattle, WA"),
  sample("4K Projector", "Electronics", "Epson", "Pro EX11000", 55, "Daily", 6, "Chicago, IL"),
  sample("PA Sound System", "Event Equipment", "JBL", "EON715 Set", 150, "Daily", 6, "Miami, FL", "rejected"),
  sample("Party Tent 20x40", "Event Equipment", "Eureka", "Premier 20x40", 220, "Daily", 7, "Nashville, TN", "pending"),
];

async function seed() {
  await connectDB();
  const db = getDB();

  const owner = await db.collection("user").findOne({ email: OWNER_EMAIL });
  if (!owner) {
    throw new Error(
      `Owner ${OWNER_EMAIL} not found. Run "npm run seed" in the client project first.`
    );
  }

  const collection = db.collection<Equipment>("equipment");

  for (const [index, item] of SAMPLES.entries()) {
    const equipment: Equipment = {
      ...item,
      owner: {
        id: String(owner._id),
        name: owner.name ?? "",
        email: OWNER_EMAIL,
        image: owner.image ?? null,
      },
      createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
    };

    await collection.updateOne(
      { name: item.name, "owner.email": OWNER_EMAIL },
      { $setOnInsert: equipment },
      { upsert: true }
    );
    console.log(`Seeded: ${item.name} (${item.status})`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });