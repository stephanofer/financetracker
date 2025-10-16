import { Bell, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import { useNavigate, useLoaderData } from "react-router";
import { BottomNav } from "@/dashboard/components/BottomNav";
import { Greeting } from "@/dashboard/components/Greeting";
import {
  useTotalBalance,
  useExpensesTotal,
  useExpenses,
} from "@/dashboard/hooks/useMainDetails";
import { Spinner } from "@/components/ui/spinner";
import { User } from "@/dashboard/types";

export function DashboardContainer() {
  const navigate = useNavigate();

  const user = useLoaderData() as User;


  // Obtener usuario autenticado desde el loader

  const userId = user.id;

  // Obtener balance total
  const { data: balanceData, isLoading: isLoadingBalance } =
    useTotalBalance(userId);

  // Obtener total de gastos
  const { data: expensesData, isLoading: isLoadingExpenses } =
    useExpensesTotal(userId);

  // Obtener últimas transacciones de gastos (solo 2)
  const { data: recentExpensesData, isLoading: isLoadingRecent } = useExpenses({
    userId,
    limit: 2,
    offset: 0,
  });

  const totalBalance = balanceData?.data.total_balance || 0;
  const totalExpenses = expensesData?.total.total_expenses || 0;
  const recentExpenses = recentExpensesData?.data || [];

  // Calcular porcentaje de gastos vs balance
  const expensePercentage =
    totalBalance > 0 ? Math.round((totalExpenses / totalBalance) * 100) : 0;

  // Determinar mensaje según porcentaje
  const getExpenseMessage = (percentage: number) => {
    if (percentage <= 30) return "Of Your Expenses, Looks Good.";
    if (percentage <= 50) return "Of Your Expenses, Keep an Eye on it.";
    if (percentage <= 70) return "Of Your Expenses, Consider Reducing.";
    return "Of Your Expenses, Too High!";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-base font-semibold mb-1">
              Hi, Welcome Back {user.full_name || user.username}
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-[#F1FFF3] rounded flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-8 h-8 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-xs font-normal">
                Total Balance
              </p>
            </div>
            {isLoadingBalance ? (
              <Spinner className="w-5 h-5 text-[#F1FFF3]" />
            ) : (
              <p className="text-xl font-bold text-[#F1FFF3] truncate">
                {formatCurrency(totalBalance)}
              </p>
            )}
          </div>

          <div className="w-px h-12 bg-[#DFF7E2] flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-[#F1FFF3] rounded flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-8 h-8 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-xs">Total Expense</p>
            </div>
            {isLoadingExpenses ? (
              <Spinner className="w-5 h-5 text-[#3299FF]" />
            ) : (
              <p className="text-xl font-bold text-[#3299FF] truncate">
                -{formatCurrency(totalExpenses)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="relative bg-[#F1FFF3] rounded-full h-8 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r bg-[#031314] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(expensePercentage, 100)}%` }}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F1FFF3] font-bold text-sm z-10">
            {expensePercentage}%
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#052224] font-semibold">
            {formatCurrency(totalBalance)}
          </div>
        </div>
      </div>

      <div className="px-6 flex items-center gap-2 mb-8">
        <div className="w-5 h-5 border-2 border-white rounded flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <p className="text-white/90 flex-1">
          {expensePercentage}% {getExpenseMessage(expensePercentage)}
        </p>
      </div>

      <div className="bg-[#093030] space-y-4 border rounded-t-[50px] flex-1 overflow-hidden flex flex-col">
        <div className="mx-6 mt-6 h-20 bg-[#00D09E] rounded-lg"></div>

        {isLoadingRecent ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-8 h-8 text-[#F1FFF3]" />
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="px-4 pt-6 text-center">
            <p className="text-[#F1FFF3]/60 text-sm">No recent expenses</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4 flex flex-col gap-4">
              {recentExpenses.map((expense) => (
                <button
                  key={expense.id}
                  onClick={() =>
                    navigate(`/transaction/${expense.id}/dashboard`)
                  }
                  className="flex items-center gap-3 w-full text-left hover:bg-[#0A3A3A]/50 rounded-xl p-2 -m-2 transition-all duration-200 active:scale-95"
                >
                  <div
                    className="rounded-xl p-3 flex-shrink-0"
                    style={{
                      backgroundColor: expense.category_color
                        ? `${expense.category_color}20`
                        : "rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <span className="text-lg">
                      {expense.category_icon || "💰"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F1FFF3] font-semibold text-sm truncate">
                      {expense.description ||
                        expense.category_name ||
                        "Expense"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[#3299FF] text-xs font-semibold whitespace-nowrap">
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
                    <p className="text-[#FF6B6B] font-bold text-sm whitespace-nowrap">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 pb-6 mt-6">
              <button
                onClick={() => navigate("/transactions")}
                className="w-full bg-gradient-to-r from-[#00D09E] to-[#00B589] hover:from-[#00B589] hover:to-[#009973] transition-all duration-300 text-[#093030] font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transform flex items-center justify-center gap-2"
              >
                <span>Ver más transacciones</span>
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
