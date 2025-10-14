import {
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Check,
} from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { Greeting } from "./components/Greeting";
import { useTotalBalance, useExpensesTotal, useExpenses } from "./hooks/useMainDetails";
import { Spinner } from "@/components/ui/spinner";

export function DashboardContainer() {
  // TODO: Reemplazar con el userId real del usuario autenticado
  const userId = 1;

  // Obtener balance total
  const { data: balanceData, isLoading: isLoadingBalance } = useTotalBalance(userId);
  
  // Obtener total de gastos
  const { data: expensesData, isLoading: isLoadingExpenses } = useExpensesTotal(userId);
  
  // Obtener últimas transacciones de gastos (últimos 10)
  const { data: recentExpensesData, isLoading: isLoadingRecent } = useExpenses({
    userId,
    limit: 10,
    offset: 0,
  });

  const totalBalance = balanceData?.data.total_balance || 0;
  const totalExpenses = expensesData?.total.total_expenses || 0;
  const recentExpenses = recentExpensesData?.data || [];

  // Calcular porcentaje de gastos vs balance
  const expensePercentage = totalBalance > 0 
    ? Math.round((totalExpenses / totalBalance) * 100) 
    : 0;

  // Determinar mensaje según porcentaje
  const getExpenseMessage = (percentage: number) => {
    if (percentage <= 30) return "Of Your Expenses, Looks Good.";
    if (percentage <= 50) return "Of Your Expenses, Keep an Eye on it.";
    if (percentage <= 70) return "Of Your Expenses, Consider Reducing.";
    return "Of Your Expenses, Too High!";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-base font-semibold mb-1">
              Hi, Welcome Back Stephano F.
            </h1>
            <Greeting />
          </div>
          <button className="bg-[#DFF7E2] backdrop-blur-sm rounded-full p-2">
            <Bell className="w-6 h-6 text-black" />
          </button>
        </div>
      </header>

      <div className="px-6 ">
        <div className="flex items-start justify-between mb-6 gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 border-2 border-[#F1FFF3] rounded flex items-center justify-center">
                <ArrowUpRight className="w-10 h-10 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-sm font-normal">
                Total Balance
              </p>
            </div>
            {isLoadingBalance ? (
              <Spinner className="w-6 h-6 text-[#F1FFF3]" />
            ) : (
              <p className="text-2xl font-bold text-[#F1FFF3]">
                {formatCurrency(totalBalance)}
              </p>
            )}
          </div>

          <div className="w-px h-15 bg-[#DFF7E2]" />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 border-2   border-[#F1FFF3] rounded flex items-center justify-center">
                <ArrowDownRight className="w-10 h-10 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-sm">Total Expense</p>
            </div>
            {isLoadingExpenses ? (
              <Spinner className="w-6 h-6 text-[#3299FF]" />
            ) : (
              <p className="text-2xl font-bold text-[#3299FF]">
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

      <div className="bg-[#093030] space-y-4 border rounded-t-[50px] flex-1 overflow-hidden">
        <div className="mx-6 mt-6 h-20 bg-[#00D09E] rounded-lg mb-[0px]"></div>
        
        {isLoadingRecent ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-8 h-8 text-[#F1FFF3]" />
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="px-4 pt-6 text-center">
            <p className="text-[#F1FFF3]/60 text-sm">No recent expenses</p>
          </div>
        ) : (
          <div className="px-4 pt-6 flex flex-col gap-8 overflow-y-auto pb-24">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center gap-4">
                <div 
                  className="rounded-2xl p-4"
                  style={{ 
                    backgroundColor: expense.category_color 
                      ? `${expense.category_color}20` 
                      : 'rgba(59, 130, 246, 0.2)' 
                  }}
                >
                  <span className="text-xl">
                    {expense.category_icon || '💰'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F1FFF3] font-semibold text-base truncate">
                    {expense.description || expense.category_name || 'Expense'}
                  </p>
                  <p className="text-[#3299FF] text-xs font-semibold whitespace-nowrap">
                    {formatDate(expense.transaction_date)}
                  </p>
                </div>

                {expense.subcategory_name && (
                  <div className="text-center border-x-1 border-[#00D09E] self-stretch flex items-center px-2">
                    <p className="text-[#F1FFF3] text-xs truncate max-w-[60px]">
                      {expense.subcategory_name}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[#FF6B6B] font-bold text-sm whitespace-nowrap">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
