import { z } from "zod";

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, "El usuario es requerido")
    .min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
