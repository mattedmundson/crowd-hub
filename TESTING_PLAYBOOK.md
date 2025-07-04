# CrowdHub Multi-Theme Challenge System - Testing Playbook

## Overview
This playbook will guide you through testing the complete multi-theme challenge system that was just implemented. The system now supports 6 different challenge themes with flexible Mon-Fri + Sunday review scheduling.

## Prerequisites
- ✅ All SQL migrations (012-016) have been run
- ✅ Your old challenge data has been deleted
- ✅ You're logged in as admin user
- ✅ Development server is running (`npm run dev`)

---

## Test 1: Admin Challenge Management

### 1.1 Access Admin Interface
1. **Navigate to:** `/dashboard/admin/challenges`
2. **Expected:** Clean admin interface with challenge management
3. **Look for:**
   - "Create New Challenge" button
   - List of existing challenges (should see some default challenges)
   - Each challenge shows theme, title, total challenges, and schedule type

### 1.2 Create a New Challenge
1. **Click:** "Create New Challenge" button
2. **Fill out the form:**
   - **Title:** "Test Prayer Challenge"
   - **Theme:** Select "prayer" from dropdown
   - **Description:** "A test prayer challenge for validation"
   - **Total Challenges:** 75
   - **Category:** "Spiritual Growth"
   - **Weekly Schedule:** Check the box (Mon-Fri + Reviews)
3. **Click:** "Create Challenge"
4. **Expected:** Challenge appears in the list with purple prayer theme styling

### 1.3 Edit an Existing Challenge
1. **Find:** Any existing challenge in the list
2. **Click:** "Edit" button
3. **Modify:** Change the description
4. **Click:** "Update Challenge"
5. **Expected:** Changes are saved and reflected in the list

---

## Test 2: User Challenge Selection

### 2.1 Browse Available Challenges
1. **Navigate to:** `/dashboard/challenges`
2. **Expected:** Beautiful challenge selection page
3. **Look for:**
   - Header: "Choose Your Challenge"
   - Grid of challenge cards with different themes
   - Each card shows theme icon, title, description, and stats
   - Color-coded themes (green=gratitude, blue=prayer, etc.)

### 2.2 Challenge Card Details
1. **Examine each challenge card:**
   - Theme-specific gradient background
   - Challenge stats (total challenges, estimated weeks, daily time)
   - "Start Challenge" button (should be enabled)
   - Schedule type indicator (Mon-Fri + Reviews vs Daily)

### 2.3 Start a Challenge
1. **Choose:** Any challenge (recommend starting with Gratitude)
2. **Click:** "Start Challenge" button
3. **Expected:** 
   - Button shows "Starting..." briefly
   - Redirects to theme-specific journey page (e.g., `/dashboard/gratitude/journey`)

---

## Test 3: Journey Experience

### 3.1 Journey Page Load
1. **Expected URL:** `/dashboard/[theme]/journey` (e.g., `/dashboard/gratitude/journey`)
2. **Look for:**
   - Challenge title and theme icon
   - "Challenge 1 of X" indicator
   - Smooth scroll sections
   - Navigation arrows between sections

### 3.2 Complete Journey Sections
**Go through each section systematically:**

1. **Opening Prayer** (Section 1)
   - Read the meditation prompt
   - Click down arrow to continue

2. **Scripture** (Section 2)
   - Watch word-by-word animation
   - Should reveal scripture text smoothly
   - Click down arrow when complete

3. **Context** (Section 3)
   - Read the context explanation
   - Should preserve line breaks properly
   - Click down arrow

4. **God's Message Form** (Section 4)
   - **Enter:** "Test message about what God revealed today"
   - **Click:** "Save and Continue" 
   - **Expected:** Progress saved, moves to next section

5. **Morning Reflection Prompt** (Section 5)
   - Read the morning prompt
   - Click down arrow

6. **Morning Entry Form** (Section 6)
   - **Enter:** "Test morning gratitude entry"
   - **Click:** "Save and Continue"
   - **Expected:** Progress saved, moves to next section

7. **Evening Reflection Prompt** (Section 7)
   - Read the evening prompt
   - Click down arrow

8. **Evening Entry Form** (Section 8)
   - **Enter:** "Test evening gratitude entry"
   - **Click:** "Save and Continue"
   - **Expected:** Progress saved, moves to next section

9. **Scripture Recap** (Section 9)
   - Should show same scripture with animation
   - Click down arrow

10. **Review Sections** (Sections 10-12)
    - **God's Message Review:** Should show your entry in brand blue
    - **Morning Review:** Should show your morning entry in brand blue
    - **Evening Review:** Should show your evening entry in brand blue

11. **Completion** (Section 13)
    - **Expected:** "Challenge 1 Complete" message
    - Progress grid showing 1 completed challenge
    - "Continue to Challenge 2" button

### 3.3 Test Navigation
1. **Click:** "Continue to Challenge 2" button
2. **Expected:** Loads Challenge 2 with new content
3. **Test:** Complete a few more challenges to see progress

---

## Test 4: Navigation System

### 4.1 Top Navigation (Desktop)
1. **Look for:** Challenge progress in center of nav
2. **Expected:** 
   - Challenge name and current challenge number
   - Dropdown arrow for challenge menu
   - Progress icons (Bible, Morning, Evening) with completion checkmarks

