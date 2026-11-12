import mongoose, { Schema } from "mongoose";

const visitSchema = new Schema({
  personId: { type: String, required: true, index: true },
  address: { type: String, required: true },
  title: { type: String, default: "Nowhere" },
  visitedAt: { type: Date, required: true, index: true },
  source: { type: String, enum: ["typed", "link", "history", "back", "forward", "seed"], required: true }
}, { timestamps: true });

visitSchema.index({ personId: 1, visitedAt: -1 });
export const Visit = mongoose.model("Visit", visitSchema);
