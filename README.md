# EventGenie

An intelligent, GenAI-powered event planning assistant built to orchestrate unforgettable weddings, milestone birthdays, and community celebrations with precision, clarity, and delight.

## Problem Statement

> "Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."

## How EventGenie Addresses This

| Requirement | EventGenie Feature |
|---|---|
| Weddings, birthdays, community events | EventTypeSelector with 3 personas |
| Budgets | BudgetTracker with category breakdown |
| Timelines | TimelineView with milestone tracking |
| Vendor checklists | VendorChecklist with status toggles |
| Personalized ideas | IdeaGenerator + ChatInterface with AI |

## Architecture

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (React 18)                                 |
|                                                                                   |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  | EventTypeSelector  |  |    BudgetTracker   |  |        TimelineView          | |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  |  VendorChecklist   |  |   IdeaGenerator    |  |        ChatInterface         | |
|  +--------------------+  +--------------------+  +------------------------------+ |
|            |                        |                           |                 |
|            +-------------------+----+---------------------------+                 |
|                                |                                                  |
|                   +------------------------+                                      |
|                   | usePlanManager Hook    |                                      |
|                   +------------------------+                                      |
|                     |                   |                                         |
|      (Auth / State) |                   | (Debounced 2s Sync)                     |
|                     v                   v                                         |
|              Firebase Auth      Cloud Firestore                                   |
|             (Anonymous UID)  (Scoped: users/{uid})                                |
+-----------------------------------------------------------------------------------+
                                          |
                                          | HTTP (CORS + Rate Limiting)
                                          v
+-----------------------------------------------------------------------------------+
|                               SERVER (Node.js/Express)                            |
|                                                                                   |
|  +-------------------+      +-------------------+      +------------------------+ |
|  | Helmet / Security | ---> | Rate Limiters     | ---> | Input Validation & XSS | |
|  +-------------------+      +-------------------+      +------------------------+ |
|                                                              |                    |
|                                                              v                    |
|                                                     +------------------+          |
|                                                     |   aiService.js   |          |
|                                                     +------------------+          |
|                                                              |                    |
|                              +-------------------------------+                    |
|                              | (Promise.race 25s Timeout)                         |
|                              v                               v                    |
|                    +--------------------+         +---------------------+         |
|                    | geminiService.js   | -(fail) | fallbackService.js  |         |
|                    | (gemini-2.5-flash) | ------> | (NVIDIA DeepSeek)   |         |
|                    +--------------------+         +---------------------+         |
+-----------------------------------------------------------------------------------+
```

## Tech Stack

- **Client**: React 18, TypeScript (strict mode, zero `any`, zero `as` assertions, zero `!`), Tailwind CSS, Create React App.
- **Server**: Node.js + Express (plain .js, CommonJS), hardened with Helmet, CORS, rate limiting, and XSS sanitization.
- **Primary AI Provider**: `@google/generative-ai` with model `gemini-2.5-flash`.
- **AI Fallback**: NVIDIA NIM (DeepSeek V4.1 Flash) providing OpenAI-compatible secondary inference with 25s AbortController timeout.
- **Firebase Ecosystem**: Firebase Authentication (anonymous session persistence), Cloud Firestore (user-scoped state with merge updates), Firebase Analytics (event logging across 13+ distinct action types), and Firebase Hosting.
- **Testing**: Jest + Supertest (Server API & Security), React Testing Library + Jest (Client Hooks & Accessible UI).
- **CI/CD**: GitHub Actions workflow running linting, TypeScript build, test execution, and JSDoc validation.

## Key Features

- **Event Type Selection**: Tailored planning personas for Weddings, Milestone Birthdays, and Community Gatherings with dedicated prompts and templates.
- **AI-Powered Chat Assistant**: Gemini 2.5 Flash reasoning with persona-specific knowledge pillars, official citation instructions, and structured `**Next Step:** [action]` guidance.
- **Budget Tracker**: Dynamic categories, variance calculations, spend progress bars, category percentage badges, inline editing, and visual over-budget alerts (`role="alert"`).
- **Timeline View**: Chronologically sorted milestones, date picker inputs, progress tracking, completion toggles, and overdue status indicators.
- **Vendor Checklist**: Supplier directory with 4-stage status cycling (`pending` → `contacted` → `booked` → `declined`), total booked expenditure computation, and vendor deletion.
- **Idea Generator**: Curated sparks by event type and focus area, live AI suggestions via `/api/ideas`, difficulty ratings, cost estimates, and direct "Add to Plan" integration.
- **Real-Time Firestore Sync**: Non-blocking debounced 2000ms persistence to user-scoped Firestore documents with full offline resilience.
- **Firebase Analytics**: Telemetry tracking 13+ distinct user actions across all application interactions.

## Security

- **Strict CSP via Helmet**: Configured as the first middleware to restrict default, script, style, font, image, and connect origins.
- **Explicit CORS Whitelist**: Hardcoded origin array strictly limiting requests to trusted local and production origins.
- **Route-Specific Rate Limiting**: Chat limited to 20 req/min and Ideas to 15 req/min, returning HTTP 429 on abuse.
- **Deep Input Validation**: Strict parameter checks and length boundaries using express-validator.
- **Recursive XSS Sanitization**: All incoming string inputs sanitized via the `xss` library before reaching business logic.
- **Strict Environment Validation**: Immediate process termination (`process.exit(1)`) on boot if required credentials are missing, and non-fatal warning if NVIDIA key is omitted.
- **API Key Isolation**: Server-only handling of `GEMINI_API_KEY` and `NVIDIA_API_KEY`; completely absent from client bundles.

## Accessibility

- **Skip Navigation Link**: High-contrast, keyboard-focusable skip link targeting `#main-content`.
- **Semantic HTML5 & ARIA Landmarks**: Full usage of `<header role="banner">`, `<main id="main-content">`, `<nav>`, and `<footer role="contentinfo">`.
- **Live Stream Messaging**: `role="log"`, `aria-live="polite"`, and `role="status"` live regions for dynamic AI replies and loading indicators.
- **Accessible Radiogroups**: `role="radiogroup"`, `role="radio"`, and `<fieldset>`/`<legend>` pairings with full Arrow Left/Right/Up/Down keyboard cycling.
- **Touch Target Sizing**: Minimum 44px (`h-11`) touch and click targets across all interactive buttons and inputs.
- **Visible Focus Rings**: Custom high-contrast orange focus rings (`*:focus-visible`) for complete keyboard navigation.

