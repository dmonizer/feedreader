# RSS Reader - Claude Code Information

## Project Overview

This is a modern web-based RSS reader application built with Next.js, featuring a professional multi-column newspaper-like interface. The application is designed to be completely frontend-only with no backend dependencies, using IndexedDB for local data persistence.

## Current Development Status

**Phase 1: ✅ COMPLETE** - Project Setup & Core Infrastructure
- Next.js 14+ project with TypeScript and App Router
- TailwindCSS + FlyonUI styling framework
- Complete IndexedDB database layer with CRUD operations
- Web worker infrastructure for background processing
- CORS proxy API for RSS feed fetching
- Development environment and build configuration

**Phase 2: ✅ COMPLETE** - Feed Management System
- Complete feeds management page at `/feeds`
- Add/edit/delete feeds with validation and testing
- Tag management system with color customization
- Import/export functionality (OPML and JSON formats)
- File upload with drag-and-drop interface
- Professional navigation and error handling

**Phase 3: 🔄 NEXT** - Main Reader Interface
- Multi-column newspaper layout
- Article display and reading interface
- Feed filtering and search functionality
- Reader settings and preferences

**Development Server**: Running at http://localhost:3001

## Quick Start Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Test (when implemented)
npm test
```

## Project Structure

This is a **monorepo** with separate frontend and backend directories:

```
/Users/erik.suit/Development/personal/rss-reader/
├── frontend/          # Next.js frontend application (PRIMARY DEVELOPMENT AREA)
│   └── src/
│       ├── components/    # React components (CVECard, CVEList, SourceCard, etc.)
│       ├── app/           # Next.js App Router pages
│       ├── hooks/         # Custom React hooks
│       ├── types/         # TypeScript type definitions
│       ├── utils/         # Utility functions
│       ├── styles/        # CSS/styling files
│       └── pages/         # Additional pages
├── backend/           # Backend services
│   └── src/
│       ├── controllers/   # Route controllers
│       ├── services/      # Business logic
│       ├── models/        # Data models
│       ├── routes/        # API routes
│       └── types/         # TypeScript types
├── db/                # Database files
├── docs/              # Documentation (Claude.md, DEVELOPMENT.md)
└── docker-compose.yml # Docker configuration
```

**⚠️ IMPORTANT FOR FILE SEARCHING:**
- Frontend components are in `frontend/src/components/` (NOT `src/components/`)
- Backend code is in `backend/src/` (NOT `src/`)
- Always use the full path with `frontend/` or `backend/` prefix

### Technology Stack
- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Styling**: TailwindCSS + FlyonUI components
- **Database**: IndexedDB with idb library
- **Background Processing**: Web Workers for RSS updates
- **CORS Handling**: Vercel API endpoints for RSS proxying
- **Deployment**: Vercel-ready configuration

## Implemented Features

### ✅ Feed Management (Phase 2)
1. **Complete Feed CRUD** - Add, edit, delete RSS feeds with validation
2. **Feed Testing** - Real-time RSS feed validation and metadata extraction
3. **Tag System** - Color-coded tags with assignment and filtering
4. **Import/Export** - OPML and JSON import/export with progress tracking
5. **File Upload** - Drag-and-drop interface for bulk operations
6. **Search & Filter** - Real-time search and tag-based filtering

### ✅ Core Infrastructure (Phase 1)
1. **IndexedDB Storage** - Complete local data persistence
2. **CORS Proxy** - RSS feed fetching through Vercel API
3. **Web Workers** - Background processing architecture
4. **TypeScript** - Full type safety and validation
5. **Responsive Design** - FlyonUI components with mobile support
6. **Error Handling** - Comprehensive error boundaries and validation

### 🔄 Planned Features (Phase 3+)
1. **Multi-column newspaper layout** - Responsive reading interface
2. **Article display** - Full content rendering and reading experience
3. **Content filtering** - Per-feed ignored words/expressions
4. **Background updates** - Automated RSS fetching and updates
5. **Reader settings** - Customizable layout and preferences

## Development Guidelines

### File Organization
- Components in `/src/components/` organized by feature:
  - `/feeds/` - Feed management components (FeedList, FeedForm, etc.)
  - `/tags/` - Tag management components (TagManager, TagEditor, etc.)
  - `/ui/` - Reusable UI components (Button, Input, Modal, etc.)
- Database layer in `/src/lib/db/` - IndexedDB service and schema
- Web workers in `/src/lib/workers/` - Background processing
- Type definitions in `/src/lib/types/` - TypeScript interfaces
- Utilities in `/src/lib/utils/` - Helper functions and validation
- Custom hooks in `/src/hooks/` - React hooks for data management
- API routes in `/src/app/api/` - Vercel serverless functions

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Component-first architecture with `'use client'` directives
- Custom hooks for state management and data operations
- Proper error boundaries and loading states
- FlyonUI component library for consistent styling

### Database Design
- IndexedDB stores: feeds, feedItems, settings, tags
- Efficient indexing for queries
- Migration system for schema updates
- Data validation and sanitization

### Performance Considerations
- Virtual scrolling for large lists
- Web workers for RSS processing
- Optimized IndexedDB queries
- Image lazy loading
- Bundle optimization

## Important Implementation Notes

### CORS Handling
RSS feeds are fetched through a Vercel API proxy at `/api/rss-proxy` to handle CORS restrictions. This endpoint:
- Accepts RSS feed URLs as query parameters
- Returns raw RSS XML with proper CORS headers
- Includes basic rate limiting and error handling

### Web Worker Architecture
RSS updates run in background workers to prevent UI blocking:
- Scheduled updates per feed or globally
- Real-time progress reporting
- Error handling and retry logic
- Communication via message passing

### Mobile Responsiveness
- Multi-column layout on desktop/tablet
- Single column layout on mobile
- Touch-friendly interface
- Optimized for various screen sizes

### Data Persistence
All data is stored locally in IndexedDB:
- No external dependencies for data storage
- Full offline reading capability
- Configurable data retention policies
- Export/import for data portability

## Common Tasks

### Adding New Components
1. Create component in appropriate `/src/components/` subdirectory
2. Add `'use client'` directive if using React hooks or browser APIs
3. Follow existing naming conventions (PascalCase for components)
4. Include TypeScript interfaces and proper prop types
5. Add proper accessibility attributes and ARIA labels
6. Use FlyonUI classes for consistent styling

### Database Schema Changes
1. Update type definitions in `/src/lib/types/`
2. Create migration in database service
3. Update relevant queries and operations
4. Test with existing data

### Adding New API Endpoints
1. Create route file in `/src/app/api/`
2. Implement proper error handling
3. Add CORS headers if needed
4. Update TypeScript types

### Testing
- Unit tests for utility functions
- Integration tests for database operations
- Component testing with React Testing Library
- E2E tests for critical user workflows

## Deployment

### Vercel Configuration
The project includes a `vercel.json` configuration for:
- API route optimization
- CORS header setup
- Function timeout configuration
- Static asset optimization

### Environment Setup
No environment variables required for basic functionality. Optional variables for:
- Analytics integration
- Error monitoring
- Performance tracking

## Troubleshooting

### Common Issues
1. **CORS errors**: Check proxy API endpoint configuration at `/api/rss-proxy`
2. **IndexedDB issues**: Verify browser support and storage limits
3. **Worker failures**: Check worker registration and message handling
4. **RSS parsing errors**: Implement fallback parsing strategies
5. **Client Component errors**: Add `'use client'` directive to components using hooks
6. **Import/Export issues**: Verify file formats (OPML/JSON) and data structure

### Development Tools
- Browser DevTools for debugging
- IndexedDB inspection in Application tab
- Network tab for RSS fetch monitoring
- Performance tab for optimization

## Contributing Guidelines

1. Follow existing code style and conventions
2. Add `'use client'` directive to components using React hooks
3. Add TypeScript types for all new code
4. Use FlyonUI components for consistent styling
5. Include proper error handling and loading states
6. Update documentation for significant changes
7. Test on multiple browsers and devices

## Security Considerations

- All RSS content is sanitized before storage
- User inputs are validated and escaped
- CSP headers configured for XSS protection
- HTTPS enforced for all external requests
- No sensitive data storage in localStorage/IndexedDB