# Libraria UI/UX Implementation Guide

**Version:** 1.0  
**Last Updated:** November 21, 2025  
**Framework:** React 18 + TypeScript + Tailwind CSS v3.4  
**Architecture Style:** Atomic Design with Module-Based Organization

---

## 📋 Quick Start: Development Priority Order

### Phase 1: Global Infrastructure (Week 1)
1. ✅ Theme Provider & localStorage integration
2. ✅ AppShell layout structure
3. ✅ Responsive Header/Navbar
4. ✅ Footer component
5. UI component library (Button, Input, Select, Badge, Skeleton)

### Phase 2: Core Pages (Week 2-3)
6. Landing/Home page with featured carousel
7. Explore/Browse page with filters & infinite scroll
8. Book Detail page with chapters list
9. Search results page

### Phase 3: Reader Module (Week 4-5) - **HIGHEST PRIORITY**
10. Reader shell with fullscreen support
11. Single-page reading mode
12. Double-spread reading mode
13. Continuous scroll (webtoon) mode
14. Gesture support & prefetch logic

### Phase 4: User Features (Week 6)
15. User Dashboard with reading progress
16. Wishlist management
17. Reading history & resume functionality

### Phase 5: Admin & Polish (Week 7-8)
18. Admin dashboard & bulk upload
19. Accessibility audit & fixes
20. Performance optimization

---

## 🎯 Page Hierarchy & User Flows

```
Public Routes:
├── Landing (/) → Featured books, trending, CTA to browse
└── Auth Pages (/login, /register, /forgot-password)

Protected Routes (/app):
├── Dashboard (/dashboard) → Reading progress, resume, stats
├── Home (/home) → Personalized recommendations
├── Library Module (/library)
│   ├── Browse (/library/books) → Grid with filters
│   ├── Book Detail (/library/books/:id) → Meta + chapters
│   ├── Reader (/library/books/:id/read?chapter=X&page=Y)
│   ├── Series Detail (/library/series/:id)
│   ├── Wishlist (/library/wishlist)
│   ├── My Books (/library/my-books) → Borrowed items
│   ├── Issued Books (/library/issued) → Admin view
│   ├── Requests (/library/requests) → Book requests
│   ├── E-Books (/library/ebooks)
│   ├── Users (/library/users) → Admin user management
│   ├── Reports (/library/reports) → Admin analytics
│   └── Community (/library/community) → Reviews & discussions
├── Notes Module (/notes)
│   ├── All Notes (/notes)
│   ├── Note Detail (/notes/:id)
│   └── Create/Edit Note (/notes/new)
├── Healthcare Module (/healthcare)
├── Settings (/settings)
│   ├── Profile
│   ├── Preferences
│   ├── Notifications
│   └── Account Security
```

---

## 🏗️ Component Architecture

### Atomic Design Structure

```
src/components/
├── ui/
│   ├── Button.tsx           # Primary, secondary, tertiary variants
│   ├── Input.tsx            # Text input with validation
│   ├── Select.tsx           # Dropdown selector
│   ├── Badge.tsx            # Status/tag badges
│   ├── Skeleton.tsx         # Loading placeholder
│   ├── Avatar.tsx           # User avatars
│   ├── Modal.tsx            # Dialog overlay
│   ├── Toast.tsx            # Notifications
│   ├── Spinner.tsx          # Loading indicator
│   ├── Card.tsx             # Container card
│   ├── Pagination.tsx       # Page navigation
│   └── Icon.tsx             # Icon wrapper (Lucide/Heroicons)
│
├── layout/
│   ├── AppShell.tsx         # ✅ Main app container
│   ├── Header.tsx           # ✅ Sticky navbar
│   ├── Footer.tsx           # Footer
│   ├── Sidebar.tsx          # Module sidebar navigation
│   ├── Container.tsx        # Responsive max-width wrapper
│   └── SkipToContent.tsx    # A11y skip link
│
├── book/
│   ├── BookCard.tsx         # Individual book card
│   ├── BookGrid.tsx         # Grid layout for books
│   ├── BookHeader.tsx       # Detail page hero section
│   ├── BookMeta.tsx         # Title, author, stats
│   ├── BookActions.tsx      # Borrow, wishlist, download
│   ├── ChapterList.tsx      # Chapters/volumes list
│   ├── ChapterRow.tsx       # Single chapter item
│   └── SimilarBooks.tsx     # Recommended carousel
│
├── reader/
│   ├── ReaderShell.tsx      # Main reader container (fullscreen)
│   ├── ReaderToolbar.tsx    # Top controls (back, chapter select)
│   ├── ReaderControls.tsx   # Bottom floating bar (prev/next, progress)
│   ├── ImagePage.tsx        # Single page viewer
│   ├── DoubleSpread.tsx     # Two-page layout
│   ├── PrefetchManager.tsx  # Image preloader logic
│   ├── AnnotationsOverlay.tsx # Bookmarks, notes overlay
│   └── QualitySelector.tsx  # Image quality picker
│
├── explore/
│   ├── FiltersPanel.tsx     # Genre, status, language, etc.
│   ├── SortSelect.tsx       # Sort options dropdown
│   ├── InfiniteScroller.tsx # Sentinel-based load more
│   └── FilterPill.tsx       # Individual filter tag
│
├── dashboard/
│   ├── ProfileCard.tsx      # User profile summary
│   ├── ReadingProgressList.tsx # Recently read + resume
│   ├── WishlistGrid.tsx     # Wishlist items grid
│   ├── ActivityFeed.tsx     # User activity log
│   └── SettingsPanel.tsx    # Quick settings
│
├── admin/
│   ├── AdminTable.tsx       # Data table component
│   ├── BookFormModal.tsx    # Create/edit book form
│   ├── BulkUploader.tsx     # CSV & image upload
│   ├── UploadQueue.tsx      # Job queue display
│   └── EventsMonitor.tsx    # Recent activity log
│
├── search/
│   ├── SearchBar.tsx        # Global search input
│   ├── SearchResults.tsx    # Results grid
│   └── SearchFilters.tsx    # Result filters
│
├── auth/
│   ├── ProtectedRoute.tsx   # ✅ Route guard
│   ├── LoginForm.tsx        # Login form
│   ├── RegisterForm.tsx     # Registration form
│   └── PasswordReset.tsx    # Password recovery
│
└── common/
    ├── ErrorBoundary.tsx    # Error handling
    ├── LoadingSpinner.tsx   # ✅ Global loader
    └── EmptyState.tsx       # No-data UI
```

