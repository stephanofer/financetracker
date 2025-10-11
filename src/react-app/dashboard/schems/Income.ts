import { z } from "zod";

export const IncomeSchema = z.object({
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  categoryId: z.string().min(1, "Debes seleccionar una categoría"),
  subcategoryId: z.string().optional(),
  accountId: z.string().min(1, "Debes seleccionar una cuenta"),
  description: z.string().max(255).optional(),
  receipt: z.instanceof(File).optional(),
});

export type IncomeFormData = z.infer<typeof IncomeSchema>;

export const defaultIncomeValues: IncomeFormData = {
  amount: 0,
  categoryId: "",
  accountId: "",
  description: "",
};
