export const getExpenseMessage = (percentage: number) => {
  if (percentage <= 30) return "Of Your Expenses, Looks Good.";
  if (percentage <= 50) return "Of Your Expenses, Keep an Eye on it.";
  if (percentage <= 70) return "Of Your Expenses, Consider Reducing.";
  return "Of Your Expenses, Too High!";
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes: number) => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

export const getTransactionDisplay = (type: string) => {
  const displays: Record<
    string,
    {
      icon: string;
      label: string;
      color: string;
      showSign: boolean;
      sign: string;
      colorClass: string;
    }
  > = {
    income: {
      icon: "💰",
      label: "Ingreso",
      color: "#10b981",
      showSign: true,
      sign: "+",
      colorClass: "text-emerald-400",
    },
    expense: {
      icon: "💸",
      label: "Gasto",
      color: "#ef4444",
      showSign: true,
      sign: "-",
      colorClass: "text-red-400",
    },
    transfer: {
      icon: "🔄",
      label: "Transferencia",
      color: "#3b82f6",
      showSign: false,
      sign: "",
      colorClass: "text-blue-400",
    },
    debt: {
      icon: "📝",
      label: "Deuda",
      color: "#f59e0b",
      showSign: true,
      sign: "-",
      colorClass: "text-orange-400",
    },
    debt_payment: {
      icon: "💳",
      label: "Pago de Deuda",
      color: "#8b5cf6",
      showSign: true,
      sign: "-",
      colorClass: "text-purple-400",
    },
    goal_contribution: {
      icon: "🎯",
      label: "Aporte a Meta",
      color: "#06b6d4",
      showSign: true,
      sign: "-",
      colorClass: "text-cyan-400",
    },
    loan_given: {
      icon: "🤝",
      label: "Préstamo Otorgado",
      color: "#ec4899",
      showSign: true,
      sign: "-",
      colorClass: "text-pink-400",
    },
    loan_payment: {
      icon: "💵",
      label: "Cobro de Préstamo",
      color: "#14b8a6",
      showSign: true,
      sign: "+",
      colorClass: "text-teal-400",
    },
    pending_payment: {
      icon: "⏰",
      label: "Pago Pendiente",
      color: "#f97316",
      showSign: true,
      sign: "-",
      colorClass: "text-orange-500",
    },
  };

  return (
    displays[type] || {
      icon: "❓",
      label: "Desconocido",
      color: "#64748b",
      showSign: false,
      sign: "",
      colorClass: "text-slate-400",
    }
  );
};
