# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A mixed team (developers, designers, PMs and non-technical colleagues) working together. They open Team Pulse during the day to see who is in a meeting right now, which projects are stuck, and where each project runs. The interface must be understandable for people who are not technical.

## Product Purpose

A shared team workspace in the spirit of Notion: nested documents with a block editor, a project board, a meeting calendar, and live "in a meeting / free" status for each teammate. Success: anyone on the team can answer "who is free, what is stuck, where does it run" in a few seconds, and keep notes and meeting minutes in one place.

## Positioning

Notion-style pages and a project board in the same place as live meeting status, so a status check and the notes behind it live together.

## Operating Context

- Used on desktop during work and sometimes on phones.
- Meetings come from the team's own calendar entries plus a quick "I'm in a meeting for 30 min" button.
- Projects record where they run (Vercel, AWS, office server, local machine) and their links/repos.

## Capabilities and Constraints

- Thai-only interface. Technical terms may stay in English.
- Runs as a Vite app (`npm run dev`); planned deploy to Vercel.
- Current storage is per-browser (localStorage / IndexedDB). A shared database (e.g. Supabase) is undecided and not built yet; the same code also runs as a claude.ai artifact with a shared store.
- Features: nested pages, slash-command block editor, images in pages, search, templates, trash, favourites, project board/table, week calendar, meeting notes linked to events, settings with light/dark theme and a profile picture chosen from hand-drawn avatars or uploaded.

## Brand Commitments

- Name: Team Pulse.
- Colourful, explicitly requested by the user.
- Avatars must be hand-drawn style.

## Evidence on Hand

No real customers, testimonials or metrics. Example data in the app is labelled "(ตัวอย่าง)" and removable.

## Product Principles

1. Status at a glance: who is busy and what is stuck must be readable in seconds.
2. Plain language for a mixed team; no jargon in labels.
3. Everything is editable in place, the way Notion works.
4. Shared truth: one set of data for the whole team.
