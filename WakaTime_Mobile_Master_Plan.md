# WakaBoard — Master Project Plan

> **App name:** WakaBoard
> **Product:** A fast, offline-first, mobile-first WakaTime companion built with Expo + React Native + TypeScript.
> **Core principle:** One React Native application. Expo/RN first. Native iOS/Android code only when a platform capability genuinely cannot be provided through Expo, React Native, or an established compatible library.

---

## 1. Executive Summary

WakaBoard is a mobile client for WakaTime designed around a better mobile experience rather than simply reproducing the WakaTime dashboard.

The application should make coding activity immediately understandable:

- How much did I code today?
- Am I progressing toward my goal?
- What projects/languages/editors did I use?
- How does today compare with my recent activity?
- What has my coding consistency looked like?
- What changed over the last 7, 30, 90 days, or year?
- Can I still see useful information when offline?

The application should feel like a native mobile product while remaining fundamentally a single Expo + React Native codebase.

### Product promise

> **Your coding activity, beautifully organized in your pocket.**

### Primary product principles

1. **Instant first paint**
2. **Offline-first**
3. **Glanceable analytics**
4. **Native-feeling UX**
5. **Progress over raw telemetry**
6. **WakaTime is the data source; WakaBoard owns the experience**
7. **Privacy by default**
8. **Minimal network dependency**
9. **Fast interactions and smooth animations**
10. **One shared React Native application**

---

# 2. Goals

## 2.1 Primary goals

Build a mobile application that:

- Authenticates users through WakaTime OAuth using Better Auth.
- Provides a polished mobile dashboard for WakaTime data.
- Works well on unreliable networks.
- Renders cached data immediately.
- Synchronizes data in the background.
- Provides useful historical analytics.
- Lets users define coding goals.
- Calculates streaks and derived metrics locally where possible.
- Supports notifications and widgets in later phases.
- Provides a foundation for advanced analytics and AI features.
- Keeps the UI independent from raw WakaTime API response structures.

## 2.2 Non-goals

The first version should **not** attempt to:

- Rebuild the WakaTime desktop agent.
- Collect source code.
- Replace WakaTime's telemetry infrastructure.
- Build a separate SwiftUI iOS application.
- Build a separate Jetpack Compose Android application.
- Store unnecessary raw heartbeat data.
- Become a generic project-management application.
- Depend on a network request for every screen render.
- Build an overly complicated backend.

---

# 3. Product Architecture Philosophy

The application follows this hierarchy:

```text
Expo APIs
    ↓
React Native APIs
    ↓
Established Expo-compatible libraries
    ↓
Expo Modules / Config Plugins
    ↓
Platform-specific React Native files
(.ios.tsx / .android.tsx)
    ↓
Custom native iOS/Android code
ONLY WHEN REQUIRED
```

## Critical rule

The project must **never evolve into two separate native applications**.

There is:

- one product,
- one React Native UI architecture,
- one shared TypeScript codebase,
- one domain layer,
- one data layer.

Native iOS/Android code exists only as a bridge to capabilities that Expo/React Native cannot reasonably provide.

For example:

```text
React Native Screen
      ↓
Shared Hook
      ↓
Shared Domain Service
      ↓
Expo / RN API
      ↓
Native capability if required
```

Not:

```text
React Native app
+
SwiftUI app
+
Jetpack Compose app
```

---

# 4. Target Technology Stack

## Mobile

- Expo
- React Native
- TypeScript
- Expo Router
- React Native Reanimated
- React Native Skia where custom graphics are justified
- Uniwind / Tailwind CSS
- NativeWind-compatible ecosystem only where appropriate

## State

### Server state

- TanStack Query

Responsibilities:

- fetching
- caching
- synchronization
- stale state
- retries
- invalidation
- background refresh

### Local state

Use a lightweight state library only for client/application state.

Possible choice:

- Zustand

Responsibilities:

- UI preferences
- selected analytics range
- onboarding state
- local feature state
- sync state where appropriate

Do not duplicate server state into Zustand.

## Persistence

### Structured data

- Expo SQLite

Use SQLite for:

- historical summaries
- daily aggregates
- projects
- languages
- editors
- goals
- activity data where required
- sync metadata

### Lightweight preferences

- MMKV or an equivalent Expo-compatible persistent store

Use for:

- theme
- preferences
- UI configuration
- last selected range
- lightweight metadata

### Secrets

- Expo SecureStore

Use for:

- sensitive session material
- tokens only where the architecture requires the mobile client to hold them
- secure authentication information

