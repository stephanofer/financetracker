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
import { Spinner } from "@/components/ui/spinner";
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
  FileText,
  Image as ImageIcon,
  Check,
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
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(IncomeSchema),
    defaultValues: defaultIncomeValues,
  });

  const queryClient = useQueryClient();

  const { mutate, isPending} = useMutation<CreateTransactionResponse, Error, FormData>({
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
    setFilePreview(null);
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
                        <Input placeholder="Descripción" {...field} autoComplete="off" />
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
                              const files = e.target.files;
                              onChange(files);
                              
                              // Generar vista previa
                              if (files && files[0]) {
                                const file = files[0];
                                if (file.type.startsWith('image/')) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setFilePreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                } else {
                                  setFilePreview(null);
                                }
                              } else {
                                setFilePreview(null);
                              }
                            }}
                            className="hidden"
                            id="file-upload"
                          />
                          
                          {!value || !value[0] ? (
                            <label
                              htmlFor="file-upload"
                              className="flex flex-col items-center justify-center gap-3 w-full min-w-0 px-6 py-8 bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 border-2 border-dashed border-slate-600/40 rounded-2xl hover:border-emerald-500/60 hover:from-emerald-950/30 hover:via-slate-800/30 hover:to-emerald-900/20 cursor-pointer transition-all duration-300 group backdrop-blur-sm"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-400/30 transition-all duration-300"></div>
                                <div className="relative p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl group-hover:from-emerald-500/20 group-hover:to-emerald-600/10 transition-all duration-300 border border-slate-600/30 group-hover:border-emerald-500/40">
                                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-all duration-300 group-hover:scale-110" strokeWidth={2} />
                                </div>
                              </div>
                              
                              <div className="text-center space-y-1">
                                <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                                  Arrastra tu archivo o haz clic
                                </p>
                                <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                  JPG, PNG, WEBP o PDF hasta 5MB
                                </p>
                              </div>
                            </label>
                          ) : (
                            <div className="space-y-3">
                              {/* Vista previa de imagen */}
                              {value[0].type.startsWith('image/') && filePreview && (
                                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-900/50 border-2 border-emerald-500/30 group/preview">
                                  <img
                                    src={filePreview}
                                    alt="Vista previa"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                                  
                                  {/* Badge de éxito */}
                                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full">
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    <span className="text-xs font-semibold text-white">Listo</span>
                                  </div>
                                  
                                  {/* Información del archivo */}
                                  <div className="absolute bottom-3 left-3 right-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                          <ImageIcon className="w-4 h-4 text-white" strokeWidth={2} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium text-white truncate">
                                            {value[0].name}
                                          </p>
                                          <p className="text-xs text-slate-300">
                                            {(value[0].size / 1024).toFixed(1)} KB
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          onChange(null);
                                          setFilePreview(null);
                                          const input = document.getElementById("file-upload") as HTMLInputElement;
                                          if (input) input.value = "";
                                        }}
                                        className="flex-shrink-0 p-2 bg-red-500/90 hover:bg-red-500 backdrop-blur-sm rounded-lg transition-all duration-200 border border-red-400/30 hover:border-red-400/50 group/btn hover:scale-105 active:scale-95"
                                        title="Eliminar archivo"
                                      >
                                        <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Vista previa de PDF */}
                              {value[0].type === 'application/pdf' && (
                                <div className="relative w-full p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border-2 border-emerald-500/30 backdrop-blur-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-xl"></div>
                                        <div className="relative p-3 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl border border-red-500/30">
                                          <FileText className="w-8 h-8 text-red-400" strokeWidth={2} />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-slate-200 truncate">
                                              {value[0].name}
                                            </p>
                                            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                              <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                                              <span className="text-xs font-medium text-emerald-400">PDF</span>
                                            </div>
                                          </div>
                                          <p className="text-xs text-slate-400">
                                            {(value[0].size / 1024).toFixed(1)} KB • Documento PDF
                                          </p>
                                        </div>
                                        
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            onChange(null);
                                            setFilePreview(null);
                                            const input = document.getElementById("file-upload") as HTMLInputElement;
                                            if (input) input.value = "";
                                          }}
                                          className="flex-shrink-0 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-500/50 group/btn hover:scale-105 active:scale-95"
                                          title="Eliminar archivo"
                                        >
                                          <X className="w-4 h-4 text-red-400 group-hover/btn:text-red-300" strokeWidth={2.5} />
                                        </button>
                                      </div>
                                      
                                      {/* Barra de progreso visual */}
                                      <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-pulse"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Formatos: JPG, PNG, WEBP, PDF (Máx. 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      Registrando Gasto...
                    </span>
                  ) : (
                    "Registrar Gasto"
                  )}
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