### Module Organization

```
src/modules/
├── library/
│   ├── LibraryModule.tsx          # Entry point
│   ├── views/
│   │   ├── BooksView.tsx          # Browse all books
│   │   ├── BookDetailView.tsx     # Single book detail
│   │   ├── ReaderView.tsx         # Reader fullscreen ⭐ Priority
│   │   ├── SeriesDetailView.tsx   # Series/volumes
│   │   ├── WishlistView.tsx       # Saved books
│   │   ├── MyBooksView.tsx        # Borrowed items
│   │   ├── EBooksView.tsx         # Digital books only
│   │   ├── IssuedBooksView.tsx    # Admin issued list
│   │   ├── RequestsView.tsx       # User requests
│   │   ├── UsersView.tsx          # Admin users
│   │   ├── ReportsView.tsx        # Analytics
│   │   ├── CommunityView.tsx      # Reviews & discussions
│   │   └── LibrariaAIView.tsx     # AI recommendations
│   ├── hooks/
│   │   ├── useBook.ts            # Book data fetching
│   │   ├── useChapters.ts        # Chapter listing
│   │   ├── usePrefetchImages.ts  # Image preloader
│   │   ├── useReader.ts          # Reader state management
│   │   └── useReadingProgress.ts # Track user progress
│   ├── services/
│   │   ├── bookApi.ts           # Book endpoints
│   │   ├── readerApi.ts         # Reader/chapter data
│   │   └── progressApi.ts       # Save/sync progress
│   └── types/
│       ├── book.ts              # Book interfaces
│       ├── chapter.ts           # Chapter interfaces
│       ├── reader.ts            # Reader state types
│       └── progress.ts          # Progress tracking types
│
├── notes/
│   └── [similar structure]
│
├── healthcare/
│   └── [similar structure]
│
└── settings/
    └── [similar structure]
```

---

## 🎨 Design Tokens & Tailwind Reference

### Already Configured in `tailwind.config.js`:

#### Color Palette

**Primary Colors** (Cyan-Blue)
```tsx
// Light theme primary
<div className="bg-primary-100 text-primary-900">Primary</div>

// Dark theme primary
<div className="dark:bg-primary-700 dark:text-primary-100">Dark Primary</div>

// Range: primary-50 to primary-900
```

**Secondary Colors** (Teal)
```tsx
<div className="bg-secondary-200 dark:bg-secondary-700">Secondary</div>
```

**Accent Colors** (Hot Pink)
```tsx
<div className="bg-accent-500 text-white">Accent</div>
```

**Surface Colors** (Theme-aware)
```tsx
// Light theme
<div className="bg-surface-light text-on-surface-light">
<div className="bg-surface-light-elevated">Elevated</div>

// Dark theme
<div className="dark:bg-surface-dark dark:text-on-surface-dark">
<div className="dark:bg-surface-dark-elevated-1">1dp Elevation</div>
<div className="dark:bg-surface-dark-elevated-4">4dp Elevation</div>
```

**Semantic Colors**
```tsx
// Error/danger
<div className="bg-error-light dark:bg-error-dark">Error</div>

// Neon colors (accent)
<div className="text-neon-blue">Neon Blue</div>
<div className="text-neon-purple">Neon Purple</div>
<div className="text-neon-pink">Neon Pink</div>
<div className="text-neon-green">Neon Green</div>
```

#### Elevation & Shadows

Material Design elevation system for consistency:

```tsx
// Light theme elevations
<div className="shadow-elevation-1">1dp (subtle)</div>
<div className="shadow-elevation-2">2dp (hover state)</div>
<div className="shadow-elevation-3">3dp (cards)</div>
<div className="shadow-elevation-4">4dp (modals)</div>
<div className="shadow-elevation-5">5dp (prominent)</div>

// Dark theme elevations (reduced intensity)
<div className="dark:shadow-elevation-dark-3">Dark 3dp</div>

// Example: Card
<div className="bg-surface-light dark:bg-surface-dark shadow-elevation-2 dark:shadow-elevation-dark-2">
  Card Content
</div>
```

#### Animations

Smooth, performance-optimized animations:

```tsx
// Float animation (3s, loop)
<div className="animate-float">Floating element</div>

// Glow effect (neon)
<div className="animate-glow shadow-elevation-3">Glowing</div>

// Fade in
<div className="animate-fadeIn">Appearing</div>

// Slide up
<div className="animate-slideUp">Sliding up</div>

// Sparkle
<div className="animate-sparkle">Sparkling</div>

// Sakura fall (cherry blossoms)
<div className="animate-sakura">Falling</div>
```

#### Spacing Scale

Uses Tailwind's standard 4px grid:

```tsx
// Padding/Margin
p-2 (8px), p-3 (12px), p-4 (16px), p-6 (24px), p-8 (32px)

// Example: Card padding
<div className="p-4 md:p-6 lg:p-8">Content</div>

// Gap in grids
<div className="gap-3 md:gap-4 lg:gap-6">Items</div>
```

#### Border Radius

```tsx
// Uses Tailwind defaults
rounded-sm (2px), rounded (4px), rounded-lg (8px), rounded-xl (12px)

// Example: Card with button
<div className="rounded-lg overflow-hidden">
  <button className="rounded-md">Action</button>
</div>
```

#### Backdrop Effects

```tsx
// Glassmorphism effect
<div className="backdrop-blur-material bg-white/80 dark:bg-slate-900/80">
  Frosted glass surface
</div>
```

---

## 📱 Responsive Design Breakpoints

**Mobile-first approach:** Base styles for mobile, then add `md:`, `lg:`, `xl:` for larger screens.

### Breakpoint Reference

| Breakpoint | Min Width | Usage |
|-----------|-----------|-------|
| `xs` | 475px | Tablets (small) |
| `sm` | 640px | Tablets (medium) |
| `md` | 768px | Small laptops |
| `lg` | 1024px | Standard laptops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Ultra-wide displays |

### Reader-Specific Layouts

```tsx
// Mobile: Single column, full width
<div className="grid grid-cols-1">Single page mode</div>

// Tablet: Single or double
<div className="grid grid-cols-1 md:grid-cols-2">Content</div>

// Desktop: Double spread enabled
<div className="hidden lg:block">Double page spread</div>

// Reader viewport height
<div className="max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-6rem)]">
  Reader area
</div>
```

### Book Grid Responsive

```tsx
// Mobile: 1 column
// Tablet (sm): 2 columns
// Small desktop (md): 3 columns
// Standard desktop (lg): 4 columns
// Large desktop (xl): 5 columns
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {books.map(book => <BookCard key={book.id} {...book} />)}
</div>
```

### Typography Scale

```tsx
// Heading hierarchy
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Page Title</h1>
<h2 className="text-2xl md:text-3xl font-semibold">Section Header</h2>
<h3 className="text-lg md:text-xl font-semibold">Subsection</h3>
<p className="text-base md:text-lg text-on-surface-variant">Body text</p>
<p className="text-sm text-on-surface-muted">Helper/hint text</p>
```

---

## 🎮 Reader Module Specification (PRIORITY)

### Architecture Overview

```
ReaderShell (Fullscreen container)
├── ReaderToolbar (Top bar - sticky/collapsible)
│   ├── BackButton
│   ├── ChapterSelector
│   └── SettingsButton
├── ReaderViewport (Main content area)
│   ├── ImagePage (Single page mode)
│   ├── DoubleSpread (Two-page mode)
│   └── ScrollContainer (Continuous mode)
├── ReaderControls (Bottom floating bar - hidden on inactivity)
│   ├── PreviousButton
│   ├── ProgressSlider
│   ├── NextButton
│   ├── PageIndicator
│   └── QualitySelector
├── AnnotationsOverlay (Optional)
│   ├── BookmarkButton
│   ├── NoteMarker
│   └── HighlightDisplay
└── PrefetchManager (Background task)
    └── Preload next 1-2 images per direction
```

### State Management (useReader Hook)

```typescript
interface ReaderState {
  // Display mode
  mode: 'single' | 'double' | 'scroll';
  
  // Current position
  currentChapterId: string;
  currentPageIndex: number;
  totalPages: number;
  
  // Display settings
  zoomLevel: number; // 0.5 to 3.0
  isUIVisible: boolean;
  quality: 'low' | 'med' | 'high'; // Image resolution
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  
  // Prefetching
  prefetchedPages: Set<number>;
  
  // Bookmarks & annotations
  bookmarks: string[]; // Page numbers bookmarked
  currentAnnotations: Annotation[];
}
```