Never store secrets in normal SQLite tables or AsyncStorage.

---

# 5. Authentication Architecture

The application will use:

- Better Auth
- Better Auth Generic OAuth
- WakaTime OAuth

The mobile app should not contain a WakaTime client secret.

## Authentication flow

```text
Mobile App
    │
    │ Start OAuth
    ▼
Better Auth
    │
    │ OAuth authorization
    ▼
WakaTime
    │
    │ User grants permission
    ▼
Better Auth callback
    │
    │ Create/restore application session
    ▼
Mobile App
    │
    ▼
Authenticated API
```

## WakaTime OAuth endpoints

Configure the WakaTime provider explicitly rather than assuming the root WakaTime website is the OAuth endpoint.

Authorization:

```text
https://wakatime.com/oauth/authorize
```

Token:

```text
https://wakatime.com/oauth/token
```

Better Auth callback convention:

```text
/api/auth/callback/wakatime
```

## OAuth scopes

Start with the minimum read-only scopes required by the MVP.

Potential scopes include:

```text
read_summaries
read_summaries.languages
read_summaries.projects
read_summaries.editors
read_stats
read_stats.languages
read_stats.projects
read_stats.best_day
read_goals
```

Only request additional permissions when a feature actually needs them.

Examples:

```text
read_heartbeats
email
read_orgs
read_private_leaderboards
```

Avoid write scopes unless a future feature explicitly requires them.

---

# 6. Backend Architecture

The backend should remain intentionally small.

Its primary responsibilities:

1. Better Auth
2. OAuth credential protection
3. Session management
4. Authentication mediation
5. Optional API proxying
6. Rate-limit protection
7. Server-side integrations that should not run on the device

The backend should **not** become the primary analytics engine.

Most derived analytics should be calculated on-device when practical.

## Suggested backend structure

```text
server/
└── auth/
    ├── better-auth.ts
    ├── oauth/
    │   └── wakatime.ts
    ├── routes/
    └── session/
```

If hosted on Cloudflare:

- Cloudflare Workers
- D1 if server-side persistence is required
- KV for suitable ephemeral/cache use cases
- Queues only if asynchronous jobs become necessary

Do not introduce Cloudflare services merely for the sake of using them.

---

# 7. WakaTime API Layer

Create a dedicated WakaTime adapter.

The UI must never directly consume arbitrary WakaTime API responses.

Architecture:

```text
WakaTime API
     ↓
WakaTime Client
     ↓
Endpoint Adapters
     ↓
Domain Mapping
     ↓
Repositories / TanStack Query
     ↓
UI
```

## Suggested structure

```text
packages/wakatime/
├── client/
│   ├── client.ts
│   ├── errors.ts
│   └── auth.ts
├── endpoints/
│   ├── user.ts
│   ├── summaries.ts
│   ├── stats.ts
│   ├── projects.ts
│   ├── goals.ts
│   ├── durations.ts
│   ├── insights.ts
│   ├── machines.ts
│   └── leaderboards.ts
├── types/
│   ├── api.ts
│   └── normalized.ts
└── index.ts
```

---

# 8. Domain Layer

The domain layer protects the rest of the application from WakaTime-specific implementation details.

Example:

```text
WakaTimeSummary
       ↓
normalizeSummary()
       ↓
DailyCodingSummary
```

The UI should consume:

```ts
type DailyCodingSummary = {
  date: string
  totalSeconds: number
  projectBreakdown: ProjectTime[]
  languageBreakdown: LanguageTime[]
  editorBreakdown: EditorTime[]
}
```

rather than raw API objects.

## Core domain entities

Potential entities:

- User
- DailySummary
- Project
- Language
- Editor
- Goal
- CodingSession
- ActivityEvent
- Machine
- OperatingSystem
- Category
- AIActivity
- AnalyticsSnapshot
- SyncMetadata

---

# 9. Local Database

SQLite becomes the durable local source for offline functionality.

## Suggested schema

### users

```text
id
email
display_name
timezone
avatar_url
updated_at
```

### daily_summaries

```text
date
total_seconds
digital_seconds
created_at
updated_at
```

### project_summaries

```text
date
project_id
project_name
seconds
percentage
```

### language_summaries

```text
date
language
seconds
percentage
```

### editor_summaries

```text
date
editor
seconds
percentage
```

### goals

```text
id
type
target_seconds
period
source
updated_at
```

### activity

Only store activity data when required by product functionality.

```text
id
timestamp
duration_seconds
project
language
editor
category
```

### sync_metadata

