# RSS Reader Development Plan

## Project Overview

A professional web-based RSS reader featuring a multi-column newspaper-like interface. Built as a frontend-only Next.js application with IndexedDB for data persistence and web workers for background RSS updates.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS + FlyonUI
- **Database**: IndexedDB (via idb library)
- **Background Processing**: Web Workers
- **Deployment**: Vercel
- **CORS Handling**: Vercel API endpoints for RSS feed proxying

## Core Features

### 1. Multi-Column Newspaper Interface
- Dynamic column layout based on screen size
- Configurable maximum width per column
- Responsive design (single column on mobile)
- Infinite scroll or pagination for article loading
- Real-time feed updates without UI blocking

### 2. Feed Management
- Dedicated page for adding/removing RSS feed sources
- Bulk import/export of feed configurations
- Individual feed import capability
- Per-feed configuration options

### 3. Tag System
- Multiple tags per RSS feed (1..N relationship)
- Tag-based filtering on main page
- AND/OR logic filtering options
- Tag management interface

### 4. Content Filtering
- "Ignored words/expressions" per feed
- Comma-separated blacklist values
- Real-time content filtering
- Case-insensitive matching

### 5. Data Persistence
- Complete RSS feed data storage in IndexedDB
- Feed source configurations
- User preferences and settings
- Offline reading capability

## Architecture

### Database Schema (IndexedDB)

```typescript
// Feed Sources
interface FeedSource {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  ignoredWords: string[];
  updateInterval?: number; // minutes, null = use global default
  lastUpdated: Date;
  isActive: boolean;
  favicon?: string;
  createdAt: Date;
}

// Feed Items
interface FeedItem {
  id: string;
  feedId: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate: Date;
  guid: string;
  categories: string[];
  isRead: boolean;
  isStarred: boolean;
  isHidden: boolean; // filtered by ignored words
  createdAt: Date;
}

// User Settings
interface UserSettings {
  id: 'global';
  defaultUpdateInterval: number; // minutes
  maxColumns: number;
  columnMaxWidth: number; // pixels
  theme: 'light' | 'dark' | 'auto';
  tagFilterMode: 'AND' | 'OR';
  itemsPerPage: number;
  markAsReadOnScroll: boolean;
}

// Tags
interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}
```

### Web Worker Architecture

```typescript
// RSS Update Worker
interface WorkerMessage {
  type: 'UPDATE_FEED' | 'UPDATE_ALL_FEEDS' | 'SCHEDULE_UPDATE';
  payload: {
    feedId?: string;
    interval?: number;
  };
}

// Worker responsibilities:
// - Fetch RSS feeds via CORS proxy
// - Parse XML/RSS content
// - Filter content based on ignored words
// - Store results in IndexedDB
// - Send progress updates to main thread
```

### API Endpoints (Vercel)

```typescript
// /api/rss-proxy
// GET /api/rss-proxy?url=<encoded_rss_url>
// Returns: Raw RSS XML content with CORS headers
```

## Development Phases

### Phase 1: Project Setup & Core Infrastructure
**Estimated Time: 1-2 days**

