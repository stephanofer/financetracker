import {
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Wallet,
} from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { Greeting } from "./components/Greeting";

export function DashboardContainer() {
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
            <p className="text-2xl font-bold text-[#F1FFF3] ">S/7,783.00</p>
          </div>

          <div className="w-px h-15 bg-[#DFF7E2]" />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 border-2   border-[#F1FFF3] rounded flex items-center justify-center">
                <ArrowDownRight className="w-10 h-10 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-sm">Total Expense</p>
            </div>
            <p className="text-2xl font-bold text-[#3299FF]">-$1.187.40</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="relative bg-[#F1FFF3] rounded-full h-8 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[30%] bg-gradient-to-r bg-[#031314] rounded-full " />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F1FFF3] font-bold text-sm">
            30%
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#052224] font-semibold">
            $20,000.00
          </div>
        </div>
      </div>

      <div className="px-6 flex items-center gap-2 mb-8">
        <div className="w-5 h-5 border-2 border-white rounded flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <p className="text-white/90 flex-1">
          30% Of Your Expenses, Looks Good.
        </p>
      </div>

      <div className="bg-[#093030] space-y-4 border rounded-t-[50px] flex-1">
        <div className="mx-6 mt-10 h-20 bg-[#00D09E] rounded-lg mb-[0px]"></div>
        <div className="px-4 pt-6 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 rounded-2xl p-4">
              <Wallet className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-[#F1FFF3] font-semibold text-base">Salary</p>
              <p className="text-[#3299FF] text-xs font-semibold whitespace-nowrap">
                18:27 - April 30
              </p>
            </div>

            <div className="text-center border-x-1 border-[#00D09E] self-stretch flex items-center px-2">
              <p className="text-[#F1FFF3] text-xs">Monthly</p>
            </div>

            <div>
              <p className="text-[#3299FF] font-bold text-sm">$ 4,000,00</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 rounded-2xl p-4">
              <Wallet className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-[#F1FFF3] font-semibold text-base">Salary</p>
              <p className="text-[#3299FF] text-xs font-semibold whitespace-nowrap">
                18:27 - April 30
              </p>
            </div>

            <div className="text-center border-x-1 border-[#00D09E] self-stretch flex items-center px-2">
              <p className="text-[#F1FFF3] text-xs">Monthly</p>
            </div>

            <div>
              <p className="text-[#3299FF] font-bold text-sm">$ 4,000,00</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 rounded-2xl p-4">
              <Wallet className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-[#F1FFF3] font-semibold text-base">Salary</p>
              <p className="text-[#3299FF] text-xs font-semibold whitespace-nowrap">
                18:27 - April 30
              </p>
            </div>

            <div className="text-center border-x-1 border-[#00D09E] self-stretch flex items-center px-2">
              <p className="text-[#F1FFF3] text-xs">Monthly</p>
            </div>

            <div>
              <p className="text-[#3299FF] font-bold text-sm">$ 4,000,00</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
