import { z } from "zod";
import { CONNECT_MAX_TAGS, CONNECT_MIN_AGE, CONNECT_TAGS } from "@/lib/connect-tags";

export const connectProfileSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(40),
  age: z.coerce.number().int().min(CONNECT_MIN_AGE, `Must be ${CONNECT_MIN_AGE}+`).max(99),
  description: z.string().trim().min(1, "Tell people a bit about you").max(500),
  instagram: z
    .string()
    .trim()
    .min(1, "Instagram handle is required")
    .max(60)
    .transform((v) => v.replace(/^@/, "")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  showMe: z.enum(["MALE", "FEMALE", "EVERYONE"]),
  photoUrl: z.url("Upload a profile photo"),
  tags: z
    .array(z.enum(CONNECT_TAGS))
    .min(1, "Pick at least one tag")
    .max(CONNECT_MAX_TAGS, `Pick up to ${CONNECT_MAX_TAGS} tags`),
});

export const connectSwipeSchema = z.object({
  toProfileId: z.string().min(1),
  direction: z.enum(["LIKE", "PASS"]),
});
