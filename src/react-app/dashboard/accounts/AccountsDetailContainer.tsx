import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/dashboard/accounts/hooks/useAccounts";
import { formatCurrency } from "@/dashboard/utils";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  DollarSign,
  Eye,
  EyeOff,
  Plus,
  Repeat,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ActionType2 } from "../types";

export function AccountsDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useAccount(Number(id));
  const [balanceVisible, setBalanceVisible] = useState(true);

  console.log(data);

  const account = data?.data?.result;
  const transactions = data?.data?.transactions || [];

  const getTransactionIcon = (type: ActionType2) => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="w-5 h-5" />;
      case "expense":
        return <ArrowUpRight className="w-5 h-5" />;
      case "transfer":
        return <Repeat className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getTransactionColor = (type: ActionType2) => {
    switch (type) {
      case "income":
        return "text-emerald-400";
      case "expense":
        return "text-red-400";
      case "transfer":
        return "text-blue-400";
      default:
        return "text-slate-400";
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="px-6 pt-8 pb-6">
          <Skeleton className="w-32 h-8 mb-8" />
          <Skeleton className="w-full h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Cuenta no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background orbs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-20"
        style={{
          backgroundColor: account.color === null ? undefined : account.color,
        }}
      />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
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

        {/* Balance Card */}
        <div
          className="relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/20 p-6 shadow-2xl mb-4"
          style={{
            background: `linear-gradient(135deg, ${account.color}30, ${account.color}10)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

          <div className="relative z-10">
            {/* Account Name & Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{
                  backgroundColor: account.color ? account.color + "40" : undefined,
                  border: account.color ? `2px solid ${account.color}60` : undefined,
                }}
              >
                {account.icon}
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl">
                  {account.name}
                </h1>
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full capitalize mt-1"
                  style={{
                    backgroundColor: account.color ? account.color + "30" : undefined,
                    color: account.color || undefined,
                    border: account.color ? `1px solid ${account.color}40` : undefined,
                  }}
                >
                  {account.type}
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="">
              <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">
                Available balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {balanceVisible ? formatCurrency(account.balance) : "••••••"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Plus, label: "Add", color: "from-emerald-500 to-teal-500" },
            {
              icon: ArrowUpRight,
              label: "Send",
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: ArrowDownLeft,
              label: "Request",
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: Repeat,
              label: "Exchange",
              color: "from-orange-500 to-amber-500",
            },
          ].map((action, idx) => (
            <button
              key={idx}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all active:scale-95 group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Transactions Section */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-xl">Transactions</h2>
          <button className="text-emerald-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            See all
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-slate-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
                onClick={() =>
                  navigate(`/dashboard/transactions/${tx.id}/dashboard`)
                }
                style={{
                  animation: "fadeIn 0.4s ease-out forwards",
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                {/* Transaction Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${getTransactionColor(
                    tx.type
                  )
                    .replace("text-", "bg-")
                    .replace(
                      "400",
                      "500/20"
                    )} flex items-center justify-center border ${getTransactionColor(
                    tx.type
                  )
                    .replace("text-", "border-")
                    .replace("400", "500/30")}`}
                >
                  {getTransactionIcon(tx.type)}
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base mb-0.5 truncate">
                    {tx.description || "Transaction"}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {new Date(tx.transaction_date).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span
                    className={`font-bold text-lg ${getTransactionColor(
                      tx.type
                    )}`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                  <p className="text-slate-500 text-xs">
                    {tx.type === "income"
                      ? "Income"
                      : tx.type === "expense"
                      ? "Expense"
                      : "Transfer"}
                  </p>
                </div>
              </div>
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
