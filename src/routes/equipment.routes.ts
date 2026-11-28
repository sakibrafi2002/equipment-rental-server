import { Router } from "express";
import { Document, Filter, Sort } from "mongodb";
import { getDB } from "../config/db";
import {
  verifyToken,
  verifyOwner,
  verifyOwnerOrAdmin,
} from "../middleware/auth";
import { validateEquipmentInput } from "../utils/validate-equipment";
import { escapeRegex } from "../utils/escape-regex";
import { toObjectId } from "../utils/object-id";
import { Equipment, Category, RentalType } from "../types/equipment";

const router = Router();

const equipmentCollection = () => getDB().collection<Equipment>("equipment");

function toNumber(value: unknown): number | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Public: approved equipment with search, filters, sorting and pagination
router.get("/", async (req, res) => {
  const search = toText(req.query.search);
  const category = toText(req.query.category);
  const rentalType = toText(req.query.rentalType);
  const availability = toText(req.query.availability);
  const sort = toText(req.query.sort);
  const minPrice = toNumber(req.query.minPrice);
  const maxPrice = toNumber(req.query.maxPrice);

  const conditions: Document[] = [{ status: "approved" }];

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    conditions.push({
      $or: [{ name: pattern }, { location: pattern }, { category: pattern }],
    });
  }
  if (category) conditions.push({ category: category as Category });
  if (rentalType) conditions.push({ rentalType: rentalType as RentalType });
  if (minPrice !== null) conditions.push({ rentalPrice: { $gte: minPrice } });
  if (maxPrice !== null) conditions.push({ rentalPrice: { $lte: maxPrice } });
  if (availability === "available") {
    conditions.push({ availableQuantity: { $gt: 0 } });
  }
  if (availability === "unavailable") {
    conditions.push({ availableQuantity: { $lte: 0 } });
  }

  const filter: Filter<Equipment> = { $and: conditions };

  const sortBy: Sort =
    sort === "price-asc"
      ? { rentalPrice: 1, createdAt: -1 }
      : sort === "price-desc"
        ? { rentalPrice: -1, createdAt: -1 }
        : { createdAt: -1 };

  const page = Math.max(1, Math.floor(toNumber(req.query.page) ?? 1));
  const limit = Math.min(
    24,
    Math.max(1, Math.floor(toNumber(req.query.limit) ?? 9))
  );

  const [items, total] = await Promise.all([
    equipmentCollection()
      .find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    equipmentCollection().countDocuments(filter),
  ]);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Owner adds new equipment (starts as pending)
router.post("/", verifyToken, verifyOwner, async (req, res) => {
  const result = validateEquipmentInput(req.body ?? {});
  if (!result.ok) {
    res.status(400).json({ message: result.error });
    return;
  }

  const ownerAccount = await getDB()
    .collection("user")
    .findOne({ email: req.user!.email });

  const equipment: Equipment = {
    ...result.data,
    status: "pending",
    owner: {
      id: req.user!.id,
      name: ownerAccount?.name ?? "",
      email: req.user!.email,
      image: ownerAccount?.image ?? null,
    },
    createdAt: new Date(),
  };

  const inserted = await equipmentCollection().insertOne(equipment);
  res.status(201).json({
    message: "Equipment submitted and waiting for admin approval.",
    id: inserted.insertedId,
  });
});

// Public: 6 approved items for the Home page
router.get("/featured", async (_req, res) => {
  const items = await equipmentCollection()
    .find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
  res.json(items);
});

// Owner: all of my equipment, any status
router.get("/mine", verifyToken, verifyOwner, async (req, res) => {
  const items = await equipmentCollection()
    .find({ "owner.email": req.user!.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(items);
});

// Logged-in users: details of one item
router.get("/:id", verifyToken, async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid equipment id." });
    return;
  }

  const item = await equipmentCollection().findOne({ _id: id });
  if (!item) {
    res.status(404).json({ message: "Equipment not found." });
    return;
  }

  const isOwner = item.owner.email === req.user!.email;
  const isAdmin = req.user!.role === "admin";
  if (item.status !== "approved" && !isOwner && !isAdmin) {
    res.status(404).json({ message: "Equipment not found." });
    return;
  }

  res.json(item);
});

// Owner (own items) or admin (any item): update equipment
router.put("/:id", verifyToken, verifyOwnerOrAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid equipment id." });
    return;
  }

  const result = validateEquipmentInput(req.body ?? {});
  if (!result.ok) {
    res.status(400).json({ message: result.error });
    return;
  }

  const item = await equipmentCollection().findOne({ _id: id });
  if (!item) {
    res.status(404).json({ message: "Equipment not found." });
    return;
  }

  if (req.user!.role === "owner" && item.owner.email !== req.user!.email) {
    res.status(403).json({ message: "You can only update your own equipment." });
    return;
  }

  await equipmentCollection().updateOne({ _id: id }, { $set: result.data });
  res.json({ message: "Equipment updated." });
});

// Owner (own items) or admin (any item): delete equipment
router.delete("/:id", verifyToken, verifyOwnerOrAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Invalid equipment id." });
    return;
  }

  const item = await equipmentCollection().findOne({ _id: id });
  if (!item) {
    res.status(404).json({ message: "Equipment not found." });
    return;
  }

  if (req.user!.role === "owner" && item.owner.email !== req.user!.email) {
    res.status(403).json({ message: "You can only delete your own equipment." });
    return;
  }

  await equipmentCollection().deleteOne({ _id: id });
  res.json({ message: "Equipment deleted." });
});

export default router;