# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Buyer:** gym owners in Argentina who run the business day to day and decide whether to contract the software. They reach the landing from a link or referral and decide whether to write on WhatsApp.
- **Daily operators:** administrators and receptionists who use the dashboard at the front desk (check-in by DNI, payments, members).
- **Gym members (alumnos):** use the per-gym portal from their phone, logging in with their DNI.

## Product Purpose

Fitness Flow is gym-management software: members, payments, plans, classes and sessions, appointments for services, attendance, products, stats, and automatic reminders. Success for a gym is knowing who is up to date and who is not, collecting on time, and spending less time on admin.

## Positioning

Built for how Argentine gyms actually work: check-in with the member's DNI (no cards or apps), a member portal that also uses only the DNI, and automatic expiration reminders that go out over WhatsApp from the gym's own number, plus email.

## Operating Context

- Contracting is a conversation: the landing CTA opens a WhatsApp chat with the founder (wa.me/5493516978330), who sets the gym up by hand. There is no self-serve sign-up or free trial.
- Roles in the app: owner (platform), administrator, receptionist.
- Each gym has its own portal URL and QR, with its own color and logo.
- Language: Spanish (Argentina, voseo).

## Capabilities and Constraints

- Members: full record (DNI, phone, email, birth date), plan, expiration, status, soft delete, acquisition source, search by name/DNI/phone.
- Payments and billing; membership plans with custom price and duration.
- Classes and sessions with capacity and enrolment; appointments for services (anthropometry, physiotherapy, evaluations) on a calendar, with a Google Calendar link.
- Attendance: check-in by DNI with automatic membership verification and an expired-plan alert.
- Dashboard: KPIs (active, new, cancellations), billing by 24h/7d/30d/12m, demographics, peak hours, acquisition source.
- Automatic reminders over WhatsApp (sent from the gym's connected number via a send queue) and over email, to members who are expired or about to expire.
- Member portal: plan, expiration, remaining classes, class enrolment and cancellation.

## Brand Commitments

- Customer-facing name: **Fitness Flow** (domain fitnessflow.com.ar). "FitFlow" is not used in marketing.
- Logo mark: `frontend/public/images/icon.png` (a slanted double "F" in a mint-green gradient). Must stay.
- Brand green (mint, roughly #10C987 to #10DFA0 as in the logo) must stay as the brand color; everything else in the visual identity is open.
- Typeface: Quicksand (the app's font, loaded in `frontend/app/layout.tsx`); the owner asked the landing to use "nuestra tipografía".
- The brand must read as a serious, reliable business system (owner's explicit request, 2026-09-28): sober and precise over playful or experimental. Given a choice of bold and familiar directions, the owner picked the familiar end.

## Evidence on Hand

- No real usage figures, customer logos, testimonials, or satisfaction numbers. Do not publish any (the old 2500+/40+/98% figures were invented and are removed).
- Real product screens exist in the app and may be shown as product demonstrations with fictional sample data.
- No public pricing.

## Product Principles

1. Show the real product doing real front-desk work rather than claiming results.
2. Every claim must map to a feature that exists today.
3. The next step is a human conversation on WhatsApp; the page should make that feel easy, not like a sales funnel.
4. Speak like a person from Argentina talking to a gym owner, not like enterprise SaaS.
