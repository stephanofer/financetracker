import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { formatCurrency } from "@/dashboard/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, DollarSign, StickyNote, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFormOptions } from "../../hooks/useFormOptions";
import { useContributeToGoal } from "../hooks/useSavingGoals";
import {
  ContributeSchema,
  defaultContributeValues,
  type ContributeFormData,
} from "../schemas/SavingGoalSchema";

interface ContributeToGoalFormProps {
  goalId: number;
  goalName: string;
  remainingAmount: number;
  handleClose: () => void;
}

export default function ContributeToGoalForm({
  goalId,
  goalName,
  remainingAmount,
  handleClose,
}: ContributeToGoalFormProps) {
  const { accounts } = useFormOptions();
  const { mutate: contribute, isPending } = useContributeToGoal();

  const form = useForm<ContributeFormData>({
    resolver: zodResolver(ContributeSchema),
    defaultValues: defaultContributeValues,
  });

  const watchedAmount = form.watch("amount");
  const watchedAccountId = form.watch("account_id");

  const selectedAccount = accounts.find(
    (acc) => acc.id === parseInt(watchedAccountId || "0")
  );

  const contributionAmount = parseFloat(watchedAmount || "0");
  const exceedsRemaining = contributionAmount > remainingAmount;

  const handleSubmit = (data: ContributeFormData) => {
    if (exceedsRemaining) {
      toast.error("Monto excesivo", {
        description: `El monto no puede exceder lo que falta: ${formatCurrency(remainingAmount)}`,
        duration: 4000,
      });
      return;
    }

    contribute(
      {
        id: goalId,
        data: {
          amount: parseFloat(data.amount),
          account_id: parseInt(data.account_id),
          transaction_date: data.transaction_date || undefined,
          description: data.description || undefined,
          notes: data.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("¡Contribución exitosa!", {
            description: `Has aportado ${formatCurrency(parseFloat(data.amount))} a tu meta`,
            duration: 3000,
          });
          handleClose();
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="max-w-2xl mx-auto">
        {/* Meta info */}
        <Card className="bg-gradient-to-br from-[#00D09E]/20 to-[#00F5B8]/10 border-[#00D09E]/30 p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#00D09E]/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#00F5B8]" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{goalName}</h3>
              <p className="text-white/60 text-sm">Meta de ahorro</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/70 text-xs mb-1">Te falta por ahorrar</p>
            <p className="text-white text-2xl font-bold">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </Card>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Monto */}
            <Card className="bg-white/10 border-white/20 p-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monto a contribuir
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-2xl font-bold"
                      />
                    </FormControl>
                    {exceedsRemaining && (
                      <p className="text-red-400 text-sm mt-2">
                        ⚠️ El monto excede lo que falta para completar la meta
                      </p>
                    )}
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                  { label: "25%", value: remainingAmount * 0.25 },
                  { label: "50%", value: remainingAmount * 0.5 },
                  { label: "75%", value: remainingAmount * 0.75 },
                  { label: "100%", value: remainingAmount },
                ].map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => form.setValue("amount", option.value.toFixed(2))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Cuenta */}
            <Card className="bg-white/10 border-white/20 p-6">
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Cuenta de origen
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Selecciona una cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={String(account.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: account.color || "#10B981",
                                  }}
                                />
                                <span className="font-medium">
                                  {account.name}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  {formatCurrency(account.balance)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {selectedAccount && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-1">
                          Saldo actual
                        </p>
                        <p className="text-white font-semibold text-lg">
                          {formatCurrency(selectedAccount.balance)}
                        </p>
                        {selectedAccount.balance < contributionAmount && (
                          <p className="text-yellow-400 text-xs mt-2">
                            ⚠️ El saldo de la cuenta es menor al monto a contribuir
                          </p>
                        )}
                      </div>
                    )}
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </Card>

            {/* Fecha */}
            <Card className="bg-white/10 border-white/20 p-6">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de contribución
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-white/5 border-white/20 text-white"
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </Card>

            {/* Descripción y Notas (opcionales) */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Descripción (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ej. Bono de trabajo, Ahorro mensual..."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">
                        Notas adicionales (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Agrega más detalles si lo deseas..."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || exceedsRemaining}
              className="w-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] hover:shadow-xl text-[#052224] font-bold disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Procesando contribución...
                </>
              ) : (
                "Contribuir a la Meta"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
