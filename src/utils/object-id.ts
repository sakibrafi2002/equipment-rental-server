import { ObjectId } from "mongodb";

export function toObjectId(value: unknown): ObjectId | null {
  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}