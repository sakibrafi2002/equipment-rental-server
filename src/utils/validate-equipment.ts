import {
  CATEGORIES,
  RENTAL_TYPES,
  Category,
  RentalType,
  EquipmentInput,
} from "../types/equipment";

type ValidationResult =
  | { ok: true; data: EquipmentInput }
  | { ok: false; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateEquipmentInput(
  body: Record<string, unknown>
): ValidationResult {
  const name = text(body.name);
  const description = text(body.description);
  const category = text(body.category);
  const location = text(body.location);
  const rentalType = text(body.rentalType);
  const condition = text(body.condition);
  const brand = text(body.brand);
  const model = text(body.model);
  const image = text(body.image);
  const rentalTerms = text(body.rentalTerms);
  const rentalPrice = Number(body.rentalPrice);
  const availableQuantity = Number(body.availableQuantity);

  if (
    !name || !description || !location || !condition ||
    !brand || !model || !image || !rentalTerms
  ) {
    return { ok: false, error: "All fields are required." };
  }
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: "Invalid category." };
  }
  if (!(RENTAL_TYPES as readonly string[]).includes(rentalType)) {
    return { ok: false, error: "Rental type must be Daily, Weekly or Monthly." };
  }
  if (!Number.isFinite(rentalPrice) || rentalPrice <= 0) {
    return { ok: false, error: "Rental price must be greater than 0." };
  }
  if (!Number.isInteger(availableQuantity) || availableQuantity < 1) {
    return { ok: false, error: "Available quantity must be a whole number of at least 1." };
  }
  if (!/^https?:\/\//.test(image)) {
    return { ok: false, error: "Image must be a valid http(s) link." };
  }

  return {
    ok: true,
    data: {
      name,
      description,
      category: category as Category,
      location,
      rentalPrice,
      rentalType: rentalType as RentalType,
      availableQuantity,
      condition,
      brand,
      model,
      image,
      rentalTerms,
    },
  };
}