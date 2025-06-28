import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/navigation/top-nav";

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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TopNav />
      
      <main className="pt-[120px]">
        {children}
      </main>
    </div>
  );
} 