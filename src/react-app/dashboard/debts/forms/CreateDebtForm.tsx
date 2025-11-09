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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CreateDebtFormData,
  CreateDebtSchema,
  defaultCreateDebtValues,
} from "./schems/CreateDebts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCreateDebt } from "../hooks/useDebts";

interface CreateDebtFormProps {
  handleClose: () => void;
}

export function CreateDebtForm({ handleClose }: CreateDebtFormProps) {
  const form = useForm<CreateDebtFormData>({
    resolver: zodResolver(CreateDebtSchema),
    defaultValues: defaultCreateDebtValues,
  });

  const { mutate: createDebt, isPending } = useCreateDebt();

  function handleSubmit(data: CreateDebtFormData) {

    const formData = {
      ...data,
      remaining_amount: data.original_amount,
      start_date: new Date().toISOString().split("T")[0],
      status: "active",
    };
    createDebt(formData, {
      onSuccess: () => {
        handleClose();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej. Juan Pérez / Banco XYZ "
                    type="text"
                    className="w-full"
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Tipo de deuda</FormLabel>
                <FormControl>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="debt-type" className="w-full">
                      <SelectValue placeholder="Seleccionar Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">Persona</SelectItem>
                      <SelectItem value="institution">Institución</SelectItem>
                      <SelectItem value="credit_card">
                        Tarjeta de crédito
                      </SelectItem>
                      <SelectItem value="loan">Préstamo</SelectItem>
                      <SelectItem value="mortgage">Hipoteca</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="original_amount"
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
          name="interest_rate"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Tasa de Interés</FormLabel>
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
          name="due_date"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Fecha de Vencimiento</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="YYYY-MM-DD" type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Notas sobre la deuda"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="has_installments"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>¿Tiene Cuotas?</FormLabel>
                <FormControl>
                  <Select
                    name={field.name}
                    value={field.value ? "true" : "false"}
                    onValueChange={(val) => field.onChange(val === "true")}
                  >
                    <SelectTrigger id="has-installments" className="w-full">
                      <SelectValue placeholder="Seleccionar opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && (
            <span className="flex items-center gap-2">
              <Spinner className="size-4" />
              Registrando Gasto...
            </span>
          )}
          Registrar Deuda
        </Button>
      </form>
    </Form>
  );
}
