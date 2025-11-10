
import { useState } from "react";
import { Link } from "react-router";
import {
  Target,
  TrendingUp,
  Plus,
  Calendar,
  Check,
  AlertCircle,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useSavingGoals } from "./hooks/useSavingGoals";
import CreateSavingGoalForm from "./forms/CreateSavingGoalForm";
import { formatCurrency } from "../utils/utils";

const STATUS_CONFIG = {
  in_progress: {
    label: "En Progreso",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/20",
  },
  achieved: {
    label: "Completada",
    color: "bg-green-500",
    textColor: "text-green-400",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/20",
  },
  expired: {
    label: "Vencida",
    color: "bg-orange-500",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/20",
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-gray-500",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/30",
    bgColor: "bg-gray-500/20",
  },
};

const PRIORITY_CONFIG = {
  high: { label: "Alta", color: "text-red-400", icon: "🔴" },
  medium: { label: "Media", color: "text-yellow-400", icon: "🟡" },
  low: { label: "Baja", color: "text-green-400", icon: "🟢" },
};

export function SavingGoalsContainer() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    "in_progress"
  );
  const [openDialog, setOpenDialog] = useState(false);

  const { data, isPending } = useSavingGoals(statusFilter);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </div>
      </div>
    );
  }

  const summary = data?.data?.summary;
  const goals = data?.data?.goals || [];

  const overallProgress =
    summary && summary.total_target_in_progress > 0
      ? (summary.total_saved_in_progress / summary.total_target_in_progress) *
        100
      : 0;

  return (
    <>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Crear nueva meta de ahorro
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CreateSavingGoalForm handleClose={() => setOpenDialog(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Metas de Ahorro
                </h1>
                <p className="text-white/60 text-sm">
                  Construye tu futuro, paso a paso 💰
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#00D09E] to-[#00F5B8] text-[#052224] hover:shadow-xl font-bold">
                    <Plus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="mr-5 w-48">
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setOpenDialog(true)}
                      className="w-full justify-start"
                      variant="ghost"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Nueva Meta
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary Card */}
            {summary && (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white/60 text-sm mb-1">
                      Progreso General
                    </p>
                    <p className="text-white text-3xl font-bold">
                      {overallProgress.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm mb-1">Ahorrado</p>
                    <p className="text-[#00F5B8] text-xl font-semibold">
                      {formatCurrency(summary.total_saved_in_progress)}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      de {formatCurrency(summary.total_target_in_progress)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative bg-white/20 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(overallProgress, 100)}%` }}
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">
                      {summary.in_progress}
                    </p>
                    <p className="text-white/60 text-xs">Activas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 text-xl font-bold">
                      {summary.achieved}
                    </p>
                    <p className="text-white/60 text-xs">Logradas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-400 text-xl font-bold">
                      {summary.expired}
                    </p>
                    <p className="text-white/60 text-xs">Vencidas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">
                      {summary.total}
                    </p>
                    <p className="text-white/60 text-xs">Total</p>
                  </div>
                </div>
              </div>
            )}

            {/* Motivational message */}
            {summary && summary.achieved > 0 && (
              <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-2xl p-4 border border-green-500/30">
                <Trophy className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 text-sm font-semibold">
                    ¡Excelente trabajo! 🎉
                  </p>
                  <p className="text-white/80 text-xs">
                    Has completado {summary.achieved} meta
                    {summary.achieved > 1 ? "s" : ""} de ahorro
                  </p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: "in_progress", label: "En Progreso", count: summary?.in_progress || 0 },
                { id: "achieved", label: "Completadas", count: summary?.achieved || 0 },
                { id: "expired", label: "Vencidas", count: summary?.expired || 0 },
                { id: undefined, label: "Todas", count: summary?.total || 0 },
              ].map(({ id, label, count }) => (
                <Button
                  key={id || "all"}
                  variant={statusFilter === id ? "default" : "outline"}
                  onClick={() => setStatusFilter(id)}
                  className={
                    statusFilter === id
                      ? "bg-white text-[#0A4A4A] hover:bg-white/90"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }
                >
                  {label}
                  <span className="ml-2 text-xs opacity-70">({count})</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="max-w-4xl mx-auto px-6 pt-4 space-y-4">
          {goals.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00D09E]/20 to-[#00F5B8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-[#00F5B8]" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                No hay metas de ahorro
              </h3>
              <p className="text-white/60 mb-6">
                {statusFilter === "in_progress"
                  ? "Comienza creando tu primera meta de ahorro"
                  : statusFilter === "achieved"
                  ? "Aún no has completado ninguna meta"
                  : "No hay metas en esta categoría"}
              </p>
              <Button
                onClick={() => setOpenDialog(true)}
                className="bg-gradient-to-r from-[#00D09E] to-[#00F5B8] text-[#052224] hover:shadow-xl font-bold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Meta
              </Button>
            </Card>
          ) : (
            goals.map((goal) => {
              const statusConfig = STATUS_CONFIG[goal.status];
              const priorityConfig = PRIORITY_CONFIG[goal.priority];

              return (
                <Link
                  key={goal.id}
                  to={`/dashboard/saving-goals/${goal.id}`}
                >
                  <Card className="bg-white/10 border-white/20 p-5 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                    <div className="flex items-start gap-4">
                      {/* Image or Icon */}
                      <div className="relative">
                        {goal.image_url ? (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden">
                            <img
                              src={goal.image_url}
                              alt={goal.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D09E]/30 to-[#00F5B8]/20 flex items-center justify-center">
                            <Target className="w-8 h-8 text-[#00F5B8]" />
                          </div>
                        )}
                        {goal.status === "achieved" && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0A4A4A]">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-lg mb-1 truncate">
                              {goal.name}
                            </h3>
                            {goal.description && (
                              <p className="text-white/60 text-sm truncate">
                                {goal.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className={`text-xs ${priorityConfig.color}`}>
                              {priorityConfig.icon}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white/70 text-sm">
                              {formatCurrency(goal.current_amount)} de{" "}
                              {formatCurrency(goal.target_amount)}
                            </span>
                            <span className="text-white font-semibold text-sm">
                              {goal.progress_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                goal.status === "achieved"
                                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                                  : goal.is_overdue
                                  ? "bg-gradient-to-r from-orange-400 to-red-400"
                                  : "bg-gradient-to-r from-[#00D09E] to-[#00F5B8]"
                              }`}
                              style={{
                                width: `${Math.min(
                                  goal.progress_percentage,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          {goal.target_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {goal.days_remaining !== null &&
                                goal.days_remaining >= 0
                                  ? `${goal.days_remaining} días restantes`
                                  : goal.is_overdue
                                  ? "Vencida"
                                  : "Sin fecha límite"}
                              </span>
                            </div>
                          )}
                          {goal.contributions.count > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>
                                {goal.contributions.count} aporte
                                {goal.contributions.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                          {goal.auto_contribute && (
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#00F5B8]" />
                              <span className="text-[#00F5B8]">
                                Auto {goal.auto_contribute_percentage}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Urgency indicator */}
                        {goal.status === "in_progress" &&
                          goal.days_remaining !== null &&
                          goal.days_remaining <= 7 &&
                          goal.days_remaining >= 0 && (
                            <div className="mt-3 flex items-center gap-2 bg-orange-500/20 rounded-lg p-2 border border-orange-500/30">
                              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                              <p className="text-orange-400 text-xs">
                                ¡Quedan {goal.days_remaining} día
                                {goal.days_remaining !== 1 ? "s" : ""}! Te faltan{" "}
                                {formatCurrency(goal.remaining_amount)}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
