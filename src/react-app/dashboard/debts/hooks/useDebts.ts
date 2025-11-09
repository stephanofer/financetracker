import { ApiResponse, Debt, DebtDetailApiResponse, DebtsApiResponse } from "@/dashboard/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: async (): Promise<ApiResponse<DebtsApiResponse>> => {
      const response = await fetch(`/api/debts`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener los gastos");
      }

      return response.json();
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newDebt: unknown) => {
      const response = await fetch(`/api/debts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newDebt),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear la deuda");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    }
  });
}



export function usePayDebt() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Debt>, Error, FormData>({
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
        queryKey: ["debts"],
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

export function useDebtDetail(id: number) {
  return useQuery({
    queryKey: ["debt", id],
    queryFn: async (): Promise<ApiResponse<DebtDetailApiResponse>> => {
      const response = await fetch(`/api/debts/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener la transacción");
      }

      return response.json();
    },
  });
}