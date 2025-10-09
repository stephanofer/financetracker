import { useState } from "react";
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

const quickActions = [
  {
    name: "Registrar Gasto",
    description: "Añade un nuevo gasto",
    icon: TrendingDown,
    gradient: "from-red-500 to-pink-500",
  },
  {
    name: "Registrar Ingreso",
    description: "Añade un nuevo ingreso",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Nueva Cuenta",
    description: "Crea una cuenta nueva",
    icon: Wallet,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Registrar Deuda",
    description: "Añade una nueva deuda",
    icon: CreditCard,
    gradient: "from-orange-500 to-amber-500",
  },
];

export function BottomNav() {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <>
      {showQuickActions && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md animate-in fade-in-0"
          onClick={() => setShowQuickActions(false)}
        >
          <div
            className="absolute bottom-20 left-1/2 w-[92%] max-w-md -translate-x-1/2 animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between rounded-t-3xl border border-white/10 bg-[#0E3E3E]/95 px-6 py-4 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-bold text-white">Acciones Rápidas</h3>
                <p className="text-xs text-white/60">Selecciona una acción</p>
              </div>
              <button
                className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"
                onClick={() => setShowQuickActions(false)}
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-b-3xl border border-t-0 border-white/10 bg-[#0E3E3E]/95 p-4 backdrop-blur-xl">
              {quickActions.map((action, index) => (
                <button
                  key={action.name}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-lg active:scale-[0.98]"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  onClick={() => {
                    setShowQuickActions(false);
                    // TODO: Implement action handlers
                  }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-10 ${action.gradient}`}
                  />

                  <div className="relative flex flex-col items-center gap-3">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl ${action.gradient}`}
                    >
                      <action.icon className="h-7 w-7 text-white" />
                    </div>

                    <div className="text-center">
                      <span className="block text-sm font-semibold text-white">
                        {action.name}
                      </span>
                      <span className="block text-xs text-white/60">
                        {action.description}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            <Repeat size={28} className="text-[#0a2b2a] transition-transform duration-300" strokeWidth={2} />
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
