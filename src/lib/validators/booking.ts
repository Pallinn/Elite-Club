import { z } from "zod";

export const createHoldSchema = z.object({
  items: z
    .array(
      z.object({
        zoneId: z.string().min(1),
        tableId: z.string().min(1).optional(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1),
});

export type CreateHoldInput = z.infer<typeof createHoldSchema>;
