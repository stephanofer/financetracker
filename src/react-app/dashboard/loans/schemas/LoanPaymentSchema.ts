import { z } from "zod";

export const LoanPaymentSchema = z.object({
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "El monto debe ser mayor a 0",
    }),
  account_id: z.string().min(1, "La cuenta es requerida"),
  transaction_date: z.string().min(1, "La fecha es requerida"),
  description: z.string().optional(),
  notes: z.string().optional(),
  file: z.instanceof(File).optional().nullable(),
});

export type LoanPaymentFormData = z.infer<typeof LoanPaymentSchema>;

export const defaultLoanPaymentValues: LoanPaymentFormData = {
  amount: "",
  account_id: "",
  transaction_date: new Date().toISOString().split("T")[0],
  description: "",
  notes: "",
  file: null,
};