### UX Behaviors

#### Hiding UI on Inactivity
```tsx
// Hide controls after 3 seconds of no interaction
const [isUIVisible, setIsUIVisible] = useState(true);
const hideTimeout = useRef<NodeJS.Timeout | null>(null);

const handleUserInteraction = () => {
  setIsUIVisible(true);
  clearTimeout(hideTimeout.current!);
  hideTimeout.current = setTimeout(() => setIsUIVisible(false), 3000);
};

useEffect(() => {
  const viewport = document.querySelector('[role="main"]');
  viewport?.addEventListener('click', handleUserInteraction);
  viewport?.addEventListener('mousemove', handleUserInteraction);
  viewport?.addEventListener('touchstart', handleUserInteraction);
  return () => {
    viewport?.removeEventListener('click', handleUserInteraction);
    // ... cleanup
  };
}, []);
```

#### Keyboard Navigation
```tsx
// Left/Right arrows OR A/D keys for prev/next
// ESC for fullscreen toggle
// F for fullscreen
// + / - for zoom
// 1/2/3 for quality

useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A':
        goToPreviousPage();
        break;
      case 'ArrowRight': case 'd': case 'D':
        goToNextPage();
        break;
      case 'Escape': case 'f': case 'F':
        toggleFullscreen();
        break;
      case '+': case '=':
        zoomIn();
        break;
      case '-': case '_':
        zoomOut();
        break;
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

#### Touch Gestures (Swipe & Pinch)
```tsx
// Swipe left/right for page navigation
// Pinch to zoom (use library: panzoom, react-pinch-zoom-pan, etc.)
// Tap to toggle UI visibility

// Recommended library: react-use-gesture or hammer.js wrapper
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

const [{ scale }, api] = useSpring(() => ({ scale: 1 }));

const bind = useGesture({
  onPinch: ({ offset: [scale] }) => api.start({ scale }),
  onSwipe: ({ direction: [dirX] }) => {
    if (dirX > 0) goToPreviousPage();
    if (dirX < 0) goToNextPage();
  },
});
```

#### Image Prefetch Strategy
```tsx
// Preload only next 1-2 images to save bandwidth
// Use Image() constructor or link rel="preload"

const prefetchImage = (url: string) => {
  const img = new Image();
  img.src = url;
};

useEffect(() => {
  // Prefetch next 2 pages
  const nextPages = [currentPageIndex + 1, currentPageIndex + 2];
  nextPages.forEach(idx => {
    if (pages[idx]) {
      const urls = pages[idx].map(p => getImageUrl(p, quality));
      urls.forEach(prefetchImage);
    }
  });
  
  // Prefetch previous page
  if (currentPageIndex > 0) {
    const prevPages = pages[currentPageIndex - 1];
    prevPages?.forEach(p => prefetchImage(getImageUrl(p, quality)));
  }
}, [currentPageIndex, quality, pages]);
```

#### Reading Progress Sync
```tsx
// Save progress every 5 seconds of inactivity, on page change
const saveProgress = useCallback(async () => {
  if (!user?.id) return;
  
  const progress = {
    chapterId: currentChapterId,
    pageIndex: currentPageIndex,
    timestamp: Date.now(),
  };
  
  await progressApi.saveProgress(user.id, bookId, progress);
  
  // Also save to localStorage for instant access
  localStorage.setItem(`reader:${bookId}`, JSON.stringify(progress));
}, [currentChapterId, currentPageIndex, user?.id, bookId]);

// Debounce saves
useEffect(() => {
  const timer = setTimeout(saveProgress, 5000);
  return () => clearTimeout(timer);
}, [currentPageIndex, saveProgress]);
```

#### Resume Reading
```tsx
// On book detail load, show resume button if progress exists
useEffect(() => {
  const saved = localStorage.getItem(`reader:${bookId}`);
  if (saved) {
    const progress = JSON.parse(saved);
    setResumeData(progress);
  }
}, [bookId]);

// Resume button
<button
  onClick={() => navigateToReader(resumeData.chapterId, resumeData.pageIndex)}
  className="btn btn-primary"
>
  Resume Reading (Chapter {resumeData.chapterNum}, Page {resumeData.pageIndex + 1})
</button>
```

### Reader Modes Implementation

#### Single Page Mode (Default)
```tsx
<div className="flex items-center justify-center h-screen bg-black">
  <img
    src={pageUrl}
    alt={`Page ${currentPageIndex + 1} of ${totalPages}`}
    className="max-h-[100vh] max-w-[100vw] object-contain"
  />
</div>
```

#### Double Spread Mode (lg+ only)
```tsx
<div className="hidden lg:grid grid-cols-2 gap-2 items-center justify-center h-screen bg-black">
  <img
    src={leftPageUrl}
    alt={`Page ${currentPageIndex}`}
    className="max-h-[100vh] max-w-[50vw] object-contain"
  />
  <img
    src={rightPageUrl}
    alt={`Page ${currentPageIndex + 1}`}
    className="max-h-[100vh] max-w-[50vw] object-contain"
  />
