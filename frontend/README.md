# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Rental dashboards and payments

The existing Vite app uses its current Roam styles plus Tailwind v4 utilities for the dashboard additions. Tailwind preflight is intentionally not enabled so existing pages keep their current styling.

### Local setup

1. Install frontend dependencies with `npm install`.
2. Copy `backend/.env.example` to `backend/.env` and set MongoDB, JWT, admin, and Stripe values. Never commit `.env` or provider secrets.
3. Install backend dependencies with `cd backend` then `npm install`.
4. Start the API from `backend` with `npm run dev` and the client from the project root with `npm run dev`.

Stripe card payment is handled by Stripe Checkout. The API does not receive card numbers or CVVs. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; for local webhook development, forward Stripe events to `http://localhost:5000/api/payments/stripe/webhook` with the Stripe CLI. A booking is marked paid only after a verified Stripe webhook. Cash reservations remain pending until an admin records receipt.

Driving-license uploads accept PDF, JPG, and PNG files up to 5 MB. Files are stored in the private `LICENSE_UPLOAD_DIR`, never served as public static assets, and can only be opened by an admin. In production, point this variable at durable private storage with restricted access and backups.

### Added API workflows

- `POST /api/payments/checkout` creates a Stripe Checkout session or a cash reservation.
- `GET /api/payments/my-transactions` returns the authenticated user's transactions.
- `POST /api/payments/stripe/webhook` verifies Stripe events and updates payment/booking state.
- `POST /api/users/profile/driving-license` uploads a private identity document; `PUT /api/users/profile/password` changes the password.
- `POST /api/bookings/:id/change-request` and `POST /api/bookings/:id/review` manage owner-scoped booking requests and completed-trip reviews.
- Admin routes under `/api/admin` expose KPIs, transaction records, refunds/cash reconciliation, booking decisions, account controls, and license review.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
