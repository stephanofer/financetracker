import { useState } from "react";
import { Link } from "react-router";
import { useRecurringExpenses } from "./hooks/useRecurringExpenses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Plus,
  TrendingUp,
  Pause,
  Play,
  XCircle,
  ChevronRight,
  CalendarClock,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModifyRecurringExpense } from "./forms/Modify";
import CreateRecurringExpenseForm from "./forms/CreateRecurringExpenseForm";
const FREQUENCY_LABELS = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  annual: "Anual",
};

const STATUS_CONFIG = {
  active: {
    label: "Activo",
    color: "bg-green-500",
    icon: Play,
  },
  paused: {
    label: "Pausado",
    color: "bg-yellow-500",
    icon: Pause,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    icon: XCircle,
  },
};

export default function RecurringExpensesContainer() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    "active"
  );
  const [openDialog, setOpenDialog] = useState<"create" | "modify" | null>(
    null
  );
  const { data, isPending } = useRecurringExpenses(statusFilter);

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const summary = data?.data.summary;
  const expenses = data?.data.recurring_expenses || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
      <Dialog
        open={openDialog !== null}
        onOpenChange={() => {
          setOpenDialog(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {openDialog === "create"
                ? "Crear nuevo gasto recurrente"
                : openDialog === "modify"
                ? "Modificar gasto recurrente"
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {openDialog === "create" && (
              <CreateRecurringExpenseForm
                handleClose={() => setOpenDialog(null)}
              />
            )}

            {openDialog === "modify" && (
              <ModifyRecurringExpense handleClose={() => setOpenDialog(null)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">Gastos Recurrentes</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-white text-[#0A4A4A] hover:bg-white/90">
                  <Plus className="h-5 w-5" />
                  Crear
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mr-5">
                <div className="flex flex-col gap-3 py-2">
                  <Button onClick={() => setOpenDialog("create")}>
                    Nuevo gasto recurrente
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setOpenDialog("modify")}
                  >
                    Editar gasto recurrente
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Total</p>
                    <p className="text-white text-2xl font-bold">
                      {summary.total}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Play className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Activos</p>
                    <p className="text-white text-2xl font-bold">
                      {summary.active}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Pause className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Pausados</p>
                    <p className="text-white text-2xl font-bold">
                      {summary.paused}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Est. Mensual</p>
                    <p className="text-white text-lg font-bold">
                      {formatCurrency(summary.monthly_estimate)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              className={
                statusFilter === "active"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === "paused" ? "default" : "outline"}
              onClick={() => setStatusFilter("paused")}
              className={
                statusFilter === "paused"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              Pausados
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              className={
                statusFilter === "cancelled"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              Cancelados
            </Button>
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              onClick={() => setStatusFilter(undefined)}
              className={
                statusFilter === undefined
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              Todos
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-6 pt-4 space-y-4 flex flex-col ">
        {expenses.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-12">
            <div className="text-center">
              <CalendarClock className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No hay gastos recurrentes
              </h3>
              <p className="text-white/60 mb-6">
                {statusFilter
                  ? `No tienes gastos ${
                      statusFilter === "active"
                        ? "activos"
                        : statusFilter === "paused"
                        ? "pausados"
                        : "cancelados"
                    } aún`
                  : "Comienza creando tu primer gasto recurrente"}
              </p>
              <Link to="/dashboard/recurring-expenses/create">
                <Button className="bg-white text-[#0A4A4A] hover:bg-white/90">
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Gasto Recurrente
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          expenses.map((expense) => {
            const StatusIcon = STATUS_CONFIG[expense.status].icon;
            const daysUntil = getDaysUntil(expense.next_charge_date);
            const isDueSoon =
              daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

            return (
              <Link
                key={expense.id}
                to={`/dashboard/recurring-expenses/${expense.id}`}
              >
                <Card className="bg-white/10 border-white/20 p-5 hover:bg-white/15 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Account Indicator */}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: expense.account.color || "#10B981",
                          }}
                        />
                        <h3 className="text-white font-semibold text-lg">
                          {expense.name}
                        </h3>
                        <div
                          className={`${
                            STATUS_CONFIG[expense.status].color
                          } rounded-full p-1`}
                        >
                          <StatusIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <p className="text-white text-2xl font-bold">
                          {formatCurrency(expense.amount)}
                        </p>
                        <span className="text-white/60 text-sm">
                          • {FREQUENCY_LABELS[expense.frequency]}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span>{expense.account.name}</span>
                        </div>
                        {expense.category && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {expense.category.icon}
                            </span>
                            <span>{expense.category.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Next Charge */}
                      {expense.next_charge_date && (
                        <div className="mt-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white/60" />
                          <span className="text-white/80 text-sm">
                            Próximo cargo:{" "}
                            <span
                              className={
                                isDueSoon ? "text-yellow-400 font-semibold" : ""
                              }
                            >
                              {formatDate(expense.next_charge_date)}
                            </span>
                            {daysUntil !== null && daysUntil >= 0 && (
                              <span className="text-white/60 ml-1">
                                ({daysUntil} {daysUntil === 1 ? "día" : "días"})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-6 w-6 text-white/40 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
