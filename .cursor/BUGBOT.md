# Project review guidelines for BugBot

## Security focus areas

- Validate user input in API endpoints
- Check for SQL injection vulnerabilities in database queries
- Ensure proper authentication on protected routes
- Validate file uploads and prevent path traversal attacks

## Architecture patterns

- Use dependency injection for services
- Follow the repository pattern for data access
- Implement proper error handling with custom error classes
- Use event-driven architecture for loose coupling

## React best practices

- Memory leaks in React components (check useEffect cleanup)
- Missing error boundaries in UI components
- Inconsistent naming conventions (use camelCase for functions)
- Proper state management with hooks
- Performance optimization with React.memo, useMemo, useCallback

## TypeScript guidelines

- Strict type checking enabled
- No implicit any types
- Proper interface definitions
- Generic type constraints
- Union and intersection types usage

## Performance considerations

- Bundle size optimization
- Lazy loading implementation
- Memory leak prevention
- WebGL performance optimization
- Event listener cleanup

## Common issues to watch for

- Unhandled promise rejections
- Missing error boundaries
- Inconsistent error handling
- Memory leaks in event listeners
- Performance bottlenecks in render loops
- Security vulnerabilities in user input

## Code quality standards

- Consistent code formatting
- Meaningful variable and function names
- Proper documentation and comments
- Unit test coverage
- Integration test coverage