```text
resource
last_synced_at
etag_or_version
status
error
```

---

# 10. Offline-First Strategy

Offline-first is a core feature, not a fallback.

The user should not have to think about whether the data came from:

- network,
- SQLite,
- TanStack Query cache,
- memory.

## Launch sequence

```text
Launch
  ↓
Restore session
  ↓
Hydrate local state
  ↓
Render cached UI immediately
  ↓
Start background synchronization
  ↓
Fetch updated WakaTime data
  ↓
Normalize
  ↓
Persist
  ↓
Update query cache
  ↓
UI updates automatically
```

Never:

```text
Launch
 ↓
Wait for API
 ↓
Show spinner
 ↓
Render application
```

## Offline states

Example:

```text
Offline · Updated 2h ago
```

instead of:

```text
ERROR
```

The application should distinguish:

- fresh
- stale
- syncing
- offline
- failed
- never synchronized

---

# 11. Synchronization Engine

Create a dedicated sync engine.

```text
packages/core/sync/
├── sync-manager.ts
├── sync-queue.ts
├── sync-policy.ts
└── sync-errors.ts
```

## Sync policy

### Today

Very fresh data.

Refresh frequently while app is active.

### Recent history

Use moderate stale times.

### Historical analytics

Cache aggressively.

### Profile

Refresh infrequently.

### Goals

Refresh when entering goal-related screens or after edits.

## Important WakaTime behavior

The implementation must correctly handle APIs that may return:

- `202`
- calculation-in-progress responses
- `is_up_to_date`
- `percent_calculated`

The UI should communicate that data is still being calculated rather than treating it as a generic failure.

Example:

```text
Calculating today's activity…
```

or:

```text
Updating your coding stats…
```

---

# 12. App Navigation

Use Expo Router.

Suggested structure:

```text
src/app/
├── _layout.tsx
│
├── (auth)/
│   ├── _layout.tsx
│   ├── welcome.tsx
│   └── login.tsx
│
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── analytics.tsx
│   ├── activity.tsx
│   └── settings.tsx
│
├── analytics/
│   └── [range].tsx
│
├── goals/
│   └── index.tsx
│
├── profile/
│   └── index.tsx
│
└── settings/
    ├── account.tsx
    ├── appearance.tsx
    ├── notifications.tsx
    └── data.tsx
```

The exact navigation can evolve during implementation.

---

# 13. Core Screens

## 13.1 Welcome

Purpose:

- communicate the product value
- explain WakaTime connection
- establish trust
- start authentication

Possible content:

```text
Your coding activity,
beautifully organized.

Track your coding time,
understand your habits,
and see your progress anywhere.

[Connect WakaTime]
```

---

# 14. Home Dashboard

This is the most important screen.

Example:

```text
Tuesday, Sep 21

        4h 32m
      coding today

         76%
   daily goal progress

   1h 28m remaining

↑ 37% vs your average
```

Then:

```text
Projects

247 POS              2h 14m
VedaTrace            1h 32m
Other                   46m
```

Then:

```text
Languages

TypeScript             54%
Go                     21%
Python                  9%
Other                  16%
```

And:

```text
Editors

VS Code                72%
JetBrains              18%
Other                  10%
```

## Home priorities

The screen should answer:

1. How much did I code?
2. Am I meeting my goal?
3. What was I working on?
4. How am I doing compared with normal?
5. Is my data current?

---

# 15. Daily Goal System

Goals should be useful without becoming distracting.

## MVP

Daily coding goal.

Example:

```text
Daily goal

6h 00m

4h 32m completed

76%
```

Calculate:

```text
progress = completedSeconds / targetSeconds
```

Clamp progress visually to:

```text
0 → 100%
```

but retain the actual duration internally.

## Future goals

- weekly goal
- project goal
- language goal
- monthly goal

---

# 16. Analytics

Analytics should provide more than charts.

Supported ranges:

```text
7D
30D
90D
1Y
ALL
```

## Core metrics

- total coding time
- daily average
- best day
- active days
- consistency
- longest streak
- most-used project
- most-used language
- most-used editor

## Daily chart

Show:

```text
Mon █████
Tue ███████
Wed ███
Thu ████████
Fri █████
Sat ██
Sun ████
```

A custom chart can eventually be implemented with Skia when the interaction quality justifies it.

## Comparison calculations

Examples:

```text
Today vs 7-day average
This week vs previous week
This month vs previous month
```

These should be presented descriptively.

Avoid implying productivity from coding time alone.

---

# 17. Project Analytics

