# GEMINI.md - Project Context: gojukainam

## Project Overview
**gojukainam** is a Karate Championships Management System designed to handle event registrations, club management, athlete tracking, and entry processing for karate tournaments.

### Architecture & Tech Stack
- **Monorepo Structure**: The project is organized into `backend/` and `frontend/` directories.
- **Backend**: Node.js with Express.js, using Prisma ORM with a PostgreSQL database. Written in TypeScript.
- **Frontend**: React SPA built with Vite and styled with Tailwind CSS. Uses TypeScript, React Router, and TanStack Query.
- **Authentication**: Custom JWT-based authentication with support for Magic Links and Password Resets. Roles include `SUPERADMIN`, `ADMIN`, `CLUB_MANAGER`, `COACH`, and `ATHLETE`.
- **Infrastructure**: Configured for deployment on Railway using Nixpacks.

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- PostgreSQL database
- npm

### Backend Setup
1.  Navigate to `backend/`.
2.  Install dependencies: `npm install`.
3.  Configure `.env` based on `.env.example`.
4.  Run migrations: `npm run prisma:migrate`.
5.  Seed the database: `npm run prisma:seed`.
6.  Start development server: `npm run dev`.

### Frontend Setup
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Configure `.env` (or `.env.production` for production builds).
4.  Start development server: `npm run dev`.

## Key Commands

### Backend Scripts
- `npm run dev`: Starts the backend server with `tsx watch` for development.
- `npm run build`: Compiles TypeScript to JavaScript in the `dist/` folder.
- `npm run start`: Runs the compiled backend from `dist/server.js`.
- `npm run prisma:migrate`: Deploys Prisma migrations to the database.
- `npm run prisma:seed`: Seeds the database with initial data (e.g., superuser, belts).
- `npm run prisma:studio`: Opens Prisma Studio for database exploration.
- `npm run superuser-recovery <email>`: Generates a password reset link for a specific user.

### Frontend Scripts
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the production-ready frontend in the `dist/` folder.
- `npm run start`: Serves the production build using the `serve` package.

## Data Model Highlights
The system revolves around several core entities:
- **Event**: Represents a tournament with specific configuration (stored in `config/event-config.yaml` and snapped into `configJson`).
- **Club**: Organizations that register athletes for events.
- **Athlete**: Individual participants belonging to clubs.
- **Entry**: A registration of an athlete (or team) into a specific event division (Kata/Kumite).
- **Division**: Age and gender-based categories within an event.
- **Team**: Groups of athletes for team events.
- **Invoice**: Financial records for club registrations.

## Development Conventions
- **Type Safety**: TypeScript is used across both backend and frontend. Ensure proper typing for all new features.
- **API Pattern**: Backend routes are organized in `backend/src/routes/` and corresponding services in `backend/src/services/`.
- **Frontend Organization**: Pages are in `frontend/src/pages/`, reusable components in `frontend/src/components/`, and API client logic in `frontend/src/lib/`.
- **Validation**: Zod is used for schema validation in the backend.
- **Error Handling**: Centralized error handling middleware in the backend (`backend/src/utils/error-handler.ts`).

## Deployment
The project is configured for Railway.
- **Backend**: Uses `npm run build` and `npm run start`. Requires `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` environment variables.
- **Frontend**: Uses `npm run build` and `npm run start` (which uses `serve`). Requires `VITE_API_URL`.
- **Database**: PostgreSQL service on Railway.
