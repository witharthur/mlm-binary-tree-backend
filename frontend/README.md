# BioBinary Frontend

Production-style Next.js 14 frontend for the MLM binary-tree backend.

## Stack

- Next.js 14 App Router, React, TypeScript
- TailwindCSS design system
- Axios API client with JWT bearer token injection
- TanStack React Query caching and optimistic wallet deposit updates
- Zustand auth and UI state
- Recharts analytics
- Framer Motion transitions
- SVG binary tree visualization

## Routes

- `/login`
- `/register`
- `/ref/[sponsorId]/[side]`
- `/dashboard`
- `/products`
- `/wallet`
- `/tree`
- `/orders`
- `/bonuses`
- `/withdrawals`

## API

The frontend targets:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

If the API is unavailable, read operations and core demo mutations fall back to mocked data so the UI remains usable during frontend development.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
