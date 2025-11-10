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
import { AccountsContainer } from "@/dashboard/accounts/AccountsContainer";
import { AccountsDetailContainer } from "@/dashboard/accounts/AccountsDetailContainer";
import { TransferContainer } from "@/dashboard/transfer/TransferContainer";
import { DebtsDetailContainer } from "./dashboard/debts/DebtsDetailContainer";
import { SavingGoalsContainer } from "./dashboard/savings-goals/SavingGoalsContainer";
import RecurringExpensesDetailContainer from "./dashboard/recurring-expenses/RecurringExpensesDetailContainer";
import RecurringExpensesContainer from "./dashboard/recurring-expenses/RecurringExpensesContainer";
import { LoansDetailsContainer } from "./dashboard/loans/LoansDetailsContainer";
import { LoansContainer } from "./dashboard/loans/LoansContainer";
import { SavingGoalsDetails } from "./dashboard/savings-goals/SavingGoalsDetails";

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
      {
        path: "accounts",
        Component: AccountsContainer,
      },
      {
        path: "accounts/:id",
        Component: AccountsDetailContainer,
      },
      {
        path: "transfer",
        Component: TransferContainer,
      },
      {
        path: "debts/:id",
        Component: DebtsDetailContainer,
      },
      {
        path: "recurring-expenses",
        Component: RecurringExpensesContainer,
      },
      {
        path: "recurring-expenses/:id",
        Component: RecurringExpensesDetailContainer,
      },
      {
        path: "loans",
        Component: LoansContainer,
      },
      {
        path: "loans/:id",
        Component: LoansDetailsContainer,
      },
      {
        path: "saving-goals",
        Component: SavingGoalsContainer,
      },
      {
        path: "saving-goals/:id",
        Component: SavingGoalsDetails,
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
