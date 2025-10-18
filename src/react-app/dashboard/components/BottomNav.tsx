import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ActionType } from "@/dashboard/types";
import { Home, Layers, Plus, Search, User, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { TransactionForm } from "@/dashboard/components/forms/TransactionForm";

export function BottomNav() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeForm, setActiveForm] = useState<ActionType>(null);
  const navigate = useNavigate();

  const handleActionClick = (actionType: ActionType) => {
    setShowQuickActions(false);
    setActiveForm(actionType);
  };

  const getDialogTitle = () => {
    switch (activeForm) {
      case "expense":
        return "Registrar Gasto";
      case "income":
        return "Registrar Ingreso";
      default:
        return "";
    }
  };

  const handleClose = () => {
    setActiveForm(null);
  };

  return (
    <>
      <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold text-center">
              Acciones Rápidas
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-2 px-3">
            <button
              onClick={() => handleActionClick("expense")}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl hover:from-red-500/15 hover:to-red-600/10 hover:border-red-500/30 active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-red-400" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-white">
                Registrar Gasto
              </span>
            </button>

            <button
              onClick={() => handleActionClick("income")}
              className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl hover:from-emerald-500/15 hover:to-emerald-600/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-white">
                Registrar Ingreso
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={activeForm !== null}
        onOpenChange={() => {
          setActiveForm(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {activeForm && (
              <TransactionForm handleClose={handleClose} type={activeForm} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0E3E3E]/95 backdrop-blur-lg rounded-t-[50px] border-white/10 z-50">
        <div className="flex items-center justify-around h-20 px-6 ">
          {/* Home Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200 "
          >
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
            <PlusIcon
              size={28}
              className="text-[#0a2b2a] transition-transform duration-300"
              strokeWidth={2}
            />
          </button>

          {/* Layers Button */}
          <button
            onClick={() => navigate("/debts")}
            className="flex items-center justify-center w-14 h-14 text-white/60 hover:text-white hover:scale-105 transition-all duration-200"
          >
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
