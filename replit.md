# ShadowStrike AI SOC Platform

## Overview

ShadowStrike is an AI-powered Security Operations Center (SOC) platform that analyzes raw security logs to identify threats, map them to MITRE ATT&CK framework, and provide actionable defense recommendations.

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


