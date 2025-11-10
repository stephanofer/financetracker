
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pause,
  Play,
  Ban,
  Sparkles,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSavingGoalDetail,
  useDeleteSavingGoal,
  useUpdateSavingGoalStatus,
} from "./hooks/useSavingGoals";
import ContributeToGoalForm from "./forms/ContributeToGoalForm";
import { formatCurrency } from "../utils/utils";
import { toast } from "sonner";

const STATUS_CONFIG = {
  in_progress: {
    label: "En Progreso",
    color: "#3b82f6",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: Clock,
  },
  achieved: {
    label: "Completada",
    color: "#10b981",
    bg: "bg-green-500/20",
    border: "border-green-500/30",
    text: "text-green-400",
    icon: CheckCircle2,
  },
  expired: {
    label: "Vencida",
    color: "#f97316",
    bg: "bg-orange-500/20",
    border: "border-orange-500/30",
    text: "text-orange-400",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelada",
    color: "#6b7280",
    bg: "bg-gray-500/20",
    border: "border-gray-500/30",
    text: "text-gray-400",
    icon: Ban,
  },
};

const PRIORITY_CONFIG = {
  high: { label: "Alta", color: "text-red-400", icon: "🔴" },
  medium: { label: "Media", color: "text-yellow-400", icon: "🟡" },
  low: { label: "Baja", color: "text-green-400", icon: "🟢" },
};

