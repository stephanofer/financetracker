import { z } from "zod";

export const MarkAsPaidSchema = z.object({
  account_id: z.string().min(1, "La cuenta es requerida"),
  transaction_date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().optional(),
});

export type MarkAsPaidFormData = z.infer<typeof MarkAsPaidSchema>;

export const defaultMarkAsPaidValues: MarkAsPaidFormData = {
  account_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
  notes: "",
};
