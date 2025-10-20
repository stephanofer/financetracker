import { BottomNav } from "./components/BottomNav";
import { Outlet } from "react-router";

export function DashboardLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

