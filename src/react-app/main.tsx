import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import { HomeContainer } from "./home/HomeContainer";
import { DashboardContainer } from "./dashboard/DashboardContainer";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeContainer />,
  },
  {
    path: "dashboard",
    element: <DashboardContainer />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
