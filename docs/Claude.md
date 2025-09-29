# RSS Reader - Claude Code Information

## Project Overview

This is a modern web-based RSS reader application built with Next.js, featuring a professional multi-column newspaper-like interface. The application is designed to be completely frontend-only with no backend dependencies, using IndexedDB for local data persistence.

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

- **Frontend**: Next.js 14+ with App Router
- **Styling**: TailwindCSS + FlyonUI components
- **Database**: IndexedDB with idb library
- **Background Processing**: Web Workers for RSS updates
- **CORS Handling**: Vercel API endpoints for RSS proxying
- **Deployment**: Vercel-ready configuration

## Key Features

1. **Multi-column newspaper layout** - Responsive design with configurable columns
2. **Feed management** - Add/remove feeds with bulk import/export
3. **Tag system** - Organize feeds with multiple tags and filtering options
4. **Content filtering** - Per-feed ignored words/expressions
5. **Background updates** - Web worker-based RSS fetching
6. **Offline capable** - Full content persistence in IndexedDB

## Development Guidelines

### File Organization
- Components in `/src/components/` organized by feature
- Database layer in `/src/lib/db/`
- Web workers in `/src/lib/workers/`
- Type definitions in `/src/lib/types/`
- API routes in `/src/app/api/`

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Component-first architecture
- Hooks for state management
- Proper error boundaries

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
2. Follow existing naming conventions
3. Include TypeScript interfaces
4. Add proper accessibility attributes

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
1. **CORS errors**: Check proxy API endpoint configuration
2. **IndexedDB issues**: Verify browser support and storage limits
3. **Worker failures**: Check worker registration and message handling
4. **RSS parsing errors**: Implement fallback parsing strategies

### Development Tools
- Browser DevTools for debugging
- IndexedDB inspection in Application tab
- Network tab for RSS fetch monitoring
- Performance tab for optimization

## Contributing Guidelines

1. Follow existing code style and conventions
2. Add TypeScript types for all new code
3. Include unit tests for new functionality
4. Update documentation for significant changes
5. Test on multiple browsers and devices

## Security Considerations

- All RSS content is sanitized before storage
- User inputs are validated and escaped
- CSP headers configured for XSS protection
- HTTPS enforced for all external requests
- No sensitive data storage in localStorage/IndexedDB