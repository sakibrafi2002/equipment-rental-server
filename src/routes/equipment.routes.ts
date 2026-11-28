import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { verifyToken, verifyOwner } from "../middleware/auth";
import { validateEquipmentInput } from "../utils/validate-equipment";
import { Equipment } from "../types/equipment";

const router = Router();

const equipmentCollection = () => getDB().collection<Equipment>("equipment");

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

// Logged-in users: details of one item
router.get("/:id", verifyToken, async (req, res) => {
  const id = String(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid equipment id." });
    return;
  }

  const item = await equipmentCollection().findOne({ _id: new ObjectId(id) });
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

export default router;