import { z } from "zod";

export const TransferSchema = z
  .object({
    amount: z.string().min(1, "El monto es requerido"),
    sourceAccountId: z.string().min(1, "Selecciona una cuenta de origen"),
    destinationAccountId: z.string().min(1, "Selecciona una cuenta de destino"),
    description: z.string().optional(),
  })
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    message: "La cuenta de destino debe ser diferente a la de origen",
    path: ["destinationAccountId"],
  });

export type TransferFormData = z.infer<typeof TransferSchema>;

export const defaultTransferValues: TransferFormData = {
  sourceAccountId: "",
  destinationAccountId: "",
  amount: "",
  description: "",
};
