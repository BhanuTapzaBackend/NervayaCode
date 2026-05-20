<p align="center">
  <img src="public/icons/nervaya-logo.jpg" alt="Nervaya Logo" width="200" />
</p>

<h1 align="center">Nervaya</h1>

<p align="center">
  A mental health and wellness platform — therapy, sleep programs, and supplements in one place.
</p>

<p align="center">
  <a href="https://sonarcloud.io/summary/new_code?id=Nervaya_Nervaya"><img src="https://sonarcloud.io/api/project_badges/measure?project=Nervaya_Nervaya&metric=alert_status" alt="Quality Gate Status" /></a>
  <a href="https://sonarcloud.io/summary/new_code?id=Nervaya_Nervaya"><img src="https://sonarcloud.io/api/project_badges/measure?project=Nervaya_Nervaya&metric=bugs" alt="Bugs" /></a>
  <a href="https://sonarcloud.io/summary/new_code?id=Nervaya_Nervaya"><img src="https://sonarcloud.io/api/project_badges/measure?project=Nervaya_Nervaya&metric=code_smells" alt="Code Smells" /></a>
  <a href="https://sonarcloud.io/summary/new_code?id=Nervaya_Nervaya"><img src="https://sonarcloud.io/api/project_badges/measure?project=Nervaya_Nervaya&metric=security_rating" alt="Security Rating" /></a>
  <a href="https://sonarcloud.io/summary/new_code?id=Nervaya_Nervaya"><img src="https://sonarcloud.io/api/project_badges/measure?project=Nervaya_Nervaya&metric=reliability_rating" alt="Reliability Rating" /></a>
  <a href="https://sonarcloud.io/summary/new_code?id=Nervaya_Nervaya"><img src="https://sonarcloud.io/api/project_badges/measure?project=Nervaya_Nervaya&metric=sqale_rating" alt="Maintainability Rating" /></a>
</p>

---

## What is Nervaya?

Nervaya is a fullstack web platform that helps users take care of their mental health. It brings together three core offerings:

- **Therapy Corner** — Browse therapists, book consultations, and attend sessions
- **Deep Rest** — A guided sleep therapy program with assessments, video sessions, and progress tracking
- **Supplements Store** — Purchase wellness supplements with a full cart and checkout flow

Users sign up, take a sleep assessment, explore programs, and manage everything from their dashboard. Therapists and admins have their own dedicated portals.

## Tech Stack

| Layer        | Tech                               |
| ------------ | ---------------------------------- |
| Framework    | Next.js 16 (App Router)            |
| Language     | TypeScript (strict mode)           |
| Database     | MongoDB + Mongoose                 |
| Auth         | JWT (httpOnly cookies) + Email OTP |
| Payments     | Razorpay                           |
| File Storage | Cloudinary                         |
| Styling      | CSS Modules                        |
| CRM          | Zoho (lead tracking)               |
| Code Quality | SonarCloud                         |

Everything runs as a single Next.js app — no separate backend server. API routes live inside `src/app/api/`.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Razorpay account (for payments)
- Cloudinary account (for media uploads)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Nervaya/Nervaya.git
cd Nervaya

# 2. Install dependencies
npm install

# 3. Create .env.local and add required variables
#    (see Environment Variables section below)

# 4. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

### Other Commands

```bash
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format code with Prettier
```

## Project Structure

```
src/
├── app/
│   ├── api/            # REST API route handlers
│   ├── (admin)/        # Admin dashboard pages
│   ├── (customer)/     # Customer-facing pages
│   └── (therapist)/    # Therapist portal pages
├── components/         # Shared UI components
├── context/            # React context providers
├── hooks/              # Custom hooks
├── lib/
│   ├── models/         # Mongoose schemas
│   ├── services/       # Business logic layer
│   ├── middleware/      # Auth & role-based access
│   └── utils/          # Shared utilities
├── queries/            # API client hooks
└── styles/             # Global CSS & theme variables
```

## License

All rights reserved.
