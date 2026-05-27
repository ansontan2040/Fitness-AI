# FormaFlow Coaching Platform

FormaFlow is a local-first prototype for a fitness and nutrition coaching business. It covers participant onboarding, body metrics, calorie and protein targets, meal upload history, AI-estimated meal analysis, dashboards, progress alerts, automation readiness, and admin review.

## Run Locally

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`.

The app stores prototype data in browser `localStorage`. Use the **Demo data** button to populate a participant, meal history, dashboard trends, admin status, and override workflow.

## Implemented Workflows

- Participant registration with BMI, BMR, TDEE, body fat mass, muscle mass, calorie target, protein target, and 8-week timeline.
- Professional participant summary report with educational coaching guidance and AI estimation disclaimer.
- Daily meal upload workflow for breakfast, lunch, dinner, and snack images with timestamps and upload history.
- AI-estimated meal analysis simulation for food items, portion estimate, calories, protein, carbs, fats, fiber, sugar, sodium, meal score, indicators, and dietitian-style recommendations.
- Dashboard for calories, target remaining, protein progress, macro breakdown, meal quality, upload consistency, hydration, weight trend, body fat trend, and muscle trend.
- Progress monitoring with on-track estimation, motivational insights, underperformance alerts, and automatic calorie adjustment guidance.
- Automation center for push, WhatsApp, and email reminder readiness plus AI-generated weekly summaries.
- Admin panel to filter participants, monitor engagement, review meals, override AI analysis, and export reports.

## API-Ready Expansion Plan

The prototype is intentionally service-shaped:

- Replace `localStorage` reads/writes with a participant API backed by PostgreSQL or Supabase.
- Move meal image storage to object storage, then save meal metadata and nutrition estimates in relational tables.
- Connect authentication with Clerk, Supabase Auth, or Firebase Auth using admin and participant roles.
- Replace the simulated `analyzeMeal` function in `app.js` with a server-side AI vision endpoint.
- Send reminder toggles to notification jobs for WhatsApp, email, and push notification providers.
- Generate weekly summaries server-side so they can run automatically even when the user is offline.

## Safety Positioning

The app presents coaching and educational recommendations only. It does not diagnose, treat, or replace medical care. Meal nutrition is labeled as **AI-estimated nutritional values**.
