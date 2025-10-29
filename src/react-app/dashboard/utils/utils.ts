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
