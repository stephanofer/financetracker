import { z } from "zod";

const CREATE_DEBT_TYPES = [
  "person",
  "institution",
  "credit_card",
  "loan",
  "mortgage",
  "other",
] as const;
const DEBT_TYPES = ["person", "institution"] as const;

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

export const DebtSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(DEBT_TYPES, {
    error: "Tipo de deuda inválido",
  }),
  original_amount: z
    .string()
    .min(1, "El monto original es requerido")
    .regex(/^[0-9]+(\.[0-9]{1,2})?$/, "El monto debe ser un número válido")
    .refine((val) => parseFloat(val) > 0, "El monto debe ser mayor a 0"),
  interest_rate: z
    .string()
    .regex(/^[0-9]+(\.[0-9]{1,2})?$/, "La tasa debe ser un número válido")
    .refine((val) => parseFloat(val) >= 0, "La tasa debe ser mayor o igual a 0")
    .optional(),
  notes: z.string().max(255).optional(),
});

export type DebtSchemaFormData = z.infer<typeof DebtSchema>;

export const defaultDebtValues: DebtSchemaFormData = {
  name: "",
  type: "person",
  original_amount: "0",
  interest_rate: "0",
  notes: "",
};
