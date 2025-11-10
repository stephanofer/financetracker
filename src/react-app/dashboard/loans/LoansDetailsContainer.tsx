
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLoanDetail } from "./hooks/useLoanDetail";
import { useDeleteLoan } from "./hooks/useDeleteLoan";
import { RegisterPaymentForm } from "./forms/RegisterPaymentForm";
import { formatCurrency } from "@/dashboard/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Phone,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
  Info,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

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

export function LoansDetailsContainer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data, isLoading } = useLoanDetail(parseInt(id!));
  const { mutate: deleteLoan, isPending: isDeleting } = useDeleteLoan();

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleDelete = () => {
    deleteLoan(parseInt(id!), {
      onSuccess: () => {
        toast.success("Préstamo eliminado", {
          description: "El préstamo ha sido eliminado exitosamente",
          duration: 3000,
        });
        navigate("/dashboard/loans");
      },
    });
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

  if (!data?.data?.loan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <h3 className="text-white text-xl font-semibold mb-2">
              No se encontró el préstamo
            </h3>
            <p className="text-white/60 mb-6">
              El préstamo que buscas no existe o fue eliminado
            </p>
            <Button
              onClick={() => navigate("/dashboard/loans")}
              className="bg-white text-[#0A4A4A] hover:bg-white/90"
            >
              Volver a la lista
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const loan = data.data.loan;
  const payments = data.data.payments;
  const summary = data.data.summary;
  const StatusIcon = STATUS_CONFIG[loan.status].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
      {/* Dialog para registrar pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago Recibido</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <RegisterPaymentForm
              loanId={loan.id}
              debtorName={loan.debtor_name}
              remainingAmount={loan.remaining_amount}
              onSuccess={() => {
                setShowPaymentDialog(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/dashboard/loans")}
            className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-white/70" />
                <h1 className="text-2xl font-bold text-white">
                  {loan.debtor_name}
                </h1>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <StatusIcon className="h-4 w-4" />
                <span
                  className={`text-sm font-medium ${
                    STATUS_CONFIG[loan.status].textColor
                  }`}
                >
                  {STATUS_CONFIG[loan.status].label}
                </span>
              </div>
            </div>

            {loan.status !== "paid" && (
              <Button
                onClick={() => setShowPaymentDialog(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Pago
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-6 space-y-6">
        {/* Montos Principales */}
        <Card className="bg-white/10 border-white/20 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/50 text-sm mb-2">Monto Original</p>
              <p className="text-white text-3xl font-bold">
                {formatCurrency(loan.original_amount)}
              </p>
            </div>

            <div>
              <p className="text-white/50 text-sm mb-2">Pendiente de Recibir</p>
              <p className="text-yellow-400 text-3xl font-bold">
                {formatCurrency(loan.remaining_amount)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>Progreso del pago</span>
              <span>{summary.payment_progress}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${summary.payment_progress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Estadísticas */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <TrendingUp className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/50 text-xs mb-1">Recibido</p>
              <p className="text-white font-bold">
                {formatCurrency(payments.statistics.total_amount)}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <CheckCircle2 className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/50 text-xs mb-1">Pagos</p>
              <p className="text-white font-bold text-xl">
                {payments.statistics.total_payments}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <DollarSign className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/50 text-xs mb-1">Pago Promedio</p>
              <p className="text-white font-bold">
                {formatCurrency(payments.statistics.average_amount)}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <Calendar className="h-5 w-5 text-white/60 mb-2" />
              <p className="text-white/50 text-xs mb-1">Días desde préstamo</p>
              <p className="text-white font-bold text-xl">
                {summary.days_since_loan}
              </p>
            </div>
          </div>
        </Card>

        {/* Detalles */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Detalles</h3>
          <div className="space-y-4">
            {loan.debtor_contact && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-white/50 text-xs">Contacto</p>
                  <p className="text-white">{loan.debtor_contact}</p>
                </div>
              </div>
            )}

            {loan.account && (
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-white/50 text-xs">Cuenta de origen</p>
                  <p className="text-white">
                    {loan.account.icon} {loan.account.name}
                  </p>
                </div>
              </div>
            )}

            {loan.interest_rate > 0 && (
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-white/50 text-xs">Tasa de Interés</p>
                  <p className="text-white">{loan.interest_rate}%</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-xs mb-1">Fecha de préstamo</p>
                  <p className="text-white font-medium">
                    {formatDateShort(loan.loan_date)}
                  </p>
                </div>
                {loan.due_date && (
                  <div>
                    <p className="text-white/50 text-xs mb-1">
                      Fecha de vencimiento
                    </p>
                    <p
                      className={`font-medium ${
                        summary.is_overdue ? "text-red-400" : "text-white"
                      }`}
                    >
                      {formatDateShort(loan.due_date)}
                      {summary.days_until_due !== null &&
                        (summary.days_until_due > 0
                          ? ` (en ${summary.days_until_due} días)`
                          : summary.days_until_due === 0
                          ? " (Hoy)"
                          : ` (Vencido hace ${Math.abs(
                              summary.days_until_due
                            )} días)`)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {loan.notes && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/50 text-xs mb-2">Notas</p>
                <p className="text-white text-sm">{loan.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Historial de Pagos */}
        {payments.list.length > 0 && (
          <Card className="bg-white/10 border-white/20 p-6">
            <h3 className="text-white text-lg font-semibold mb-4">
              Historial de Pagos ({payments.list.length})
            </h3>
            <div className="space-y-3">
              {payments.list.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white/5 rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <p className="text-white font-semibold">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <p className="text-white/50 text-sm mb-1">
                      {formatDateShort(payment.transaction_date)}
                    </p>
                    {payment.description && (
                      <p className="text-white/70 text-sm">
                        {payment.description}
                      </p>
                    )}
                    {payment.account && (
                      <p className="text-white/50 text-xs mt-1">
                        {payment.account.icon} {payment.account.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Acciones */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Acciones</h3>
          <div className="space-y-3">
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 w-full"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Eliminar préstamo
            </Button>
          </div>

          {summary.is_overdue && loan.status !== "paid" && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium text-sm">
                  Préstamo Vencido
                </p>
                <p className="text-red-400/80 text-xs mt-1">
                  Este préstamo está vencido. Considera contactar al deudor para
                  solicitar el pago.
                </p>
              </div>
            </div>
          )}

          {loan.status !== "paid" &&
            loan.remaining_amount > 0 &&
            !summary.is_overdue && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">
                    Pago Pendiente
                  </p>
                  <p className="text-yellow-400/80 text-xs mt-1">
                    Aún hay {formatCurrency(loan.remaining_amount)} pendiente de
                    recibir.
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
              ¿Eliminar préstamo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta acción no se puede deshacer. El préstamo será eliminado
              permanentemente. Si tiene transacciones asociadas, no podrá ser
              eliminado.
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
    </div>
  );
}
