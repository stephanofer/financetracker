import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import {
  useRecurringExpenseDetail,
  useDeleteRecurringExpense,
  useUpdateRecurringExpenseStatus,
} from "./hooks/useRecurringExpenses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Wallet,
  Tag,
  Bell,
  BellOff,
  Trash2,
  Play,
  Pause,
  XCircle,
  TrendingDown,
  Clock,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "../utils/utils";

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
    textColor: "text-green-400",
    icon: Play,
  },
  paused: {
    label: "Pausado",
    color: "bg-yellow-500",
    textColor: "text-yellow-400",
    icon: Pause,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    textColor: "text-red-400",
    icon: XCircle,
  },
};

export default function RecurringExpensesDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"active" | "paused" | "cancelled" | null>(null);

  const { data, isLoading } = useRecurringExpenseDetail(parseInt(id!));
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteRecurringExpense();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateRecurringExpenseStatus();

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleDelete = () => {
    deleteExpense(parseInt(id!), {
      onSuccess: () => {
        toast.success("Gasto eliminado", {
          description: "El gasto recurrente ha sido eliminado exitosamente",
          duration: 3000,
        });
        navigate("/dashboard/recurring-expenses");
      },
    });
  };

  const handleStatusChange = (newStatus: "active" | "paused" | "cancelled") => {
    setTargetStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = () => {
    if (!targetStatus) return;
    
    updateStatus(
      { id: parseInt(id!), status: targetStatus },
      {
        onSuccess: () => {
          toast.success("Estado actualizado", {
            description: `El gasto ahora está ${STATUS_CONFIG[targetStatus].label.toLowerCase()}`,
            duration: 3000,
          });
          setShowStatusDialog(false);
          setTargetStatus(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!data?.data?.expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <h3 className="text-white text-xl font-semibold mb-2">
              No se encontró el gasto
            </h3>
            <p className="text-white/60 mb-6">
              El gasto recurrente que buscas no existe o fue eliminado
            </p>
            <Button
              onClick={() => navigate("/dashboard/recurring-expenses")}
              className="bg-white text-[#0A4A4A] hover:bg-white/90"
            >
              Volver a la lista
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const expense = data.data.expense;
  const history = data.data.history;
  const statistics = data.data.statistics;
  const StatusIcon = STATUS_CONFIG[expense.status].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/dashboard/recurring-expenses")}
            className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: expense.account.color || "#10B981" }}
                />
                <h1 className="text-3xl font-bold text-white">{expense.name}</h1>
                <div className={`${STATUS_CONFIG[expense.status].color} rounded-full p-2`}>
                  <StatusIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-white/60">
                {FREQUENCY_LABELS[expense.frequency]} •{" "}
                {STATUS_CONFIG[expense.status].label}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-6 space-y-6">
        {/* Monto y Próximo Cargo */}
        <Card className="bg-white/10 border-white/20 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/60 text-sm mb-1">Monto del gasto</p>
              <p className="text-white text-4xl font-bold">
                {formatCurrency(expense.amount)}
              </p>
              <p className="text-white/50 text-sm mt-1">
                {FREQUENCY_LABELS[expense.frequency]}
              </p>
            </div>
            
            {expense.next_charge_date && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-white/60" />
                  <p className="text-white/60 text-sm">Próximo cargo</p>
                </div>
                <p className="text-white text-lg font-semibold">
                  {formatDate(expense.next_charge_date)}
                </p>
                {statistics.days_until_next_charge !== null && (
                  <p className={`text-sm mt-1 ${
                    statistics.is_due_soon ? "text-yellow-400" : "text-white/60"
                  }`}>
                    En {statistics.days_until_next_charge}{" "}
                    {statistics.days_until_next_charge === 1 ? "día" : "días"}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Estadísticas */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <Clock className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/60 text-sm">Días activo</p>
              <p className="text-white text-2xl font-bold">
                {statistics.days_since_creation}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <TrendingDown className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/60 text-sm">Total gastado</p>
              <p className="text-white text-lg font-bold">
                {formatCurrency(statistics.total_spent_history)}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <Calendar className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/60 text-sm">Transacciones</p>
              <p className="text-white text-2xl font-bold">
                {history.count}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <CheckCircle2 className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/60 text-sm">Último cargo</p>
              <p className="text-white text-sm font-semibold">
                {expense.last_charge_date
                  ? formatDateShort(expense.last_charge_date)
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>

        {/* Detalles */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Detalles</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-white/60" />
              <div>
                <p className="text-white/60 text-sm">Cuenta de cargo</p>
                <p className="text-white font-medium">{expense.account.name}</p>
              </div>
            </div>

            {expense.category && (
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-white/60 text-sm">Categoría</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{expense.category.icon}</span>
                    <p className="text-white font-medium">
                      {expense.category.name}
                      {expense.subcategory && ` • ${expense.subcategory.name}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-5 w-5 text-white/60" />
                <p className="text-white/60 text-sm">Notificaciones</p>
              </div>
              <div className="space-y-2 ml-7">
                <div className="flex items-center gap-2">
                  {expense.notify_3_days ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <BellOff className="h-4 w-4 text-white/30" />
                  )}
                  <span className={expense.notify_3_days ? "text-white" : "text-white/40"}>
                    3 días antes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {expense.notify_1_day ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <BellOff className="h-4 w-4 text-white/30" />
                  )}
                  <span className={expense.notify_1_day ? "text-white" : "text-white/40"}>
                    1 día antes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {expense.notify_same_day ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <BellOff className="h-4 w-4 text-white/30" />
                  )}
                  <span className={expense.notify_same_day ? "text-white" : "text-white/40"}>
                    El mismo día
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Historial */}
        {history.transactions.length > 0 && (
          <Card className="bg-white/10 border-white/20 p-6">
            <h3 className="text-white text-lg font-semibold mb-4">
              Historial de cargos ({history.count})
            </h3>
            <div className="space-y-3">
              {history.transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-white/60 text-sm">
                      {formatDateShort(transaction.transaction_date)}
                    </p>
                    {transaction.description && (
                      <p className="text-white/50 text-xs mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {history.count > 5 && (
              <p className="text-white/60 text-sm text-center mt-4">
                Mostrando 5 de {history.count} transacciones
              </p>
            )}
          </Card>
        )}

        {/* Acciones */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Acciones</h3>
          <div className="grid gap-3">
            {expense.status === "active" && (
              <Button
                onClick={() => handleStatusChange("paused")}
                variant="outline"
                className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 w-full"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pausar gasto
              </Button>
            )}

            {expense.status === "paused" && (
              <Button
                onClick={() => handleStatusChange("active")}
                variant="outline"
                className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 w-full"
              >
                <Play className="h-5 w-5 mr-2" />
                Reactivar gasto
              </Button>
            )}

            {expense.status !== "cancelled" && (
              <Button
                onClick={() => handleStatusChange("cancelled")}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 w-full"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Cancelar gasto
              </Button>
            )}

            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 w-full"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Eliminar permanentemente
            </Button>
          </div>

          {expense.status === "active" && statistics.is_due_soon && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 text-sm font-medium">
                  Cargo próximo
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Este gasto se cargará en los próximos días. Asegúrate de tener
                  fondos suficientes.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#0A4A4A] border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Eliminar gasto recurrente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. El gasto recurrente será
              eliminado permanentemente, pero las transacciones históricas se
              mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent className="bg-[#0A4A4A] border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Cambiar estado del gasto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {targetStatus === "paused" &&
                "El gasto será pausado y no se generarán cargos automáticos hasta que lo reactives."}
              {targetStatus === "active" &&
                "El gasto será reactivado y se reanudarán los cargos automáticos."}
              {targetStatus === "cancelled" &&
                "El gasto será cancelado permanentemente. No se generarán más cargos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isUpdatingStatus}
              className="bg-white text-[#0A4A4A] hover:bg-white/90"
            >
              {isUpdatingStatus ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
