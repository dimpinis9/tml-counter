import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";

describe("auth validation", () => {
  it("accepts valid login fields", () => {
    expect(
      loginSchema.safeParse({
        email: "friend@example.com",
        password: "keepsake123",
      }).success,
    ).toBe(true);
  });

  it("rejects mismatched signup passwords", () => {
    const result = signupSchema.safeParse({
      displayName: "Alex",
      email: "friend@example.com",
      password: "keepsake123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
  });

  it("requires strong matching reset passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "Keepsake123",
        confirmPassword: "Keepsake123",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: "weakpass",
        confirmPassword: "weakpass",
      }).success,
    ).toBe(false);
  });

  it("validates password recovery email and profile fields", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "friend@example.com" }).success,
    ).toBe(true);
    expect(
      profileUpdateSchema.safeParse({
        displayName: "Alex",
        avatarUrl: "https://example.com/alex.jpg",
      }).success,
    ).toBe(true);
  });
});
