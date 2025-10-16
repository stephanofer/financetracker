import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFormOptions } from "@/dashboard/hooks/useFormOptions";
import { useTransaction } from "@/dashboard/hooks/useTransactions";
import {
  TransactionSchema,
  TransactionSchemaFormData,
  defaultTransactionValues,
} from "@/dashboard/schems/Transaction";
import { FileUpload } from "@/dashboard/components/FileUpload";

interface TransactionFormProps {
  handleClose: () => void;
  type: "expense" | "income";
}

export function TransactionForm({ handleClose, type }: TransactionFormProps) {
  const form = useForm<TransactionSchemaFormData>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: defaultTransactionValues,
  });

  const { categories, subcategories, accounts } = useFormOptions();

  const { mutate, isPending } = useTransaction();

  const filteredCategories = categories.filter((cat) => cat.type === type);
  
  console.log(accounts);
  const selectedCategoryId = form.watch("categoryId");

  const filteredSubcategories = selectedCategoryId
    ? subcategories.filter(
        (sub) => sub.category_id === parseInt(selectedCategoryId)
      )
    : [];

  function handleSubmit(data: TransactionSchemaFormData) {
    if (data.file && data.file[0]) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (data.file[0].size > maxSize) {
        toast.error("Archivo demasiado grande", {
          description: "El archivo no debe superar los 5MB.",
          duration: 4000,
        });
        return;
      }
    }

    const formData = new FormData();

    formData.append("amount", data.amount);
    formData.append("type", type);
    formData.append("description", data.description || "");
    formData.append("date", new Date().toISOString());
    formData.append("accountId", data.accountId);
    formData.append("categoryId", data.categoryId);
    console.log(data.categoryId);

    if (data.subcategoryId) {
      formData.append("subcategoryId", data.subcategoryId);
    }


    if (data.file) {
      formData.append("file", data.file[0]);
    }

    const loadingToast = toast.loading("Registrando transacción...", {
      description: "Por favor espera un momento.",
    });

    mutate(formData, {
      onSuccess: () => {
        toast.success("¡Transacción registrada!", {
          description: `${
            type === "expense" ? "Gasto" : "Ingreso"
          } registrado con éxito.`,
          duration: 4000,
        });
        toast.dismiss(loadingToast);
        handleClose();
      },
      onError: () => {
        toast.dismiss(loadingToast);
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => {
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Resetear subcategoría cuando cambie la categoría
                    form.setValue("subcategoryId", "");
                  }}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Seleccionar Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
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
                  disabled={
                    !selectedCategoryId || filteredSubcategories.length === 0
                  }
                >
                  <SelectTrigger id="subcategory" className="w-full">
                    <SelectValue
                      placeholder={
                        !selectedCategoryId
                          ? "Primero selecciona una categoría"
                          : filteredSubcategories.length === 0
                          ? "No hay subcategorías disponibles"
                          : "Seleccionar Subcategoría"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
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
                    {accounts.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
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
                <Input
                  placeholder="Descripción"
                  {...field}
                  autoComplete="off"
                />
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
                <FileUpload
                  value={value ?? null}
                  onChange={onChange}
                  {...fieldProps}
                />
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
          ) : type === "expense" ? (
            "Registrar Gasto"
          ) : (
            "Registrar Ingreso"
          )}
        </Button>
      </form>
    </Form>
  );
}