</div>
```

#### Continuous Scroll Mode (Webtoon)
```tsx
<div className="overflow-y-auto h-screen bg-black">
  {pages.map((page, idx) => (
    <div key={idx} className="flex justify-center py-2">
      <img
        src={page.url}
        alt={`Page ${idx + 1}`}
        className="max-w-[100vw] object-contain"
        loading={idx < currentPageIndex + 5 ? 'eager' : 'lazy'}
      />
    </div>
  ))}
</div>
```

---

## 📡 API Endpoints & Data Flow

### Book Endpoints

```typescript
// GET /api/books?page=1&limit=20&genre=&status=&sort=
// Returns: { data: Book[], total: number, page: number }
interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  rating: number;
  totalRatings: number;
  genre: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  totalChapters: number;
  language: string;
  tags: string[];
  publishedAt: string;
}

// GET /api/books/:id
// Returns: Book (full details)

// GET /api/books/:id/chapters?page=1&limit=50
// Returns: { data: Chapter[], total: number }
interface Chapter {
  id: string;
  number: number;
  title: string;
  publishedAt: string;
  readProgress?: number; // 0-100
  isRead?: boolean;
  duration?: number; // Estimated read time in minutes
}

// GET /api/chapters/:chapterId/pages
// Returns: { data: Page[], chapter: ChapterDetail }
interface Page {
  id: string;
  index: number;
  url: string;
  width: number;
  height: number;
}

// POST /api/users/:userId/progress
// Body: { bookId, chapterId, pageIndex, timestamp }
// Saves reading progress server-side

// POST /api/users/:userId/wishlist/:bookId
// Add/remove from wishlist (toggle)

// GET /api/users/:userId/wishlist
// Returns: Book[]

// POST /api/books/:id/borrow
// Body: { borrowDate?, returnDate? }
// Borrow a physical book

// GET /api/search?q=&page=1&limit=20
// Search across books, series, authors

// GET /api/books/recommendations?userId=
// AI-powered recommendations
```

### Progress Sync Strategy

```typescript
// Frontend strategy:
// 1. Save to localStorage immediately (optimistic)
// 2. Debounce server save (5s after last page change)
// 3. Save to server on page change
// 4. Sync on app resume/focus
// 5. Load from server on app start (if user logged in)

const saveProgressToServer = async (bookId, progress) => {
  try {
    await api.post(`/users/${user.id}/progress`, {
      bookId,
      ...progress,
      clientTimestamp: Date.now(),
    });
  } catch (error) {
    // Fall back to localStorage on error
    console.error('Failed to sync progress:', error);
  }
};

