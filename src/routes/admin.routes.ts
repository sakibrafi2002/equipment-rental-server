import { Router } from "express";
import { getDB } from "../config/db";
import { verifyToken, verifyAdmin } from "../middleware/auth";
import { toObjectId } from "../utils/object-id";
import { Equipment, EquipmentStatus } from "../types/equipment";

const router = Router();

const equipmentCollection = () => getDB().collection<Equipment>("equipment");

const STATUSES = ["pending", "approved", "rejected"];

// Admin: all equipment, optionally filtered by ?status=
router.get("/equipment", verifyToken, verifyAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const filter = STATUSES.includes(status)
    ? { status: status as EquipmentStatus }
    : {};

  const items = await equipmentCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  res.json(items);
});

// Admin: approve or reject equipment
router.patch(
  "/equipment/:id/status",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const id = toObjectId(req.params.id);
    if (!id) {
      res.status(400).json({ message: "Invalid equipment id." });
      return;
    }

    const status: unknown = req.body?.status;
    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ message: "Status must be approved or rejected." });
      return;
    }

    const result = await equipmentCollection().updateOne(
      { _id: id },
      { $set: { status } }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "Equipment not found." });
      return;
    }

    res.json({ message: `Equipment ${status}.` });
  }
);

export default router;