import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoanSchema, LoanFormData, defaultLoanValues } from "../schemas/LoanSchema";
import { useCreateLoan } from "../hooks/useCreateLoan";
import { useAccounts } from "@/dashboard/accounts/hooks/useAccounts";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/dashboard/utils/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateLoanFormProps {
  onSuccess?: () => void;
}

export function CreateLoanForm({ onSuccess }: CreateLoanFormProps) {
  const { data: accountsResponse, isPending: isAccountsLoading } = useAccounts();
  const { mutate: createLoan, isPending: isCreating } = useCreateLoan();

  const form = useForm<LoanFormData>({
    resolver: zodResolver(LoanSchema),
    defaultValues: defaultLoanValues,
  });

  const accounts = accountsResponse?.data || [];

  const onSubmit = (data: LoanFormData) => {
    const loadingToast = toast.loading("Creando préstamo...", {
      description: "Por favor espera un momento.",
    });

    createLoan(data, {
      onSuccess: () => {
        toast.success("¡Préstamo creado!", {
          description: `Se registró el préstamo a ${data.debtor_name} por ${formatCurrency(
            parseFloat(data.original_amount)
          )}`,
          duration: 4000,
          icon: <CheckCircle2 className="h-5 w-5 text-[#00D09E]" />,
        });
        toast.dismiss(loadingToast);
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        toast.dismiss(loadingToast);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre del Deudor */}
        <FormField
          control={form.control}
          name="debtor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Deudor *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Juan Pérez"
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contacto */}
        <FormField
          control={form.control}
          name="debtor_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contacto (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Teléfono, email, etc."
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monto */}
        <FormField
          control={form.control}
          name="original_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del Préstamo *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tasa de Interés */}
        <FormField
          control={form.control}
          name="interest_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tasa de Interés (%) - Opcional</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cuenta Origen */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta desde donde se prestó (opcional)</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isAccountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id.toString()}
                      >
                        {account.icon} {account.name} -{" "}
                        {formatCurrency(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha del Préstamo */}
        <FormField
          control={form.control}
          name="loan_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Préstamo *</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha de Vencimiento */}
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Vencimiento (opcional)</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Detalles adicionales..."
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isCreating}>
          {isCreating ? (
            <>
              <Spinner className="size-5" />
              <span>Creando...</span>
            </>
          ) : (
            "Crear Préstamo"
          )}
        </Button>
      </form>
    </Form>
  );
}
