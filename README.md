# Support CRM

A customer support ticketing system built for the Datastraw assessment. Create tickets, search and filter them, view details, update status, and add notes — with a priority + SLA indicator to flag tickets that need urgent attention.

**Live app:*https://support-crm-three-ashy.vercel.app/*
**Demo video:\*\* [ADD YOUR YOUTUBE LINK HERE]

## Tech stack

- **Database:** Supabase (PostgreSQL)
- **Frontend:** HTML, Bootstrap 5, vanilla JavaScript (no build step, no framework)
- **Deployment:** Vercel (static hosting)

I chose plain HTML/JS + Bootstrap over React because I'm new to React and wanted to ship something I fully understand and can explain, rather than a partially-understood React app. Supabase's auto-generated REST API replaces a custom backend, which is a fair tradeoff for a project this size — it removes the need to write and host a separate API server.

## Features

1. **Create tickets** — customer name, email, issue title, description, priority. Auto-generates ticket IDs like `TKT-001`.
2. **List all tickets** — ID, name, title, priority, status, date, newest first.
3. **Search** — live search-as-you-type across name, email, ticket ID, title, and description.
4. **Filter by status** — Open / In Progress / Closed.
5. **View & update tickets** — detail page with full ticket info, status update, and notes/comments.
6. **Stand-out feature: Priority + SLA indicator** — each ticket has a priority (Low/Medium/High/Urgent), each with a target resolution time (4h to 72h). Tickets past their target show a red "Overdue" badge; tickets close to their deadline show an amber "Due soon" badge. This helps a team handling many tickets a day spot what needs attention first, without reading every row.

   **Tradeoff:** the SLA is calculated client-side from `created_at`, so it needs no extra database column or background job and is always current. The downside is the targets are hardcoded (not configurable per client), it counts real hours rather than business hours, and a ticket closed late doesn't record that it breached its SLA. With more time, I'd move the targets into a settings table, account for business hours, and log SLA breaches for reporting.

## Database schema

Two tables, as specified:

**tickets**
| column | type | notes |
|---|---|---|
| id | bigint | primary key |
| ticket_id | text | unique, auto-generated (`TKT-001`) |
| customer_name | text | |
| customer_email | text | |
| subject | text | |
| description | text | |
| status | text | Open / In Progress / Closed |
| priority | text | Low / Medium / High / Urgent |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**notes**
| column | type | notes |
|---|---|---|
| id | bigint | primary key |
| ticket_id | text | foreign key → tickets.ticket_id |
| note_text | text | |
| created_at | timestamptz | |

Both tables use Row Level Security with a public-access policy for this MVP. A production version would restrict writes to authenticated support agents.

## Setup instructions

1. Clone the repo:

   ```bash
   git clone https://github.com/SanketMohite01/support-crm.git
   cd support-crm
   ```

2. Create a free [Supabase](https://supabase.com) project.

3. In the Supabase SQL Editor, run the schema in [`schema.sql`](./schema.sql) (or see the Database schema section above) to create the `tickets` and `notes` tables with Row Level Security policies.

4. Copy `js/config.example.js` to `js/config.js` and fill in your Supabase project URL and anon/public key (found under Project Settings → API):

   ```js
   const SUPABASE_URL = "your-project-url-here";
   const SUPABASE_ANON_KEY = "your-anon-key-here";
   ```

5. Open `index.html` with any static file server (e.g. VS Code's Live Server extension), or deploy the folder as-is to Vercel/Netlify — no build step required.

## Project structure

```
support-crm/
├── index.html          # Ticket list, search, filter
├── new.html            # Create ticket form
├── ticket.html         # Ticket detail, status update, notes
├── js/
│   ├── config.js        # Supabase credentials (not committed with real keys)
│   ├── config.example.js
│   ├── db.js            # Supabase client init
│   ├── new.js           # Create ticket logic
│   ├── index.js         # List, search, filter logic
│   ├── ticket.js         # Detail page, status update, notes logic
│   └── sla.js           # Priority/SLA calculation logic
└── README.md
```

## Challenges faced

- **Indian ISP-level DNS blocking of Supabase:** while developing, `*.supabase.co` was intermittently unreachable on some networks (a known, reported issue affecting several Indian ISPs). I diagnosed this by testing the same request across Wi-Fi and mobile data and comparing DNS errors, which confirmed it was a network-level block rather than a code bug.
- **Debugging a broken database connection:** an early typo (`SUPABASE_ANON_KEY.createClient` instead of `supabase.createClient`) caused a silent failure. Adding explicit error handling (try/catch around all database calls, and surfacing `error.message` in the UI) made failures visible instead of leaving the UI stuck.

## Improvements with more time

- Authentication for support agents (currently open access for demo purposes)
- Configurable SLA targets per client/team
- Pagination for large ticket volumes
- Ticket assignment to specific agents
- Email notifications on status change
