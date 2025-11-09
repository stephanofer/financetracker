import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/dashboard/utils/utils";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  User,
  Building2,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useDebtDetail } from "./hooks/useDebts";

export function DebtsDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useDebtDetail(Number(id));

  const debtDetail = data?.data;
  const debt = debtDetail?.debt;
  const payments = debtDetail?.payments;
  const installments = debtDetail?.installments;
  const summary = debtDetail?.summary;

  // Status colors and labels
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          color: "#10b981",
          bg: "bg-emerald-500/20",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          label: "Pagado",
          icon: CheckCircle2,
        };
      case "active":
        return {
          color: "#3b82f6",
          bg: "bg-blue-500/20",
          border: "border-blue-500/30",
          text: "text-blue-400",
          label: "Activo",
          icon: Clock,
        };
      case "overdue":
        return {
          color: "#ef4444",
          bg: "bg-red-500/20",
          border: "border-red-500/30",
          text: "text-red-400",
          label: "Vencido",
          icon: AlertCircle,
        };
      default:
        return {
          color: "#64748b",
          bg: "bg-slate-500/20",
          border: "border-slate-500/30",
          text: "text-slate-400",
          label: status,
          icon: Clock,
        };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "person":
        return { icon: User, label: "Persona" };
      case "institution":
        return { icon: Building2, label: "Institución" };
      case "credit_card":
        return { icon: CreditCard, label: "Tarjeta de Crédito" };
      case "loan":
        return { icon: DollarSign, label: "Préstamo" };
      case "mortgage":
        return { icon: Building2, label: "Hipoteca" };
      default:
        return { icon: Receipt, label: "Otro" };
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="px-6 pt-8 pb-6">
          <Skeleton className="w-32 h-8 mb-8" />
          <Skeleton className="w-full h-64 rounded-3xl mb-6" />
          <Skeleton className="w-full h-32 rounded-3xl mb-4" />
          <Skeleton className="w-full h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!debt || !debtDetail) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 mx-auto">
            <Receipt className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-slate-400 text-lg mb-2">Deuda no encontrada</p>
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

  const statusConfig = getStatusConfig(debt.status || "active");
  const typeConfig = getTypeConfig(debt.type);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-y-auto">
      {/* Animated background orbs - Mucho menos luminosos */}
      {/* <div
        className="fixed top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.02] pointer-events-none"
        style={{ 
          backgroundColor: statusConfig.color,
          animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }}
      />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" 
        style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
      /> */}

      {/* Header - Ahora hace scroll con el contenido */}
      <header className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-slate-400 text-sm font-medium">
            Detalle de Deuda
          </span>
        </div>

        {/* Main Debt Card - Más compacta */}
        <div
          className="relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/20 p-5 shadow-2xl mb-4"
          style={{
            background: `linear-gradient(135deg, ${statusConfig.color}20, ${statusConfig.color}05)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

          <div className="relative z-10">
            {/* Header: Name, Type & Status - Más compacto */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${statusConfig.bg} border ${statusConfig.border}`}
                >
                  <TypeIcon className={`w-6 h-6 ${statusConfig.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-white font-bold text-xl mb-1 truncate">
                    {debt.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                      {typeConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Display - Más compacto */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs uppercase tracking-wider">
                  Monto Original
                </p>
                <p className="text-white font-bold text-lg">
                  {formatCurrency(debt.original_amount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-xs uppercase tracking-wider">
                  Saldo Pendiente
                </p>
                <p
                  className={`font-bold text-lg ${
                    debt.remaining_amount === 0
                      ? "text-emerald-400"
                      : "text-orange-400"
                  }`}
                >
                  {formatCurrency(debt.remaining_amount)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {summary && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progreso de Pago</span>
                  <span className="text-emerald-400 font-bold">
                    {summary.payment_progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/20"
                    style={{ width: `${summary.payment_progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content Section */}
      <div className="relative z-10 px-6 pb-24 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Interest Rate */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-slate-400 text-xs">Interés</span>
            </div>
            <p className="text-white font-bold text-lg">
              {debt.interest_rate}%
            </p>
          </div>

          {/* Days Since Start */}
          {summary && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-slate-400 text-xs">Días Activos</span>
              </div>
              <p className="text-white font-bold text-lg">
                {summary.days_since_start}
              </p>
            </div>
          )}

          {/* Total Payments */}
          {payments && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-400 text-xs">Pagos Totales</span>
              </div>
              <p className="text-emerald-400 font-bold text-lg">
                {formatCurrency(payments.statistics.total_amount)}
              </p>
            </div>
          )}

          {/* Payment Count */}
          {payments && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-slate-400 text-xs">N° Pagos</span>
              </div>
              <p className="text-white font-bold text-lg">
                {payments.statistics.total_payments}
              </p>
            </div>
          )}
        </div>

        {/* Dates Section */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Información de Fechas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Fecha de Inicio</span>
              <span className="text-white text-sm font-medium">
                {new Date(debt.start_date).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {debt.due_date && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Fecha de Vencimiento</span>
                <span className="text-white text-sm font-medium">
                  {new Date(debt.due_date).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {debt.payments.last_date && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Último Pago</span>
                <span className="text-emerald-400 text-sm font-medium">
                  {new Date(debt.payments.last_date).toLocaleDateString(
                    "es-PE",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payments History */}
        {payments && payments.list.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                Historial de Pagos
              </h2>
              <span className="text-slate-400 text-sm">
                {payments.statistics.total_payments}{" "}
                {payments.statistics.total_payments === 1 ? "pago" : "pagos"}
              </span>
            </div>

            <div className="space-y-3">
              {payments.list.map((payment, index) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
                  style={{
                    animation: "fadeIn 0.4s ease-out forwards",
                    animationDelay: `${index * 50}ms`,
                    opacity: 0,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Account Icon */}
                    {payment.account && (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg border"
                        style={{
                          backgroundColor: payment.account.color
                            ? `${payment.account.color}20`
                            : "rgba(148, 163, 184, 0.1)",
                          borderColor: payment.account.color
                            ? `${payment.account.color}30`
                            : "rgba(148, 163, 184, 0.2)",
                        }}
                      >
                        {payment.account.icon || "💳"}
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-base truncate">
                            {payment.description || "Pago de deuda"}
                          </h3>
                          {payment.account && (
                            <p className="text-slate-400 text-xs">
                              {payment.account.name}
                            </p>
                          )}
                        </div>
                        <span className="text-emerald-400 font-bold text-lg whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.transaction_date).toLocaleDateString(
                          "es-PE",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>
                      {payment.notes && (
                        <p className="text-slate-400 text-xs mt-2 italic">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Statistics */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 backdrop-blur-sm border border-emerald-500/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-emerald-400/70 text-xs mb-1">
                    Promedio por Pago
                  </p>
                  <p className="text-emerald-400 font-bold text-lg">
                    {formatCurrency(payments.statistics.average_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-400/70 text-xs mb-1">
                    Total Pagado
                  </p>
                  <p className="text-emerald-400 font-bold text-lg">
                    {formatCurrency(payments.statistics.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Payments State */}
        {payments && payments.list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
              <Receipt className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">
              Aún no se han registrado pagos
            </p>
          </div>
        )}

        {/* Installments Section (if applicable) */}
        {debt.has_installments &&
          installments &&
          installments.list.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Cuotas
                </h2>
                <span className="text-slate-400 text-sm">
                  {installments.statistics.paid} /{" "}
                  {installments.statistics.total}
                </span>
              </div>

              <div className="space-y-2">
                {installments.list.map((inst, index) => {
                  const instStatusConfig = getStatusConfig(inst.status);
                  return (
                    <div
                      key={inst.id}
                      className={`p-3 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border ${instStatusConfig.border}`}
                      style={{
                        animation: "fadeIn 0.3s ease-out forwards",
                        animationDelay: `${index * 30}ms`,
                        opacity: 0,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${instStatusConfig.bg} ${instStatusConfig.border} border flex items-center justify-center`}
                          >
                            <span className={`text-sm font-bold ${instStatusConfig.text}`}>
                              #{inst.installment_number}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {formatCurrency(inst.amount)}
                            </p>
                            <p className="text-slate-400 text-xs">
                              Vence:{" "}
                              {new Date(inst.due_date).toLocaleDateString(
                                "es-PE",
                                { day: "numeric", month: "short" }
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${instStatusConfig.bg} ${instStatusConfig.text}`}
                        >
                          {instStatusConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
