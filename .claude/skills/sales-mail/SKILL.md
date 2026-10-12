---
name: sales-mail
description: Find 5 new European (default Germany) casting-buyer company contacts BUY FOR US hasn't emailed yet, draft a short plain-language sales email from Govind Patel, show the drafts for one approval, send via the sales@buyforus.in Titan webmail, and log them so future runs never repeat a contact. Use when the user invokes /sales-mail to run the next outreach batch.
---

# Sales Mail Outreach Agent

Run this skill in a single pass. Do not stop for approval except at the one checkpoint marked below. Designed to be invoked fresh each time (`/sales-mail`) — all state lives in `tracker.md` next to this file, not in chat history.

## Sender identity (always use exactly this — never invent or vary it)

- Name: Govind Patel
- Role: Sales Manager
- Platform: BUY FOR US (buyforus.in)
- Phone: +91 9653987673
- Address: 10 A, DLF Cyber Hub, Gurugram, India
- Sending mailbox: sales@buyforus.in

## Step 0 — Read the tracker

Read `tracker.md` (same directory as this file). Build a set of every company/email already listed — these are permanently off-limits for future runs, regardless of whether the email was opened/replied.

## Step 1 — Find 5 new target contacts

Default target geography: Germany (unless the user names a different EU country in the `/sales-mail` invocation).

Priority order for finding targets:
1. First, pull unused companies from `/Users/pratikchoudhary/Documents/Sales-Pipeline/Germany_GTM_Target_Accounts.xlsx` (Target Accounts sheet) — ALNOX, ARI-Armaturen, LESER, GESTRA, Buschjost, USD Formteiltechnik. Skip any already in `tracker.md`.
2. Once that list is exhausted, research new candidate companies the same way the GTM plan was built: WebSearch for German/EU companies that import castings, investment castings, or valve/pump components from India (Volza/Trademo/Tradekey buyer directories, VDMA Pumps+Systems and Valves member lists, EUROGUSS/Valve World Expo exhibitor lists). Prefer mid-size (SME) companies over giant OEMs — they move faster and are easier to reach directly.

**Finding the actual email address — critical rule: never invent or guess an email.** Only use an address you actually found published. Good sources, in order of reliability:
- The company's own "Contact" or "Impressum" page (German companies are legally required to publish a direct contact email on their Impressum page — this is usually the most reliable source).
- A general company inbox (`info@`, `sales@`, `vertrieb@`, `kontakt@`) is fine and expected — you are not expected to find a named individual's personal email.
- If WebFetch is blocked on a company site, use WebSearch for `"[company name]" contact email` or `"[company name]" impressum`.
- If no email can be found for a company after a real attempt, drop that company and pick a different one — do not fabricate a `firstname.lastname@company.com` guess.

Stop once you have 5 confirmed, previously-unused company + email pairs.

## Step 2 — Draft the emails

Write one short, plain-language email per contact. Keep each under ~150 words. Structure:

1. One-line friendly opener, mention the company by name (shows it's not a mass-blast).
2. 2-3 sentences on what BUY FOR US does: a sourcing platform with researched, verified profiles of Indian casting manufacturers — real materials/process capability, certifications, export history, and a transparent data-confidence score per supplier, so EU buyers can evaluate without doing that research themselves.
3. A simple plain-text summary table (3-4 rows, using `|` separators or aligned dashes — no images, since webmail compose can't reliably embed custom graphics) covering: Manufacturers profiled, Material/process coverage, Certifications tracked, Pricing model (quote-based, no fixed catalog price).
4. One clear call to action: visit buyforus.in/manufacturers or buyforus.in/castings, and reply with feedback or a sample drawing for a no-commitment quote.
5. Sign-off with the exact sender identity block above (name, role, platform, phone, address).

Subject line: short and specific, e.g. "Verified Indian casting suppliers for [Company]" — never generic ("Hello", "Business proposal").

## Step 3 — CHECKPOINT: show all 5 drafts before sending

Print all 5 drafts (recipient, subject, body) in the chat. Wait for the user's explicit go-ahead on this batch before sending anything. If the user asks for edits to any draft, make them and re-show only the changed ones. Do not proceed to Step 4 without an explicit yes.

## Step 4 — Send via Titan webmail

1. Load the `mcp__claude-in-chrome__*` tools if not already loaded.
2. Navigate to `https://secureserver.titan.email/mail/`. The `sales@buyforus.in` account should already be logged in (visible in the left sidebar). If it asks for a login, stop and tell the user to log in themselves — never enter a password.
3. For each of the 5 approved drafts: click "New email", fill recipient/subject/body exactly as approved, and send.
4. Take a screenshot after each send as confirmation it went through (check it lands in the Sent folder).

## Step 5 — Update the tracker

Append one row per sent email to `tracker.md`: date, company, country, contact email, contact name/role if known, subject line, status (`Sent`), and where the email address came from (e.g. "Impressum page" or "company contact form"). Never delete or overwrite existing rows.

## Step 6 — Report

Reply with only:
1. The 5 companies/emails contacted this run.
2. Any companies skipped and why (e.g. no public email found).
3. Running total of companies contacted so far (count tracker.md rows).
4. Reminder that the user can just run `/sales-mail` again in a new session to send the next batch of 5 — no need to repeat instructions.

Then stop. Do not start a second batch in the same run.
