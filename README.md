# 🚀 Quick Start Guide
# Institute ERP System

## Prerequisites

Before you begin, ensure you have:
- ✅ **Node.js 20+** - [Download](https://nodejs.org/)
- ✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- ✅ **Git** - [Download](https://git-scm.com/)

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd institute-erp
```

### Step 2: Start Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker ps
```

You should see:
- `institute-erp-postgres` on port 5432
- `institute-erp-redis` on port 6379

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
copy .env.example .env

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run migrate

# Start the backend server
npm run dev
```

Backend will be running on `http://localhost:3000`

✅ Test it: Open `http://localhost:3000/health`

### Step 4: Setup Frontend

Open a **new terminal** window:

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

Frontend will be running on `http://localhost:5173`

✅ Test it: Open `http://localhost:5173` in your browser

---

## 📁 Project Structure

```
institute-erp/
├── backend/              # Node.js + TypeScript + Express API
│   ├── prisma/          # Database schema & migrations
│   ├── src/             # Source code
│   ├── .env             # Environment variables
│   └── package.json
│
├── frontend/            # React + Vite Application
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   └── package.json
│
├── docker/             # Docker configurations
├── docker-compose.yml  # PostgreSQL + Redis setup
└── README.md
```

---

## 🔧 Common Commands

### Backend

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run migrate          # Run migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run prisma:generate  # Regenerate Prisma Client
npm run seed             # Seed database with sample data

# Testing
npm test                 # Run tests
```

### Frontend

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
```

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

---

## 🧪 Verify Installation

### 1. Check Backend Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Institute ERP API is running",
  "timestamp": "2026-01-29T..."
}
```

### 2. Check Database Connection

```bash
cd backend
npm run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can view your database.

### 3. Check Frontend

Open `http://localhost:5173` in your browser. You should see the welcome screen with:
- 🎓 Institute ERP header
- System status indicators
- All checkmarks should be green ✅

---

## 🗃️ Database Schema

The system includes 22 database tables:

**Core Tables:**
- `users`, `roles`, `permissions`, `role_permissions`, `user_roles`
- `audit_logs`

**Academic:**
- `programs`, `units`, `program_units`
- `classes`, `lectures`

**Students:**
- `students`, `parents`, `student_parents`
- `student_enrollments`, `student_unit_progress`

**Operations:**
- `attendance_records`
- `assignments`, `student_assignments`

**System:**
- `notifications`, `notification_preferences`
- `system_settings`

View the full schema at: [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma)

---

## 🔐 Default Credentials

After seeding the database (coming soon), you can use:

- **Super Admin:**
  - Username: `admin`
  - Password: `Admin@123`

- **Academic Affairs:**
  - Username: `academic`
  - Password: `Academic@123`

- **Instructor:**
  - Username: `instructor`
  - Password: `Instructor@123`

> ⚠️ **Important:** Change these passwords in production!

---

## 🐛 Troubleshooting

### PowerShell Script Execution Error

If you see: `running scripts is disabled on this system`

**Solution:** The project files have been created manually. Simply run:
```bash
cd backend
npm install

cd ../frontend
npm install
```

### Docker Connection Error

If backend can't connect to PostgreSQL:

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check the connection string in `backend/.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/institute_erp?schema=public"
   ```

3. Restart Docker services:
   ```bash
   docker-compose restart
   ```

### Port Already in Use

If port 3000 or 5173 is busy:

**Backend:** Change PORT in `backend/.env`
**Frontend:** Change port in `frontend/vite.config.ts`

---

## 📖 Next Steps

1. ✅ Complete Authentication Module
2. ✅ Build Academic Management (Programs, Classes, Scheduling)
3. ✅ Implement Student Management
4. ✅ Add Attendance System
5. ✅ Create Assignment Workflow (BTEC-compliant)

Refer to the [Implementation Plan](./docs/implementation_plan.md) for detailed roadmap.

---

## 📚 Documentation

- [Feature List](./docs/feature_list.md) - Complete feature specifications
- [Workflows](./docs/workflows.md) - Detailed process workflows
- [Architecture](./docs/architecture.md) - System architecture & tech stack
- [Implementation Plan](./docs/implementation_plan.md) - MVP development plan
- [Roadmap](./docs/roadmap.md) - 12-month development roadmap

---

## 🆘 Need Help?

- **Backend Issues:** Check [`backend/README.md`](./backend/README.md)
- **Frontend Issues:** Check [`frontend/README.md`](./frontend/README.md)
- **Database Issues:** Run `npm run prisma:studio` to inspect

---

## ✅ System Status

Current implementation status:

- [x] Project structure created
- [x] Docker environment configured
- [x] Backend scaffolding complete
- [x] Frontend scaffolding complete
- [x] Database schema defined (22 tables)
- [ ] Authentication & Authorization
- [ ] Academic Management
- [ ] Student Management
- [ ] Attendance System
- [ ] Assignment Workflow

**Progress:** Foundation Complete ✅ | MVP Development: 0% ⏳

---

**Happy Coding! 🚀**