### 4.2 Mobile Navigation
1. **Resize browser** to mobile width
2. **Click:** Hamburger menu
3. **Expected:**
   - Current challenge shown at top
   - "My Dashboard", "Challenges", "Weekly Review" links
   - "My Account" and other standard links

### 4.3 Challenge Progress Indicators
1. **In journey page:** Complete different sections
2. **Check top nav:** Icons should show green checkmarks when sections completed
3. **Click progress icons:** Should navigate to respective sections

---

## Test 5: Dashboard Integration

### 5.1 Dashboard Overview
1. **Navigate to:** `/dashboard`
2. **Expected:**
   - Clean dashboard with progress grid
   - Grid shows completed challenges as filled circles
   - Current challenge highlighted differently

### 5.2 Progress Grid Behavior
1. **Complete several challenges** (at least 3-4)
2. **Return to dashboard**
3. **Expected:**
   - Completed challenges show as solid blue circles
   - Streak lines connect consecutive completions
   - Grid properly represents your progress

---

## Test 6: Weekly Review System

### 6.1 Access Weekly Review
1. **Navigate to:** `/dashboard/review`
2. **Expected:**
   - Weekly review interface loads
   - Shows current week number
   - Theme-specific icon and styling

### 6.2 Complete Weekly Review
1. **Fill out all sections:**
   - **Challenges Completed:** Set to number you've done
   - **Overall Mood:** Drag slider to 8/10
   - **Spiritual Growth:** Drag slider to 7/10
   - **Key Learnings:** "Test learning about patience"
   - **Biggest Challenge:** "Test challenge with consistency"
   - **Celebrate Wins:** "Test celebration of small victories"
   - **Weekly Intentions:** "Test intentions for growth"
   - **Specific Goals:** "Test specific goal setting"
   - **Prayer Requests:** "Test prayer request"

2. **Click:** "Save Review"
3. **Expected:** "Saving..." then success

### 6.3 Week Navigation
1. **Click:** Next week arrow
2. **Expected:** Moves to week 2 (empty form)
3. **Click:** Previous week arrow
4. **Expected:** Returns to week 1 with saved data

---

## Test 7: Multi-Theme Testing

### 7.1 Test Different Themes
1. **Complete current challenge** or **start new one**
2. **Go to:** `/dashboard/challenges`
3. **Start different theme:** Try Prayer, Faith, or Service
4. **Expected:**
   - Each theme has unique colors, icons, and styling
   - Journey content is theme-appropriate
   - Progress tracking works identically

### 7.2 Theme-Specific Features
1. **Prayer Theme:** Purple colors, ✨ icon
2. **Faith Theme:** Purple colors, ⛪ icon  
3. **Service Theme:** Orange colors, 🤝 icon
4. **Worship Theme:** Pink colors, 🎵 icon
5. **Scripture Theme:** Teal colors, 📖 icon

---

## Test 8: Error Handling & Edge Cases

### 8.1 Navigation Without Active Challenge
1. **If no active challenge:** Visit `/dashboard/challenges`
2. **Expected:** Shows available challenges, no current challenge alert

### 8.2 Direct URL Access
1. **Try:** `/dashboard/prayer/journey` (without starting challenge)
2. **Expected:** Should redirect to challenge selection

### 8.3 Review Page Without Challenge
1. **Try:** `/dashboard/review` (without active challenge)
2. **Expected:** Should redirect to challenge selection

---

## Test 9: Data Persistence

### 9.1 Refresh Testing
1. **Complete several journey sections**
2. **Refresh the page**
3. **Expected:** All progress preserved, can continue where left off

### 9.2 Session Testing
1. **Log out and log back in**
2. **Expected:** All challenge progress maintained

---

## Test 10: Admin-Only Features

### 10.1 Admin Menu Access
1. **Check hamburger menu**
2. **Expected:** "Admin" and "Manage Challenges" links visible
3. **Test:** Both links work correctly

### 10.2 Non-Admin Testing (Optional)
1. **If you have another test user:** Log in as non-admin
2. **Expected:** No admin menu items visible

---

## Expected Behaviors Summary

### ✅ Should Work:
- Challenge selection and starting
- Complete journey experience with all sections
- Progress tracking and visualization
- Weekly review system
- Navigation between challenges
- Admin challenge management
- Data persistence across sessions
- Mobile responsive design

### ❌ Should NOT Work:
- Starting multiple challenges simultaneously
- Accessing admin pages as non-admin
- Broken navigation or missing content
- Data loss on refresh
- Styling inconsistencies

---

## Troubleshooting

### Common Issues:
1. **"No active challenge"** - Start a new challenge from `/dashboard/challenges`
2. **Blank pages** - Check console for errors, verify database connection
3. **Styling issues** - Hard refresh (Cmd+Shift+R) to clear cache
4. **Navigation problems** - Check that all migrations ran successfully

### Report Issues:
- Include: Page URL, steps taken, expected vs actual behavior
- Check: Browser console for error messages
- Verify: Database has required tables and data

---

## Success Criteria

The system is working correctly when:
- ✅ All challenge themes are selectable and functional
- ✅ Journey experience is smooth and saves progress
- ✅ Weekly reviews save and load correctly
- ✅ Navigation works on desktop and mobile
- ✅ Admin features work for challenge management
- ✅ Data persists across sessions
- ✅ Progress visualization is accurate

**Happy Testing! 🎉**