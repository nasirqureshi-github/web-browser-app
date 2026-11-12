import mongoose, { Schema } from "mongoose";

const siteSchema = new Schema({
  address: { type: String, required: true, unique: true, lowercase: true, index: true },
  title: { type: String, required: true },
  html: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  plainText: { type: String, required: true }
}, { timestamps: true });

export const Site = mongoose.model("Site", siteSchema);
