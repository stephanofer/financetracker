import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Home,
  Search,
  Repeat,
  Layers,
  User,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
} from "lucide-react";

export function BottomNav() {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <>
      <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
        <SheetContent side="bottom">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold">
              Acciones Rápidas
            </SheetTitle>
            <SheetDescription>
              Selecciona una acción para continuar
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0E3E3E]/95 backdrop-blur-lg rounded-t-[50px] border-white/10 z-50">
        <div className="flex items-center justify-around h-20 px-6 ">
          {/* Home Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200 ">
            <Home size={28} strokeWidth={2} />
          </button>

          {/* Search Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200">
            <Search size={28} strokeWidth={2} />
          </button>

          {/* Repeat Button - Centro (Siempre resaltado) */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ${
              showQuickActions ? "rotate-45" : ""
            }`}
          >
            <Repeat
              size={28}
              className="text-[#0a2b2a] transition-transform duration-300"
              strokeWidth={2}
            />
          </button>

          {/* Layers Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200">
            <Layers size={28} strokeWidth={2} />
          </button>

          {/* User Button */}
          <button className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200">
            <User size={28} strokeWidth={2} />
          </button>
        </div>
      </nav>
    </>
  );
}
