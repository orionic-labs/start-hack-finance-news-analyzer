import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-dashboard-primary/10 bg-card flex items-center  px-6 gap-4">
            <SidebarTrigger className="text-dashboard-primary hover:bg-dashboard-primary/90" />

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search news, clients, markets..."
                  className="pl-10 bg-background border-dashboard-primary/20"
                />
              </div>
            </div>

            <div className="flex ml-auto items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative border border-muted/30"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-dashboard-danger rounded-full"></span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="border border-muted/30"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
