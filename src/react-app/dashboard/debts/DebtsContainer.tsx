import { Check, ArrowUpRight, TrendingDown, Plus, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";

export function DebtsContainer() {
  const [filter, setFilter] = useState("all");
  
  const totalDebt = 5400;
  const paidDebt = 2100;
  const progress = Math.round((paidDebt / totalDebt) * 100);
  
  const debts = [
    {
      id: 1,
      name: "Préstamo personal",
      type: "person",
      amount: 3200,
      paid: 1200,
      due: "2025-12-10",
      icon: "💳",
      color: "#FF6B6B",
      status: "active"
    },
    {
      id: 2,
      name: "Tarjeta de crédito",
      type: "institution",
      amount: 1500,
      paid: 700,
      due: "2025-11-05",
      icon: "💸",
      color: "#3299FF",
      status: "overdue"
    },
    {
      id: 3,
      name: "Préstamo auto",
      type: "institution",
      amount: 700,
      paid: 200,
      due: "2026-01-20",
      icon: "🚗",
      color: "#00D09E",
      status: "active"
    },
  ];

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, daysUntil: number) => {
    if (status === "overdue" || daysUntil < 0) {
      return { text: "Vencida", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (daysUntil <= 7) {
      return { text: "Urgente", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    }
    return { text: "Al día", color: "bg-green-500/20 text-green-400 border-green-500/30" };
  };

  const filteredDebts = debts.filter(debt => {
    if (filter === "all") return true;
    const daysUntil = getDaysUntilDue(debt.due);
    if (filter === "overdue") return debt.status === "overdue" || daysUntil < 0;
    if (filter === "urgent") return daysUntil <= 7 && daysUntil >= 0;
    if (filter === "active") return daysUntil > 7;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0A4A4A] to-[#052224]">
      {/* Header con mejor jerarquía */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Mis Deudas
            </h1>
            <p className="text-white/60 text-sm">Mantén el control de tus finanzas</p>
          </div>
          <button className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 hover:bg-white/20 transition-all active:scale-95">
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tarjeta de progreso mejorada */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-white/70 text-xs mb-1">Total adeudado</p>
              <p className="text-3xl font-bold text-white">${(totalDebt - paidDebt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs mb-1">Pagado</p>
              <p className="text-xl font-semibold text-[#00D09E]">${paidDebt.toLocaleString()}</p>
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
          {[
            { id: "all", label: "Todas", count: debts.length },
            { id: "overdue", label: "Vencidas", count: debts.filter(d => d.status === "overdue" || getDaysUntilDue(d.due) < 0).length },
            { id: "urgent", label: "Urgentes", count: debts.filter(d => getDaysUntilDue(d.due) <= 7 && getDaysUntilDue(d.due) >= 0).length },
            { id: "active", label: "Al día", count: debts.filter(d => getDaysUntilDue(d.due) > 7).length }
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
          ))}
        </div>
      </div>

      {/* Lista de deudas mejorada */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {filteredDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">No hay deudas en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDebts.map((debt) => {
              const debtProgress = Math.round((debt.paid / debt.amount) * 100);
              const daysUntil = getDaysUntilDue(debt.due);
              const statusBadge = getStatusBadge(debt.status, daysUntil);
              const remaining = debt.amount - debt.paid;

              return (
                <div
                  key={debt.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="rounded-xl p-3 flex-shrink-0"
                      style={{ backgroundColor: debt.color + '30' }}
                    >
                      <span className="text-2xl">{debt.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-base truncate">
                          {debt.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border whitespace-nowrap ${statusBadge.color}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-white/60 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {daysUntil < 0 
                            ? `Vencida hace ${Math.abs(daysUntil)} días` 
                            : daysUntil === 0 
                            ? "Vence hoy" 
                            : `Vence en ${daysUntil} días`
                          }
                        </span>
                        {daysUntil <= 7 && daysUntil >= 0 && (
                          <AlertCircle className="w-3.5 h-3.5 text-orange-400 ml-1" />
                        )}
                      </div>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/70">Restante: <span className="font-bold text-[#FF6B6B]">${remaining.toLocaleString()}</span></span>
                        <span className="text-white/70">Pagado: <span className="font-semibold text-[#00D09E]">${debt.paid.toLocaleString()}</span></span>
                      </div>
                      
                      <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ 
                            width: `${debtProgress}%`,
                            background: `linear-gradient(90deg, ${debt.color}, ${debt.color}dd)`
                          }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-1 text-right">{debtProgress}% pagado</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón flotante mejorado */}
      <div className="fixed bottom-6 left-0 right-0 px-6">
        <button
          className="w-full bg-gradient-to-r from-[#00D09E] to-[#00F5B8] hover:shadow-2xl hover:shadow-[#00D09E]/50 transition-all duration-300 text-[#052224] font-bold py-4 px-6 rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Registrar pago</span>
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}