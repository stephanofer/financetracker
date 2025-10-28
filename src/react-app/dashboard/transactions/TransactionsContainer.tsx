import { ArrowLeft, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router";
import { useTransactions } from "@/dashboard/hooks/useMainDetails";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/dashboard/utils";

export function TransactionsContainer() {
  const navigate = useNavigate();

  const { data: expensesData, isPending } = useTransactions({
    limit: 100,
    offset: 0,
  });

  const transactions = expensesData?.data || [];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <header className="relative z-10 px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-3 border border-emerald-500/30 hover:border-emerald-500/50 transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            All Transactions
          </h1>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-3 hover:border-white/20 transition-all active:scale-95">
            <Filter className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Transactions List */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-24">
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="w-8 h-8 text-emerald-400" />
              <span className="text-slate-400 text-sm">Loading transactions...</span>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
              <span className="text-5xl">📊</span>
            </div>
            <p className="text-slate-400 text-sm">No transactions found</p>
            <p className="text-slate-500 text-xs mt-2">Start tracking your expenses</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            {transactions.map((expense, index) => (
              <button
                key={expense.id}
                onClick={() => navigate(`${expense.id}/transactions`)}
                className="flex items-center gap-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:from-slate-800/60 hover:to-slate-900/60 backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-[0.98] w-full text-left shadow-lg hover:shadow-xl group"
                style={{
                  animation: 'fadeInUp 0.4s ease-out forwards',
                  animationDelay: `${index * 40}ms`,
                  opacity: 0
                }}
              >
                {/* Category Icon */}
                <div
                  className="rounded-xl p-3 flex-shrink-0 transition-transform group-hover:scale-110 shadow-lg"
                  style={{
                    backgroundColor: expense.category_color
                      ? `${expense.category_color}30`
                      : "rgba(59, 130, 246, 0.3)",
                    border: `2px solid ${expense.category_color || '#3b82f6'}40`
                  }}
                >
                  <span className="text-2xl">
                    {expense.category_icon || "💰"}
                  </span>
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate mb-1">
                    {expense.category_name || "Expense"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 text-xs font-medium whitespace-nowrap">
                      {formatDate(expense.transaction_date)}
                    </p>
                    {expense.subcategory_name && (
                      <>
                        <span className="text-slate-600">•</span>
                        <p className="text-slate-400 text-xs truncate">
                          {expense.subcategory_name}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p
                    className={`font-bold text-lg whitespace-nowrap ${
                      expense.type === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {expense.type === "income" ? "+" : "-"}
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 capitalize">
                    {expense.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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