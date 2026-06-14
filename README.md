# Ascend AI

## Inspiration

Looking for internships and summer programs as a student is not a simple task. You have to constantly polish your resume, apply across multiple platforms, and most of the time you get ghosted or receive no feedback. On top of that, many listings online are outdated, low-quality, or unverified.

We wanted to solve a core problem:

> Students don’t just need listings — they need guidance.

We built Ascend AI to give actionable feedback like:

* “You are a strong match for this opportunity”
* “This listing is unverified or low quality”
* “You should improve X skill before applying”

---

## What it does

Ascend AI is an intelligent opportunity discovery and recommendation system that combines search, ranking, and trust verification into one platform.

### 1. Smart Opportunity Search

Users can search for internships, research programs, hackathons, and summer opportunities. The system aggregates listings and normalizes them into a structured format.

### 2. AI Match Scoring

Each opportunity is evaluated against the user’s profile using a scoring system that considers:

* Skills match
* Experience level
* Domain relevance
* Career alignment
* Accessibility

The system returns a **match score (0–100)** showing how well the opportunity fits the user.

### 3. Trust Verification Engine

Each listing is analyzed for legitimacy and quality. The system flags:

* Verified opportunities
* Incomplete or unclear listings
* Potentially outdated or suspicious posts

### 4. End-to-End Guidance

Once a user finds a strong match, the system can guide them through:

* Application readiness checks
* Resume alignment suggestions
* Interview preparation steps

---

## How it works (System Design)

Ascend AI is built as a multi-layer AI pipeline:

### 1. Frontend Layer

Built using:

* HTML
* CSS
* JavaScript

Handles:

* User input (skills, interests, search queries)
* Displaying ranked opportunities
* Showing trust + match outputs

---

### 2. Backend Layer

The backend uses:

* Python proxy server (security + API routing)
* GraphQL API
* Hasura + Momen database engine

The Python layer:

* Protects API keys
* Routes requests safely to GraphQL
* Prevents direct frontend exposure to backend services

---

### 3. Data Layer

We use a structured database system that stores:

* Opportunity listings
* User profiles
* Match scores
* Trust classifications

LocalStorage is used for:

* Saving user profiles
* Maintaining session state
* Offline fallback support

---

### 4. AI Pipeline (Core Logic)

When a user searches:

1. Query is sent to backend
2. Opportunities are retrieved from database
3. AI scoring engine evaluates:

   * skill match
   * relevance
   * opportunity quality
4. Trust engine evaluates legitimacy
5. Final ranked list is returned to frontend

---

## How search works internally

When a user searches for internships:

1. The query is parsed into structured filters
2. The system fetches matching opportunities from GraphQL
3. Data is normalized into a standard schema
4. AI scoring model evaluates each listing
5. Results are sorted by:

   * Match score
   * Trust score
6. Top results are displayed instantly

This ensures users don’t just see results — they see **ranked opportunities tailored to them**.

---

## Challenges we ran into

### 1. CORS Errors

We initially ran into Cross-Origin Resource Sharing issues when connecting the frontend directly to the GraphQL backend.

Instead of bypassing security, we built a Python proxy server to safely route requests and handle authentication properly.

---

### 2. Data Structure Mismatch

Our dataset was originally structured for unrelated fields (like travel data such as destination and budget).

We had to build a JavaScript transformation layer to convert:

* destination → location
* budget → cost
* tags → opportunity category

This allowed us to normalize inconsistent data into a usable format.

---

## Accomplishments we're proud of

### Offline Fallback System

If the database is unavailable or the user loses internet connection, the system automatically switches to a local dataset of mock opportunities without interrupting the user experience.

### Privacy-First Design

All user profile data is stored locally using browser storage, ensuring no sensitive data is unnecessarily transmitted or stored externally.

---

## What we learned

This project taught us:

* How to design scalable AI pipelines
* How frontend and backend systems communicate safely
* How to build proxy servers for secure API handling
* How to normalize messy real-world data into structured formats
* How to design systems that degrade gracefully when services fail

---

## What's next for Ascend AI

We plan to expand Ascend AI into a fully semantic recommendation engine.

Future improvements include:

* LLM-based resume understanding
* Semantic matching between resumes and job descriptions
* Personalized skill gap analysis
* Automated project recommendations to improve eligibility
* Community feature for interview experiences and insights
* Real-time internship tracking and alerts

Eventually, Ascend AI will not just recommend opportunities — it will guide users toward becoming qualified for them.

---
