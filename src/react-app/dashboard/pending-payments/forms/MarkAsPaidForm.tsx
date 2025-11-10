import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Spinner } from "@/components/ui/spinner";
import { useMarkAsPaid } from "../hooks/useMarkAsPaid";
import { useAccounts } from "@/dashboard/accounts/hooks/useAccounts";
import {
  MarkAsPaidSchema,
  MarkAsPaidFormData,
  defaultMarkAsPaidValues,
} from "../schemas/MarkAsPaidSchema";
import { formatCurrency } from "@/dashboard/utils/utils";

interface MarkAsPaidFormProps {
  paymentId: number;
  paymentAmount: number;
  paymentName: string;
  handleClose: () => void;
}

export function MarkAsPaidForm({
  paymentId,
  paymentAmount,
  paymentName,
  handleClose,
}: MarkAsPaidFormProps) {
  const { mutate: markAsPaid, isPending } = useMarkAsPaid();
  const { data: accountsResponse } = useAccounts();

  const form = useForm<MarkAsPaidFormData>({
    resolver: zodResolver(MarkAsPaidSchema),
    defaultValues: defaultMarkAsPaidValues,
  });

  const accounts = accountsResponse?.data || [];
  const selectedAccountId = form.watch("account_id");
  const selectedAccount = accounts.find(
    (acc) => acc.id === parseInt(selectedAccountId)
  );

  const hasInsufficientBalance =
    selectedAccount && paymentAmount > selectedAccount.balance;

  const onSubmit = (data: MarkAsPaidFormData) => {
    markAsPaid(
      {
        id: paymentId,
        ...data,
      },
      {
        onSuccess: () => {
          form.reset();
          handleClose();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <p className="text-blue-400 text-sm font-medium mb-1">
            Registrando pago de:
          </p>
          <p className="text-white font-bold text-lg">{paymentName}</p>
          <p className="text-[#00D09E] font-bold text-2xl mt-2">
            {formatCurrency(paymentAmount)}
          </p>
        </div>

        {/* Cuenta */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta de Pago</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <span>{account.icon}</span>
                          <span>{account.name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {selectedAccount && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Saldo disponible:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(selectedAccount.balance)}
                    </span>
                  </div>
                  {hasInsufficientBalance && (
                    <p className="text-red-400 text-xs mt-2">
                      ⚠️ Saldo insuficiente en esta cuenta
                    </p>
                  )}
                </div>
              )}
            </FormItem>
          )}
        />

        {/* Fecha de Transacción */}
        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Pago</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
              <FormLabel>Notas Adicionales (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Comprobante #12345..."
                  {...field}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending || hasInsufficientBalance || !selectedAccountId}
          >
            {isPending ? (
              <>
                <Spinner className="size-4" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Marcar como Pagado
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