Provide project-level insights:

```text
247 POS
2h 14m
49%

VedaTrace
1h 32m
34%

Forge
32m
12%
```

Future:

- project history
- project goal
- project consistency
- project trends
- project calendar

---

# 18. Language Analytics

Show:

- total time
- percentage
- historical trend
- language activity by day

Potential display:

```text
TypeScript       54%
Go               21%
Python            9%
SQL               6%
Other            10%
```

---

# 19. Editor Analytics

Track:

- VS Code
- JetBrains IDEs
- Neovim
- Cursor
- other detected editors

Do not infer quality or productivity from editor choice.

---

# 20. Activity Timeline

Phase 2 feature.

Purpose:

Give the user a chronological view of coding activity.

Example:

```text
09:42
247 POS
TypeScript
1h 12m

11:05
VedaTrace
TypeScript
43m

13:22
Forge
Go
28m
```

This should use the minimum data necessary.

Avoid permanently storing raw heartbeat data unless required.

---

# 21. Streaks

Streaks should be calculated locally.

Example definition:

```text
A day counts when coding time >= configured threshold.
```

The threshold can initially be:

```text
1 minute
```

or another configurable product rule.

Future:

- minimum daily goal
- custom streak thresholds
- weekly consistency
- active-day calendar

Streaks should encourage awareness rather than shame users for inactivity.

---

# 22. Calendar View

Phase 2.

Similar concept to a contribution calendar:

```text
      Mon Tue Wed Thu Fri Sat Sun

Week 1  ░   ░   ▒   ▓   ▓   ░   ▒
Week 2  ▓   ▓   ▒   ▓   ▓   ▒   ░
...
```

Tap a date to view:

- coding time
- projects
- languages
- editors
- goal status

---

# 23. Notifications

Use Expo Notifications.

Potential notifications:

### Goal reached

```text
Daily goal reached 🎉
You've completed 6h of coding today.
```

### Near goal

```text
You're 25 minutes away from your daily goal.
```

### Weekly summary

```text
This week: 28h 42m
Active on 6 of 7 days.
```

Notifications should be opt-in and configurable.

Avoid excessive notification frequency.

---

# 24. Widgets

Phase 2/3.

Potential widgets:

## Small

```text
4h 32m
Today
76%
```

## Medium

```text
Today       4h 32m
Goal        6h 00m

████████░░
```

## Large

```text
Today
4h 32m

Goal
6h 00m

Top Project
247 POS

Top Language
TypeScript
```

## Native implementation rule

First investigate:

1. Expo support
2. React Native-compatible widget libraries
3. Expo Modules
4. Config plugins

Only if those cannot provide the capability should custom iOS/Android native code be introduced.

Any native widget implementation must remain a thin capability layer around the React Native app.

---

# 25. Live Activity

Potential iOS feature for a future focus/session mode.

Do not build this in MVP.

If implemented:

```text
Focus session
01:42:32
247 POS
```

The React Native app remains the primary application.

Native code should only expose the Live Activity capability.

---

# 26. Shareable Reports

Phase 2.

Generate a beautiful weekly summary:

```text
MY CODING WEEK

28h 42m
6 active days

Top project
247 POS

Top language
TypeScript

Best day
Tuesday · 6h 18m
```

Allow:

- image generation
- native share sheet
- save/share

Use Expo Sharing where supported.

---

# 27. AI Activity

WakaTime provides AI-related coding metrics.

Potential future analytics:

- AI additions
- AI deletions
- human additions
- human deletions
- AI-related activity
- AI coding days
- AI-assisted coding trends

Important:

Do not turn these metrics into unsupported claims such as:

```text
AI made you 40% more productive.
```

Instead use descriptive language:

```text
AI-assisted activity accounted for X% of recorded coding changes.
```

The exact terminology must follow WakaTime's documented metric semantics.

---

# 28. AI Coding Coach

Phase 5.

Potential experience:

```text
Your coding week

You coded 31h 14m across 6 days.

You spent most of your time on:
1. 247 POS
2. VedaTrace
3. Forge

Your longest session was Tuesday.
```

The AI must use actual retrieved data.

It must not invent:

- projects
- durations
- productivity improvements
- causes
- conclusions unsupported by the data

The AI layer should receive structured analytics rather than arbitrary raw API payloads.

Example:

```text
Analytics Snapshot
       ↓
AI Prompt Builder
       ↓
LLM
       ↓
Structured Insight
       ↓
UI
```

---

# 29. Privacy Architecture

Privacy should be a product feature.

