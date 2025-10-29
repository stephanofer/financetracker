import { BottomNav } from "@/dashboard/components/BottomNav";
import { Outlet } from "react-router";

export function DashboardLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}
