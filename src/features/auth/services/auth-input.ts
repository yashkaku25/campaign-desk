import { z } from "zod";

import { signInEmail, signupGmail } from "@/features/auth/services/gmail-address";
import { isCurrency, type CurrencyCode } from "@/lib/currency/codes";

const emailField = z.string().trim().toLowerCase().email().max(120);
const passwordField = z.string().min(8, "Use at least 8 characters.").max(72);
const nameField = z.string().trim().min(1, "Enter your name.").max(40);

export function readSignInInput(email: string, password: string): { email: string; password: string } | { message: string } {
  if (!email.trim() || !password) return { message: "Enter your email and password." };
  const parsed = emailField.safeParse(email);
  if (!parsed.success) return { message: "Enter a real email address." };
  return { email: signInEmail(parsed.data), password };
}

export function readSignUpInput(
  displayName: string,
  email: string,
  password: string,
  currency: string,
): { displayName: string; email: string; password: string; currency: CurrencyCode } | { message: string } {
  const name = nameField.safeParse(displayName);
  if (!name.success) return { message: name.error.issues[0]?.message ?? "Enter your name." };
  if (!isCurrency(currency)) return { message: "Choose USD, EUR, GBP, CAD, or INR." };
  const gmail = signupGmail(email);
  if ("message" in gmail) return { message: gmail.message };
  const parsedPassword = passwordField.safeParse(password);
  if (!parsedPassword.success) return { message: parsedPassword.error.issues[0]?.message ?? "Use at least 8 characters." };
  return { displayName: name.data, email: gmail.email, password: parsedPassword.data, currency };
}
