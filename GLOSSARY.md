# Template Next.js

A reusable starter for an authenticated dashboard. "Task" and "User" are the canonical example entities used to demonstrate the full stack: a contract-first API, a mocked backend, role-based access control, i18n, and performance patterns.

## Language

**Task**:
A unit of work tracked in the application: a title, an optional description, a lifecycle status, an optional priority, an assignee, and an optional due date.
_Avoid_: Item, job, ticket

**User**:
A person with an account in the application. Every User holds a Role.
_Avoid_: Account, member

**Role**:
A named level of access — `admin` or `member` — that determines what a User may do.
_Avoid_: Permission group, level

**Assignee**:
The User responsible for a Task.
_Avoid_: Owner

**Status**:
The lifecycle state of a Task: `todo`, `in-progress`, `done`, or `blocked`.
_Avoid_: State, phase

**Priority**:
The relative urgency of a Task: `low`, `medium`, or `high`.
_Avoid_: Severity, importance

**Locale**:
A language and region pair (e.g. `en`, `vi`) used to translate the interface and format currency.
_Avoid_: Language, region
