import {
  AlertCircle,
  Calendar,
  Check,
  Plus,
  TrendingDown
} from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "../utils";
import { CreateDebtForm } from "./forms/CreateDebtForm";
import { useDebts } from "./hooks/useDebts";

export function DebtsContainer() {
  const { data, isPending, error } = useDebts();
  const [filter, setFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224]">
        <span className="text-red-400 text-lg">Error al cargar las deudas</span>
      </div>
    );
  }

  const summary = data?.data?.summary ?? {
    total_pending_debt: 0,
    total_paid: 0,
  };
  const debts = data?.data?.debts ?? [];

  // Cálculos
  const totalDebt = summary.total_pending_debt + summary.total_paid;
  const paidDebt = summary.total_paid;
  const progress = totalDebt > 0 ? Math.round((paidDebt / totalDebt) * 100) : 0;

  // Utilidades adaptadas
  const getDaysUntilDue = (dueDate: string | null): number => {
    if (!dueDate) return 9999; // Si no hay fecha, lo consideramos "sin urgencia"
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, daysUntil: number) => {
    if (status === "overdue" || daysUntil < 0) {
      return {
        text: "Vencida",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      };
    }
    if (daysUntil <= 7) {
      return {
        text: "Urgente",
        color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      };
    }
    return {
      text: "Al día",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
    };
  };

  const filteredDebts = debts.filter((debt) => {
    const daysUntil = getDaysUntilDue(debt.due_date);
    if (filter === "all") return true;
    if (filter === "overdue") return debt.status === "overdue" || daysUntil < 0;
    if (filter === "urgent") return daysUntil <= 7 && daysUntil >= 0;
    if (filter === "active") return daysUntil > 7;
    return true;
  });

  // Contadores para los filtros
  const overdueCount = debts.filter(
    (d) => d.status === "overdue" || getDaysUntilDue(d.due_date) < 0
  ).length;
  const urgentCount = debts.filter(
    (d) => getDaysUntilDue(d.due_date) <= 7 && getDaysUntilDue(d.due_date) >= 0
  ).length;
  const activeCount = debts.filter(
    (d) => getDaysUntilDue(d.due_date) > 7
  ).length;

  return (
    <>
      <Dialog
        open={openDialog}
        onOpenChange={() => {
          setOpenDialog(false);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              ¿Otra deuda más? ¡Claro, qué podría salir mal!
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {openDialog && (
              <CreateDebtForm handleClose={() => setOpenDialog(false)} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224]">
        {/* Header con mejor jerarquía */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Mis Deudas</h1>
              <p className="text-white/60 text-sm">
                Mantén el control de tus finanzas
              </p>
            </div>
            <button
              onClick={() => setOpenDialog(true)}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/20 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Tarjeta de progreso mejorada o Skeleton */}
          {isPending ? (
            <Skeleton className="h-[140px] w-full bg-white/10 rounded-3xl p-5 border border-white/20" />
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white/70 text-xs mb-1">Total adeudado</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(summary.total_pending_debt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs mb-1">Pagado</p>
                  <p className="text-xl font-semibold text-[#00D09E]">
                    {formatCurrency(summary.total_paid)}
                  </p>
                </div>
              </div>

              {/* Barra de progreso rediseñada */}
              <div className="relative bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-white/80 text-sm font-medium">
                  {progress}% completado
                </span>
                <span className="text-white/60 text-xs">
                  ${totalDebt.toLocaleString()} total
                </span>
              </div>
            </div>
          )}

          {/* Mensaje motivacional condicional */}
          {progress >= 50 ? (
            <div className="flex items-center gap-2 mt-4 bg-green-500/10 rounded-2xl p-3 border border-green-500/20">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm font-medium">
                ¡Excelente! Estás a mitad de camino
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4 bg-blue-500/10 rounded-2xl p-3 border border-blue-500/20">
              <TrendingDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-blue-400 text-sm font-medium">
                Sigue así, cada pago cuenta
              </p>
            </div>
          )}
        </header>

        {/* Filtros */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {isPending ? (
              <>
                <Skeleton className="h-8 w-20 rounded-xl bg-white/20" />
                <Skeleton className="h-8 w-24 rounded-xl bg-white/20" />
                <Skeleton className="h-8 w-24 rounded-xl bg-white/20" />
                <Skeleton className="h-8 w-24 rounded-xl bg-white/20" />
              </>
            ) : (
              [
                { id: "all", label: "Todas", count: debts.length },
                { id: "overdue", label: "Vencidas", count: overdueCount },
                { id: "urgent", label: "Urgentes", count: urgentCount },
                { id: "active", label: "Al día", count: activeCount },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    filter === id
                      ? "bg-white text-[#052224]"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {label} {count > 0 && `(${count})`}
                </button>
              ))
            )}
          </div>
        </div>
        {/* Lista de deudas mejorada */}
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          {isPending ? (
            <div className="space-y-3">
              {/* Skeleton de una sola card */}
              <Skeleton className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 h-[148px] w-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-xl p-3 flex-shrink-0 bg-white/10 w-12 h-12" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="h-4 w-24 bg-white/20 rounded" />
                      <div className="h-4 w-14 bg-white/20 rounded" />
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-3">
                      <div className="h-3 w-20 bg-white/20 rounded" />
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <div className="h-4 w-20 bg-white/20 rounded" />
                      <div className="h-4 w-20 bg-white/20 rounded" />
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden" />
                    <div className="h-3 w-16 bg-white/10 rounded mt-1 ml-auto" />
                  </div>
                </div>
              </Skeleton>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 text-sm">
                No hay deudas en esta categoría
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDebts.map((debt) => {
                const paid = debt.original_amount - debt.remaining_amount;
                const debtProgress =
                  debt.original_amount > 0
                    ? Math.round((paid / debt.original_amount) * 100)
                    : 0;
                const daysUntil = getDaysUntilDue(debt.due_date);
                const statusBadge = getStatusBadge(
                  debt.status ?? "",
                  daysUntil
                );
                const remaining = debt.remaining_amount;
                // Icono y color por tipo (puedes personalizar más)
                const icon = debt.type === "person" ? "💳" : "💸";
                const color = debt.type === "person" ? "#FF6B6B" : "#3299FF";

                return (
                  <div
                    key={debt.id}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="rounded-xl p-3 flex-shrink-0"
                        style={{ backgroundColor: color + "30" }}
                      >
                        <span className="text-2xl">{icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-white font-semibold text-base truncate">
                            {debt.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium border whitespace-nowrap ${statusBadge.color}`}
                          >
                            {statusBadge.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/60 mb-3">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {debt.due_date
                              ? daysUntil < 0
                                ? `Vencida hace ${Math.abs(daysUntil)} días`
                                : daysUntil === 0
                                ? "Vence hoy"
                                : `Vence en ${daysUntil} días`
                              : "Sin fecha de vencimiento"}
                          </span>
                          {daysUntil <= 7 && daysUntil >= 0 && (
                            <AlertCircle className="w-3.5 h-3.5 text-orange-400 ml-1" />
                          )}
                        </div>

                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/70">
                            Restante:{" "}
                            <span className="font-bold text-[#FF6B6B]">
                              ${remaining.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-white/70">
                            Pagado:{" "}
                            <span className="font-semibold text-[#00D09E]">
                              ${paid.toLocaleString()}
                            </span>
                          </span>
                        </div>

                        <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${debtProgress}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-white/50 mt-1 text-right">
                          {debtProgress}% pagado
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* <div className="pt-4">
            <button className="w-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] hover:shadow-2xl hover:shadow-[#00D09E]/50 transition-all duration-300 text-[#052224] font-bold py-4 px-6 rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-2">
              <span>Registrar pago</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div> */}
        </div>

        {/* Botón flotante mejorado */}
      </div>
    </>
  );
}