1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest rss-reader --typescript --tailwind --app
   cd rss-reader
   npm install @flyonui/flyonui idb rss-parser
   ```

2. **Configure TailwindCSS with FlyonUI**
   - Install and configure FlyonUI components
   - Set up custom theme and design tokens
   - Configure responsive breakpoints

3. **Setup IndexedDB Database**
   - Create database schema and types
   - Implement database service layer
   - Add migration system for schema updates
   - Create data access layer (DAL)

4. **Setup Web Worker Infrastructure**
   - Create RSS update worker
   - Implement worker communication layer
   - Add worker registration and lifecycle management

5. **Create CORS Proxy API**
   - Implement `/api/rss-proxy` endpoint
   - Add error handling and rate limiting
   - Test with various RSS feed formats

### Phase 2: Feed Management System
**Estimated Time: 2-3 days**

1. **Feed Sources Page**
   - Create `/feeds` route and page component
   - Build add/edit feed form with validation
   - Implement feed deletion with confirmation
   - Add feed testing functionality (validate URL)

2. **Import/Export Functionality**
   - Create OPML import parser
   - Implement JSON export/import for bulk operations
   - Add individual feed import from URL
   - Build file upload interface

3. **Feed Configuration**
   - Per-feed update interval settings
   - Ignored words management interface
   - Tag assignment interface
   - Feed metadata display and editing

4. **Tag Management**
   - Tag creation and editing interface
   - Tag color picker
   - Tag deletion with reassignment options
   - Tag statistics (feed count per tag)

### Phase 3: Main Reader Interface
**Estimated Time: 3-4 days**

1. **Layout System**
   - Responsive multi-column layout component
   - Dynamic column width calculation
   - Mobile-first responsive design
   - Configurable maximum columns

2. **Article Display Components**
   - Article card component with FlyonUI styling
   - Article metadata display (date, source, tags)
   - Read/unread status indicators
   - Star/bookmark functionality

3. **Navigation and Filtering**
   - Tag-based filtering interface
   - AND/OR filter mode toggle
   - Search functionality
   - Sort options (date, title, source)

4. **Content Loading**
   - Infinite scroll implementation
   - Loading states and skeletons
   - Error handling for failed loads
   - Performance optimization for large datasets

### Phase 4: Background Processing & Updates
**Estimated Time: 2-3 days**

1. **RSS Parser Integration**
   - Integrate rss-parser in web worker
   - Handle various RSS/Atom feed formats
   - Error handling for malformed feeds
   - Content sanitization and validation

2. **Update Scheduling**
   - Implement update scheduler in worker
   - Per-feed and global interval handling
   - Background update progress tracking
   - Update conflict resolution

3. **Content Filtering**
   - Implement ignored words filtering
   - Case-insensitive matching
   - Regular expression support
   - Performance optimization for large blacklists

4. **Data Synchronization**
   - Worker to main thread communication
   - Real-time UI updates
   - Optimistic updates for user interactions
   - Conflict resolution for concurrent updates

### Phase 5: User Experience & Settings
**Estimated Time: 2 days**

1. **Settings Page**
   - Global configuration interface
   - Theme selection (light/dark/auto)
   - Update interval management
   - Layout preferences

2. **User Interface Enhancements**
   - Keyboard shortcuts
   - Context menus for articles
   - Bulk operations (mark all read, etc.)
   - Drag and drop for tag assignment

3. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader compatibility
   - High contrast mode support

4. **Performance Optimization**
   - Virtual scrolling for large lists
   - Image lazy loading
   - Database query optimization
   - Bundle size optimization

### Phase 6: Testing & Deployment
**Estimated Time: 1-2 days**

1. **Testing**
   - Unit tests for core functions
   - Integration tests for database operations
   - End-to-end tests for user workflows
   - Performance testing with large datasets

2. **Error Handling & Monitoring**
   - Global error boundaries
   - User-friendly error messages
   - Logging and debugging tools
   - Offline state handling

3. **Deployment Setup**
   - Vercel deployment configuration
   - Environment variable setup
   - Performance monitoring
   - Analytics implementation (optional)

4. **Documentation**
   - User guide and help system
   - Developer documentation
   - API documentation
   - Deployment instructions

## File Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main reader interface
│   ├── feeds/
│   │   ├── page.tsx              # Feed management page
│   │   └── components/           # Feed-specific components
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   ├── api/
│   │   └── rss-proxy/
│   │       └── route.ts          # CORS proxy endpoint
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── layout/                   # Layout components
│   ├── reader/                   # Reader-specific components
│   └── feeds/                    # Feed management components
├── lib/
│   ├── db/                       # IndexedDB service layer
│   ├── workers/                  # Web worker files
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript type definitions
├── hooks/                        # Custom React hooks
└── stores/                       # State management (if needed)

public/
├── workers/                      # Web worker files
└── favicon.ico

docs/
├── DevelopmentPlan.md           # This file
├── Claude.md                    # Claude-specific information
├── UserGuide.md                 # End-user documentation
└── API.md                       # API documentation
```

