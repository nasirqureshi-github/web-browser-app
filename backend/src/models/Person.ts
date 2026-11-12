import mongoose, { Schema } from "mongoose";

const personSchema = new Schema({
  personId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true }
}, { timestamps: true });

export const Person = mongoose.model("Person", personSchema);
