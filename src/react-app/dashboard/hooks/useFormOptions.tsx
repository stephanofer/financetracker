import { useQuery } from "@tanstack/react-query";
import { Account, ApiResponse, Category, Subcategory } from "@/dashboard/utils/types";
import { toast } from "sonner";

export function useFormOptions() {
  const { data: categoryData } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<ApiResponse<Category[]>> => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        const errorMsg = "Error al cargar las categorías";
        toast.error("Error de conexión", {
          description: errorMsg,
        });
        throw new Error(errorMsg);
      }
      return res.json();
    },
  });

  const { data: subcategoryData } = useQuery({
    queryKey: ["subcategories"],
    queryFn: async (): Promise<ApiResponse<Subcategory[]>> => {
      const res = await fetch("/api/subcategories");
      if (!res.ok) {
        const errorMsg = "Error al cargar las subcategorías";
        toast.error("Error de conexión", {
          description: errorMsg,
        });
        throw new Error(errorMsg);
      }
      return res.json();
    },
  });

  const { data: accountData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<ApiResponse<Account[]>> => {
      const res = await fetch("/api/accounts", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorMsg = "Error al cargar las cuentas";
        toast.error("Error de conexión", {
          description: errorMsg,
        });
        throw new Error(errorMsg);
      }
      return res.json();
    },
  });

  return {
    categories: categoryData?.data || [],
    subcategories: subcategoryData?.data || [],
    accounts: accountData?.data || [],
  };
}
