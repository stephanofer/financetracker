import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Receipt,
  Tag,
  FileText,
  DollarSign,
  Building2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingPaymentDetail } from "./hooks/usePendingPaymentDetail";
import { useDeletePendingPayment } from "./hooks/useDeletePendingPayment";
import { MarkAsPaidForm } from "./forms/MarkAsPaidForm";
import { formatCurrency } from "@/dashboard/utils/utils";
import { toast } from "sonner";

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

export function PendingPaymentsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [openMarkPaid, setOpenMarkPaid] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { data: payment, isPending } = usePendingPaymentDetail(Number(id));
  const deleteMutation = useDeletePendingPayment();

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
    if (days < 0)
      return `Vencido hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`;
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    return `Vence en ${days} días`;
  };

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate(Number(id), {
      onSuccess: () => {
        toast.success("Pago pendiente eliminado correctamente");
        navigate("/dashboard/pending-payments");
      },
      onError: () => {
        toast.error("Error al eliminar el pago pendiente");
      },
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <AlertCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">
              Pago no encontrado
            </h2>
            <p className="text-white/60 mb-6">
              El pago pendiente que buscas no existe
            </p>
            <Button
              onClick={() => navigate("/dashboard/pending-payments")}
              className="bg-white text-[#0A4A4A] hover:bg-white/90"
            >
              Volver al listado
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const paymentData = payment.data;
  const StatusIcon = STATUS_CONFIG[paymentData.status].icon;
  const priorityConfig = PRIORITY_CONFIG[paymentData.priority];
  const daysUntil = getDaysUntil(paymentData.due_date);
  const daysLabel = getDaysLabel(daysUntil);
  const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;
  const isOverdue = daysUntil !== null && daysUntil < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224] pb-24">
      <Dialog open={openMarkPaid} onOpenChange={setOpenMarkPaid}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Marcar como Pagado</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <MarkAsPaidForm
              paymentId={Number(id)}
              paymentAmount={paymentData.amount}
              paymentName={paymentData.name}
              handleClose={() => setOpenMarkPaid(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago pendiente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pago pendiente será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4A4A] to-[#052224] pt-6 px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/pending-payments")}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-white">
                  {paymentData.name}
                </h1>
                <span className="text-2xl">{priorityConfig.icon}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[paymentData.status].textColor} ${STATUS_CONFIG[paymentData.status].color}/20 border-${paymentData.status === "overdue" ? "red" : paymentData.status === "paid" ? "green" : "blue"}-500/30`}
                >
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {STATUS_CONFIG[paymentData.status].label}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityConfig.textColor} ${priorityConfig.bgColor} ${priorityConfig.borderColor}`}
                >
                  Prioridad {priorityConfig.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm mb-1">Monto</p>
              <p className="text-[#00D09E] font-bold text-3xl">
                {formatCurrency(paymentData.amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 space-y-4">
        {/* Due Date Alert */}
        {paymentData.due_date && (
          <Card
            className={`p-4 ${
              isOverdue
                ? "bg-red-500/10 border-red-500/30"
                : isDueSoon
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-white/10 border-white/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar
                className={`w-6 h-6 ${
                  isOverdue
                    ? "text-red-400"
                    : isDueSoon
                    ? "text-yellow-400"
                    : "text-white/60"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    isOverdue
                      ? "text-red-400"
                      : isDueSoon
                      ? "text-yellow-400"
                      : "text-white"
                  }`}
                >
                  {daysLabel}
                </p>
                <p className="text-white/60 text-sm">
                  Fecha de vencimiento:{" "}
                  {new Date(paymentData.due_date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {isOverdue && <AlertTriangle className="w-6 h-6 text-red-400" />}
            </div>
          </Card>
        )}

        {/* Main Info Card */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h2 className="text-white font-semibold text-lg mb-4">
            Información del Pago
          </h2>
          <div className="space-y-4">
            {paymentData.category_name && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-white/60 mt-0.5" />
                <div>
                  <p className="text-white/60 text-sm">Categoría</p>
                  <p className="text-white font-medium">
                    {paymentData.category_icon} {paymentData.category_name}
                  </p>
                  {paymentData.subcategory_name && (
                    <p className="text-white/70 text-sm mt-1">
                      {paymentData.subcategory_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentData.account_name && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-white/60 mt-0.5" />
                <div>
                  <p className="text-white/60 text-sm">Cuenta sugerida</p>
                  <p className="text-white font-medium">
                    {paymentData.account_icon} {paymentData.account_name}
                  </p>
                </div>
              </div>
            )}

            {paymentData.debt_name && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-white/60 mt-0.5" />
                <div>
                  <p className="text-white/60 text-sm">Deuda relacionada</p>
                  <p className="text-white font-medium">
                    {paymentData.debt_name}
                  </p>
                </div>
              </div>
            )}

            {paymentData.loan_debtor_name && (
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-white/60 mt-0.5" />
                <div>
                  <p className="text-white/60 text-sm">Préstamo relacionado</p>
                  <p className="text-white font-medium">
                    {paymentData.loan_debtor_name}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-white/60 mt-0.5" />
              <div>
                <p className="text-white/60 text-sm">Monto</p>
                <p className="text-[#00D09E] font-bold text-xl">
                  {formatCurrency(paymentData.amount)}
                </p>
              </div>
            </div>

            {paymentData.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-white/60 mt-0.5" />
                <div>
                  <p className="text-white/60 text-sm">Notas</p>
                  <p className="text-white/90 mt-1">{paymentData.notes}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Transaction Info if Paid */}
        {paymentData.status === "paid" && paymentData.transaction_id && (
          <Card className="bg-green-500/10 border-green-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <h2 className="text-white font-semibold text-lg">
                Pago Registrado
              </h2>
            </div>
            <div className="space-y-2">
              {paymentData.account_name && (
                <div className="flex justify-between">
                  <p className="text-white/60">Cuenta utilizada:</p>
                  <p className="text-white font-medium">
                    {paymentData.account_name}
                  </p>
                </div>
              )}
              {paymentData.transaction_date && (
                <div className="flex justify-between">
                  <p className="text-white/60">Fecha de pago:</p>
                  <p className="text-white font-medium">
                    {new Date(paymentData.transaction_date).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        {paymentData.status === "pending" ||
        paymentData.status === "overdue" ? (
          <div className="space-y-3">
            <Button
              onClick={() => setOpenMarkPaid(true)}
              className="w-full bg-[#00D09E] text-white hover:bg-[#00D09E]/90"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Marcar como Pagado
            </Button>
            <Button
              onClick={() => setOpenDelete(true)}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Eliminar Pago Pendiente
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setOpenDelete(true)}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Eliminar Registro
          </Button>
        )}
      </div>
    </div>
  );
}
