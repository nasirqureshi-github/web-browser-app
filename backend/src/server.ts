import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import api from "./routes/api";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json({ limit: "100kb" }));
app.use("/api", api);
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  },
);

const port = Number(process.env.PORT || 4000);
connectDB()
  .then(() =>
    app.listen(port, () =>
      console.log(`API listening on http://localhost:${port}`),
    ),
  )
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
