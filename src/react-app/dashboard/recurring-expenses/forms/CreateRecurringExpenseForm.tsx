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
import { Label } from "@/components/ui/label";
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
import {
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Info,
  Tag,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFormOptions } from "../../hooks/useFormOptions";
import { useCreateRecurringExpense } from "../hooks/useRecurringExpenses";
import {
  defaultRecurringExpenseValues,
  RecurringExpenseSchema,
  type RecurringExpenseFormData,
} from "../schemas/RecurringExpenseSchema";

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Semanal", description: "Cada semana" },
  { value: "biweekly", label: "Quincenal", description: "Cada 2 semanas" },
  { value: "monthly", label: "Mensual", description: "Cada mes" },
  { value: "annual", label: "Anual", description: "Cada año" },
];

const WEEKDAY_OPTIONS = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "7", label: "Domingo" },
];

interface CreateRecurringExpenseFormProps {
  handleClose: () => void;
}

export default function CreateRecurringExpenseForm({
  handleClose,
}: CreateRecurringExpenseFormProps) {
  const { accounts, categories, subcategories } = useFormOptions();
  const { mutate: createExpense, isPending } = useCreateRecurringExpense();
  const [selectedFrequency, setSelectedFrequency] = useState<string>("monthly");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [nextChargePreview, setNextChargePreview] = useState<string>("");

  const form = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(RecurringExpenseSchema),
    defaultValues: defaultRecurringExpenseValues,
  });

  const watchedFrequency = form.watch("frequency");
  const watchedChargeDay = form.watch("charge_day");

  useEffect(() => {
    setSelectedFrequency(watchedFrequency);
  }, [watchedFrequency]);

  // Calcular fecha de próximo cargo
  useEffect(() => {
    if (watchedChargeDay && watchedFrequency) {
      const today = new Date();
      const chargeDayNum = parseInt(watchedChargeDay);
      let nextDate = new Date();

      try {
        switch (watchedFrequency) {
          case "weekly":
          case "biweekly": {
            const currentDay = today.getDay() || 7;
            const targetDay = chargeDayNum;
            const daysUntil =
              targetDay >= currentDay
                ? targetDay - currentDay
                : 7 - currentDay + targetDay;
            nextDate.setDate(today.getDate() + daysUntil);
            if (watchedFrequency === "biweekly" && daysUntil === 0) {
              nextDate.setDate(nextDate.getDate() + 14);
            }
            break;
          }
          case "monthly": {
            nextDate.setDate(chargeDayNum);
            if (nextDate <= today) {
              nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;
          }
          case "annual": {
            const currentDayOfYear = Math.floor(
              (today.getTime() -
                new Date(today.getFullYear(), 0, 0).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (chargeDayNum <= currentDayOfYear) {
              nextDate = new Date(today.getFullYear() + 1, 0, chargeDayNum);
            } else {
              nextDate = new Date(today.getFullYear(), 0, chargeDayNum);
            }
            break;
          }
        }

        const formatted = new Intl.DateTimeFormat("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(nextDate);
        setNextChargePreview(
          formatted.charAt(0).toUpperCase() + formatted.slice(1)
        );
      } catch {
        setNextChargePreview("");
      }
    } else {
      setNextChargePreview("");
    }
  }, [watchedChargeDay, watchedFrequency]);

  const handleSubmit = (data: RecurringExpenseFormData) => {
    console.log(data);
    createExpense(
      {
        name: data.name,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        charge_day: parseInt(data.charge_day),
        account_id: parseInt(data.account_id),
        category_id: data.category_id ? parseInt(data.category_id) : undefined,
        subcategory_id: data.subcategory_id
          ? parseInt(data.subcategory_id)
          : undefined,
        notify_3_days: data.notify_3_days,
        notify_1_day: data.notify_1_day,
        notify_same_day: data.notify_same_day,
      },
      {
        onSuccess: () => {
          toast.success("Gasto recurrente creado", {
            description: "El gasto se ha registrado exitosamente",
            duration: 3000,
          });
          handleClose();
        },
      }
    );
  };

  const getChargeDayOptions = () => {
    switch (selectedFrequency) {
      case "weekly":
      case "biweekly":
        return WEEKDAY_OPTIONS;
      case "monthly":
        return Array.from({ length: 31 }, (_, i) => ({
          value: String(i + 1),
          label: String(i + 1),
        }));
      case "annual":
        return Array.from({ length: 365 }, (_, i) => ({
          value: String(i + 1),
          label: `Día ${i + 1}`,
        }));
      default:
        return [];
    }
  };

  const getChargeDayLabel = () => {
    switch (selectedFrequency) {
      case "weekly":
      case "biweekly":
        return "Día de la semana";
      case "monthly":
        return "Día del mes";
      case "annual":
        return "Día del año";
      default:
        return "Día de cargo";
    }
  };

  const selectedAccount = accounts.find(
    (acc) => acc.id === parseInt(form.watch("account_id"))
  );

  const filteredSubcategories = selectedCategory
    ? subcategories.filter((sub) => sub.category_id === selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br">
      {/* Form */}
      <div className="max-w-2xl mx-auto ">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Nombre */}
            <Card className="bg-white/10 border-white/20 p-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Nombre del gasto
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ej. Netflix, Renta, Gym..."
                        autoComplete="off"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </Card>

            {/* Monto y Frecuencia */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Monto</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 text-xl font-semibold"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Frecuencia
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("charge_day", "");
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {option.label}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="charge_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        {getChargeDayLabel()}
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white w-full">
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {getChargeDayOptions().map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Preview de próximo cargo */}
                {nextChargePreview && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 text-sm font-medium">
                        Próximo cargo programado
                      </p>
                      <p className="text-white text-sm mt-1">
                        {nextChargePreview}
                      </p>
                    </div>
                  </div>
                )}
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
                      Cuenta de cargo
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        // disabled={isLoadingOptions}
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
                      <p className="text-white/60 text-sm mt-2">
                        Saldo actual:{" "}
                        <span className="font-semibold text-white">
                          {formatCurrency(selectedAccount.balance)}
                        </span>
                      </p>
                    )}
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </Card>

            {/* Categoría y Subcategoría (Opcional) */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white text-base">Categorización</Label>
                  <span className="text-white/50 text-xs">Opcional</span>
                </div>

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Categoría</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategory(parseInt(value));
                            form.setValue("subcategory_id", "");
                          }}
                          value={field.value}
                          // disabled={isLoadingOptions}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white w-full">
                            <SelectValue placeholder="Sin categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={String(category.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {category.icon}
                                  </span>
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {selectedCategory && filteredSubcategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name="subcategory_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">
                          Subcategoría
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="bg-white/5 border-white/20 text-white w-full">
                              <SelectValue placeholder="Sin subcategoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredSubcategories.map((subcategory) => (
                                <SelectItem
                                  key={subcategory.id}
                                  value={String(subcategory.id)}
                                >
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </Card>

            {/* Notificaciones */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-white" />
                  <Label className="text-white text-base">Notificaciones</Label>
                </div>

                <FormField
                  control={form.control}
                  name="notify_3_days"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {field.value ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <BellOff className="h-5 w-5 text-white/40" />
                          )}
                          <div>
                            <FormLabel className="text-white">
                              3 días antes
                            </FormLabel>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            field.value ? "bg-green-500" : "bg-white/20"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              field.value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_1_day"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {field.value ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <BellOff className="h-5 w-5 text-white/40" />
                          )}
                          <div>
                            <FormLabel className="text-white">
                              1 día antes
                            </FormLabel>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            field.value ? "bg-green-500" : "bg-white/20"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              field.value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify_same_day"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {field.value ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <BellOff className="h-5 w-5 text-white/40" />
                          )}
                          <div>
                            <FormLabel className="text-white">
                              El mismo día
                            </FormLabel>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            field.value ? "bg-green-500" : "bg-white/20"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full transition-transform ${
                              field.value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Submit Button */}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Creando...
                </>
              ) : (
                "Crear Gasto Recurrente"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
