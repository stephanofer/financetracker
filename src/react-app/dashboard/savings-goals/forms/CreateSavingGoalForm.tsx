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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  Target,
  TrendingUp,
  Info,
  Percent,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateSavingGoal } from "../hooks/useSavingGoals";
import {
  defaultSavingGoalValues,
  SavingGoalSchema,
  type SavingGoalFormData,
} from "../schemas/SavingGoalSchema";

const PRIORITY_OPTIONS = [
  { 
    value: "high", 
    label: "Alta", 
    description: "Prioridad máxima",
    color: "text-red-400"
  },
  { 
    value: "medium", 
    label: "Media", 
    description: "Prioridad normal",
    color: "text-yellow-400"
  },
  { 
    value: "low", 
    label: "Baja", 
    description: "Sin urgencia",
    color: "text-green-400"
  },
];

interface CreateSavingGoalFormProps {
  handleClose: () => void;
}

export default function CreateSavingGoalForm({
  handleClose,
}: CreateSavingGoalFormProps) {
  const { mutate: createGoal, isPending } = useCreateSavingGoal();
  const [previewProgress, setPreviewProgress] = useState<number>(0);

  const form = useForm<SavingGoalFormData>({
    resolver: zodResolver(SavingGoalSchema),
    defaultValues: defaultSavingGoalValues,
  });

  const watchedTargetAmount = form.watch("target_amount");
  const watchedCurrentAmount = form.watch("current_amount");
  const watchedAutoContribute = form.watch("auto_contribute");

  // Calcular el progreso en tiempo real
  useEffect(() => {
    const target = parseFloat(watchedTargetAmount || "0") || 0;
    const current = parseFloat(watchedCurrentAmount || "0") || 0;
    
    if (target > 0) {
      const progress = Math.min((current / target) * 100, 100);
      setPreviewProgress(progress);
    } else {
      setPreviewProgress(0);
    }
  }, [watchedTargetAmount, watchedCurrentAmount]);

  const handleSubmit = (data: SavingGoalFormData) => {
    createGoal(
      {
        name: data.name,
        description: data.description || undefined,
        target_amount: parseFloat(data.target_amount),
        current_amount: data.current_amount ? parseFloat(data.current_amount) : 0,
        target_date: data.target_date || undefined,
        priority: data.priority || "medium",
        image_url: data.image_url || undefined,
        auto_contribute: data.auto_contribute || false,
        auto_contribute_percentage: data.auto_contribute_percentage 
          ? parseFloat(data.auto_contribute_percentage) 
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Meta creada", {
            description: "Tu meta de ahorro se ha creado exitosamente",
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Nombre y Descripción */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Nombre de tu meta
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ej. Casa nueva, Vacaciones, Auto..."
                          autoComplete="off"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">
                        Descripción (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Añade detalles sobre tu meta..."
                          autoComplete="off"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Montos */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Monto objetivo
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
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">
                        Monto inicial (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Preview del progreso */}
                {parseFloat(watchedTargetAmount) > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/60 text-sm">Progreso inicial</span>
                      <span className="text-white font-semibold">
                        {previewProgress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] transition-all duration-300"
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Fecha objetivo y Prioridad */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="target_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fecha objetivo (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-white/5 border-white/20 text-white"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Prioridad</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${option.color}`}>
                                    {option.label}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    • {option.description}
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
              </div>
            </Card>

            {/* Imagen (opcional) */}
            <Card className="bg-white/10 border-white/20 p-6">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      URL de imagen (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      />
                    </FormControl>
                    <p className="text-white/50 text-xs mt-2">
                      Añade una imagen que represente tu meta
                    </p>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </Card>

            {/* Auto-contribución */}
            <Card className="bg-white/10 border-white/20 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="h-5 w-5 text-white" />
                  <Label className="text-white text-base">
                    Auto-contribución
                  </Label>
                </div>

                <FormField
                  control={form.control}
                  name="auto_contribute"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          {field.value ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-white/40" />
                          )}
                          <div>
                            <FormLabel className="text-white">
                              Activar contribución automática
                            </FormLabel>
                            <p className="text-white/50 text-xs mt-1">
                              Ahorra un % de cada ingreso
                            </p>
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

                {watchedAutoContribute && (
                  <FormField
                    control={form.control}
                    name="auto_contribute_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Porcentaje de contribución
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="10"
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-blue-400 text-xs">
                            Cada vez que registres un ingreso, se destinará este
                            porcentaje automáticamente a esta meta de ahorro.
                          </p>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </Card>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isPending} 
              className="w-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] hover:shadow-xl text-[#052224] font-bold"
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Creando meta...
                </>
              ) : (
                "Crear Meta de Ahorro"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
