# Backend

Institute ERP Backend API built with Node.js, TypeScript, and Express.

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (via Docker or installed locally)
- Redis (via Docker or installed locally)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start Docker services (PostgreSQL + Redis):
```bash
# From project root
docker-compose up -d
```

4. Run database migrations:
```bash
npm run prisma:generate
npm run migrate
```

5. Seed the database (optional):
```bash
npm run seed
```

### Development

Start the development server:
```bash
npm run dev
```

Server will run on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed database with initial data
- `npm test` - Run tests

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── modules/
│   │   ├── auth/          # Authentication & Authorization
│   │   ├── students/      # Student management
│   │   ├── classes/       # Class management
│   │   ├── assignments/   # Assignment management
│   │   ├── attendance/    # Attendance management
│   │   └── ...
│   ├── common/
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   ├── config/            # Configuration
│   └── index.ts           # Entry point
├── .env.example           # Environment variables template
├── package.json
└── tsconfig.json
```

## API Documentation

Once the server is running, API documentation will be available at:
- Swagger UI: `http://localhost:3000/api/docs` (coming soon)

## Database Schema

The database schema includes:
- Users & Authentication (JWT-based)
- Role-Based Access Control (RBAC)
- Programs, Units, Classes
- Students & Enrollments
- Attendance Management
- Assignments with BTEC Workflow
- Notifications
- Audit Logs

View the complete schema in `prisma/schema.prisma`

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
