import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// Uppercase letters + digits, no ambiguous-looking pairs (0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

type BookingItemClient = { findUnique: (typeof prisma.bookingItem)["findUnique"] };

/** Generates a unique 6-character join code, retrying on the rare collision. */
export async function generateUniqueJoinCode(
  client: { bookingItem: BookingItemClient } = prisma
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await client.bookingItem.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique join code.");
}
