import { useAccounts } from "./hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router";
import { formatCurrency } from "@/dashboard/utils/utils";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";

export function AccountsContainer() {
  const { data, isPending } = useAccounts();
  const navigate = useNavigate();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const accounts = data?.data || [];

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      <header className="relative px-6 pt-8 pb-6 z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Mis Cuentas
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {accounts.length}{" "}
              {accounts.length === 1 ? "cuenta activa" : "cuentas activas"}
            </p>
          </div>
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all active:scale-95"
          >
            {balanceVisible ? (
              <Eye className="w-5 h-5 text-white" />
            ) : (
              <EyeOff className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Total Balance Card - Enhanced glassmorphism */}
        {isPending ? (
          <Skeleton className="h-32 w-full rounded-3xl" />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-white/20 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  Balance Total
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white tracking-tight">
                  {balanceVisible ? formatCurrency(totalBalance) : "••••••"}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-3">
                Actualizado hace instantes
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Accounts Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 relative z-10">
        {isPending ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                <span className="text-5xl">💼</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">+</span>
              </div>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              No tienes cuentas aún
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Comienza agregando tu primera cuenta bancaria o método de pago
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {accounts.map((acc, index) => (
              <button
                key={acc.id}
                onClick={() => navigate(`/dashboard/accounts/${acc.id}`)}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/20"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeIn 0.5s ease-out forwards",
                  opacity: 0,
                }}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-5 flex items-center gap-4">
                  {/* Icon with color accent */}
                  <div
                    className="rounded-2xl p-2 flex-shrink-0 text-3xl shadow-lg relative overflow-hidden"
                    style={{
                      backgroundColor: acc.color ? `${acc.color}20` : undefined,
                      border: acc.color
                        ? `1px solid ${acc.color}30`
                        : undefined,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{ backgroundColor: acc.color ?? undefined }}
                    />
                    <span className="relative z-10">{acc.icon || "🏦"}</span>
                  </div>

                  {/* Account info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm mb-1.5 truncate group-hover:text-emerald-400 transition-colors">
                      {acc.name}
                    </h3>
                    {acc.type && (
                      <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 capitalize">
                        {acc.type}
                      </span>
                    )}
                  </div>

                  {/* Balance with arrow indicator */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block font-bold text-base text-emerald-400 mb-0.5">
                        {balanceVisible ? formatCurrency(acc.balance) : "••••"}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Disponible
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
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
