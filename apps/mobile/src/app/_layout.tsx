import "../global.css";

import { Stack } from "expo-router";
import { DashboardProvider } from "../data/dashboard-context";

export default function Layout() {
  return (
    <DashboardProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DashboardProvider>
  );
}