## Testing

Comprehensive test suites covering unit, integration, and security scenarios (53 total automated tests across 10 suites):
- **Client Tests**: 6 test suites covering `usePlanManager` (10 tests), `EventTypeSelector` (3 tests), `BudgetTracker` (4 tests), `TimelineView` (3 tests), `ChatInterface` (1 test), and `IdeaGenerator` (3 tests) — 24 client tests total.
- **Server Tests**: 4 test suites covering Security & Headers (8 tests), Health (1 test), Chat API (5 tests), and Gemini & Fallback Service (15 tests) — 29 server tests total.
- **JSDoc Validation**: Python-based AST and docstring audit verifying 100% documentation coverage with 0 missing items.

## CI/CD

Configured via [.github/workflows/ci.yml](file:///c:/Users/User/Desktop/%E2%80%8Fvirtual%20promptwars%20challenge5/.github/workflows/ci.yml) with 3 parallel Ubuntu jobs:
1. `lint-and-build`: ESLint zero-warning validation, production TypeScript compilation, and client test suite.
2. `server-tests`: Node.js server test execution with environment mocks.
3. `jsdoc-check`: Automated Python script verifying 100% JSDoc coverage across all exported symbols.

## Setup Instructions

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Python 3.x (for running JSDoc validation checks)

### 1. Server Configuration
```bash
cd server
cp .env.example .env # Create .env with GEMINI_API_KEY and PORT
npm install
npm run start # Starts Express server on port 5000
```

### 2. Client Configuration
```bash
cd client
cp .env.example .env
npm install
npm run start # Starts React dev server on http://localhost:3000
```

## Testing Instructions

### Run Client Tests
```bash
cd client
npm test -- --watchAll=false
```

### Run Server Tests
```bash
cd server
npm test
```

### Verify JSDoc Coverage
```bash
python check_jsdoc.py
```

## Deployment Instructions

### Deploy Client and Firestore Rules to Firebase
1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Authenticate to Firebase:
   ```bash
   firebase login
   ```
3. Build the client bundle:
   ```bash
   cd client
   npm run build
   cd ..
   ```
4. Deploy Hosting and Firestore rules:
   ```bash
   firebase deploy --only hosting,firestore
   ```

## Environment Variables

| Variable | Scope | Description | Example / Default |
|---|---|---|---|
| `PORT` | Server | Express HTTP listening port | `5000` |
| `GEMINI_API_KEY` | Server | Google AI Studio API key for Gemini 2.5 Flash | `AIzaSy...` |
| `NVIDIA_API_KEY` | Server | NVIDIA NIM API key for DeepSeek V4.1 Flash fallback | `nvapi-...` |
| `REACT_APP_API_URL` | Client | URL of backend Express proxy server | `http://localhost:5000` |
| `REACT_APP_FIREBASE_API_KEY` | Client | Firebase project web API key | `AIzaSy...` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Client | Firebase auth domain | `eventgenie-prod-98.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Client | Firebase project identifier | `eventgenie-prod-98` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Client | Firebase storage bucket | `eventgenie-prod-98.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Client | Firebase cloud messaging sender ID | `1234567890` |
| `REACT_APP_FIREBASE_APP_ID` | Client | Firebase web app application ID | `1:1234567890:web:abcdef` |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Client | Firebase Google Analytics measurement ID | `G-ABCDEF1234` |
