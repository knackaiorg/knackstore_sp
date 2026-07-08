# KnackStore — Knack AI Hackathon Starter App

> **Spring Boot + Angular electronics store. Clone, run, and extend.**

## Quick Start

### Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
API → http://localhost:8080 | H2 Console → http://localhost:8080/h2-console

### Frontend (Angular)
```bash
cd frontend
npm install
npm start
```
App → http://localhost:4200

### Demo Login
Email: `demo@knack.com` | Password: `Demo@1234`

---

## Project Structure

```
electronics-store/
├── backend/                         # Spring Boot API
│   └── src/main/java/com/knack/store/
│       ├── model/                   # JPA entities
│       ├── repository/              # Spring Data repositories
│       ├── service/                 # Business logic
│       ├── controller/              # REST controllers
│       ├── dto/                     # Request/Response objects
│       ├── security/                # JWT filter & util
│       └── config/                  # Security, CORS, DataInitializer
├── frontend/                        # Angular app
│   └── src/app/
│       ├── core/services/           # API services (product, cart, auth, order)
│       ├── core/guards/             # Auth guard
│       ├── core/interceptors/       # JWT interceptor
│       ├── models/                  # TypeScript interfaces
│       ├── pages/                   # Route components
│       └── shared/                  # Header, footer, reusable components
└── features.md                      # Full feature list & API reference
```

## What's Built

- Product catalogue with search, filter by category/brand/price
- 6 categories, 12 seeded products with variants
- Customer registration, login (JWT), profile management
- Shopping cart (add, update, remove, auto-merge)
- 3-step checkout (address → payment → confirm)
- Order placement, history, and detail view
- Responsive Bootstrap 5 UI

## Your Hackathon Task

Extend this repo to implement one of the five tasks in `features.md`. Use AI tools to help you generate code, user stories, and test cases. See the hackathon brief for the full workflow.

---

*Knack Systems & Services Pvt Ltd · ISO 27001:2022 · GDPR Compliant*
