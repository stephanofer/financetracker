import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoanPaymentSchema,
  LoanPaymentFormData,
  defaultLoanPaymentValues,
} from "../schemas/LoanPaymentSchema";
import { useRegisterLoanPayment } from "../hooks/useRegisterLoanPayment";
import { useAccounts } from "@/dashboard/accounts/hooks/useAccounts";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/dashboard/utils/utils";
import { FileUpload } from "@/dashboard/components/FileUpload";

import {
  Form,
  FormControl,
  FormDescription,
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

interface RegisterPaymentFormProps {
  loanId: number;
  debtorName: string;
  remainingAmount: number;
  onSuccess?: () => void;
}

export function RegisterPaymentForm({
  loanId,
  debtorName,
  remainingAmount,
  onSuccess,
}: RegisterPaymentFormProps) {
  const { data: accountsResponse, isPending: isAccountsLoading } =
    useAccounts();
  const { mutate: registerPayment, isPending: isRegistering } =
    useRegisterLoanPayment();

  const form = useForm<LoanPaymentFormData>({
    resolver: zodResolver(LoanPaymentSchema),
    defaultValues: defaultLoanPaymentValues,
  });

  const accounts = accountsResponse?.data || [];
  const amount = form.watch("amount");

  const isOverpayment =
    amount && parseFloat(amount) > remainingAmount && remainingAmount > 0;

  const onSubmit = (data: LoanPaymentFormData) => {
    // console.log(data);
    if (isOverpayment) {
      toast.error("Monto excedido", {
        description: "El monto del pago no puede ser mayor al saldo pendiente",
        duration: 4000,
      });
      return;
    }

    const loadingToast = toast.loading("Registrando pago...", {
      description: "Por favor espera un momento.",
    });

    registerPayment(
      {
        loanId,
        amount: parseFloat(data.amount),
        account_id: parseInt(data.account_id),
        transaction_date: data.transaction_date,
        description: data.description,
        notes: data.notes,
        file: data.file,
      },
      {
        onSuccess: () => {
          toast.success("¡Pago registrado!", {
            description: `Se registró el pago de ${formatCurrency(
              parseFloat(data.amount)
            )} de ${debtorName}`,
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
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Info del saldo pendiente */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-white/70 text-sm mb-1">Saldo pendiente</p>
          <p className="text-white text-2xl font-bold">
            {formatCurrency(remainingAmount)}
          </p>
        </div>

        {/* Monto with Pay All Button */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del Pago *</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="p-5"
                  />
                </FormControl>
                <Button
                  type="button"
                  size="sm"
                //   variant=""
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                  onClick={() =>
                    form.setValue("amount", remainingAmount.toString())
                  }
                >
                  Pagar Todo
                </Button>
              </div>
              {isOverpayment && (
                <div className="flex items-center gap-2 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">
                    El monto excede el saldo pendiente
                  </p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cuenta donde se recibe */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta donde recibes el pago *</FormLabel>
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

        {/* Fecha */}
        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Pago *</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Pago parcial..."
                  autoComplete="off"
                />
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

        {/* File Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Comprobante de Pago</FormLabel>
              <FormControl>
                <FileUpload
                  {...fieldProps}
                  value={value ? (() => {
                    const dt = new DataTransfer();
                    dt.items.add(value);
                    return dt.files;
                  })() : null}
                  onChange={(files) => onChange(files?.[0] || null)}
                />
              </FormControl>
              <FormDescription>
                Formatos: JPG, PNG, WEBP, PDF (Máx. 5MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isRegistering || !!isOverpayment}
        >
          {isRegistering ? (
            <>
              <Spinner className="size-5" />
              <span>Registrando...</span>
            </>
          ) : (
            "Registrar Pago"
          )}
        </Button>
      </form>
    </Form>
  );
}
