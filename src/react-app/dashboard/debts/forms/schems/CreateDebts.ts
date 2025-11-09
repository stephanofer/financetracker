import { z } from "zod";

const CREATE_DEBT_TYPES = [
  "person",
  "institution",
  "credit_card",
  "loan",
  "mortgage",
  "other",
] as const;

export const CreateDebtSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(CREATE_DEBT_TYPES, { error: "Tipo de deuda inválido" }),
  original_amount: z.string(),
  interest_rate: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().max(255).optional(),
  has_installments: z.boolean(),
});

export type CreateDebtFormData = z.infer<typeof CreateDebtSchema>;

export const defaultCreateDebtValues: CreateDebtFormData = {
  name: "",
  type: "person",
  original_amount: "0",
  interest_rate: "0",
  due_date: "",
  notes: "",
  has_installments: false,
};
