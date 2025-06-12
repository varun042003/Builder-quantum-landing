import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
