import { z } from "zod";

export const invitationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export const invitationTokenSchema = z
  .string()
  .min(32, "This invitation link is invalid.")
  .max(256, "This invitation link is invalid.")
  .regex(/^[A-Za-z0-9_-]+$/, "This invitation link is invalid.");
