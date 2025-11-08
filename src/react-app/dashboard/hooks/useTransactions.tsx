import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, Transaction } from "@/dashboard/utils/types";
import { toast } from "sonner";

export function useTransaction() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Transaction>, Error, FormData>({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/transactions`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        let errorMessage = "Error al crear la transacción";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          switch (response.status) {
            case 400:
              errorMessage =
                "Datos inválidos. Por favor verifica la información ingresada.";
              break;
            case 401:
              errorMessage = "No estás autenticado. Por favor inicia sesión.";
              break;
            case 403:
              errorMessage = "No tienes permisos para realizar esta acción.";
              break;
            case 404:
              errorMessage = "Recurso no encontrado.";
              break;
            case 413:
              errorMessage = "El archivo es demasiado grande. Máximo 5MB.";
              break;
            case 500:
              errorMessage = "Error del servidor. Por favor intenta más tarde.";
              break;
            case 503:
              errorMessage =
                "Servicio no disponible. Por favor intenta más tarde.";
              break;
            default:
              errorMessage = `Error al crear la transacción (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["summary", 10, 0],
      });
    },
    onError: (error) => {
      toast.error("Error al registrar transacción", {
        description:
          error.message ||
          "Ocurrió un error inesperado. Por favor intenta nuevamente.",
        duration: 5000,
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Error al eliminar la transacción";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          switch (response.status) {
            case 400:
              errorMessage =
                "Solicitud inválida. Por favor verifica la información.";
              break;
            case 401:
              errorMessage = "No estás autenticado. Por favor inicia sesión.";
              break;
            case 403:
              errorMessage = "No tienes permisos para realizar esta acción.";
              break;
            case 404:
              errorMessage = "Transacción no encontrada.";
              break;
            case 500:
              errorMessage = "Error del servidor. Por favor intenta más tarde.";
              break;
            default:
              errorMessage = `Error al eliminar la transacción (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["summary", 10, 0],
      });
      toast.success("Transacción eliminada correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar transacción", {
        description:
          error.message ||
          "Ocurrió un error inesperado. Por favor intenta nuevamente.",
        duration: 5000,
      });
    },
  });
}
