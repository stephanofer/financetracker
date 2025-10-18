import { Bell, ArrowUpRight, Check } from "lucide-react";
import { useNavigate, useLoaderData } from "react-router";
import { BottomNav } from "@/dashboard/components/BottomNav";
import { Greeting } from "@/dashboard/components/Greeting";
import { useTotalBalance, useExpenses } from "@/dashboard/hooks/useMainDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/dashboard/types";
import { MainDetails } from "./components/home/MainDetails";
import { SavingsCard } from "./components/home/SavingsCard";
import { formatCurrency, formatDate } from "@/dashboard/utils";

export function DashboardContainer() {
  const navigate = useNavigate();

  const user = useLoaderData() as User;

  const { data: balanceData, isPending: isLoadingBalance } = useTotalBalance();

  const { data: expensesData, isPending: isLoadingExpenses } = useExpenses({
    limit: 10,
  });

  const recentExpenses = expensesData?.data.results || [];

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-base font-semibold mb-1">
              Hi, Welcome Back {(() => {
                const name = user.full_name || user.username || "";
                const parts = name.split(" ");
                if (parts.length > 1) {
                  return `${parts[0]} ${parts[1][0]}.`;
                }
                return name;
              })()}
            </h1>
            <Greeting />
          </div>
          <button className="bg-[#DFF7E2] backdrop-blur-sm rounded-full p-2">
            <Bell className="w-6 h-6 text-black" />
          </button>
        </div>
      </header>

      <div className="px-6 ">
        <div className="flex items-start justify-between mb-6 gap-4">
          {isLoadingBalance || isLoadingExpenses ? (
            <div className="flex flex-col w-full gap-4">
              <Skeleton className="h-32 w-full rounded-3xl bg-white/5" />
              <div className="flex gap-4">
                <Skeleton className="h-24 w-1/2 rounded-3xl bg-white/5" />
                <Skeleton className="h-24 w-1/2 rounded-3xl bg-white/5" />
              </div>
            </div>
          ) : balanceData && expensesData ? (
            <MainDetails
              balanceData={balanceData}
              expensesData={expensesData}
            />
          ) : null}
        </div>


      </div>

      <div className="px-6 mb-4">
        <div className="relative bg-[#F1FFF3] rounded-full h-7 shadow-sm">
          <div
            className="absolute left-0 top-0 h-full bg-[#031314] rounded-l-full transition-all duration-500 ease-out"
            style={{ width: "35%" }}
          />
          <div className="relative flex items-center justify-between px-4 h-full">
            <span className="text-white font-bold text-xs z-10 drop-shadow-md">
              35%
            </span>
            <span className="text-[#052224] font-semibold text-xs">
              $12,450.00
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 flex items-center gap-2 mb-6">
        <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
        <p className="text-white/90 text-sm">
          You're doing great! Keep track of your.
        </p>
      </div>

      <div className="bg-[#093030] border rounded-t-[50px] flex-1 overflow-y-auto pb-[80px]">
        <div className="space-y-4">
          {/* Savings Card */}
          <div className="px-6 pb-6 pt-4 m-0">
            <SavingsCard 
              savingsPercentage={35}
              revenueLastWeek={4000}
              foodLastWeek={100}
            />
          </div>
        
          {isLoadingExpenses ? (
            <div className="px-4 pt-4 flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-14 w-14 rounded-xl bg-white/5 flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-4 w-3/4 bg-white/5 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 bg-white/5 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-20 bg-white/5 rounded-lg flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="px-4 pt-6 text-center">
              <p className="text-[#F1FFF3]/60 text-sm">No recent expenses</p>
            </div>
          ) : (
            <>
              <div className="px-4 flex flex-col gap-2">
                {recentExpenses.map((expense) => (
                  <button
                    key={expense.id}
                    onClick={() =>
                      navigate(`/transaction/${expense.id}/dashboard`)
                    }
                    className="flex items-center gap-3 w-full text-left hover:bg-[#0A3A3A]/50 rounded-xl p-2 transition-all duration-200 active:scale-98"
                  >
                    <div
                      className="rounded-xl p-3 flex-shrink-0"
                      style={{
                        backgroundColor: expense.category_color
                          ? `${expense.category_color}20`
                          : "rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      <span className="text-2xl">
                        {expense.category_icon || "💰"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F1FFF3] font-semibold text-base truncate">
                        {expense.category_name || "Expense"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[#3299FF] text-xs font-medium whitespace-nowrap">
                          {formatDate(expense.transaction_date)}
                        </p>
                        {expense.subcategory_name && (
                          <>
                            <span className="text-[#F1FFF3]/40">•</span>
                            <p className="text-[#F1FFF3]/70 text-xs truncate">
                              {expense.subcategory_name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <p className={`font-bold text-base whitespace-nowrap ${
                        expense.type === 'income' 
                          ? 'text-[#00D09E]' 
                          : 'text-[#FF6B6B]'
                      }`}>
                        {expense.type === 'income' ? '' : '-'}{formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-4 pb-6 pt-4">
                <button
                  onClick={() => navigate("/transactions")}
                  className="w-full bg-gradient-to-r from-[#00D09E] to-[#00B589] hover:from-[#00B589] hover:to-[#009973] transition-all duration-300 text-[#093030] font-bold py-2 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transform flex items-center justify-center gap-2"
                >
                  <span>Ver más transacciones</span>
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
