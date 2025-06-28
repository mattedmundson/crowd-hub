# CrowdHub Navigation Component Package

A modern, responsive navigation component with dropdown menu, theme switching, and user authentication support.

## Features

- 🎨 **Two-tone design** with light blue secondary navigation
- 📱 **Fully responsive** with different layouts for mobile and desktop
- 🌓 **Dark/light mode** support via next-themes
- 👤 **User authentication** integration
- 🎯 **Smooth animations** with shrinking on scroll
- 📺 **Livestream countdown** banner
- 🔐 **Role-based access** (Admin menu items)

## Installation

### 1. Install Dependencies

```bash
npm install lucide-react next-themes
```

### 2. Copy Files

Copy the entire `navigation-package` folder to your project, maintaining the structure:

```
your-project/
├── components/
│   ├── navigation/
│   │   ├── top-nav.tsx
│   │   └── livestream-countdown.tsx
│   └── icons/
│       ├── crowd-logo.tsx
│       └── crowd-church.tsx
├── contexts/
│   └── user-context.tsx
├── hooks/
│   └── useUserRole.ts
└── lib/
    └── supabase/
        └── client.ts
```

### 3. Setup Tailwind CSS

Add these colors to your `tailwind.config.ts`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#7DB9C5',      // Main brand blue
          dark: '#21252D',      // Dark nav background
          secondary: '#72bbc6', // Light blue for secondary nav
          livestream: '#0498db' // Livestream countdown blue
        }
      }
    }
  }
}
```

### 4. Setup Theme Provider

Wrap your app with the theme provider from `next-themes`:

```tsx
// app/layout.tsx or _app.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 5. Implement Required Contexts/Hooks

You need to implement these based on your authentication system:

#### User Context (`contexts/user-context.tsx`)
Replace the stub with your actual user authentication logic:

```tsx
export function useUser() {
  // Return actual user data from your auth system
  return {
    user: currentUser, // { id, email } or null
    loading: isLoading,
    error: authError
  };
}
```

#### User Role Hook (`hooks/useUserRole.ts`)
Replace with your role checking logic:

```tsx
export function useUserRole() {
  // Implement your role checking
  return {
    isAdmin: userRole === 'admin',
    role: userRole,
    loading: false,
    error: null
  };
}
```

#### Supabase Client (`lib/supabase/client.ts`)
Replace with your auth implementation:

```tsx
export function createClient() {
  // Return your auth client (Supabase, Auth0, etc.)
  return yourAuthClient;
}
```

## Usage

Import and use the navigation in your layout:

```tsx
import { TopNav } from '@/components/navigation/top-nav'
import { UserProvider } from '@/contexts/user-context'

export default function Layout({ children }) {
  return (
    <UserProvider>
      <TopNav />
      <main className="pt-[120px]"> {/* Add padding for fixed nav */}
        {children}
      </main>
    </UserProvider>
  )
}
```

## Customization

### Logo and Branding
- Replace `CrowdLogo` and `CrowdChurch` components with your own logos
- Update brand colors in Tailwind config

### Navigation Links
Edit the links in `top-nav.tsx`:
- Desktop nav items (lines 91-111)
- Mobile menu items (lines 189-213)
- Social media links (lines 261-273)

### Livestream Countdown
Modify `livestream-countdown.tsx` to match your schedule:
- Default: Sundays at 7pm UK time
- Change `streamHour` and `streamMinute` for different times

### Menu Content
- Left column: Latest livestream info (hidden on mobile)
- Right column: Navigation menu and social links
- Customize text and links as needed

## Responsive Behavior

### Mobile (< 768px)
- Compact navigation with smaller padding and icons
- 2-line hamburger menu icon
- Menu shows only navigation items (no livestream)
- Nav moves closer to top when scrolled (32px → 8px)

### Desktop (≥ 768px)
- Full navigation with center links visible
- 3-line hamburger menu icon
- Menu shows livestream info + navigation
- Nav shrinks on scroll (90% → 750px width)

## Color Scheme

- **Main nav**: `#21252D` (dark charcoal)
- **Secondary nav**: `#72bbc6` (light blue)
- **Brand accent**: `#7DB9C5` (navigation links)
- **Text**: White with various opacity levels
- **Hover state**: Dark blue `#21252D` on light background

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Requires JavaScript for interactive features
- Tailwind CSS v3.0+
- Next.js 13+ (for 'use client' directive)

## Notes

- The navigation is fixed positioned and requires padding on your main content
- Theme switching requires next-themes setup
- User authentication features require implementation of contexts/hooks
- Social media links are placeholders - update with actual URLs