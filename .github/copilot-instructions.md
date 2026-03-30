<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# GastroLog Backend - Copilot Instructions

## Project Overview
GastroLog Backend is a Node.js + Express.js API for a food social network with real-time features.

## Architecture Guidelines

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL)
- **Cache**: Redis (ioredis)
- **Real-time**: Socket.io
- **Auth**: JWT + bcrypt

### Code Structure
- `src/controllers/` - Business logic for each resource
- `src/routes/` - API endpoint definitions
- `src/middleware/` - Authentication, error handling, validation
- `src/lib/` - Database and cache configurations
- `src/index.ts` - Application entry point

### Naming Conventions
- Controllers: PascalCase with "Controller" suffix (e.g., `UserController`)
- Routes: kebab-case with `.routes.ts` suffix
- Files: Use descriptive names with appropriate suffix
- Functions: camelCase

### Best Practices
1. Always validate input data before processing
2. Use Prisma for all database operations
3. Return proper HTTP status codes
4. Include error messages in responses
5. Use async/await for asynchronous operations
6. Implement proper authentication checks
7. Use TypeScript types for all parameters and returns
8. Handle errors gracefully with try-catch blocks

### Database Patterns
- Use Prisma for all queries
- Select only needed fields to optimize queries
- Include related data when necessary
- Use transactions for multi-step operations

### API Response Format
```json
{
  "data": {},
  "message": "Success message",
  "error": null
}
```

For errors:
```json
{
  "error": "Error message",
  "status": 400
}
```

### Authentication
- All protected routes require JWT token
- Token should be in Authorization header: `Bearer <token>`
- Use `@authenticate` middleware on protected routes

### Socket.io Events
- Keep event names simple and descriptive
- Emit events from controllers after successful operations
- Namespace events by feature (e.g., `notifications:new`, `messages:send`)

## Common Tasks

### Adding a New Endpoint
1. Create a method in the appropriate controller
2. Add route in the corresponding routes file
3. Apply authentication middleware if needed
4. Test with appropriate HTTP method and status code

### Adding a Database Model
1. Update `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Create controller and routes for the new model
4. Export in appropriate routes file

## Development Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio for database visualization
- `npm test` - Run test suite
