// Example implementation showing how to use the navigation component

import { TopNav } from './components/navigation/top-nav'
import { UserProvider } from './contexts/user-context'
import { ThemeProvider } from 'next-themes'

// Example layout component
export default function ExampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <UserProvider>
            {/* Navigation Component */}
            <TopNav />
            
            {/* Main Content with padding for fixed nav */}
            <main className="pt-[120px] min-h-screen bg-gray-50 dark:bg-gray-900">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Example page using the navigation
export function ExamplePage() {
  return (
    <div className="py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
        Welcome to Your Site
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        The navigation is fixed at the top and will shrink when you scroll.
        Try clicking the hamburger menu to see the dropdown!
      </p>
    </div>
  )
}

// Example of customizing for your brand
export const customizedConfig = {
  // Replace logos
  logos: {
    main: 'YourLogo',
    text: 'YourBrandName'
  },
  
  // Customize navigation links
  navLinks: [
    { href: '/products', label: 'Products' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' }
  ],
  
  // Customize colors in tailwind.config.js
  colors: {
    'nav-dark': '#1a1a1a',      // Your dark color
    'nav-secondary': '#4a90e2',  // Your light color
    'nav-accent': '#2ecc71'      // Your accent color
  },
  
  // Customize social links
  socialLinks: {
    instagram: 'https://instagram.com/yourbrand',
    youtube: 'https://youtube.com/yourbrand',
    tiktok: 'https://tiktok.com/@yourbrand'
  }
}