// Handle app focus (resume after idle/background)
useEffect(() => {
  const handleFocus = () => {
    // Sync progress on focus
    saveProgressToServer(bookId, currentProgress);
  };
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

---

## ♿ Accessibility Checklist & Implementation

### WCAG AA Compliance Requirements

#### 1. Semantic HTML
```tsx
// Use proper landmark elements
<header role="banner">Header</header>
<nav role="navigation">Navigation</nav>
<main role="main">Main content</main>
<aside role="complementary">Sidebar</aside>
<footer role="contentinfo">Footer</footer>

// Use semantic form elements
<form>
  <label htmlFor="search">Search books</label>
  <input id="search" type="search" />
  <button type="submit">Search</button>
</form>

// Use article, section for content structure
<article>
  <h1>Book Title</h1>
  <section>
    <h2>Chapters</h2>
    ...
  </section>
</article>
```

#### 2. Focus Management
```tsx
// Always show focus ring
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2">
  Action
</button>

// Focus trap in modals
<dialog
  className="fixed inset-0 z-50 flex items-center justify-center"
  open={isOpen}
  onKeyDown={(e) => {
    if (e.key === 'Escape') handleClose();
  }}
>
  <div
    ref={dialogRef}
    className="bg-white dark:bg-surface-dark p-6 rounded-lg"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <h2 id="dialog-title">Dialog Title</h2>
    ...
  </div>
</dialog>

// Manage focus on route change
useEffect(() => {
  const main = document.querySelector('main');
  main?.focus();
}, [location]);
```

#### 3. ARIA Roles & Attributes
```tsx
// Buttons with state
<button
  aria-pressed={isWishlisted}
  onClick={toggleWishlist}
  className="btn"
>
  {isWishlisted ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
</button>

// Pagination
<nav aria-label="Pagination" className="flex gap-2">
  <button aria-label="Previous page">←</button>
  <span aria-current="page">Page 1</span>
  <button aria-label="Next page">→</button>
</nav>

// Dropdown menu
<div className="relative">
  <button aria-haspopup="true" aria-expanded={isOpen}>
    Menu
  </button>
  {isOpen && (
    <ul role="menu">
      <li role="none">
        <a role="menuitem" href="/">Home</a>
      </li>
    </ul>
  )}
</div>

// Live region for status updates
<div aria-live="polite" aria-atomic="true">
  {toastMessage && <p>{toastMessage}</p>}
</div>

// Custom image cards
<figure>
  <img
    src={cover}
    alt={`Cover of "${title}" by ${author}`}
  />
  <figcaption>{title}</figcaption>
</figure>
```

#### 4. Color Contrast
```tsx
// Minimum WCAG AA: 4.5:1 for normal text, 3:1 for large text
// Tailwind utilities to ensure contrast:

// Light theme examples
<p className="text-on-surface-light bg-surface-light">High contrast</p>

// Dark theme (already calculated)
<p className="dark:text-on-surface-dark dark:bg-surface-dark">Dark contrast</p>

// Never rely on color alone
<div className="flex items-center gap-2">
  <span className="w-4 h-4 rounded-full bg-red-500">●</span>
  <span>Error message</span> {/* Text label + color */}
</div>
```

#### 5. Skip to Content Link
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only absolute top-0 left-0 z-50 bg-primary-600 text-white px-4 py-2"
>
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
  Content here...
</main>
```

#### 6. Keyboard Navigation
```tsx
// All interactive elements keyboard accessible
// Tab through: Links, Buttons, Form fields, Modals
// Enter/Space: Activate buttons
// Arrow keys: Navigate lists, tabs
// Escape: Close modals, cancel actions

// Example: Chapter list keyboard nav
<ul role="listbox" onKeyDown={handleKeyDown}>
  {chapters.map((ch, idx) => (
    <li
      key={ch.id}
      role="option"
      tabIndex={selectedIndex === idx ? 0 : -1}
      onClick={() => selectChapter(ch.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectChapter(ch.id);
        }
      }}
    >
      {ch.title}
    </li>
  ))}
</ul>
```

#### 7. Respect Motion Preferences
```tsx
// Check for prefers-reduced-motion
<div className="animate-float motion-safe:animate-float motion-reduce:animate-none">
  Content
</div>

// Or with CSS
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Use in component
{prefersReducedMotion() ? (
  <div>Static content</div>
) : (
  <div className="animate-fadeIn">Animated content</div>
)}
```

### Accessibility Testing Checklist

- [ ] Lighthouse Accessibility score ≥ 90
- [ ] axe DevTools audit passes
- [ ] Keyboard navigation full coverage (Tab, Enter, Escape, Arrows)
- [ ] Screen reader tested (NVDA on Windows, JAWS, VoiceOver on Mac)
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] alt text on all images
- [ ] Form labels associated with inputs
- [ ] Modal focus trap working
- [ ] Skip link functional
- [ ] Animations respect prefers-reduced-motion
- [ ] Error messages clear and associated with fields
- [ ] Timing/session doesn't timeout unexpectedly
- [ ] Responsive at 200% zoom
- [ ] Mobile screen reader (iOS VoiceOver, Android TalkBack)

---

## ⚡ Performance & Optimization Guide

### Image Optimization Strategy

```tsx
// 1. Lazy load with Intersection Observer
<img
  src={cover}
  alt={title}
  loading="lazy"
  decoding="async"
  srcSet={`
    ${cover}?w=300&q=75 300w,
    ${cover}?w=600&q=75 600w,
    ${cover}?w=1200&q=90 1200w
  `}
  sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
/>

// 2. Blur-up placeholder
const [imageLoaded, setImageLoaded] = useState(false);
<div className="relative">
  {!imageLoaded && (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 blur-md" />
  )}
  <img
    src={cover}
    onLoad={() => setImageLoaded(true)}
    className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
  />
</div>

// 3. Use WebP with fallback
<picture>
  <source srcSet={`${imageUrl}.webp`} type="image/webp" />
  <source srcSet={`${imageUrl}.jpg`} type="image/jpeg" />
  <img src={`${imageUrl}.jpg`} alt={title} />
</picture>

// 4. CDN delivery with optimization
const getCDNUrl = (path: string, options?: { width?: number; quality?: number }) => {
  const params = new URLSearchParams();
  if (options?.width) params.append('w', options.width.toString());
  if (options?.quality) params.append('q', options.quality.toString());
  return `https://cdn.example.com/images/${path}?${params}`;
};
```

### Code Splitting Strategy

```tsx
// Already implemented in App.tsx - lazy load modules
const LibraryModule = lazy(() => import('./modules/library/LibraryModule'));
const NotesModule = lazy(() => import('./modules/notes/NotesModule'));

// Split within modules
const ReaderView = lazy(() => import('./views/ReaderView'));
const BookDetailView = lazy(() => import('./views/BookDetailView'));

// Use Suspense for graceful loading
<Suspense fallback={<LoadingSpinner />}>
  <ReaderView bookId={bookId} />
</Suspense>

// Route-based code splitting
const routes = [
  {
    path: '/library/books/:id/read',
    element: <Suspense fallback={<Spinner />}><ReaderView /></Suspense>,
  },
];
```

### Data Fetching & Caching

```tsx
// Use React Query for caching & invalidation
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

// Cache book list (5 min)
const { data: books } = useQuery({
  queryKey: ['books', { page, filters }],
  queryFn: () => api.getBooks({ page, ...filters }),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000, // garbage collection time
});

// Infinite scroll for explore page
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['books', 'explore'],
  queryFn: ({ pageParam }) => api.getBooks({ page: pageParam }),
  initialPageParam: 1,
  getNextPageParam: (lastPage, pages) => pages.length + 1,
});