## Never collect unnecessarily

Do not collect:

- source code
- file contents
- editor buffers
- passwords
- arbitrary heartbeat payloads when not needed
- unrelated device information

## Logs

Never log:

- OAuth secrets
- access tokens
- refresh tokens
- sensitive user data

## Local data

Allow users to:

- clear local cache
- disconnect WakaTime
- remove local data
- understand what data the application stores

---

# 30. Performance Requirements

Target:

- cached home render: near instant
- meaningful cached UI: ideally under ~2 seconds
- 60 FPS scrolling
- minimal layout thrashing
- no unnecessary network calls
- no duplicated requests
- no blocking authentication restoration
- background synchronization
- efficient SQLite queries
- lazy loading for historical analytics

## Performance rules

Prefer:

```text
Cache → render → sync
```

over:

```text
network → wait → render
```

Use:

- query deduplication
- prefetching
- memoization where useful
- virtualization
- background calculations
- SQLite indexes
- selective hydration

---

# 31. UX and Visual Design

The product should feel premium without becoming visually noisy.

## Design characteristics

- clean
- modern
- dark/light mode
- subtle gradients
- rounded cards
- clear hierarchy
- strong typography
- restrained glass effects
- smooth transitions
- meaningful animation

Avoid:

- excessive glassmorphism
- excessive shadows
- giant dashboards copied from desktop
- tiny charts
- overloaded screens
- decorative animation that slows interaction

## Animation philosophy

Animation should explain state.

Examples:

- progress ring animates when new data arrives
- chart transitions between ranges
- cards subtly update after synchronization
- pull-to-refresh provides feedback
- tab transitions remain lightweight

Use Reanimated for interactions.

Use Skia only where custom rendering materially improves the experience.

---

# 32. Responsive Mobile Layout

Design for:

- small iPhones
- large iPhones
- Android phones
- different aspect ratios
- dynamic text sizes where practical
- safe areas
- accessibility settings

Do not assume one screen size.

---

# 33. Platform-Specific React Native Files

Use platform files when UI behavior legitimately differs.

Example:

```text
components/
├── SettingsScreen.tsx
├── SettingsScreen.ios.tsx
└── SettingsScreen.android.tsx
```

Use this instead of:

```ts
if (Platform.OS === "ios") {
   ...
} else {
   ...
}
```

when the implementation difference is substantial.

Do not duplicate entire application architectures.

---

# 34. Native Development Rule

Add this to `AGENTS.md`:

```md
## Native Development Rule

This project is an Expo + React Native application.

Always prefer, in order:

1. Expo APIs
2. React Native APIs
3. Established Expo-compatible libraries
4. Expo Modules / Config Plugins
5. Platform-specific React Native files (.ios.tsx / .android.tsx)
6. Custom native iOS/Android code only when the capability cannot reasonably be implemented through the above.

Do NOT create separate native iOS or Android application architectures.

Native code, when required, exists only to expose a specific platform capability to the React Native application.

The React Native application remains the source of truth for product UI, navigation, state, business logic, and data handling.
```

---

# 35. Project Structure

Recommended structure:

```text
wakaboard/
│
├── apps/
│   └── mobile/
│       ├── src/
│       │   └── app/
│       │   ├── _layout.tsx
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   ├── analytics/
│       │   ├── goals/
│       │   ├── profile/
│       │   └── settings/
│       │
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── providers/
│       ├── services/
│       ├── theme/
│       ├── utils/
│       └── package.json
│
├── packages/
│   ├── core/
│   │   ├── domain/
│   │   ├── analytics/
│   │   ├── goals/
│   │   ├── streaks/
│   │   ├── formatting/
│   │   └── sync/
│   │
│   ├── wakatime/
│   │   ├── client/
│   │   ├── endpoints/
│   │   ├── types/
│   │   └── mappers/
│   │
│   ├── database/
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── repositories/
│   │
│   └── api-client/
│
├── server/
│   └── auth/
│       ├── better-auth.ts
│       ├── wakatime.ts
│       └── routes/
│
├── docs/
│   ├── architecture.md
│   ├── oauth.md
│   ├── sync.md
│   ├── database.md
│   └── native-capabilities.md
│
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

The `ios/` and `android/` directories should **not** be created simply because the project may eventually need native features.

They should only appear when Expo prebuild/native configuration actually requires them.

---

# 36. Feature Architecture

Each major feature should be independently organized.

Example:

```text
features/home/
├── components/
│   ├── TodaySummary.tsx
│   ├── GoalProgress.tsx
│   ├── ProjectBreakdown.tsx
│   └── LanguageBreakdown.tsx
├── hooks/
│   └── useTodaySummary.ts
├── queries/
│   └── today.ts
├── calculations/
│   └── comparisons.ts
└── index.ts
```

Analytics:

```text
features/analytics/
├── components/
├── hooks/
├── queries/
├── calculations/
└── index.ts
```

This prevents screens from becoming giant files.

---

# 37. API Repository Pattern

Recommended flow:

```text
Screen
  ↓
