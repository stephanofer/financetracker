import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  FileText,
  Home,
  Layers,
  Repeat,
  Search,
  Tag,
  User,
  Wallet
} from "lucide-react";
import { useState } from "react";

type ActionType = "expense" | "income" | "account" | "debt" | null;

// Types para las respuestas de la API
interface Category {
  id: number;
  name: string;
  type: "ingreso" | "gasto";
  color: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

interface Account {
  id: number;
  user_id: number;
  name: string;
  type: "efectivo" | "debito" | "credito" | "banco" | "ahorros" | "inversiones";
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
interface ApiResponse<T> {
  success: boolean;
  data: T;
  count: number;
}

export function BottomNav() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeForm, setActiveForm] = useState<ActionType>(null);
  const [category, setCategory] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  // const [amount, setAmount] = useState<string>("");
  // const [description, setDescription] = useState<string>("");

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubcategory("");
  };

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

  const { data, isPending } = useQuery<ApiResponse<Category[]>>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error fetching categories");
      return res.json();
    },
  });

  const { data: subcategoryData } = useQuery<ApiResponse<Subcategory[]>>({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories");
      if (!res.ok) throw new Error("Error fetching subcategories");
      return res.json();
    },
  });

  const { data: accountData } = useQuery<ApiResponse<Account[]>>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts?userId=1");
      if (!res.ok) throw new Error("Error fetching accounts");
      return res.json();
    },
  });

  console.log("Categories:", data?.data);
  console.log("Subcategories:", subcategoryData?.data);

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

            <button
              onClick={() => {
                fetch("/api/transaction/income", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    amount: 1500.5,
                    description: "Salario mensual",
                    date: new Date().toISOString(),
                    accountId: "1",
                    categoryId: "1",
                    subcategoryId: "1",
                    notes: "Pago de salario",
                    userId: "1",
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => console.log(data));
              }}
              className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
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
            <form className="space-y-4">
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
                    // value={amount}
                    // onChange={(e) => setAmount(e.target.value)}
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
                  <Select
                    value={category}
                    onValueChange={handleCategoryChange}
                    required
                    disabled={isPending}
                  >
                    <SelectTrigger id="category">
                      <SelectValue
                        placeholder={isPending ? "Cargando..." : "Seleccionar"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.data?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="subcategory"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Subcategoría
                  </Label>
                  <Select
                    value={subcategory}
                    onValueChange={setSubcategory}
                    disabled={isPending}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue
                        placeholder={isPending ? "Cargando..." : "Seleccionar"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoryData?.data?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="account"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Tipo de Cuenta *
                </Label>
                <Select required>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountData?.data?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.icon} {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Descripción
                </Label>
                <Input
                  id="description"
                  placeholder="Ej: Pago de salario mensual"
                  // value={description}
                  // onChange={(e) => setDescription(e.target.value)}
                />
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
