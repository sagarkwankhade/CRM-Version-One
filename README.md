
# CRM Backend (Node + Express + MongoDB)

A comprehensive CRM backend system with role-based access control (Admin, Vendor, Employee), task management, lead tracking, and notifications.

## Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Crm Version One"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and update the following:
   # - MONGO_URI: Your MongoDB connection string
   # - JWT_SECRET: A strong random string for JWT token signing
   # - PORT: Server port (default: 4000)
   ```

4. **Start MongoDB**
   - Local: Make sure MongoDB is running on `localhost:27017`
   - Cloud: Update `MONGO_URI` in `.env` with your MongoDB Atlas connection string

5. **Create admin user**
   ```bash
   npm run seed
   # or
   npm run create-admin
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Production Deployment

### Environment Variables

Make sure to set these environment variables in your production environment:

- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Strong random string for JWT signing (required, change from default!)
- `PORT` - Server port (optional, defaults to 4000)
- `ADMIN_EMAIL` - Admin email (optional, for admin creation scripts)
- `ADMIN_PASSWORD` - Admin password (optional, for admin creation scripts)

### Deployment Steps

1. **Set up environment variables** on your hosting platform (Heroku, Railway, Render, etc.)
   - Never commit `.env` file to git
   - Use your platform's environment variable configuration

2. **Install dependencies**
   ```bash
   npm install --production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Create default admin user (admin@example.com / admin123)
- `npm run create-admin` - Create/update admin user (uses ADMIN_EMAIL and ADMIN_PASSWORD from .env)
- `npm run list-users` - List all users in the database
- `npm run fix-passwords` - Fix users with plain text passwords (re-hash them)

### Security Notes

- ✅ All passwords are hashed using bcrypt
- ✅ JWT tokens for authentication
- ✅ Environment variables for sensitive data
- ✅ CORS enabled (configure allowed origins in production)
- ⚠️ Change `JWT_SECRET` in production!
- ⚠️ Never commit `.env` file to version control

APIs (overview)

- Auth: /api/auth/login, /api/auth/register (register limited to admin/vendor)
- Admin routes: /api/admin/...
- Vendors: /api/vendors/...
- Employees: /api/employees/...
- Tasks: /api/tasks/...
- Leads: /api/leads/...
- Notifications: /api/notifications/...

Postman: import & run (step-by-step)

1) Files included

- `Postman_CRM_Backend_Collection.json` — collection with requests for login, admin/vendor flows, tasks, leads, notifications.
- `Postman_CRM_Backend_Environment.json` — environment with variables: `baseUrl`, `token`, `vendorId`, `employeeId`, `taskId`, `notifId`.

2) Import into Postman

- Open Postman.
- Click File → Import and select `Postman_CRM_Backend_Collection.json`.
- Import the environment file `Postman_CRM_Backend_Environment.json` the same way.
- Select the environment named `CRM Backend Env` in the top-right environment selector.

3) Configure environment (optional)

- By default `baseUrl` is `http://localhost:4000`. Change it if your server runs elsewhere.
- `token` will be filled automatically when you run the Login request.

4) Run the main flow

- Run `Auth - Login` (collection root). It will call `/api/auth/login` using the seeded admin (admin@example.com / admin123) and store the returned token in the environment variable `token`.
- Run `Admin - Create Vendor` to create a vendor — the response test script stores the returned `_id` into `vendorId`.
- Run `Admin - Create Employee` to create an employee and link to the vendor (uses `vendorId`). The script stores `employeeId`.
- Run `Create Task (Admin)` or `Create Task (Vendor)` to create tasks (scripts save `taskId`).
- Run `Admin - Create Notification` then `Admin - Send Notification` (script stores `notifId`) to simulate sending notifications to the selected audience.

5) Notes & tips

- Use the environment variables in request bodies/URLs: the collection already references `{{vendorId}}`, `{{employeeId}}`, `{{notifId}}` etc.
- If a request fails with 401, re-run `Auth - Login` and ensure the `token` variable is set.
- The `send` notification request simulates delivery and returns a recipients count. Integrate a real email/push provider later if you need actual delivery.

If you'd like, I can also add a Newman script to run the collection from the command line or extend the collection with more tests/assertions.
