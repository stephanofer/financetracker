
import { useState } from "react";
import { Link } from "react-router";
import { useLoans } from "./hooks/useLoans";
import { CreateLoanForm } from "./forms/CreateLoanForm";
import { formatCurrency } from "@/dashboard/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Clock,
} from "lucide-react";

const STATUS_CONFIG = {
  active: {
    label: "Activo",
    color: "bg-green-500",
    textColor: "text-green-400",
    icon: CheckCircle2,
  },
  partial: {
    label: "Parcial",
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
    color: "bg-gray-500",
    textColor: "text-gray-400",
    icon: CheckCircle2,
  },
};

export function LoansContainer() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("active");

  const { data, isPending } = useLoans();

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
  const allLoans = data?.data.loans || [];
  
  // Filtrar préstamos según el estado seleccionado
  const loans = statusFilter
    ? allLoans.filter((loan) => loan.status === statusFilter)
    : allLoans;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
      {/* Dialog para crear préstamo */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Préstamo</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CreateLoanForm
              onSuccess={() => {
                setShowCreateDialog(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">Préstamos</h1>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-white text-[#0A4A4A] hover:bg-white/90"
            >
              <Plus className="h-5 w-5" />
              Crear
            </Button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Por Recibir</p>
                    <p className="text-white text-lg font-bold">
                      {formatCurrency(summary.total_pending_to_receive)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Recibido</p>
                    <p className="text-white text-lg font-bold">
                      {formatCurrency(summary.total_received)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/10 border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Vencidos</p>
                    <p className="text-white text-2xl font-bold">
                      {summary.overdue_loans_count}
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
              variant={statusFilter === "partial" ? "default" : "outline"}
              onClick={() => setStatusFilter("partial")}
              className={
                statusFilter === "partial"
                  ? "bg-white text-[#0A4A4A]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }
            >
              Parciales
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
              Todos
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-6 pt-4 space-y-4">
        {loans.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                No hay préstamos
              </h3>
              <p className="text-white/60 mb-6">
                {statusFilter
                  ? `No tienes préstamos ${
                      statusFilter === "active"
                        ? "activos"
                        : statusFilter === "partial"
                        ? "parciales"
                        : statusFilter === "overdue"
                        ? "vencidos"
                        : "pagados"
                    } aún`
                  : "Comienza registrando tu primer préstamo"}
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-white text-[#0A4A4A] hover:bg-white/90"
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Préstamo
              </Button>
            </div>
          </Card>
        ) : (
          loans.map((loan) => {
            const daysUntil = getDaysUntil(loan.due_date);
            const isDueSoon =
              daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;
            const progressPercent =
              loan.original_amount > 0
                ? ((loan.original_amount - loan.remaining_amount) /
                    loan.original_amount) *
                  100
                : 0;

            return (
              <Link key={loan.id} to={`/dashboard/loans/${loan.id}`}>
                <Card className="bg-white/10 border-white/20 p-5 hover:bg-white/15 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-white/70" />
                          <h3 className="text-white font-semibold text-lg">
                            {loan.debtor_name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              STATUS_CONFIG[loan.status].color
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              STATUS_CONFIG[loan.status].textColor
                            }`}
                          >
                            {STATUS_CONFIG[loan.status].label}
                          </span>
                        </div>
                      </div>

                      {loan.debtor_contact && (
                        <p className="text-white/50 text-sm mb-3">
                          {loan.debtor_contact}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-white/50 text-xs mb-1">
                            Monto Original
                          </p>
                          <p className="text-white font-semibold">
                            {formatCurrency(loan.original_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs mb-1">
                            Pendiente
                          </p>
                          <p className="text-yellow-400 font-bold">
                            {formatCurrency(loan.remaining_amount)}
                          </p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span>Recibido</span>
                          <span>{progressPercent.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs">
                        {loan.payments.count > 0 && (
                          <div className="flex items-center gap-1.5 text-white/60">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>
                              {loan.payments.count} pago
                              {loan.payments.count > 1 ? "s" : ""} (
                              {formatCurrency(loan.payments.total)})
                            </span>
                          </div>
                        )}

                        {loan.due_date && (
                          <div
                            className={`flex items-center gap-1.5 ${
                              isDueSoon
                                ? "text-yellow-400"
                                : daysUntil && daysUntil < 0
                                ? "text-red-400"
                                : "text-white/60"
                            }`}
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>
                              {daysUntil !== null
                                ? daysUntil > 0
                                  ? `Vence en ${daysUntil} día${
                                      daysUntil > 1 ? "s" : ""
                                    }`
                                  : daysUntil === 0
                                  ? "Vence hoy"
                                  : `Vencido hace ${Math.abs(daysUntil)} día${
                                      Math.abs(daysUntil) > 1 ? "s" : ""
                                    }`
                                : "Sin fecha límite"}
                            </span>
                          </div>
                        )}

                        {loan.interest_rate > 0 && (
                          <div className="flex items-center gap-1.5 text-white/60">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>{loan.interest_rate}% interés</span>
                          </div>
                        )}

                        {loan.account && (
                          <div className="flex items-center gap-1.5 text-white/60">
                            <span>{loan.account.icon}</span>
                            <span>{loan.account.name}</span>
                          </div>
                        )}
                      </div>
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