Feature Hook
  ↓
TanStack Query
  ↓
Repository
  ↓
Local DB / API
```

Repository example:

```ts
interface SummaryRepository {
  getDailySummary(date: string): Promise<DailyCodingSummary | null>
  getRangeSummary(
    start: string,
    end: string
  ): Promise<DailyCodingSummary[]>
  syncRange(
    start: string,
    end: string
  ): Promise<void>
}
```

This makes testing and offline support easier.

---

# 38. TanStack Query Strategy

Query keys should be predictable.

Examples:

```ts
["summary", "today"]
["summary", "range", "7d"]
["summary", "range", "30d"]
["projects", "today"]
["languages", "today"]
["editors", "today"]
["goals"]
["profile"]
```

Avoid arbitrary query keys.

## Query behavior

Today:

```text
short stale time
background refresh
```

Historical:

```text
long stale time
persistent cache
```

Profile:

```text
long stale time
```

---

# 39. Error Handling

Errors should be typed.

Potential categories:

```text
AuthenticationError
AuthorizationError
RateLimitError
NetworkError
WakaTimeApiError
CalculationPendingError
DatabaseError
SyncError
```

Map them into user-friendly states.

Do not show raw API errors.

Instead of:

```text
HTTP 202
```

show:

```text
WakaTime is still calculating your latest activity.
```

---

# 40. Loading States

Avoid generic full-screen spinners.

Use:

- skeleton cards
- cached content
- subtle progress indicators
- section-level placeholders

If previous data exists:

```text
show stale data
+
small sync indicator
```

Do not replace useful cached data with a blank loader.

---

# 41. Refresh Behavior

Pull-to-refresh should:

1. Immediately indicate interaction.
2. Refresh relevant data.
3. Update SQLite.
4. Update TanStack Query.
5. Preserve existing content during refresh.

Avoid clearing the UI before fetching.

---

# 42. Background Sync

Potential sync triggers:

- app launch
- app foreground
- manual refresh
- periodic background task where platform allows
- notification-triggered refresh where appropriate

Background execution should respect:

- battery
- network conditions
- platform limitations
- rate limits

Do not assume iOS/Android will run arbitrary background JavaScript indefinitely.

---

# 43. Testing Strategy

## Unit tests

Test:

- duration formatting
- percentages
- goal calculations
- streak calculations
- date boundaries
- timezone behavior
- comparison calculations
- analytics aggregation

Example:

```text
4h 32m / 6h = 75.56%
```

Display:

```text
76%
```

## Integration tests

Test:

- WakaTime API mapping
- repository behavior
- database persistence
- sync engine
- authentication state

## Component tests

Test:

- loading
- stale
- offline
- error
- empty states

## E2E

Eventually test:

```text
Install
→ login
→ dashboard
→ analytics
→ offline
→ reconnect
→ data refresh
```

---

# 44. Date and Time Handling

This is critical.

WakaTime data is time-sensitive.

The application must consistently handle:

- user timezone
- WakaTime timezone
- UTC
- day boundaries
- daylight saving changes
- historical ranges

Never use naive local timestamps for analytics logic.

Store canonical timestamps appropriately and derive display dates using the intended timezone.

---

# 45. Analytics Calculations

Create a reusable analytics package.

```text
packages/core/analytics/
├── aggregation.ts
├── comparisons.ts
├── consistency.ts
├── streaks.ts
├── goals.ts
├── trends.ts
└── types.ts
```

Potential calculations:

```text
totalCodingTime
dailyAverage
bestDay
activeDays
consistencyRate
goalProgress
streak
projectDistribution
languageDistribution
editorDistribution
weekOverWeekChange
monthOverMonthChange
```

All calculations should be deterministic and testable.

---

# 46. Accessibility

Support:

- screen readers
- sufficient contrast
- scalable text
- large touch targets
- reduced motion where possible
- semantic labels
- meaningful chart descriptions

Charts must have a textual equivalent.

Example:

```text
You coded for 28h 42m this week across 6 days.
Tuesday was your most active day at 6h 18m.
```

---

# 47. Security

Security requirements:

- no secrets in Git
- no OAuth client secret in mobile bundle
- secure authentication storage
- TLS-only network requests
- typed input validation
- secure backend session handling
- no token logging
- sanitized error logging
- least-privilege OAuth scopes

Potential future:

- certificate pinning only if justified
- device/session management
- suspicious session detection

Do not add complex security mechanisms without a clear threat model.

---

# 48. Observability

Use an error/telemetry system carefully.

Potential events:

```text
app_open
auth_success
auth_failure
sync_started
sync_completed
sync_failed
offline_mode
api_error
```

Do not capture:

- tokens
- source code
- raw private activity unnecessarily
- sensitive personal data

Performance monitoring should measure:

- startup
- API latency
- database latency
- sync duration
- crashes
- screen rendering problems

---

# 49. Analytics Privacy

Product analytics should be minimal.

Avoid tracking every tap.

Useful events:

```text
connected_wakatime
completed_onboarding
enabled_notifications
created_goal
shared_weekly_report
```

The application should not need behavioral surveillance to provide coding analytics.

---

# 50. MVP Scope

The MVP should contain:

## Authentication

- Better Auth
- WakaTime OAuth
- session restore
- logout
- auth error handling

## Home

- today's coding time
- goal progress
- comparison
- projects
- languages
- editors
- sync status

## Analytics

- 7D
- 30D
- 90D
- daily chart
- average
- best day
- active days
- project breakdown
- language breakdown

## Offline

- SQLite
- cached dashboard
- cached analytics
- offline indicator
- background synchronization
- pull-to-refresh

## Settings

- account
- theme
- daily goal
- notifications preference
- cache/data controls
- logout

---

# 51. Phase 2

Add:

- streaks
- calendar
- activity timeline
- duration history
- weekly reports
- sharing
- notifications
- widgets
- improved project analytics

---

# 52. Phase 3

Add:

- AI activity metrics
- AI vs human coding metrics
- machine analytics
- operating system analytics
- category analytics
- project goals
- advanced trend analysis

---

# 53. Phase 4

Potential advanced features:

- private leaderboards
- public leaderboards
- organization analytics
- team dashboards
- team goals
- organization insights

These features should only be implemented after the individual-user experience is stable.

---

# 54. Phase 5

AI Coding Coach.

Possible capabilities:

- weekly coding summary
- trend explanations
- project distribution explanation
- goal reflection
- activity summaries
- anomaly detection
- personalized observations

AI must be grounded in actual structured WakaTime data.

---

# 55. Development Roadmap

## Step 1 — Repository setup

- initialize monorepo
- configure pnpm
- configure TypeScript
- initialize Expo app
- configure Expo Router
- configure linting
- configure formatting
- configure testing
- create AGENTS.md
- establish architecture rules

## Step 2 — Design system

Build:

- typography
- spacing
- cards
- buttons
- tabs
- charts
- progress indicators
- skeletons
- empty states
- error states
- bottom sheets
- settings rows

## Step 3 — Authentication

Implement:

- Better Auth
- WakaTime OAuth
- secure session handling
- login
- callback
- session restore
- logout

## Step 4 — WakaTime API client

Implement:

- client
- auth handling
- typed endpoints
- errors
- response normalization

## Step 5 — Database

Implement:

- SQLite setup
- migrations
- repositories
- indexes
- sync metadata

## Step 6 — Home

Implement:

- today's summary
- goal
- project breakdown
- language breakdown
- editor breakdown
- comparisons
- sync status

## Step 7 — Offline-first

Implement:

- cache hydration
- offline state
- synchronization
- stale data handling
- background refresh

## Step 8 — Analytics

Implement:

- range selector
- daily chart
- aggregate metrics
- project analytics
- language analytics
- comparison engine

## Step 9 — Settings

Implement:

- profile
- goal
- theme
- notification settings
- cache management
- logout

## Step 10 — Testing

Implement:

- unit tests
- integration tests
- component tests
- critical E2E paths

## Step 11 — Beta

Test:

- real WakaTime accounts
- slow network
- offline mode
- large histories
- different timezones
- iOS
- Android

## Step 12 — Phase 2

Add:

- streaks
- calendar
- activity
- widgets
- notifications
- sharing

---

# 56. Agent Workflow

Coding agents should work feature-by-feature.

Recommended loop:

```text
Understand
   ↓
