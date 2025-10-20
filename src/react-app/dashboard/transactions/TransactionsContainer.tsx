import { ArrowLeft } from "lucide-react";
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
  console.log(transactions);

  return (
    <div className="flex flex-col h-full bg-[#093030]">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-[#00352F] to-[#093030]">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-[#DFF7E2] backdrop-blur-sm rounded-full p-2"
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <h1 className="text-2xl font-bold text-[#F1FFF3]">
            All Transactions
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-8 h-8 text-[#F1FFF3]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#F1FFF3]/60 text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-6">
            {transactions.map((expense) => (
              <button
                key={expense.id}
                onClick={() =>
                  navigate(`${expense.id}/transactions`)
                }
                className="flex items-center gap-3 bg-[#0A3A3A] hover:bg-[#0D4444] rounded-xl p-4 transition-all duration-200 active:scale-95 w-full text-left"
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[#3299FF] text-xs font-medium">
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
                  <p
                    className={`font-bold text-base whitespace-nowrap ${
                      expense.type === "income"
                        ? "text-[#00D09E]"
                        : "text-[#FF6B6B]"
                    }`}
                  >
                    {expense.type === "income" ? "" : "-"}
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
