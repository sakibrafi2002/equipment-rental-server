import { Router } from "express";
import {
  verifyToken,
  verifyRenter,
  verifyOwner,
  verifyAdmin,
} from "../middleware/auth";

const router = Router();

router.get("/me", verifyToken, (req, res) => {
  res.json({ message: "Token is valid", user: req.user });
});

router.get("/renter", verifyToken, verifyRenter, (req, res) => {
  res.json({ message: "Hello renter", user: req.user });
});

router.get("/owner", verifyToken, verifyOwner, (req, res) => {
  res.json({ message: "Hello owner", user: req.user });
});

router.get("/admin", verifyToken, verifyAdmin, (req, res) => {
  res.json({ message: "Hello admin", user: req.user });
});

export default router;