Inspect existing architecture
   ↓
Plan
   ↓
Implement
   ↓
Run typecheck
   ↓
Run lint
   ↓
Run tests
   ↓
Review performance
   ↓
Review offline behavior
   ↓
Review security
   ↓
Commit
```

Agents should not make large architectural changes without documenting why.

---

# 57. AGENTS.md Requirements

The project-level `AGENTS.md` should contain:

## Architecture

```text
Expo + React Native + TypeScript is the primary application architecture.
```

## Native rule

```text
Expo → RN → libraries → Expo Modules/config plugins → platform files → native code.
```

## Data rule

```text
TanStack Query owns server state.
SQLite owns durable local structured data.
Zustand owns client/UI state.
SecureStore owns sensitive secrets.
```

## API rule

```text
UI must not directly depend on raw WakaTime API responses.
```

## Offline rule

```text
Network must never be required to render previously cached data.
```

## Security rule

```text
Never log credentials, tokens, secrets, or unnecessary private activity.
```

---

# 58. Definition of Done

A feature is not complete merely because the happy path works.

Every feature should consider:

### Functionality

- Does the feature work?
- Does it work with empty data?
- Does it work with large data?

### Offline

- What happens without network?
- Does cached data remain available?

### Loading

- What does the user see while loading?

### Errors

- What happens if WakaTime fails?

### Performance

- Does it block rendering?
- Does it cause unnecessary requests?

### Security

- Is sensitive data exposed?

### Accessibility

- Can the feature be understood with assistive technology?

### Platform

- Does it work on iOS and Android?

### Native rule

- Can the feature be implemented entirely through Expo/RN?
- If not, why is native code necessary?

---

# 59. Success Metrics

Product success should initially be measured through experience quality rather than vanity metrics.

Technical:

- startup performance
- crash-free sessions
- sync success rate
- API error rate
- offline cache availability
- average screen render performance

Product:

- successful WakaTime connections
- returning users
- daily/weekly usage
- goal creation
- analytics usage
- report sharing
- notification opt-in

Do not equate more coding time with better user outcomes.

---

# 60. Future Architecture

The eventual architecture could become:

```text
                    ┌─────────────────────┐
                    │      WakaTime       │
                    │       APIs          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   WakaTime Adapter  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Domain / Mapper   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐          ┌─────────────────┐
        │   SQLite        │          │ TanStack Query  │
        │ Durable Cache   │          │ Server Cache    │
        └────────┬────────┘          └────────┬────────┘
                 │                            │
                 └─────────────┬──────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Domain Services   │
                    │ Analytics / Goals   │
                    │ Streaks / Trends    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React Native / Expo │
                    │       UI            │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼────────────────┐
               ▼               ▼                ▼
            iOS APIs       Android APIs      Shared APIs
