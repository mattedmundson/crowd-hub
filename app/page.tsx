import { TopNav } from "@/components/navigation/top-nav";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <TopNav />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <Hero />
        </div>
      </section>

      {/* Content Sections to test scrolling */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Gratitude Challenge</h3>
              <p className="text-gray-600">Daily challenges to cultivate gratitude and mindfulness in your life.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Live Stream</h3>
              <p className="text-gray-600">Join our community for live interactive sessions and discussions.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Archive</h3>
              <p className="text-gray-600">Access our complete library of past content and resources.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Get Started</h2>
          <div className="max-w-3xl mx-auto">
            {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
          </div>
        </div>
      </section>

      {/* More content to enable scrolling */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">About Us</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 mb-8">
              CrowdHub is dedicated to building meaningful connections and fostering personal growth 
              through gratitude practices and community engagement.
            </p>
            <Link href="/dashboard">
              <Button size="lg">Get Started Today</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-16 px-4 border-t bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <p>
              Powered by{" "}
              <a
                href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                target="_blank"
                className="font-bold hover:underline"
                rel="noreferrer"
              >
                Supabase
              </a>
            </p>
            <ThemeSwitcher />
          </div>
        </div>
      </footer>
    </main>
  );
}
