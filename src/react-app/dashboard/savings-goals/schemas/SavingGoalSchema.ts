import { z } from "zod";

export const SavingGoalSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  target_amount: z.string().min(1, "El monto objetivo es obligatorio"),
  current_amount: z.string().optional(),
  target_date: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  image_url: z.string().optional(),
  auto_contribute: z.boolean().optional(),
  auto_contribute_percentage: z.string().optional(),
});

export type SavingGoalFormData = z.infer<typeof SavingGoalSchema>;

export const defaultSavingGoalValues: SavingGoalFormData = {
  name: "",
  description: "",
  target_amount: "",
  current_amount: "0",
  target_date: "",
  priority: "medium",
  image_url: "",
  auto_contribute: false,
  auto_contribute_percentage: "",
};

export const ContributeSchema = z.object({
  amount: z.string().min(1, "El monto es obligatorio"),
  account_id: z.string().min(1, "Debes seleccionar una cuenta"),
  transaction_date: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export type ContributeFormData = z.infer<typeof ContributeSchema>;

export const defaultContributeValues: ContributeFormData = {
  amount: "",
  account_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
  description: "",
  notes: "",
};
