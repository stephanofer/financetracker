import { formatCurrency } from "@/dashboard/utils/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MainDetailsProps {
  total: {
    total_balance: number;
    total_expenses: number;
  };
}

export function MainDetails({ total }: MainDetailsProps) {
  const totalBalance = total.total_balance || 0;
  const totalExpenses = total.total_expenses || 0;

  return (
    <>
      <div className="flex items-stretch gap-4 w-full">
        {/* Total Balance Card */}
        <div className="flex-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-500/30 border-2 border-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <ArrowUpRight
                className="w-4 h-4 text-emerald-400"
                strokeWidth={3}
              />
            </div>
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">
              Balance
            </p>
          </div>
          <p className="text-lg font-bold text-white truncate drop-shadow-md">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        {/* Total Expense Card */}
        <div className="flex-1 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-5 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500/30 border-2 border-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <ArrowDownRight
                className="w-4 h-4 text-blue-400"
                strokeWidth={3}
              />
            </div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">
              Expense
            </p>
          </div>
          <p className="text-lg font-bold text-white truncate drop-shadow-md">
            -{formatCurrency(totalExpenses)}
          </p>
          {/* Ver todas las cuentas */}
        </div>
      </div>
    </>
  );
}
