# ShadowStrike AI SOC Platform

## Overview

ShadowStrike is an AI-powered Security Operations Center (SOC) platform that analyzes raw security logs to identify threats, map them to MITRE ATT&CK framework, and provide actionable defense recommendations.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Auth**: JWT (bcryptjs + jsonwebtoken), 30-day token expiry
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── shadow-strike/      # React frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## Features

1. **Log Analysis** (`/analyze`) - Paste raw security logs, get AI analysis
2. **Threat Intelligence** - Threat level (low/med/high/critical), risk score 0-100
3. **Attacker Attribution** - Origin country/region detection
4. **Attack Classification** - Type of attack identified
5. **MITRE ATT&CK Mapping** - Specific technique IDs and tactics
6. **Attack Timeline** - Chronological event breakdown with severity
7. **Next Steps Prediction** - What the attacker is likely to do next
8. **Defense Actions** - Prioritized (immediate/short-term/long-term) recommendations
9. **Graph Visualization** - Network graph showing attacker → techniques → target
10. **Save Reports** - Save and review analysis reports
11. **Auth System** - JWT login/register, admin panel with user management

## Admin Access

- Email: `jarrarhassan05@gmail.com`
- Password: `T3lthod@72`
- Admin can view all registered users at `/admin`

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (auth required)
- `POST /api/analyze` - Analyze logs (auth required)
- `GET /api/reports` - Get user's saved reports (auth required)
- `POST /api/reports` - Save a report (auth required)
- `DELETE /api/reports/:id` - Delete a report (auth required)
- `GET /api/admin/users` - Get all users (admin only)

## Database Schema

- `users` - id, email, password_hash, role, created_at
- `reports` - id, user_id, title, logs, result (jsonb), created_at