// Prefetch next page on mount
const queryClient = useQueryClient();
useEffect(() => {
  queryClient.prefetchInfiniteQuery({
    queryKey: ['books', 'explore'],
    queryFn: ({ pageParam }) => api.getBooks({ page: pageParam }),
    pages: 2,
  });
}, []);
```

### Infinite Scroll with Sentinel

```tsx
// InfiniteScroller component
export const InfiniteScroller = ({ hasMore, onLoadMore, children }) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore) {
        onLoadMore();
      }
    }, { rootMargin: '100px' });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  return (
    <>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center">
          <Spinner />
        </div>
      )}
    </>
  );
};

// Usage
<InfiniteScroller
  hasMore={hasMore}
  onLoadMore={() => fetchNextPage()}
>
  <BookGrid books={books} />
</InfiniteScroller>
```

### Throttle & Debounce Handlers

```tsx
// Throttle scroll handlers (for reader)
const useThrottle = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(() => {
    if (!timeoutRef.current) {
      callback();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
      }, delay);
    }
  }, [callback, delay]);
};

// Debounce search input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage in search
const searchInput = useRef('');
const debouncedSearch = useDebounce(searchInput.current, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchBooks(debouncedSearch);
  }
}, [debouncedSearch]);
```

### Performance Monitoring

```tsx
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

