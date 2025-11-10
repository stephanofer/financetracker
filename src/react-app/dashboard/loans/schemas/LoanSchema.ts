import { z } from "zod";

export const LoanSchema = z.object({
  debtor_name: z.string().min(1, "El nombre del deudor es requerido"),
  debtor_contact: z.string().optional(),
  original_amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "El monto debe ser mayor a 0",
    }),
  interest_rate: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      {
        message: "La tasa de interés debe ser mayor o igual a 0",
      }
    ),
  loan_date: z.string().min(1, "La fecha del préstamo es requerida"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  account_id: z.string().optional(),
});

export type LoanFormData = z.infer<typeof LoanSchema>;

export const defaultLoanValues: LoanFormData = {
  debtor_name: "",
  debtor_contact: "",
  original_amount: "",
  interest_rate: "0",
  loan_date: new Date().toISOString().split("T")[0],
  due_date: "",
  notes: "",
  account_id: "",
};
