import { ApiResponse, Expenses, TotalBalance } from "@/dashboard/types";
import { formatCurrency } from "@/dashboard/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MainDetailsProps {
  balanceData: ApiResponse<TotalBalance>;
  expensesData: ApiResponse<Expenses>;
}
export function MainDetails({ balanceData, expensesData }: MainDetailsProps) {
  const totalBalance = balanceData?.data.total_balance || 0;
  const totalExpenses = expensesData?.data.total.total_expenses || 0;

  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-[#F1FFF3] rounded flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-8 h-8 text-[#F1FFF3]" />
          </div>
          <p className="text-[#F1FFF3] text-xs font-normal">Total Balance</p>
        </div>
        <p className="text-xl font-bold text-[#F1FFF3] truncate">
          {formatCurrency(totalBalance)}
        </p>
      </div>

      <div className="w-px h-12 bg-[#DFF7E2] flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-[#F1FFF3] rounded flex items-center justify-center flex-shrink-0">
            <ArrowDownRight className="w-8 h-8 text-[#F1FFF3]" />
          </div>
          <p className="text-[#F1FFF3] text-xs">Total Expense</p>
        </div>
        <p className="text-xl font-bold text-[#3299FF] truncate">
          -{formatCurrency(totalExpenses)}
        </p>
      </div>
    </>
  );
}
