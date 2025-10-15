import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { DashboardContainer } from "@/dashboard/DashboardContainer";
import { HomeContainer } from "@//home/HomeContainer";
import { TransactionsContainer } from "@/transactions/TransactionsContainer";
import { TransactionDetailContainer } from "@/transaction-detail/TransactionDetailContainer";
import "@/index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeContainer />,
  },
  {
    path: "dashboard",
    element: <DashboardContainer />,
  },
  {
    path: "transactions",
    element: <TransactionsContainer />,
  },
  {
    path: "transaction/:id/:from",
    element: <TransactionDetailContainer />,
  },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  </StrictMode>
);
