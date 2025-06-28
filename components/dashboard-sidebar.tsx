'use client';

import Link from "next/link";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  CreditCard,
  ChevronRight,
  Users,
  Shield
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";

export function DashboardSidebar() {
  const { isAdmin } = useUserRole();

  return (
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
          
          {/* Admin Section */}
          {isAdmin && (
            <>
              <li className="pt-4">
                <div className="flex items-center text-xs font-semibold text-muted-foreground mb-2">
                  <Shield className="mr-2 h-4 w-4" />
                  ADMIN
                </div>
              </li>
              <li>
                <Link 
                  href="/dashboard/admin/users" 
                  className="flex items-center p-2 rounded-md hover:bg-sidebar-accent group"
                >
                  <Users className="mr-3 h-5 w-5" />
                  <span>User Management</span>
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                </Link>
              </li>
            </>
          )}
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
  );
}