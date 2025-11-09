import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const PayDebtSchema = z.object({
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .regex(/^\d+(\.\d+)?$/, "El monto debe ser un número válido")
    .refine((val) => parseFloat(val) > 0, "El monto debe ser mayor a 0"),
  accountId: z.string().min(1, "Debes seleccionar una cuenta"),
  debtId: z.string().min(1, "Debes seleccionar una deuda"),
  description: z.string().max(255).optional(),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, "Debes seleccionar un archivo")
    .refine(
      (files) => files[0]?.size <= MAX_FILE_SIZE,
      "El archivo debe ser menor a 5MB"
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files[0]?.type),
      "Tipo de archivo no permitido"
    )
    .optional(),
});

export type PayDebtFormData = z.infer<typeof PayDebtSchema>;

export const defaultPayDebtValues: PayDebtFormData = {
  amount: "",
  accountId: "",
  debtId: "",
  description: "",
  file: undefined,
};
