# Codexa Backend

Express.js REST API for task management with MongoDB.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev

# Seed database with sample tasks
npm run seed:tasks
```

## API Endpoints

- `GET /api/tasks` - Get tasks with filtering

# Codexa Backend

Express.js REST API for task management with MongoDB.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev

# Seed database with sample tasks
npm run seed:tasks
```

## API Endpoints

- `GET /api/tasks` - Get tasks with filtering
- `GET /api/tasks/categories` - Get task categories
- `GET /api/tasks/difficulties` - Get task difficulties
- `GET /api/tasks/stats` - Get task statistics
- `GET /api/tasks/:id` - Get single task

See `docs/API_REFERENCE.md` for complete documentation.

## Available Scripts

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm run seed:tasks` - Seed database with sample tasks
- `npm run test` - Run API tests

```
Authorization: Bearer <token>
```

Response:

```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "id": "session-id",
        "device": "Chrome on MacOS",
        "createdAt": "2025-06-24T12:00:00.000Z",
        "expiresAt": "2025-07-01T12:00:00.000Z",
        "isCurrentSession": true
      }
    ]
  }
}
```

#### Logout from a specific session

```
DELETE /api/auth/sessions/:sessionId
```

Headers:

```
Authorization: Bearer <token>
```

Response:

```json
{
  "status": "success",
  "message": "Session ended successfully"
}
```

#### Logout from all sessions

```
DELETE /api/auth/sessions
```

Headers:

```
Authorization: Bearer <token>
```

Response:

```json
{
  "status": "success",
  "message": "Logged out from all sessions"
}
```

## License

ISC
