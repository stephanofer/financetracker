import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Home, Search, Repeat, Layers, User, DollarSign, Tag, Wallet, CalendarIcon, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ActionType = "expense" | "income" | "account" | "debt" | null;

export function BottomNav() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeForm, setActiveForm] = useState<ActionType>(null);

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
      case "account":
        return "Nueva Cuenta";
      case "debt":
        return "Registrar Deuda";
      default:
        return "";
    }
  };

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

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setShowQuickActions(false);
                handleActionClick("income");
              }}
              className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <div className="mb-2 p-3 bg-emerald-500/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-sm text-white">Agregar Ingreso</span>
            </button>

            <button className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <div className="mb-2 p-3 bg-red-500/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-sm text-white">Agregar Gasto</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={activeForm !== null}
        onOpenChange={(open) => !open && setActiveForm(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <form  className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Monto *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value="10"
                    // onChange={}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Categoría *
                  </Label>
                  <Select required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>

                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="account"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Cuenta *
                  </Label>
                  <Select required>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </Label>
                <Input
                  id="description"
                  placeholder="Ej: Pago de salario mensual"
                  value="asd"
                  // onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button type="submit" className="w-full">
                Guardar Ingreso
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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
