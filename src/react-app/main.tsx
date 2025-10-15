import { HomeContainer } from "@//home/HomeContainer";
import { Toaster } from "@/components/ui/sonner";
import { DashboardContainer } from "@/dashboard/DashboardContainer";
import "@/index.css";
import { TransactionDetailContainer } from "@/transaction-detail/TransactionDetailContainer";
import { TransactionsContainer } from "@/transactions/TransactionsContainer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { userContext } from "./contexts/auth";
import { authMiddleware } from "./middleware/auth";
import { loggingMiddleware } from "./middleware/login";

const router = createBrowserRouter([
  {
    path: "/",
    middleware: [loggingMiddleware],
    Component: HomeContainer,
  },
  {
    path: "/dashboard",
    middleware: [authMiddleware],
    Component: DashboardContainer,
    loader: async function dashboardLoader({ context }) {
      const user = context.get(userContext);
      return { user };
    },

    children: [
      {
        path: "settings",
        element: <div>Settings</div>,
      },
      {
        path: "profile",
        element: <div>Profile</div>,
      },
    ],
  },
  {
    path: "*",
    element: <div>404 Not Found</div>,
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