## Key Components

### 1. Database Service (`lib/db/`)

```typescript
// db-service.ts
export class DatabaseService {
  async initialize(): Promise<void>
  async addFeed(feed: FeedSource): Promise<string>
  async updateFeed(id: string, updates: Partial<FeedSource>): Promise<void>
  async deleteFeed(id: string): Promise<void>
  async getAllFeeds(): Promise<FeedSource[]>
  async getFeedItems(feedId: string, limit?: number): Promise<FeedItem[]>
  async addFeedItems(items: FeedItem[]): Promise<void>
  async markAsRead(itemIds: string[]): Promise<void>
  async getSettings(): Promise<UserSettings>
  async updateSettings(settings: Partial<UserSettings>): Promise<void>
}
```

### 2. RSS Worker (`lib/workers/rss-worker.ts`)

```typescript
// Worker for background RSS processing
export class RSSWorker {
  async updateFeed(feedId: string): Promise<void>
  async updateAllFeeds(): Promise<void>
  async scheduleUpdates(): Promise<void>
  private async fetchFeed(url: string): Promise<string>
  private async parseFeed(xmlContent: string): Promise<FeedItem[]>
  private async filterContent(items: FeedItem[], ignoredWords: string[]): Promise<FeedItem[]>
}
```

### 3. Reader Layout (`components/reader/ReaderLayout.tsx`)

```typescript
// Multi-column responsive layout
export function ReaderLayout({
  items,
  selectedTags,
  filterMode,
  onLoadMore
}: ReaderLayoutProps) {
  // Dynamic column calculation
  // Responsive breakpoints
  // Virtual scrolling
  // Item rendering
}
```

## Technical Considerations

### Performance
- Use virtual scrolling for large article lists
- Implement proper IndexedDB indexing
- Optimize worker communication with batching
- Use React.memo and useMemo for expensive operations

### Security
- Sanitize all RSS content before storage
- Validate all user inputs
- Implement CSP headers
- Use HTTPS for all external requests

### Accessibility
- Semantic HTML structure
- ARIA labels for dynamic content
- Keyboard navigation support
- Screen reader compatibility

### Browser Compatibility
- Modern browsers with IndexedDB support
- Web Worker support required
- Progressive enhancement for older browsers

## Deployment Notes

### Vercel Configuration

```javascript
// vercel.json
{
  "functions": {
    "src/app/api/rss-proxy/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/rss-proxy",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

### Environment Variables
- No sensitive data required for basic operation
- Optional: Analytics keys, monitoring services

## Future Enhancements

### Phase 7: Advanced Features (Optional)
- Full-text search across all articles
- Article summarization using AI
- Social sharing capabilities
- Podcast RSS support
- Export to read-later services
- Progressive Web App (PWA) features
- Collaborative features (shared feeds)
- Advanced analytics and reading statistics

## Risk Mitigation

### Technical Risks
- **CORS Issues**: Mitigated by Vercel proxy API
- **IndexedDB Limitations**: Implement fallback to localStorage
- **Worker Browser Support**: Graceful degradation to main thread
- **RSS Feed Variations**: Robust parsing with fallbacks

### User Experience Risks
- **Performance with Large Datasets**: Virtual scrolling and pagination
- **Offline Functionality**: Service worker implementation
- **Data Loss**: Regular export reminders and backup features
- **Learning Curve**: Comprehensive onboarding and help system

## Success Metrics

- **Performance**: Page load < 3 seconds, smooth scrolling
- **Reliability**: 99%+ uptime, robust error handling
- **Usability**: Intuitive interface, minimal learning curve
- **Compatibility**: Works on all modern browsers and devices