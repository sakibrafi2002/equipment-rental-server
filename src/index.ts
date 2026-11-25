import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Equipment Rental Platform server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});