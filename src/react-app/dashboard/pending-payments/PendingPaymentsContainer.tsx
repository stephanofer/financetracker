import { useState } from "react";
import { Link } from "react-router";
import {
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingPayments } from "./hooks/usePendingPayments";
import { CreatePendingPaymentForm } from "./forms/CreatePendingPaymentForm";
import { formatCurrency } from "@/dashboard/utils/utils";

const PRIORITY_CONFIG = {
  high: {
    label: "Alta",
    color: "bg-red-500",
    textColor: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
    icon: "🔴",
  },
  medium: {
    label: "Media",
    color: "bg-yellow-500",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
    icon: "🟡",
  },
  low: {
    label: "Baja",
    color: "bg-green-500",
    textColor: "text-green-400",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/10",
    icon: "🟢",
  },
};

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    icon: Clock,
  },
  overdue: {
    label: "Vencido",
    color: "bg-red-500",
    textColor: "text-red-400",
    icon: AlertCircle,
  },
  paid: {
    label: "Pagado",
    color: "bg-green-500",
    textColor: "text-green-400",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-gray-500",
    textColor: "text-gray-400",
    icon: AlertCircle,
  },
};

export function PendingPaymentsContainer() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [openDialog, setOpenDialog] = useState(false);

  const { data, isPending } = usePendingPayments(statusFilter);

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysLabel = (days: number | null) => {
    if (days === null) return null;
    if (days < 0) return `Vencido hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`;
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    return `Vence en ${days} días`;
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
  const payments = data?.data.pending_payments || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Crear Nuevo Pago Pendiente
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CreatePendingPaymentForm handleClose={() => setOpenDialog(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Pagos Pendientes</h1>
              <p className="text-white/60 text-sm mt-1">
                Organiza tus próximos pagos
              </p>
            </div>
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-white text-[#0A4A4A] hover:bg-white/90"
            >
              <Plus className="h-5 w-5" />
              Crear
            </Button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Pendientes</p>
                    <p className="text-white text-xl font-bold">
                      {summary.pending_count}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Vencidos</p>
                    <p className="text-white text-xl font-bold">
                      {summary.overdue_count}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Monto Total</p>
                    <p className="text-white text-lg font-bold">
                      {formatCurrency(summary.total_pending_amount)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Pagados</p>
                    <p className="text-white text-xl font-bold">
                      {summary.paid_count}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={
                statusFilter === "pending"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              <Clock className="w-4 h-4 mr-2" />
              Pendientes
            </Button>
            <Button
              variant={statusFilter === "overdue" ? "default" : "outline"}
              onClick={() => setStatusFilter("overdue")}
              className={
                statusFilter === "overdue"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Vencidos
            </Button>
            <Button
              variant={statusFilter === "paid" ? "default" : "outline"}
              onClick={() => setStatusFilter("paid")}
              className={
                statusFilter === "paid"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Pagados
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
              <Filter className="w-4 h-4 mr-2" />
              Todos
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-6 pt-4 space-y-4">
        {payments.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No hay pagos pendientes
              </h3>
              <p className="text-white/60 mb-6">
                Crea tu primer pago pendiente para mantener el control de tus
                finanzas
              </p>
              <Button
                onClick={() => setOpenDialog(true)}
                className="bg-white text-[#0A4A4A] hover:bg-white/90"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Pago Pendiente
              </Button>
            </div>
          </Card>
        ) : (
          payments.map((payment) => {
            const StatusIcon = STATUS_CONFIG[payment.status].icon;
            const priorityConfig = PRIORITY_CONFIG[payment.priority];
            const daysUntil = getDaysUntil(payment.due_date);
            const daysLabel = getDaysLabel(daysUntil);
            const isDueSoon =
              daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;
            const isOverdue = daysUntil !== null && daysUntil < 0;

            return (
              <Link
                key={payment.id}
                to={`/dashboard/pending-payments/${payment.id}`}
              >
                <Card className="bg-white/10 border-white/20 p-5 hover:bg-white/15 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold text-lg">
                          {payment.name}
                        </h3>
                        <span className="text-lg">
                          {priorityConfig.icon}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[payment.status].textColor} ${STATUS_CONFIG[payment.status].color}/20 border-${payment.status === "overdue" ? "red" : payment.status === "paid" ? "green" : "blue"}-500/30`}
                        >
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {STATUS_CONFIG[payment.status].label}
                        </span>
                        {payment.category_name && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10">
                            {payment.category_icon} {payment.category_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#00D09E] font-bold text-xl">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>

                  {payment.due_date && (
                    <div
                      className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-lg ${
                        isOverdue
                          ? "bg-red-500/10 border border-red-500/20"
                          : isDueSoon
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <Calendar
                        className={`w-4 h-4 ${
                          isOverdue
                            ? "text-red-400"
                            : isDueSoon
                            ? "text-yellow-400"
                            : "text-white/60"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isOverdue
                            ? "text-red-400"
                            : isDueSoon
                            ? "text-yellow-400"
                            : "text-white/70"
                        }`}
                      >
                        {daysLabel}
                      </span>
                      {isOverdue && (
                        <AlertCircle className="w-4 h-4 text-red-400 ml-auto" />
                      )}
                    </div>
                  )}

                  {payment.notes && (
                    <p className="text-white/50 text-sm mt-3 line-clamp-2">
                      {payment.notes}
                    </p>
                  )}
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

