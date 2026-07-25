import { z } from "zod";

export const coverPlaceholderValues = [
  "sunset",
  "sea",
  "forest",
  "night",
] as const;

export const tripSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give this trip a name.")
    .max(120, "Trip name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1,000 characters or fewer."),
  coverPlaceholder: z.enum(coverPlaceholderValues),
});

export const tripIdSchema = z.string().uuid("Invalid trip identifier.");

export type TripValues = z.infer<typeof tripSchema>;
export type CoverPlaceholder = (typeof coverPlaceholderValues)[number];
