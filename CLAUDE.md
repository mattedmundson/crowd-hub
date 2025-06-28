# CrowdHub Project Notes

## Project Overview
CrowdHub is a SaaS dashboard application built with Next.js 15, React 19, Supabase, and Tailwind CSS. It features user authentication, role-based access control, and a modern top navigation system with clean dashboard interface.

## User Role System Implementation

### Roles
- **user** (default) - Basic user with standard access
- **contributor** - Enhanced permissions for content contribution
- **editor** - Advanced permissions for editing content
- **admin** - Full administrative access including user management

### Database Structure
- `user_roles` table with RLS policies
- `profiles` table for user profile data (first_name, last_name, country)
- Automatic role assignment on user signup (defaults to 'user')
- Secure functions for role management

### Admin Features
- Admin users see an "ADMIN" section in the sidebar
- User management page at `/dashboard/admin/users`
- Ability to assign/change roles for all users
- Only admins can modify user roles

### Key Files Created/Modified
- `lib/hooks/useUserRole.ts` - React hook for role checking
- `components/dashboard-sidebar.tsx` - Sidebar with conditional admin menu
- `app/dashboard/admin/users/page.tsx` - User management interface
- `supabase/migrations/` - Database migrations for role system

### Database Functions
- `get_current_user_role()` - Returns current user's role
- `get_all_users_with_roles()` - Admin-only function to list all users
- `update_user_role(user_id, new_role)` - Admin-only role assignment
- `current_user_is_admin()` - Checks if current user is admin

### Admin User Setup
Your user ID `b16b8fe8-1ae7-449e-89d6-3d286294afd2` is hardcoded as admin in the database functions for initial setup.

## User Onboarding System

### Onboarding Flow
- **File**: `app/onboarding/page.tsx`
- **Features**:
  - Collects first name, last name, and country
  - Automatic country detection based on browser language, timezone, and IP
  - Saves data to `profiles` table
  - Redirects to dashboard after completion

### Country Detection Logic
1. Browser language mapping (EN-GB → GB, EN-US → US, etc.)
2. Timezone detection (Europe/London → GB, America/New_York → US, etc.)
3. IP-based geolocation fallback using ipapi.co
4. Full country list with flags and proper formatting

## Navigation System

### Top Navigation (Gitwit-inspired)
- **File**: `components/navigation/top-nav.tsx`
- **Features**:
  - Livestream countdown banner at top
  - Shrinking effect on scroll (90% → 50% width)
  - Fully rounded (pill-shaped) in all states
  - Sticky positioning with smooth animations
  - Animated hamburger dropdown menu with account section

### Account Menu (Hamburger Dropdown)
When logged in, the hamburger menu includes:
- User's email address display
- "My Account" link (with user icon)
- "Settings" link (with settings icon)
- "Logout" button (with logout icon)
- Full logout functionality

### Design Colors
- **Navigation Background**: `#21252D` (dark charcoal)
- **Logo**: Custom SVG in brand blue `#7DB9C5`
- **Brand Text**: "Crowd Hub" in white, bold
- **Navigation Links**: `#7DB9C5` (brand blue) with hover effects
- **Dropdown Menu**: Same `#21252D` background with consistent color scheme

### Logo Implementation
- **File**: `components/icons/crowd-logo.tsx` (React component)
- **Source**: `/components/icons/crowd-logo.svg`
- **Size**: 32x32px in navigation
- **Color**: Uses `currentColor` for easy theming

### Navigation Structure
- **Main Nav**: Gratitude Challenge, Live Stream, Mode (dark/light toggle)
- **Dropdown Menu**: 
  - Latest Posts (mock data)
  - Main section (Gratitude Challenge, Live Stream, Mode, About)
  - More section (Articles, Resources, Contact)
  - Account section (email, My Account, Settings, Logout) - when logged in
  - Social media icons (Twitter, GitHub, LinkedIn)

## Authentication & User Context

### UserContext Implementation
- **File**: `contexts/user-context.tsx`
- **Features**:
  - Simplified auth state management
  - No complex profile loading to avoid delays
  - Basic user, loading, and error states
  - Clean session management

### Auth Flow
- Login/logout works smoothly without hanging
- Protected routes redirect to `/auth/login`
- Clean auth state transitions

## Dashboard Layout

### Current Dashboard Structure
- **Layout**: `app/dashboard/layout.tsx` - Simplified without sidebar
- **Page**: `app/dashboard/page.tsx` - Clean blank page
- **Features**:
  - No sidebar (removed for clean interface)
  - Full-width content area
  - Top navigation only
  - Proper spacing with `pt-[120px]` for fixed nav

