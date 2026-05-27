# Mike's Clean Cut Landscaping

Next.js 16 web application — marketing website + employee portal for managing landscaping work orders, crews, materials, and customers.

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| React | 19.2.4 |
| Database | PostgreSQL via Prisma 5.x |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Auth | NextAuth v5 (beta) |
| Animation | Framer Motion 12.x |
| Components | Radix UI, Lucide icons, CVA + clsx + tailwind-merge |

---

## PROJECT STRUCTURE

```
mmc-next/
├── CLAUDE.md                        ← You are here
├── prisma/schema.prisma             ← 16 models (Employee, Customer, WorkOrder, etc.)
├── src/app/
│   ├── (marketing)/                 ← Public marketing site
│   │   ├── page.tsx                 ← Homepage
│   │   ├── about/, blog/, careers/, contact/
│   │   ├── portfolio/, quote/, resources/
│   │   ├── services/, testimonials/
│   │   └── layout.tsx
│   ├── portal/                      ← Employee portal (auth required)
│   │   ├── page.tsx                 ← Dashboard
│   │   ├── admin/                   ← Admin settings
│   │   ├── jobs/                    ← Work order CRUD
│   │   ├── breakdown/               ← Job breakdown / stats
│   │   ├── customers/               ← Customer management
│   │   ├── employees/               ← Employee management
│   │   ├── materials/               ← Materials tracking
│   │   └── settings/
│   ├── api/
│   │   ├── auth/                    ← NextAuth endpoints
│   │   └── jobs/                    ← Work order API
│   ├── login/                       ← Login page
│   ├── layout.tsx                   ← Root layout
│   └── globals.css
└── docker-compose.yml (if applicable)
```

---

## DATABASE MODELS (Prisma)

Core models in `prisma/schema.prisma`:

- **Employee** — staff with roles (ADMIN, MANAGER, FOREMAN, CREW)
- **Customer** — clients with address/contact info
- **WorkOrder** — jobs with status lifecycle (DRAFT → IN_PROGRESS → COMPLETED → INVOICED)
- **TimeEntry** — start/end times per work order
- **CrewDetail** — per-employee hours breakdown (job, setup, travel, unload, delivery)
- **Payment** — check payments against work orders
- **Photo** — before/after images
- **Machine** — equipment hours per job
- **Debris** — debris removal tracking (yards)
- **Weeding** — bed maintenance time tracking
- **HourlyWork** — sprinkler/lighting/hourly labor
- **Material** — MCC-owned materials used
- **OutsourcedMaterial** — supplier materials with cost tracking
- **AdditionalWork** — approved extra work with its own crew and materials

---

## AUTH

- NextAuth v5 with Prisma adapter
- Roles: ADMIN, MANAGER, FOREMAN, CREW
- Portal requires authentication; marketing pages are public

---

## RUNNING LOCALLY

```bash
npm run dev     # localhost:3000 (or 3001 if 3000 occupied)
npx prisma studio   # Database GUI
npx prisma migrate dev  # Run migrations
```

---

## KEY CONTEXT

- 590+ imported work orders from the legacy Zoho Creator system
- Business is in Michigan (default state: MI)
- Work types: landscaping, sprinkler, lighting, bed maintenance, debris removal
- Materials tracked separately for MCC-owned vs outsourced (supplier + cost)
- Marketing site not yet deployed — currently localhost only
