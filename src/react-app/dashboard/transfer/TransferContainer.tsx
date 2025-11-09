import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/dashboard/accounts/hooks/useAccounts";
import { useTransfer } from "./hooks/useTransfer";
import {
  TransferSchema,
  TransferFormData,
  defaultTransferValues,
} from "./schemas/TransferSchema";
import { formatCurrency } from "@/dashboard/utils/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router";

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

export function TransferContainer() {
  const { data: accountsResponse, isPending: isAccountsLoading } =
    useAccounts();
  const { mutate: transfer, isPending: isTransferLoading } = useTransfer();

  const navigate = useNavigate();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(TransferSchema),
    defaultValues: defaultTransferValues,
  });

  const accounts = accountsResponse?.data || [];
  const sourceAccountId = form.watch("sourceAccountId");
  const destinationAccountId = form.watch("destinationAccountId");
  const amount = form.watch("amount");

  // Obtener detalles de las cuentas seleccionadas
  const fromAccount = accounts.find(
    (acc) => acc.id === parseInt(sourceAccountId)
  );
  const toAccount = accounts.find(
    (acc) => acc.id === parseInt(destinationAccountId)
  );

  // Validar saldo suficiente
  const hasInsufficientBalance =
    fromAccount && amount && parseFloat(amount) > fromAccount.balance;

  const onSubmit = (data: TransferFormData) => {
    console.log(data);

    if (hasInsufficientBalance) {
      toast.error("Saldo insuficiente", {
        description: "No tienes suficiente saldo en la cuenta de origen",
        duration: 4000,
      });
      return;
    }

    const loadingToast = toast.loading("Procesando transferencia...", {
      description: "Por favor espera un momento.",
    });

    transfer(data, {
      onSuccess: () => {
        toast.success("¡Transferencia exitosa!", {
          description: `Se transfirieron ${formatCurrency(
            parseFloat(data.amount)
          )} exitosamente.`,
          duration: 4000,
          icon: <CheckCircle2 className="h-5 w-5 text-[#00D09E]" />,
        });
        toast.dismiss(loadingToast);
        form.reset();
        navigate("/dashboard/accounts");
      },
      onError: () => {
        toast.dismiss(loadingToast);
      },
    });
  };

  if (!accounts || accounts.length < 2) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224]">
        <div className="flex flex-col items-center justify-center flex-1 px-6 pb-24">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-10 h-10 text-white/40" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 text-center">
            Necesitas al menos 2 cuentas
          </h3>
          <p className="text-sm text-white/60 text-center max-w-sm">
            Para realizar transferencias, debes tener al menos dos cuentas
            creadas en tu perfil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">
            Transferir Dinero
          </h1>
          <p className="text-white/60 text-sm">
            Mueve dinero entre tus cuentas
          </p>
        </div>
      </header>

      {/* Contenido Principal */}

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col">
            {/* Cuenta Origen */}
            <div className="space-y-2">
              {isAccountsLoading ? (
                <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
              ) : (
                <FormField
                  control={form.control}
                  name="sourceAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Cuenta de Origen</FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={(value) => {
                            console.log(value);
                            field.onChange(value);
                            if (value === destinationAccountId) {
                              form.setValue("destinationAccountId", "");
                            }
                          }}
                        >
                          <SelectTrigger
                            id="sourceAccountId"
                            className="w-full"
                          >
                            <SelectValue placeholder="Seleccionar Cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem
                                key={account.id}
                                value={account.id.toString()}
                                disabled={
                                  destinationAccountId === account.id.toString()
                                }
                              >
                                {account.name} -{" "}
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
              )}

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: fromAccount?.color || "#00D09E",
                    }}
                  />
                  <span className="text-white/70 text-sm">
                    Saldo disponible:
                  </span>
                </div>
                <span className="text-white font-bold text-sm">
                  {fromAccount ? formatCurrency(fromAccount.balance) : "---"}
                </span>
              </div>
              {form.formState.errors.sourceAccountId && (
                <p className="text-red-400 text-xs mt-1">
                  {form.formState.errors.sourceAccountId.message}
                </p>
              )}
            </div>

            {/* Indicador Visual */}
            <div className="flex items-center justify-center py-4">
              {fromAccount && toAccount ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg backdrop-blur-sm border-2"
                      style={{
                        backgroundColor: `${fromAccount.color || "#00D09E"}20`,
                        borderColor: fromAccount.color || "#00D09E",
                        color: fromAccount.color || "#00D09E",
                      }}
                    >
                      {fromAccount.icon || "💰"}
                    </div>
                    <span className="text-xs text-white/50 font-medium">
                      Desde
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <ArrowRightLeft className="w-6 h-6 text-[#00D09E] animate-pulse" />
                    {amount && parseFloat(amount) > 0 && (
                      <span className="text-[#00D09E] font-bold text-lg">
                        {formatCurrency(parseFloat(amount))}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg backdrop-blur-sm border-2"
                      style={{
                        backgroundColor: `${toAccount.color || "#3299FF"}20`,
                        borderColor: toAccount.color || "#3299FF",
                        color: toAccount.color || "#3299FF",
                      }}
                    >
                      {toAccount.icon || "💳"}
                    </div>
                    <span className="text-xs text-white/50 font-medium">
                      Hacia
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white/30 text-lg">?</span>
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-white/20" />
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white/30 text-lg">?</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs text-center">
                    Selecciona las cuentas para ver la transferencia
                  </p>
                </div>
              )}
            </div>

            {/* Cuenta Destino */}
            <div className="space-y-2">
              {isAccountsLoading ? (
                <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
              ) : (
                <FormField
                  control={form.control}
                  name="destinationAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Cuenta de Destino </FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          value={field.value}
                          disabled={!sourceAccountId}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger
                            id="destinationAccountId"
                            className="w-full"
                          >
                            <SelectValue
                              placeholder={
                                !sourceAccountId
                                  ? "Primero selecciona cuenta de origen"
                                  : "Selecciona la cuenta de destino"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts
                              .filter(
                                (account) =>
                                  account.id.toString() !== sourceAccountId
                              )
                              .map((account) => (
                                <SelectItem
                                  key={account.id}
                                  value={account.id.toString()}
                                >
                                  {account.name} -{" "}
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
              )}

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: toAccount?.color || "#3299FF",
                    }}
                  />
                  <span className="text-white/70 text-sm">Saldo actual:</span>
                </div>
                <span className="text-white font-bold text-sm">
                  {toAccount ? formatCurrency(toAccount.balance) : "---"}
                </span>
              </div>
              {form.formState.errors.destinationAccountId && (
                <p className="text-red-400 text-xs mt-1">
                  {form.formState.errors.destinationAccountId.message}
                </p>
              )}
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Monto a Transferir</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="0.00"
                          type="number"
                          className="w-full"
                          disabled={!sourceAccountId || !destinationAccountId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {hasInsufficientBalance && (
                <div className="flex items-center gap-2 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm font-medium">
                    Saldo insuficiente en la cuenta de origen
                  </p>
                </div>
              )}
              {form.formState.errors.amount && !hasInsufficientBalance && (
                <p className="text-red-400 text-xs mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            {/* Descripción (Opcional) */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Ahorro mensual..."
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="default"
              disabled={
                isTransferLoading ||
                hasInsufficientBalance ||
                !sourceAccountId ||
                !destinationAccountId ||
                !amount
              }
            >
              {isTransferLoading ? (
                <>
                  <Spinner className="size-5" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Realizar Transferencia</span>
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
