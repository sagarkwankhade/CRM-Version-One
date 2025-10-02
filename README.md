
CRM Backend (Node + Express + MongoDB)

Quick start

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies: npm install
3. Start MongoDB locally or set `MONGO_URI`.
4. Seed an admin: npm run seed
5. Start server: npm run dev

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
