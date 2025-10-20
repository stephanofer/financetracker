import { HomeContainer } from "@//home/HomeContainer";
import { Toaster } from "@/components/ui/sonner";
import { DashboardContainer } from "@/dashboard/DashboardContainer";
import "@/index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { userContext } from "@/contexts/auth";
import { authMiddleware } from "@/middleware/auth";
import { loggingMiddleware } from "@/middleware/login";
import { DashboardLayout } from "@/dashboard/DashboardLayout";
import { TransactionsContainer } from "@/dashboard/transactions/TransactionsContainer";
import { TransactionDetailContainer } from "@/dashboard/transactions/TransactionDetailContainer";
import { DebtsContainer } from "@/dashboard/debts/DebtsContainer";

const router = createBrowserRouter([
  {
    path: "/",
    middleware: [loggingMiddleware],
    Component: HomeContainer,
  },
  {
    path: "/dashboard",
    middleware: [authMiddleware],
    Component: DashboardLayout,
    id: "dashboard",
    loader: async function dashboardLoader({ context }) {
      const user = context.get(userContext);
      return user;
    },
    children: [
      {
        index: true,
        Component: DashboardContainer,
      },
      {
        path: "transactions",
        Component: TransactionsContainer,
      },
      {
        path: "transactions/:id/:from",
        Component: TransactionDetailContainer,
      },
      {
        path: "debts",
        Component: DebtsContainer,
      },
    ],
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