```

Native capabilities remain underneath the React Native application:

```text
React Native
    │
    ├── Expo Notifications
    ├── Expo Sharing
    ├── Expo SecureStore
    ├── Expo SQLite
    ├── Expo Haptics
    ├── Expo Router
    │
    └── Native capability bridge
          ├── iOS widget, if required
          ├── Live Activity, if required
          └── Android widget, if required
```

---

# 61. Recommended First Milestone

The first implementation milestone should be deliberately small.

## Milestone: "Authenticated Cached Dashboard"

Deliver:

```text
Open app
   ↓
Connect WakaTime
   ↓
OAuth succeeds
   ↓
Session restored
   ↓
Fetch today's summary
   ↓
Normalize data
   ↓
Store in SQLite
   ↓
Render dashboard
   ↓
Kill app
   ↓
Open app offline
   ↓
Dashboard still works
   ↓
Reconnect
   ↓
Background sync updates dashboard
```

If this flow is solid, the architecture is ready for the rest of the product.

---

# 62. Final Product Direction

WakaBoard should not try to win by having the most screens.

It should win by making WakaTime data feel:

- immediate
- understandable
- personal
- beautiful
- reliable
- useful offline

The core experience should always remain:

```text
Open app
    ↓
See where your coding stands
    ↓
Understand what you've been working on
    ↓
Explore your history
    ↓
Set and track goals
    ↓
Return later without losing context
```

The most important engineering decision is to preserve the **offline-first, domain-driven architecture** from the beginning.

The most important product decision is to treat WakaTime as the telemetry provider rather than allowing the WakaTime API response format to dictate the entire product.

The most important platform decision is:

> **Build one Expo + React Native application and progressively add native capabilities only when Expo or React Native genuinely cannot provide them.**

That keeps the codebase maintainable while still allowing the product to take advantage of deeper iOS and Android capabilities when they become valuable.
