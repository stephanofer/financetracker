export const getExpenseMessage = (percentage: number) => {
  console.log(percentage);
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
