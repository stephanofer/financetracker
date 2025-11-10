import { z } from "zod";

export const RecurringExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  amount: z.string().min(1, "El monto es requerido"),
  frequency: z.enum(["weekly", "biweekly", "monthly", "annual"], {
    message: "Selecciona una frecuencia",
  }),
  charge_day: z.string().min(1, "El día de cargo es requerido"),
  account_id: z.string().min(1, "Selecciona una cuenta"),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  notify_3_days: z.boolean().optional(),
  notify_1_day: z.boolean().optional(),
  notify_same_day: z.boolean().optional(),
});

export type RecurringExpenseFormData = z.infer<typeof RecurringExpenseSchema>;

export const defaultRecurringExpenseValues: RecurringExpenseFormData = {
  name: "",
  amount: "",
  frequency: "monthly",
  charge_day: "",
  account_id: "",
  category_id: "",
  subcategory_id: "",
  notify_3_days: true,
  notify_1_day: true,
  notify_same_day: true,
};

// Mapeo de frecuencias para mostrar en español
export const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  annual: "Anual",
};

// Mapeo de días para frecuencia semanal
export const weekDays = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "7", label: "Domingo" },
];
