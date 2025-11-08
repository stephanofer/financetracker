import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  ArrowDownUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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

export function TransferContainer() {
  const { data: accountsResponse, isPending: isAccountsLoading } = useAccounts();
  const { mutate: transfer, isPending: isTransferLoading } = useTransfer();

  const navigate = useNavigate()

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
  const toAccount = accounts.find((acc) => acc.id === parseInt(destinationAccountId));

  // Validar saldo suficiente
  const hasInsufficientBalance =
    fromAccount && amount && parseFloat(amount) > fromAccount.balance;

  const onSubmit = (data: TransferFormData) => {
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Cuenta Origen */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-semibold">
              Cuenta de Origen
            </label>
            {isAccountsLoading ? (
              <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
            ) : (
              <div className="relative">
                <select
                  value={sourceAccountId}
                  onChange={(e) => {
                    form.setValue("sourceAccountId", e.target.value);
                    // Si la cuenta destino es igual, resetearla
                    if (e.target.value === destinationAccountId) {
                      form.setValue("destinationAccountId", "");
                    }
                  }}
                  className="w-full bg-white/10 backdrop-blur-sm text-white rounded-2xl p-4 border border-white/20 focus:border-[#00D09E] focus:outline-none focus:ring-2 focus:ring-[#00D09E]/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-[#052224] text-white">
                    Selecciona la cuenta de origen
                  </option>
                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id.toString()}
                      disabled={destinationAccountId === account.id.toString()}
                      className="bg-[#052224] text-white"
                    >
                      {account.name} - {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>
                <ArrowDownUp className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>
            )}

            {fromAccount && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: fromAccount.color || "#00D09E",
                    }}
                  />
                  <span className="text-white/70 text-sm">
                    Saldo disponible:
                  </span>
                </div>
                <span className="text-white font-bold text-sm">
                  {formatCurrency(fromAccount.balance)}
                </span>
              </div>
            )}
            {form.formState.errors.sourceAccountId && (
              <p className="text-red-400 text-xs mt-1">
                {form.formState.errors.sourceAccountId.message}
              </p>
            )}
          </div>

          {/* Indicador Visual - Solo cuando ambas cuentas están seleccionadas */}
          {fromAccount && toAccount && (
            <div className="flex items-center justify-center py-4">
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
            </div>
          )}

          {/* Cuenta Destino */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-semibold">
              Cuenta de Destino
            </label>
            {isAccountsLoading ? (
              <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
            ) : (
              <div className="relative">
                <select
                  value={destinationAccountId}
                  onChange={(e) => form.setValue("destinationAccountId", e.target.value)}
                  disabled={!sourceAccountId}
                  className="w-full bg-white/10 backdrop-blur-sm text-white rounded-2xl p-4 border border-white/20 focus:border-[#00D09E] focus:outline-none focus:ring-2 focus:ring-[#00D09E]/30 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="bg-[#052224] text-white">
                    {!sourceAccountId
                      ? "Primero selecciona cuenta de origen"
                      : "Selecciona la cuenta de destino"}
                  </option>
                  {accounts
                    .filter(
                      (account) => account.id.toString() !== sourceAccountId
                    )
                    .map((account) => (
                      <option
                        key={account.id}
                        value={account.id.toString()}
                        className="bg-[#052224] text-white"
                      >
                        {account.name} - {formatCurrency(account.balance)}
                      </option>
                    ))}
                </select>
                <ArrowDownUp className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>
            )}

            {toAccount && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: toAccount.color || "#3299FF",
                    }}
                  />
                  <span className="text-white/70 text-sm">Saldo actual:</span>
                </div>
                <span className="text-white font-bold text-sm">
                  {formatCurrency(toAccount.balance)}
                </span>
              </div>
            )}
            {form.formState.errors.destinationAccountId && (
              <p className="text-red-400 text-xs mt-1">
                {form.formState.errors.destinationAccountId.message}
              </p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <label className="text-white/90 text-sm font-semibold">
              Monto a Transferir
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/60 pointer-events-none z-10">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => form.setValue("amount", e.target.value)}
                disabled={!sourceAccountId || !destinationAccountId}
                className="w-full bg-white/10 backdrop-blur-sm text-white text-2xl font-bold rounded-2xl p-5 pl-16 border border-white/20 focus:border-[#00D09E] focus:outline-none focus:ring-2 focus:ring-[#00D09E]/30 transition-all placeholder:text-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

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
            <label className="text-white/90 text-sm font-medium">
              Descripción (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Ahorro mensual, pago de servicios..."
              value={form.watch("description") || ""}
              onChange={(e) => form.setValue("description", e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm text-white rounded-2xl p-4 border border-white/20 focus:border-[#00D09E] focus:outline-none focus:ring-2 focus:ring-[#00D09E]/30 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Botón de Transferir */}
          <button
            type="submit"
            disabled={
              isTransferLoading ||
              hasInsufficientBalance ||
              !sourceAccountId ||
              !destinationAccountId ||
              !amount
            }
            className="w-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] hover:shadow-2xl hover:shadow-[#00D09E]/50 transition-all duration-300 text-[#052224] font-bold py-4 px-6 rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-6"
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
          </button>
        </form>
      </div>
    </div>
  );
}
