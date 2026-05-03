# 🚀 Quick Setup - Choose Your Option

## ⚡ Option 1: SQLite (Easiest - No PostgreSQL needed!)

### Step 1: استخدم SQLite بدلاً من PostgreSQL

```powershell
cd backend
copy .env.sqlite .env
```

### Step 2: تشغيل Migration

```powershell
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 3: أعد تشغيل Backend

في terminal الـ Backend (اضغط Ctrl+C ثم):
```powershell
npm run dev
```

### Step 4: افتح التطبيق

http://localhost:5173

**Login:**
- Email: `admin@example.com`
- Password: `admin123`

---

## 🐘 Option 2: PostgreSQL (إذا كنت تعرف الـ password)

### خيار A: Password = "postgres"

```powershell
cd backend
# لا تحتاج شيء، .env جاهز
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### خيار B: Password = "admin"

Edit `backend\.env`:
```
DATABASE_URL="postgresql://postgres:admin@localhost:5432/institute_erp?schema=public"
```

### خيار C: Password = "password"

Edit `backend\.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/institute_erp?schema=public"
```

### خيار D: Password = "1234"

Edit `backend\.env`:
```
DATABASE_URL="postgresql://postgres:1234@localhost:5432/institute_erp?schema=public"
```

---

## 🆘 نسيت الـ PostgreSQL Password؟

### إعادة تعيين Password:

1. افتح **Services** (اضغط Win+R واكتب `services.msc`)
2. ابحث عن `postgresql-x64-18`
3. Stop the service
4. افتح Command Prompt كـ Administrator:

```cmd
cd "C:\Program Files\PostgreSQL\18\bin"
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start
psql -U postgres
ALTER USER postgres WITH PASSWORD 'newpassword';
\q
```

5. ثم غيّر password في `.env`

---

## ✅ أسهل حل: استخدم SQLite!

SQLite لا يحتاج password ولا تثبيت أي شيء إضافي:

```powershell
cd backend
copy .env.sqlite .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

**Done! 🎉**
