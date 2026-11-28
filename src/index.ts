import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import equipmentRoutes from "./routes/equipment.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/equipment", equipmentRoutes);
app.use("/api/admin", adminRoutes);


app.get("/", (_req: Request, res: Response) => {
  res.send("Equipment Rental Platform server is running");
});

async function startServer() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  process.exit(1);
});