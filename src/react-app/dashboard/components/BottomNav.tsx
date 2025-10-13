import {
  Account,
  ActionType,
  ApiResponse,
  Category,
  Subcategory,
} from "@/react-app/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Layers,
  Repeat,
  Search,
  Upload,
  User,
  X,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  defaultIncomeValues,
  IncomeFormData,
  IncomeSchema,
} from "../schems/Income";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function BottomNav() {
  interface CreateTransactionResponse {
    success: boolean;
    id?: number;
    error?: string;
  }
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeForm, setActiveForm] = useState<ActionType>(null);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(IncomeSchema),
    defaultValues: defaultIncomeValues,
  });

  const queryClient = useQueryClient();

  const { mutate } = useMutation<CreateTransactionResponse, Error, FormData>({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/transaction/income`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        throw new Error("Error al crear la transacción");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const { reset } = form;

  function onSubmit(data: IncomeFormData) {
    const formData = new FormData();

    formData.append("amount", data.amount);
    formData.append("description", data.description || "");
    formData.append("date", new Date().toISOString());
    formData.append("accountId", data.accountId);
    formData.append("categoryId", data.categoryId);

    if (data.subcategoryId) {
      formData.append("subcategoryId", data.subcategoryId);
    }

    formData.append("userId", "1");

    if (data.file) {
      formData.append("file", data.file[0]);
    }

    console.log("FormData contents:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type,
          lastModified: value.lastModified,
        });
        // Para ver los primeros bytes del archivo
        value.arrayBuffer().then((buffer) => {
          const bytes = new Uint8Array(buffer);
          console.log(
            `${key} - Primeros 20 bytes:`,
            Array.from(bytes.slice(0, 20))
          );
        });
      } else {
        console.log(`${key}:`, value);
      }
    }
    mutate(formData, {
      onSuccess: (response) => {
        console.log("Transaction created successfully:", response);
        handleClose();
      },
      onError: (error) => {
        console.log("Error:", error);
      },
    });
  }

  const handleActionClick = (actionType: ActionType) => {
    setShowQuickActions(false);
    setActiveForm(actionType);
  };

  const getDialogTitle = () => {
    switch (activeForm) {
      case "expense":
        return "Registrar Gasto";
      case "income":
        return "Registrar Ingreso";
      case "account":
        return "Nueva Cuenta";
      case "debt":
        return "Registrar Deuda";
      default:
        return "";
    }
  };

  const { data: categoryData } = useQuery<ApiResponse<Category[]>>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error fetching categories");
      return res.json();
    },
  });

  const { data: subcategoryData } = useQuery<ApiResponse<Subcategory[]>>({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories");
      if (!res.ok) throw new Error("Error fetching subcategories");
      return res.json();
    },
  });

  const { data: accountData } = useQuery<ApiResponse<Account[]>>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts?userId=1");
      if (!res.ok) throw new Error("Error fetching accounts");
      return res.json();
    },
  });

  const handleClose = () => {
    console.log("reset");
    setActiveForm(null);
    reset();
  };

  return (
    <>
      <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold text-center">
              Acciones Rápidas
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-2 px-3">
            {/* Registrar Ingreso */}
            <button
              onClick={() => handleActionClick("income")}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl hover:from-emerald-500/15 hover:to-emerald-600/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-white">
                Registrar Ingreso
              </span>
            </button>

            {/* Registrar Gasto */}
            <button
              onClick={() => handleActionClick("expense")}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl hover:from-red-500/15 hover:to-red-600/10 hover:border-red-500/30 active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-red-400" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-white">
                Registrar Gasto
              </span>
            </button>

            {/* Nueva Cuenta */}
            <button
              onClick={() => handleActionClick("account")}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl hover:from-blue-500/15 hover:to-blue-600/10 hover:border-blue-500/30 active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-white">
                Nueva Cuenta
              </span>
            </button>

            {/* Registrar Deuda */}
            <button
              onClick={() => handleActionClick("debt")}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl hover:from-amber-500/15 hover:to-amber-600/10 hover:border-amber-500/30 active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-white">
                Registrar Deuda
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={activeForm !== null} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => {
                    console.log(field);
                    return (
                      <FormItem>
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0.00"
                            type="number"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="category" className="w-full">
                            <SelectValue placeholder="Seleccionar Categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryData?.data.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoría</FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="subcategory" className="w-full">
                            <SelectValue placeholder="Seleccionar Subcategoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategoryData?.data.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuenta</FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="account" className="w-full">
                            <SelectValue placeholder="Seleccionar Cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {accountData?.data.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Comprobante (Opcional)</FormLabel>
                      <FormControl>
                        <div className="relative w-full min-w-0">
                          <input
                            {...fieldProps}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            onChange={(e) => {
                              onChange(e.target.files);
                            }}
                            className="hidden"
                            id="file-upload"
                          />
                          {!value || !value[0] ? (
                            <label
                              htmlFor="file-upload"
                              className="flex items-center justify-center gap-2 w-full min-w-0 px-4 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-2 border-dashed border-slate-600/50 rounded-xl hover:border-emerald-500/50 hover:from-emerald-900/20 hover:to-slate-800/50 cursor-pointer transition-all duration-200 group"
                            >
                              <Upload className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                              <span className="text-sm font-medium text-slate-300 group-hover:text-emerald-300 transition-colors">
                                Subir comprobante
                              </span>
                            </label>
                          ) : (
                            <div className="flex items-center gap-2 w-full min-w-0 px-4 py-3 bg-gradient-to-r from-emerald-900/30 to-slate-800/50 border-2 border-emerald-500/30 rounded-xl overflow-hidden">
                              <Upload className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                              <span className="text-sm font-medium text-emerald-300 truncate min-w-0 flex-1">
                                {value[0].name}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onChange(null);
                                  const input = document.getElementById(
                                    "file-upload"
                                  ) as HTMLInputElement;
                                  if (input) input.value = "";
                                }}
                                className="flex-shrink-0 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-200 group/btn"
                                title="Eliminar archivo"
                              >
                                <X className="w-4 h-4 text-red-400 group-hover/btn:text-red-300" />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400">
                        Formatos: JPG, PNG, WEBP, PDF (Max. 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Registrar Gasto
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0E3E3E]/95 backdrop-blur-lg rounded-t-[50px] border-white/10 z-50">
        <div className="flex items-center justify-around h-20 px-6 ">
          {/* Home Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200 ">
            <Home size={28} strokeWidth={2} />
          </button>

          {/* Search Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200">
            <Search size={28} strokeWidth={2} />
          </button>

          {/* Repeat Button - Centro (Siempre resaltado) */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ${
              showQuickActions ? "rotate-45" : ""
            }`}
          >
            <Repeat
              size={28}
              className="text-[#0a2b2a] transition-transform duration-300"
              strokeWidth={2}
            />
          </button>

          {/* Layers Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200">
            <Layers size={28} strokeWidth={2} />
          </button>

          {/* User Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200">
            <User size={28} strokeWidth={2} />
          </button>
        </div>
      </nav>
    </>
  );
}