### Removed Components
- Dashboard sidebar (was causing complexity)
- All dashboard content cards (clean slate)
- User profile display attempts (simplified auth)

## Brand Colors
```
brand: {
  50: "#f0f9ff",
  100: "#e0f2fe", 
  200: "#bae6fd",
  300: "#7dd3fc",
  400: "#38bdf8",
  500: "#0498db", // Main brand blue
  600: "#0284c7",
  700: "#0369a1",
  800: "#075985",
  900: "#0c4a6e",
  950: "#082f49"
}
```

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Tech Stack
- Next.js 15 with App Router
- React 19
- Supabase (Auth + Database)
- Tailwind CSS with custom brand colors
- Radix UI components
- TypeScript
- Lucide React icons

## Gratitude Challenge Journey System

### Journey Experience
- **File**: `app/dashboard/gratitude/journey/page.tsx`
- **Features**:
  - Full-screen scroll-based experience with smooth animations
  - 13 sections total with automatic scroll navigation
  - Word-by-word scripture animation (like Vivobarefoot website)
  - Clickable arrows with hover bounce effects for navigation
  - Apple-style typography and spacing

### Journey Flow
1. **Opening Prayer** - Narrow width meditation prompt
2. **Scripture** - Wide format with word-by-word reveal animation
3. **Context** - Narrow width explanation with proper paragraph spacing
4. **God's Message** - Form to capture spiritual insights
5. **Morning Reflection Prompt** - Display morning prompt text
6. **Morning Entry Form** - User input for morning thoughts
7. **Evening Reflection Prompt** - Display evening prompt text  
8. **Evening Entry Form** - User input for evening gratitude
9. **Scripture Recap** - Same animation as original scripture
10. **God's Message Review** - Show what user wrote in brand blue
11. **Morning Review** - Show morning entry in brand blue
12. **Evening Review** - Show evening entry in brand blue
13. **Completion** - "Day {n} Complete" with 100-day progress grid

### Content Management & Editing
- **Edit Page**: `app/dashboard/gratitude/edit/page.tsx`
- **Features**:
  - Single edit button (top-right) for admin/editor users
  - Four-column layout: Scripture (red), Context (blue), Morning (amber), Evening (purple)
  - Day navigation with scrollable circles (1-100)
  - Save all content types simultaneously
  - Responsive design (stacks on mobile)

### 100-Day Progress Grid
- **Component**: `components/challenge/hundred-day-grid.tsx`
- **Features**:
  - 10x10 grid of circles representing 100 days
  - White circles with brand blue border (incomplete)
  - Solid brand blue circles (completed)
  - Brand blue lines connecting consecutive completion streaks
  - No day numbers (clean, minimal design)
  - Reusable with different sizes (small/medium/large)
  - Smart streak detection (breaks on missed days)

### Text Formatting & Line Breaks
- All content preserves line breaks using paragraph splitting
- Consistent typography hierarchy throughout
- Brand blue (#0498db) for user-generated content
- Proper spacing between paragraphs (1.3x line height)

### Always Show Both Reflections
- System assumes all users do both morning and evening
- `showEvening = true` hardcoded in today page
- Complete journey experience includes both reflection types

## Current Status
✅ User role system fully implemented and working
✅ Admin interface functional
✅ Role-based access control
✅ Database migrations completed
✅ User onboarding with country detection
✅ Profile data collection and storage
✅ Modern top navigation with shrinking/expanding animations
✅ Custom logo integration
✅ Consistent brand color scheme
✅ Animated dropdown menu with account section
✅ Clean dashboard layout without sidebar
✅ Simplified auth context (no flashing/delays)
✅ Working logout functionality in hamburger menu
✅ Complete journey experience with scroll animations
✅ Content editing system for admin/editor users
✅ 100-day progress visualization with streak tracking
✅ Line break preservation in all content areas
✅ Minimal, elegant completion flow

## Simplified Architecture Decisions
- **No name display in nav**: Removed complex profile loading that caused delays and flashing
- **No sidebar in dashboard**: Clean, simple interface ready for content
- **Simplified UserContext**: Basic auth state only, no complex profile fetching
- **Account menu in hamburger**: All user account functions accessible via dropdown
- **Always both reflections**: Removed schedule type complexity, everyone does morning + evening

## Notes for Next Session
- Complete journey experience with beautiful scroll animations and typography
- Content editing system ready for admin/editor content management
- 100-day progress visualization with streak tracking
- All text formatting preserves line breaks properly
- System ready for production use with full feature set