export function SavingGoalsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<
    "in_progress" | "cancelled" | null
  >(null);
  const [showContributeDialog, setShowContributeDialog] = useState(false);

  const { data, isPending } = useSavingGoalDetail(Number(id));
  const { mutate: deleteGoal, isPending: isDeleting } = useDeleteSavingGoal();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateSavingGoalStatus();

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleDelete = () => {
    deleteGoal(Number(id), {
      onSuccess: () => {
        toast.success("Meta eliminada", {
          description: "La meta de ahorro ha sido eliminada exitosamente",
          duration: 3000,
        });
        navigate("/dashboard/saving-goals");
      },
    });
  };

  const handleStatusChange = (newStatus: "in_progress" | "cancelled") => {
    setTargetStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = () => {
    if (!targetStatus) return;

    updateStatus(
      { id: Number(id), status: targetStatus },
      {
        onSuccess: () => {
          toast.success("Estado actualizado", {
            description: `La meta ahora está ${
              STATUS_CONFIG[targetStatus].label.toLowerCase()
            }`,
            duration: 3000,
          });
          setShowStatusDialog(false);
          setTargetStatus(null);
        },
      }
    );
  };

  if (isPending) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="px-6 pt-8 pb-6">
          <Skeleton className="w-32 h-8 mb-8 bg-white/10" />
          <Skeleton className="w-full h-64 rounded-3xl mb-6 bg-white/10" />
          <Skeleton className="w-full h-32 rounded-3xl mb-4 bg-white/10" />
          <Skeleton className="w-full h-48 rounded-3xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!data?.data?.goal) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 mx-auto">
            <Target className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-slate-400 text-lg mb-2">Meta no encontrada</p>
          <button
            onClick={() => navigate(-1)}
            className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  const goalDetail = data.data;
  const goal = goalDetail.goal;
  const contributions = goalDetail.contributions_history;
  const statistics = goalDetail.statistics;

  const statusConfig = STATUS_CONFIG[goal.status];
  const priorityConfig = PRIORITY_CONFIG[goal.priority];
  const StatusIcon = statusConfig.icon;

  return (
    <>
      {/* Contribute Dialog */}
      <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Contribuir a tu meta</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ContributeToGoalForm
              goalId={goal.id}
              goalName={goal.name}
              remainingAmount={goal.remaining_amount}
              handleClose={() => setShowContributeDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#0A4A4A] border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Eliminar meta de ahorro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              meta "{goal.name}" y todo su historial de contribuciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
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
              Cambiar estado de la meta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              ¿Estás seguro de que deseas cambiar el estado de esta meta a "
              {targetStatus && STATUS_CONFIG[targetStatus].label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isUpdatingStatus}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isUpdatingStatus ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-y-auto pb-24">
        {/* Header */}
        <header className="relative z-10 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-slate-400 text-sm font-medium">
              Detalle de Meta
            </span>
          </div>

          {/* Main Goal Card */}
          <div
            className="relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/20 p-6 shadow-2xl mb-4"
            style={{
              background: `linear-gradient(135deg, ${statusConfig.color}20, ${statusConfig.color}05)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

            <div className="relative z-10">
              {/* Image or Icon + Header */}
              <div className="flex items-start gap-4 mb-5">
                <div className="relative">
                  {goal.image_url ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden">
                      <img
                        src={goal.image_url}
                        alt={goal.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D09E]/30 to-[#00F5B8]/20 flex items-center justify-center">
                      <Target className="w-10 h-10 text-[#00F5B8]" />
                    </div>
                  )}
                  {goal.status === "achieved" && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-white text-2xl font-bold mb-2">
                    {goal.name}
                  </h1>
                  {goal.description && (
                    <p className="text-white/70 text-sm mb-3">
                      {goal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} flex items-center gap-1`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                    <span className={`text-xs ${priorityConfig.color}`}>
                      {priorityConfig.icon} {priorityConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Ahorrado</p>
                  <p className="text-[#00F5B8] text-2xl font-bold">
                    {formatCurrency(goal.current_amount)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Objetivo</p>
                  <p className="text-white text-2xl font-bold">
                    {formatCurrency(goal.target_amount)}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Progreso</span>
                  <span className="text-white font-bold text-lg">
                    {goal.progress_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="relative bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full transition-all duration-700 ${
                      goal.status === "achieved"
                        ? "bg-gradient-to-r from-green-400 to-emerald-400"
                        : "bg-gradient-to-r from-[#00D09E] to-[#00F5B8]"
                    }`}
                    style={{
                      width: `${Math.min(goal.progress_percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Remaining */}
              {goal.status !== "achieved" && goal.remaining_amount > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-xs mb-1">Te falta</p>
                    <p className="text-white text-xl font-bold">
                      {formatCurrency(goal.remaining_amount)}
                    </p>
                  </div>
                  {goal.status === "in_progress" && (
                    <Button
                      onClick={() => setShowContributeDialog(true)}
                      className="bg-gradient-to-r from-[#00D09E] to-[#00F5B8] text-[#052224] hover:shadow-xl font-bold"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Contribuir
                    </Button>
                  )}
                </div>
              )}

              {/* Achievement message */}
              {goal.status === "achieved" && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                  <Award className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">
                      ¡Meta Completada! 🎉
                    </p>
                    <p className="text-white/80 text-sm">
                      Felicitaciones por alcanzar tu objetivo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Section */}
        <div className="relative z-10 px-6 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Contributions count */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
              <TrendingUp className="w-5 h-5 text-[#00F5B8] mb-2" />
              <p className="text-white/60 text-xs mb-1">Contribuciones</p>
              <p className="text-white text-xl font-bold">
                {goal.contributions.count}
              </p>
            </div>

            {/* Average contribution */}
            {statistics && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
                <DollarSign className="w-5 h-5 text-[#00F5B8] mb-2" />
                <p className="text-white/60 text-xs mb-1">Promedio</p>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(statistics.average_contribution)}
                </p>
              </div>
            )}

            {/* Days since creation */}
            {statistics && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
                <Clock className="w-5 h-5 text-[#00F5B8] mb-2" />
                <p className="text-white/60 text-xs mb-1">Días transcurridos</p>
                <p className="text-white text-xl font-bold">
                  {statistics.days_since_creation}
                </p>
              </div>
            )}

            {/* Estimated days */}
            {statistics &&
              statistics.estimated_days_to_complete !== null &&
              goal.status === "in_progress" && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
                  <Calendar className="w-5 h-5 text-[#00F5B8] mb-2" />
                  <p className="text-white/60 text-xs mb-1">Estimado</p>
                  <p className="text-white text-xl font-bold">
                    {statistics.estimated_days_to_complete} días
                  </p>
                </div>
              )}
          </div>

          {/* Dates and Auto-contribute */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Información Adicional
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Creada el</span>
                <span className="text-white text-sm font-medium">
                  {formatDateShort(goal.created_at)}
                </span>
              </div>
              {goal.target_date && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Fecha objetivo</span>
                  <span className="text-white text-sm font-medium">
                    {formatDateShort(goal.target_date)}
                  </span>
                </div>
              )}
              {goal.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Completada el</span>
                  <span className="text-green-400 text-sm font-medium">
                    {formatDateShort(goal.completed_at)}
                  </span>
                </div>
              )}
              {goal.auto_contribute && (
                <div className="flex items-center justify-between bg-[#00F5B8]/10 rounded-lg p-2 border border-[#00F5B8]/20">
                  <span className="text-[#00F5B8] text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Auto-contribución activa
                  </span>
                  <span className="text-white text-sm font-bold">
                    {goal.auto_contribute_percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contributions History */}
          {contributions && contributions.transactions.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                Historial de Contribuciones ({contributions.count})
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {contributions.transactions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor:
                            contribution.account.color || "#10B981",
                        }}
                      >
                        <span className="text-lg">
                          {contribution.account.icon || "💰"}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {formatCurrency(contribution.amount)}
                        </p>
                        <p className="text-white/60 text-xs">
                          {formatDateShort(contribution.transaction_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-xs">
                        {contribution.account.name}
                      </p>
                      {contribution.description && (
                        <p className="text-white/50 text-xs">
                          {contribution.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Contributions */}
          {contributions && contributions.transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-white text-base mb-1">
                Sin contribuciones aún
              </p>
              <p className="text-white/60 text-sm">
                Comienza a ahorrar para tu meta
              </p>
            </div>
          )}

          {/* Actions */}
          <Card className="bg-white/10 border-white/20 p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Acciones</h3>
            <div className="grid gap-3">
              {goal.status === "in_progress" && (
                <Button
                  onClick={() => setShowContributeDialog(true)}
                  className="w-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] text-[#052224] hover:shadow-xl font-bold justify-start"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Hacer una Contribución
                </Button>
              )}

              {goal.status === "in_progress" && (
                <Button
                  onClick={() => handleStatusChange("cancelled")}
                  variant="outline"
                  className="w-full bg-white/5 text-white border-white/20 hover:bg-white/10 justify-start"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Cancelar Meta
                </Button>
              )}

              {goal.status === "cancelled" && (
                <Button
                  onClick={() => handleStatusChange("in_progress")}
                  variant="outline"
                  className="w-full bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 justify-start"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Reactivar Meta
                </Button>
              )}

              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="w-full bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 justify-start"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Eliminar Meta
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
