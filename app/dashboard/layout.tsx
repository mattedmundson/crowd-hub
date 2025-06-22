import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  CreditCard,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {/* Logo and branding */}
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold text-xl">CrowdHub</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/dashboard" 
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent group"
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                <span>Generate</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/upload" 
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent group"
              >
                <Upload className="mr-3 h-5 w-5" />
                <span>Upload & Train</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent group"
              >
                <Settings className="mr-3 h-5 w-5" />
                <span>Settings</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/billing" 
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent group"
              >
                <CreditCard className="mr-3 h-5 w-5" />
                <span>Billing</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-medium">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {data.user.email}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 