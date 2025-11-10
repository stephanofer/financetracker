import { z } from "zod";

export const PendingPaymentSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "El monto debe ser mayor a 0",
    }),
  due_date: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  account_id: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().optional(),
  reminder_enabled: z.boolean().optional(),
});

export type PendingPaymentFormData = z.infer<typeof PendingPaymentSchema>;

export const defaultPendingPaymentValues: PendingPaymentFormData = {
  name: "",
  amount: "",
  due_date: "",
  category_id: "",
  subcategory_id: "",
  account_id: "",
  priority: "medium",
  notes: "",
  reminder_enabled: true,
};