if (import.meta.env.PROD) {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// Monitor API response times
const measureApiCall = async (name: string, fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return result;
};

// Usage
await measureApiCall('getBooks', () => api.getBooks());
```

---

## 📝 Common Tailwind Patterns

### BookCard Component

```tsx
export const BookCard: React.FC<BookCardProps> = ({
  bookId,
  cover,
  title,
  author,
  rating,
  tags,
  onBorrow,
  onWishlistToggle,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <article className="group flex flex-col gap-3 rounded-lg overflow-hidden bg-surface-light dark:bg-surface-dark shadow-elevation-2 dark:shadow-elevation-dark-2 transition-all hover:shadow-elevation-3 hover:-translate-y-1">
      {/* Cover Image */}
      <div className="relative overflow-hidden h-56 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
        <img
          src={cover}
          alt={`Cover of "${title}" by ${author}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        {/* Wishlist Button */}
        <button
          onClick={() => {
            setIsWishlisted(!isWishlisted);
            onWishlistToggle(bookId);
          }}
          aria-pressed={isWishlisted}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-surface-dark/90 backdrop-blur-sm shadow-elevation-1 hover:bg-white dark:hover:bg-surface-dark-elevated-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-all"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? (
            <span className="text-lg">❤️</span>
          ) : (
            <span className="text-lg">🤍</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-grow">
        <h3 className="font-semibold text-sm line-clamp-2 text-on-surface-light dark:text-on-surface-dark hover:text-primary-600 dark:hover:text-primary-300">
          {title}
        </h3>
        <p className="text-xs text-on-surface-light-variant dark:text-on-surface-dark-variant line-clamp-1">
          {author}
        </p>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-lg">⭐</span>
            <span className="text-xs font-medium text-on-surface-light dark:text-on-surface-dark">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 2).map((tag) => (
              <badge key={tag} className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 text-xs px-2 py-0.5 rounded">
                {tag}
              </badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t border-outline-light dark:border-outline-dark">
        <button
          onClick={() => onBorrow(bookId)}
          className="flex-1 btn btn-primary text-sm"
        >
          Read
        </button>
        <button className="flex-1 btn btn-secondary text-sm">Details</button>
      </div>
    </article>
  );
};
```

### Reader Full-Screen Layout

```tsx
export const ReaderShell: React.FC<ReaderShellProps> = ({
  currentPageIndex,
  totalPages,
  onNextPage,
  onPreviousPage,
  onClose,
}) => {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isFullscreen ? '' : 'md:rounded-lg'}`}>
      {/* Toolbar */}
      <header
        className={`absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${
          isUIVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between max-w-full">
          <button
            onClick={onClose}
            className="btn btn-ghost text-white focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close reader"
          >
            ← Back
          </button>
          <span className="text-white text-sm font-medium">
            Page {currentPageIndex + 1} of {totalPages}
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-ghost text-white focus-visible:ring-2 focus-visible:ring-white"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main
        role="main"
        className="flex-1 bg-black flex items-center justify-center overflow-hidden"
        onClick={() => setIsUIVisible(!isUIVisible)}
      >
        {/* Image container */}
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={currentPage.url}
            alt={`Page ${currentPageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </main>

      {/* Controls Bar */}
      <footer
        className={`absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-between gap-4 transition-opacity duration-300 ${
          isUIVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onPreviousPage}
          disabled={currentPageIndex === 0}
          className="btn btn-secondary text-white focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={totalPages - 1}
            value={currentPageIndex}
            onChange={(e) => /* handle page change */}
            className="flex-1"
            aria-label="Progress slider"
          />
          <span className="text-white text-xs font-medium whitespace-nowrap">
            {Math.round((currentPageIndex / totalPages) * 100)}%
          </span>
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPageIndex === totalPages - 1}
          className="btn btn-secondary text-white focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Next page"
        >
          Next →
        </button>
      </footer>
    </div>
  );
};
```

### Explore Page Grid with Filters

```tsx
export const ExplorePage: React.FC = () => {
  const [filters, setFilters] = useState({ genre: '', status: '', sort: 'trending' });
  const { data: books, hasMore, fetchNextPage } = useInfiniteQuery(/* ... */);

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar - Mobile bottom sheet, desktop sidebar */}
        <aside className="lg:col-span-1">
          <FiltersPanel
            filters={filters}
            onFilterChange={setFilters}
            className="hidden lg:block"
          />
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          <InfiniteScroller hasMore={hasMore} onLoadMore={() => fetchNextPage()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {books?.pages.flatMap((page) => page.data).map((book) => (
                <BookCard key={book.id} {...book} />
              ))}
            </div>
          </InfiniteScroller>
        </main>
      </div>
    </Container>
  );
};
```

---

## 🔗 Recommended Dependencies

Already installed:
- ✅ `react`, `react-dom` — Core UI library
- ✅ `react-router-dom` — Page routing
- ✅ `tailwindcss` — Styling
- ✅ `lucide-react` — Icons
- ✅ `framer-motion` — Animations
- ✅ `axios` — HTTP client

Recommended to add:
- `@tanstack/react-query` — Data fetching & caching
- `react-hook-form` — Form handling
- `zod` or `yup` — Schema validation
- `zustand` — State management (lighter alternative to Redux)
- `react-use-gesture` or `@use-gesture/react` — Gesture support
- `panzoom` or `react-medium-image-zoom` — Image zoom/pan
- `react-virtual` — Virtualization for long lists
- `date-fns` — Date formatting
- `clsx` — Conditional className utility

```bash
npm install @tanstack/react-query react-hook-form zod zustand @use-gesture/react panzoom
```

---

## ✅ Final Implementation Checklist

### Global Setup
- [ ] Theme provider with localStorage persistence
- [ ] AppShell layout with Header/Footer
- [ ] Responsive breakpoint testing at 5+ sizes
- [ ] Color token implementation verified

### Component Library
- [ ] All UI components created (Button, Input, Select, etc.)
- [ ] BookCard component with hover states
- [ ] BookGrid responsive layout
- [ ] Modal & Toast notification system

### Core Pages
- [ ] Landing page with featured carousel
- [ ] Explore page with filters & infinite scroll
- [ ] Book detail page with chapters list
- [ ] Search results integration

### Reader Module (CRITICAL)
- [ ] ReaderShell fullscreen container
- [ ] Single-page reading mode
- [ ] Double-spread mode (lg breakpoint)
- [ ] Continuous scroll mode
- [ ] Keyboard navigation (arrows, ESC, +/-)
- [ ] Touch gestures (swipe, pinch-zoom)
- [ ] UI auto-hide on inactivity
- [ ] Image prefetching strategy
- [ ] Reading progress persistence
- [ ] Resume reading functionality

### User Dashboard
- [ ] Profile card with avatar
- [ ] Reading progress list
- [ ] Resume reading buttons
- [ ] Wishlist grid view
- [ ] Activity feed

### Admin Area
- [ ] Books table with search/sort/pagination
- [ ] Create/edit book modal
- [ ] Bulk uploader for CBZ/images
- [ ] Upload job queue display
- [ ] Event monitor/logs

### Accessibility
- [ ] Skip to content link
- [ ] Keyboard navigation full coverage
- [ ] Focus indicators on all interactive elements
- [ ] ARIA roles and labels implemented
- [ ] Color contrast WCAG AA verified
- [ ] Screen reader tested
- [ ] Lighthouse a11y score ≥ 90

### Performance
- [ ] Image lazy loading with blur-up
- [ ] Code splitting for modules
- [ ] React Query caching configured
- [ ] Infinite scroll with Intersection Observer
- [ ] Debounce/throttle on scroll, resize
- [ ] Lighthouse performance score ≥ 80

### Deployment Ready
- [ ] .env variables documented
- [ ] API error handling implemented
- [ ] Offline fallback strategy
- [ ] Build optimized (tree-shaking, minification)
- [ ] TypeScript strict mode enabled
- [ ] ESLint rules passing
- [ ] README updated with component docs

---

## 📚 References

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Material Design 3 Specification](https://m3.material.io)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Vitals](https://web.dev/vitals/)
- [React Query Docs](https://tanstack.com/query)
- [Accessibility Testing Guide](https://www.w3.org/WAI/test-evaluate/)

---

**Next Step:** Start with Phase 1 (Global Infrastructure) and work systematically through each phase. Test accessibility and performance at each checkpoint.
