# Poker Planning for YouTrack

> Automate **Story Point** estimation through comment-based voting and a summary command, keeping details visible only to the Product Owners (POs) team.

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Workflow Structure](#workflow-structure)
4. [Installation](#installation)
5. [How to Use](#how-to-use)
6. [Sample Voting Session](#sample-voting-session)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [License](#license)

---

## Overview
This package ships **two JavaScript workflow rules** that work together:

| Rule | Type | Purpose |
|------|------|---------|
| `Update Story Points from Poker Fibonacci Comment Votes` | `Issue.onChange` | Listens for new comments, validates votes and auto-detects the winning value. Updates the **Story points** field when the issue is in *Backlog* or *Refinement*. |
| `Post or Update Poker Votes Summary` | `Issue.action` (command `poker-result`) | Publishes or updates a **Markdown summary** with all valid votes, vote count per value and tiebreaker criterion. Only **POs Team** members can run the command. |

---

## Prerequisites
- YouTrack 2023.1 or later (JavaScript workflow engine).
- A custom field **Story points** of type *integer* added to your project(s).
- Workflow states containing at least **Backlog** and **Refinement**.
- A user group **POs Team** (only members may execute the `poker-result` command).

> ⚠️ Create the field, states or group first if they do not yet exist.

---

## Workflow Structure
```
Poker-Fibonacci/             # workflow folder
├── manifest.json            # Manifest file
├── poker.js                 # Comment script pokoer vote
└── poker-reuslt.js          # Issue action to output Result
```

Each file maps 1-to-1 to the original scripts.

---

## Installation
1. Import the zip file
---

## How to Use
1. During a *Refinement Session*, each participant comments on the issue using:
   ```
   Poker <number>
   ```
   - Accepted numbers come from the **Fibonacci sequence**: `1, 2, 3, 5, 8, 13`.
   - Values outside the sequence are **rounded up to the next valid number**.
   - Comments are automatically **hidden** from everyone outside **POs Team**.
2. After all votes are in, a **POs Team** member can use the Issue action:
   ```
   Post or Update Poker Votes Summary
   ```
   - The workflow action posts (or updates) the **Poker Votes Summary** in Markdown.
   - It counts votes, identifies the **winning value** and displays the tiebreak rule (“highest value wins on tie”).
3. If the issue is in **Backlog** or **Refinement**, the **Story points** field is set to the winning value.

> **Tiebreak rule:** when two or more values share the highest vote count, the **largest value** wins (e.g., tie 3 × 5 → choose 5).

---

## Sample Voting Session
| User | Comment        |
|------|----------------|
| alice| `Poker 3`      |
| bob  | `Poker 5`      |
| carol| `Poker 5`      |

After `poker-result`, the posted summary will be:
```
**Poker Votes Summary:**

**Valid votes:**
- alice: 3
- bob: 5
- carol: 5

**Final result:** 5
**Criterion used:** highest value wins on tie
```
And the issue **Story points** becomes **5**.

---

## Customization
| What to change | Where | Note |
|----------------|-------|------|
| Fibonacci series | `FIBONACCI_LIMIT` (update rule) and `FIBONACCI` (summary rule) | Add more numbers if needed. |
| Allowed states for update | `VALID_STATES` | e.g., `['Open','In Progress']`. |
| Command permission group | `POs Team` | Replace with another group or role. |
| Comment prefix | `POKER_PREFIX` | Change to `PP <n>` if desired. |

---

## Troubleshooting
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Story points not updated** | Issue not in allowed state; field not attached | Check `VALID_STATES`; attach field to project. |
| **Comment still visible** | Group misconfigured | Verify *POs Team* exists and contains correct users. |
| **Command `Post or Update Poker Votes Summary` not recognized** | User not in POs group | Add user to group or adjust guard check. |
| **Unexpected winning value** | Tie resolved by highest number | This is default; change code for another rule. Do not misunderstand votes as a value or the sum of value |

---

## Best Practices
- Define who triggers `Post or Update Poker Votes Summary` and when.
- Keep voting sessions concise to avoid excess comments.
- Perform code reviews on workflow changes.
- Document the process in the team handbook for newcomers.

---

## License
Internal use within Atreyo. Adapt freely under your team policies.
