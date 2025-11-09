import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FileUpload } from "@/dashboard/components/FileUpload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PayDebtFormData,
  PayDebtSchema,
  defaultPayDebtValues,
} from "./schems/PayDebts";
import { useFormOptions } from "@/dashboard/hooks/useFormOptions";
import { useDebts, usePayDebt } from "../hooks/useDebts";
import { DebtRowWithAggregates } from "@/dashboard/utils/types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/dashboard/utils/utils";

interface PayDebtFormProps {
  handleClose: () => void;
}

export function PayDebtForm({ handleClose }: PayDebtFormProps) {
  const form = useForm<PayDebtFormData>({
    resolver: zodResolver(PayDebtSchema),
    defaultValues: defaultPayDebtValues,
  });

  const { accounts } = useFormOptions();
  const { data, isPending: isLoadingDebts } = useDebts();
  const { mutate: payDebt, isPending: isPayingDebt } = usePayDebt();

  const debts = data?.data?.debts || [];
  const activeDebts = useMemo(
    () => debts.filter((debt) => debt.status === "active" || debt.status === "overdue"),
    [debts]
  );

  const [selectedDebt, setSelectedDebt] = useState<DebtRowWithAggregates | null>(null);
  const selectedDebtId = form.watch("debtId");
  const paymentAmount = form.watch("amount");
  const selectedAccountId = form.watch("accountId");

  // Actualizar la deuda seleccionada cuando cambia el debtId
  useEffect(() => {
    if (selectedDebtId) {
      const debt = activeDebts.find((d) => d.id.toString() === selectedDebtId);
      setSelectedDebt(debt || null);
    } else {
      setSelectedDebt(null);
    }
  }, [selectedDebtId, activeDebts]);

  // Calcular el monto restante después del pago
  const remainingAfterPayment = useMemo(() => {
    if (!selectedDebt || !paymentAmount) return null;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) return null;
    return Math.max(0, selectedDebt.remaining_amount - amount);
  }, [selectedDebt, paymentAmount]);

  // Validar si el pago excede el monto restante
  const isOverpayment = useMemo(() => {
    if (!selectedDebt || !paymentAmount) return false;
    const amount = parseFloat(paymentAmount);
    return !isNaN(amount) && amount > selectedDebt.remaining_amount;
  }, [selectedDebt, paymentAmount]);

  // Validar si la cuenta tiene saldo suficiente
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find((acc) => acc.id.toString() === selectedAccountId);
  }, [selectedAccountId, accounts]);

  const hasInsufficientFunds = useMemo(() => {
    if (!selectedAccount || !paymentAmount) return false;
    const amount = parseFloat(paymentAmount);
    return !isNaN(amount) && amount > selectedAccount.balance;
  }, [selectedAccount, paymentAmount]);

  function handleSubmit(data: PayDebtFormData) {
    if (isOverpayment) {
      toast.error("El monto excede la deuda restante", {
        description: "Por favor, ajusta el monto del pago.",
      });
      return;
    }

    if (hasInsufficientFunds) {
      toast.error("Saldo insuficiente en la cuenta", {
        description: "La cuenta seleccionada no tiene fondos suficientes para este pago.",
      });
      return;
    }

    console.log("Pay Debt Data:", data);
    
    const formData = new FormData();
    formData.append("amount", data.amount);
    formData.append("debtId", data.debtId);
    formData.append("type", "debt_payment");
    if (data.accountId) formData.append("accountId", data.accountId);
    if (data.description) formData.append("description", data.description);
    if (data.file && data.file.length > 0) {
      formData.append("file", data.file[0]);
    }

    payDebt(formData, {
      onSuccess: () => {
        toast.success("Pago registrado exitosamente", {
          description: `Se registró el pago de ${formatCurrency(Number(data.amount))} para la deuda seleccionada.`,
        });
        handleClose();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Selector de Deuda */}
        <FormField
          control={form.control}
          name="debtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <span className="text-base font-semibold">Deuda a Pagar</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({activeDebts.length} activas)
                </span>
              </FormLabel>
              <FormControl>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingDebts || activeDebts.length === 0}
                
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar Deuda " />
                  </SelectTrigger>
                  <SelectContent >
                    {activeDebts.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No hay deudas activas
                      </div>
                    ) : (
                      activeDebts.map((debt) => (
                        <SelectItem key={debt.id} value={debt.id.toString()} >
                          <div className="flex flex-col gap-0.5 py-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{debt.name}</span>
                              {debt.status === "overdue" && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">
                                  Vencida
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Información de la Deuda Seleccionada */}
        {selectedDebt && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in-50 duration-300">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Información de la Deuda</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDebt.name}
                </p>
              </div>
              {selectedDebt.status === "overdue" && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Vencida</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monto Original</p>
                <p className="font-semibold">
                  {formatCurrency(selectedDebt.original_amount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monto Pendiente</p>
                <p className="font-semibold text-orange-600">
                  {formatCurrency(selectedDebt.remaining_amount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pagado</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(selectedDebt.payments.total)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">N° Pagos</p>
                <p className="font-medium">{selectedDebt.payments.count}</p>
              </div>
            </div>

            {selectedDebt.due_date && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fecha de Vencimiento</span>
                  <span className="font-medium">
                    {new Date(selectedDebt.due_date).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Barra de progreso */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progreso de Pago</span>
                <span className="font-medium">
                  {(
                    (selectedDebt.payments.total / selectedDebt.original_amount) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (selectedDebt.payments.total / selectedDebt.original_amount) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Monto del Pago */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Monto del Pago
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className={`w-full h-11 text-lg ${
                      isOverpayment
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    disabled={!selectedDebt}
                  />
                  {selectedDebt && paymentAmount && (
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue(
                          "amount",
                          selectedDebt.remaining_amount.toString()
                        );
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Pagar Todo
                    </button>
                  )}
                </div>
              </FormControl>
              {isOverpayment && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  El monto excede la deuda restante
                </p>
              )}
              {selectedDebt && paymentAmount && !isOverpayment && remainingAfterPayment !== null && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Restante después del pago:{" "}
                  <span className="font-semibold">
                    {formatCurrency(remainingAfterPayment)}

                  </span>
                </p>
              )}
            </FormItem>
          )}
        />

        {/* Cuenta de Origen */}
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Cuenta de Pago
              </FormLabel>
              <FormControl>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className={`w-full h-11 ${
                    hasInsufficientFunds ? "border-red-500" : ""
                  }`}>
                    <SelectValue placeholder="Seleccionar Cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        <div className="flex items-center justify-between gap-3 py-1">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              {hasInsufficientFunds && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Saldo insuficiente. Disponible: {formatCurrency(selectedAccount?.balance || 0)}
                </p>
              )}
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Pago mensual, abono extra..."
                  {...field}
                  autoComplete="off"
                  className="h-11"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Comprobante */}
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
            </FormItem>
          )}
        />

        {/* Botón de Envío */}
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={isPayingDebt || !selectedDebt || isOverpayment || hasInsufficientFunds}
          >
            {isPayingDebt ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-5" />
                Procesando Pago...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Registrar Pago
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
