import {
  Bell,
  Car,
  Banknote,
  UtensilsCrossed,
  Wallet,
  ShoppingBag,
  Home as HomeIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { Greeting } from "./components/Greeting";

export function DashboardContainer() {
  return (
    <div className="">
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

      {/* Balance Section */}
      <div className="px-6 mb-8">
        <div className="flex items-start justify-between mb-6 gap-5">
          {/* Total Balance */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 border-2 border-[#F1FFF3] rounded flex items-center justify-center">
                {/* <div className="w-2 h-2 bg-white/60 rounded-sm" /> */}
                <ArrowUpRight className="w-10 h-10 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-sm font-normal">
                Total Balance
              </p>
            </div>
            <p className="text-2xl font-bold text-[#F1FFF3] ">S/7,783.00</p>
          </div>

          {/* Divider */}
          <div className="w-px h-15 bg-[#DFF7E2]" />

          {/* Total Expense */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 border-2 border-[#F1FFF3] rounded flex items-center justify-center">
                <ArrowDownRight className="w-10 h-10 text-[#F1FFF3]" />
              </div>
              <p className="text-[#F1FFF3] text-sm">Total Expense</p>
            </div>
            <p className="text-2xl font-bold text-[#3299FF]">-$1.187.40</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
