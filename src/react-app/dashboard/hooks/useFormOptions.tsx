import { useQuery } from "@tanstack/react-query";
import { Account, ApiResponse, Category, Subcategory } from "@/dashboard/types";
import { toast } from "sonner";

export function useFormOptions() {
  const { data: categoryData } = useQuery<ApiResponse<Category[]>>({
    queryKey: ["categories"],
    queryFn: async () => {
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

  const { data: subcategoryData } = useQuery<ApiResponse<Subcategory[]>>({
    queryKey: ["subcategories"],
    queryFn: async () => {
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

  const { data: accountData } = useQuery<ApiResponse<Account[]>>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts?userId=1");
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
