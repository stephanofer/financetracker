import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/dashboard/home/components/Greeting";
import { useSummary } from "@/dashboard/hooks/useMainDetails";
import { User } from "@/dashboard/utils/types";
import { formatCurrency, formatDate } from "@/dashboard/utils/utils";
import { ArrowUpRight, Bell, Check, TrendingUp } from "lucide-react";
import { useNavigate, useRouteLoaderData } from "react-router";
import { MainDetails } from "@/dashboard/home/components/MainDetails";

export function DashboardContainer() {
  const navigate = useNavigate();
  const user = useRouteLoaderData<User>("dashboard");

  const { data: summaryData, isPending: isLoadingSummary } = useSummary({
    limit: 10,
  });

  const total = summaryData?.data.total;
  const transactions = summaryData?.data.results;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <header className="relative z-10 px-6 pt-8 pb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-base font-bold text-white mb-1">
              Hi, Welcome Back{" "}
              {(() => {
                const name = user?.full_name || user?.username || "";
                const parts = name.split(" ");
                if (parts.length > 1) {
                  return `${parts[0]} ${parts[1][0]}.`;
                }
                return name;
              })()}
            </h1>
            <Greeting />
          </div>
          <button className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-3 border border-emerald-500/30 hover:border-emerald-500/50 transition-all active:scale-95 shadow-lg">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </button>
        </div>
      </header>

      <div className="relative z-10 px-6 mb-4">
        {isLoadingSummary ? (
          <div className="flex gap-4">
            <Skeleton className="h-[118px] flex-1 rounded-3xl bg-white/5" />
            <Skeleton className="h-[118px] flex-1 rounded-3xl bg-white/5" />
          </div>
        ) : total ? (
          <div>
            <MainDetails total={total} />
          </div>
        ) : null}
        <div className="flex justify-end mt-2">
          <button
            className="group flex items-center gap-1 text-xs text-emerald-600 font-medium bg-transparent px-0 py-0 border-none focus:outline-none hover:underline hover:text-emerald-800 transition-colors duration-200"
            aria-label="Ver todas las cuentas"
            onClick={() => navigate("accounts")}
          >
            Ver todas las cuentas
            <svg
              className="ml-1 group-hover:translate-x-1 transition-transform duration-200"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 10h10M10 5l5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 px-6 mb-4">
        <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl h-9 shadow-lg border border-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-l-2xl transition-all duration-700 ease-out shadow-lg"
            style={{ width: "35%" }}
          />
          <div className="relative flex items-center justify-between px-5 h-full">
            <div className="flex items-center gap-2 z-10">
              <TrendingUp className="w-4 h-4 text-white drop-shadow-lg" />
              <span className="text-white font-bold text-sm drop-shadow-lg">
                35%
              </span>
            </div>
            <span className="text-white/80 font-semibold text-sm">
              $12,450.00
            </span>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="relative z-10 px-6 flex items-center gap-3 mb-6">
        <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
        <p className="text-slate-300 text-xs font-medium">
          You're doing great! Keep track of your.
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border-t border-white/10 rounded-t-[40px] flex-1 overflow-y-auto pb-24 relative z-10 shadow-2xl">
        <div className="space-y-4">

          {isLoadingSummary ? (
            <div className="px-6 flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/5"
                >
                  <Skeleton className="h-14 w-14 rounded-xl bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/10 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 bg-white/10 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-20 bg-white/10 rounded-lg flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : transactions?.length === 0 ? (
            <div className="px-6 pt-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
                <span className="text-4xl">📊</span>
              </div>
              <p className="text-slate-400 text-sm">No recent transactions</p>
            </div>
          ) : (
            <>
              <div className="px-6 flex flex-col gap-3">
                {transactions?.map((expense, index) => (
                  <button
                    key={expense.id}
                    onClick={() =>
                      navigate(`transactions/${expense.id}/dashboard`)
                    }
                    className="flex items-center gap-4 w-full text-left bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:from-slate-800/60 hover:to-slate-900/60 backdrop-blur-sm rounded-2xl p-3 transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-[0.98] shadow-lg hover:shadow-xl group"
                    style={{
                      animation: "fadeInUp 0.4s ease-out forwards",
                      animationDelay: `${index * 50}ms`,
                      opacity: 0,
                    }}
                  >
                    {/* Category Icon */}
                    <div
                      className="rounded-xl p-2 flex-shrink-0 shadow-lg transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: expense.category_color
                          ? `${expense.category_color}30`
                          : "rgba(59, 130, 246, 0.3)",
                        border: `2px solid ${
                          expense.category_color || "#3b82f6"
                        }40`,
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
                    <div className="flex-shrink-0">
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
                    </div>
                  </button>
                ))}
              </div>

              {/* View More Button */}
              <div className="px-6 pb-6 pt-4">
                <button
                  onClick={() => navigate("/dashboard/transactions")}
                  className="group w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-400/30 shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 text-white font-semibold text-base tracking-tight hover:from-emerald-600 hover:to-teal-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  aria-label="Ver más transacciones"
                  style={{ letterSpacing: "0.01em" }}
                >
                  <span className="drop-shadow-sm">Ver más transacciones</span>
                  <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </>
          )}
        </div>
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
