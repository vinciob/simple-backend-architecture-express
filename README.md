# simple-backend-architecture-express

A simple backend API built with Express 5, TypeScript, Zod and Mongoose,
focused on ease of development and a readable, feature-based architecture.

Users register, log in and manage their own tasks. Authentication uses Argon2id
password hashes, short-lived JWT access tokens and rotating refresh tokens stored
in an HttpOnly cookie.

## Structure

```text
src/
  app.ts                        Express middleware and route registration
  server.ts                     Database connection, HTTP startup and shutdown
  config/env.ts                 Environment validation with Zod
  db/connection.ts              Mongoose connection and index creation
  modules/
    users/
      user.entity.ts            User schemas, inferred types, model and response mapper
      users.routes.ts           Registration and current user
    auth/
      session.entity.ts         Session schema, inferred type, model and indexes
      auth.routes.ts            Login, refresh and logout
      auth.middleware.ts        JWT verification and request.auth
      auth.utils.ts             Token and cookie helpers
    tasks/
      task.entity.ts            Task schemas, inferred types, model and response mapper
      task.routes.ts            Task CRUD
  shared/
    errorHandler.ts             Shared errors and HTTP error responses
```

Each feature groups its routes and entities in one module. Each entity keeps its
Zod schemas, `z.infer` types, Mongoose schema and indexes together. Routers validate
input and use the models directly. Express 5 automatically sends async handler
errors to the shared error middleware.

Database indexes are created before the server starts accepting requests:

- Unique user email.
- Task owner and creation date (`createdBy`, `createdAt`).
- Session user and revocation status (`userId`, `revokedAt`).
- Session expiry TTL (`expiresAt`, `expireAfterSeconds: 0`).

## Run locally

Requires Node.js 22.12+ and MongoDB (MongoDB 8 is used in Docker Compose).

```sh
npm install
cp .env.example .env
npm run dev
```

Set `JWT_SECRET` to a random value of at least 32 characters and configure MongoDB
in `.env`. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable           | Default       | Description                                             |
| ------------------ | ------------- | ------------------------------------------------------- |
| `NODE_ENV`         | `development` | `development`, `test` or `production`                   |
| `PORT`             | `3000`        | HTTP port                                               |
| `HOST`             | `0.0.0.0`     | Listening address                                       |
| `CLIENT_ORIGIN`    | Required      | Allowed HTTP(S) frontend origin, without trailing slash |
| `MONGODB_URI`      | Required      | MongoDB connection URI                                  |
| `MONGODB_DATABASE` | Required      | Database name                                           |
| `JWT_SECRET`       | Required      | HS256 signing secret, at least 32 characters            |

```sh
npm run typecheck
npm run build
npm start
```

To run both the backend and MongoDB with Docker:

```sh
docker compose up --build
```

Compose reads `JWT_SECRET` and `NODE_ENV` from `.env`. The development default
supports local HTTP. In production, set `NODE_ENV=production` and serve the API
over HTTPS so browsers can send the Secure refresh cookie. MongoDB data is kept
in the `mongo-data` volume. The backend reaches MongoDB using the `mongo` service
hostname.

## API

The API exposes user registration, authentication, task management and health
checks at the following endpoints.

| Method | Path            | Auth             | Success response                                  |
| ------ | --------------- | ---------------- | ------------------------------------------------- |
| GET    | `/health`       | Public           | `200 { status, timestamp }`                       |
| GET    | `/health/db`    | Public           | `200 { status, database }` after MongoDB ping     |
| POST   | `/users`        | Public           | `201 { user }`                                    |
| GET    | `/users/me`     | Bearer           | `200` user object                                 |
| POST   | `/auth/login`   | Public           | `200 { accessToken, tokenType }` + refresh cookie |
| POST   | `/auth/refresh` | Cookie           | `200 { accessToken, tokenType }` + rotated cookie |
| POST   | `/auth/logout`  | Cookie, optional | `204`, clears cookie                              |
| POST   | `/tasks`        | Bearer           | `201` task object                                 |
| GET    | `/tasks`        | Bearer           | `200` array of task list items                    |
| GET    | `/tasks/:id`    | Bearer           | `200` task object                                 |
| PATCH  | `/tasks/:id`    | Bearer           | `200` updated task object                         |
| DELETE | `/tasks/:id`    | Bearer           | `204`                                             |

### Users

Register with `POST /users`:

```json
{
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "password": "a-long-password-123"
}
```

`name` is 2–100 characters, email is at most 254 characters and password is 12–128
characters. Email is trimmed and lowercased. Registration returns `{ "user": ... }`
and does not create a session. User responses contain only `id`, `name`, `email`
and ISO `createdAt`; password hashes are never returned.

### Login and sessions

`POST /auth/login` accepts `email` and `password`. The response contains an HS256
JWT with `sub` (user ID), `sid` (session ID) and a **10-minute** lifetime:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer"
}
```

Send it as `Authorization: Bearer <jwt>` on protected routes. In a browser, use
`credentials: 'include'` for login, refresh and logout so the cookie is stored and
sent. The allowed frontend origin is configured with `CLIENT_ORIGIN`.

Refresh tokens expire **7 days after login** and are stored only as SHA-256 hashes
in MongoDB. Every refresh rotates the token atomically without extending the
original session expiry. Reusing a previous token revokes that session. The
`refreshToken` cookie is HttpOnly, SameSite=Lax, restricted to `/auth`, and Secure
in production. Logout revokes the session and clears the cookie, even if it is
missing or invalid.

Protected routes verify JWT signatures and claims without looking up the session
on each request. **Logout/replay revokes refresh
tokens; an already issued access token remains valid until its 10-minute expiry.**

### Tasks

Create with `POST /tasks`:

```json
{
  "name": "Study Express architecture",
  "description": "Read the routes and entity definitions",
  "status": "created",
  "dueDate": "2027-01-30T10:00:00.000Z"
}
```

- `name`: required, 1–120 characters after trimming.
- `description`: optional, at most 2000 characters, defaults to `null`.
- `status`: `created`, `in_progress` or `completed`; defaults to `created`.
- `dueDate`: optional ISO date-time, defaults to `null`.

Single-task responses contain `id`, `name`, `description`, `status`, `dueDate`,
`createdAt`, `updatedAt` and `createdBy`. All dates are ISO strings.

`GET /tasks` returns an array ordered by descending creation date, with only
`_id`, `name`, `dueDate` and `status`.

`PATCH /tasks/:id` accepts any nonempty subset of the create fields. Omitted
fields remain unchanged; `null` clears `description` or `dueDate`. Whitespace-only
names and unexpected input properties are rejected with `400`.

All task queries include the authenticated owner. Reading, changing or deleting
another user's task returns `404`. Complete or reopen a task with PATCH and the
appropriate `status`.

### Errors

Errors have `statusCode`, `error` and `message`; Zod validation errors also include
`details`. Invalid inputs return `400`, authentication failures `401`, missing
resources `404`, and duplicate emails `409`. Unexpected errors return a generic
`500` response and are logged on the server.

## Author

Created by Vincenzo Brasca.
