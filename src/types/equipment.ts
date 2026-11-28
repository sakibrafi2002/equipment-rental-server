export const CATEGORIES = [
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
] as const;

export const RENTAL_TYPES = ["Daily", "Weekly", "Monthly"] as const;

export type Category = (typeof CATEGORIES)[number];
export type RentalType = (typeof RENTAL_TYPES)[number];
export type EquipmentStatus = "pending" | "approved" | "rejected";

export interface Equipment {
  name: string;
  description: string;
  category: Category;
  location: string;
  rentalPrice: number;
  rentalType: RentalType;
  availableQuantity: number;
  condition: string;
  brand: string;
  model: string;
  image: string;
  rentalTerms: string;
  status: EquipmentStatus;
  owner: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  createdAt: Date;
}

export type EquipmentInput = Omit<Equipment, "status" | "owner" | "createdAt">;