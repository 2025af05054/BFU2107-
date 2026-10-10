---
name: vendor-research
description: Research manufacturers for ONE cluster row from the master tracker, build a sourced Excel supplier dataset, save it locally, upload it to the BUY FOR US admin panel, update the tracker, and report. Use when the user invokes /vendor-research to process the next pending cluster row.
---

# Vendor Research Agent

Run this entire skill in a single pass, without stopping for approval, except where a step below says to stop. This skill is designed to be invoked fresh in a new chat each time — do not assume any prior conversation context. All state lives in `tracker.md` next to this file, not in chat history.

## Step 0 — Pick the row

Read `tracker.md` (same directory as this file). Pick the **first row from the top with Status = PENDING**. If the user's invocation message names a specific row explicitly, use that row instead. Immediately edit `tracker.md` to set that row's Status to `IN_PROGRESS` so a concurrent run won't duplicate it.

Work on only this one row. Do not start another row in this run.

## Step 1 — Research

Goal: at least 60 genuine **manufacturers** in the cluster (more if available). Exclude traders, dealers, raw-material suppliers, pattern-only shops, and consultants. Cover every industrial area named in the row, not just the city centre.

Search term patterns by product type:
- Castings: foundry, grey/SG/ductile iron castings, steel castings, investment/lost-wax casting, aluminium die casting, shell moulding
- Forgings: closed-die/open-die forging, hot forging, flanges, forged auto parts, hand tools
- CNC machining: CNC job work, VMC/HMC machining, turned/precision machined components
- Fabricated components: sheet metal, structural fabrication, laser cutting, welded assemblies
- Shafts & gears: gear manufacturer, gear box, shafts, sprockets, gear hobbing
- Pumps: pump manufacturer, monoblock, submersible, centrifugal, pump castings & ancillaries
- Valves: industrial valves, gate/globe/ball/butterfly valves, brass valves

Source priority:
1. Industry/trade association member directories for the cluster (chamber of commerce, engineering association, institute chapters) — these give real addresses and phone numbers and are the most reliable.
2. MSME/SIDBI/TERI-SDC/BEE cluster profile reports (search `sameeeksha.org` and similar) — good for cluster facts and estimates, rarely individual company contact details.
3. Company websites.
4. Trade directories (IndiaMART, TradeIndia, ExportersIndia) — treat phone numbers starting +91 80xx/79xx as relay numbers, not direct lines.
5. Blog/industry round-ups (foundrychannel.com etc.) for company names and specialties.

Use WebSearch and WebFetch. When a source is a PDF that WebFetch can't parse as text, download it and run `pdftotext -layout` on it via Bash, then read the text file.

## Step 2 — Data rules (strict)

- Never invent a phone number, address, capacity, turnover, or employee count. If a field isn't found, write exactly `Not found - verify`.
- Record the real source for every row (publication/site name + URL pattern), not a placeholder.
- Phone type classification: `Direct` (company's own line, as published by an association/chamber directory), `Direct (HO / corporate)`, `IndiaMART relay number` (+91 80xx/79xx), or `Not found - verify`.
- Deduplicate same company listed under different spellings/units.
- Keep addresses exactly as published, with PIN code where available.
- Key Cluster column must use only the named industrial areas from the tracker row (e.g. "Shapar-Veraval", "Metoda", "Aji GIDC") — not ad hoc sub-localities. Put finer detail in the Locality column instead.

## Step 3 — Build the Excel file

Write a Python script using `openpyxl` (install via `pip3 install --quiet openpyxl` if missing) to `/private/tmp/.../scratchpad/` and run it with Bash. Do not hand-build the xlsx any other way.

File name: `[Product]_Suppliers_[State]_[Cluster].xlsx` (spaces → underscores).

**Sheet 1 "`[State] - [Cluster] Suppliers`"**: title row, one-line note (rank, est. manufacturers, date compiled, "VERIFY BY PHONE BEFORE RFQ"), then columns in this exact order:
S.No, Company Name, Key Cluster, Locality, Full Address, Contact No., Phone Type, Contact Person, Email, Website, Product/Material Type, Products/Capability, Company Size, Size Basis, Installed Capacity, Specialty/Key Strength, Certifications, Year Established, Source.

Company Size bands (use only when real turnover/employee data was found): Large = turnover >Rs 250 Cr or 500+ employees; Medium = Rs 50-250 Cr or 100-500 employees; Small = Rs 5-50 Cr or 20-100 employees; Micro = <Rs 5 Cr or <20 employees; otherwise `Not found - verify`.

Formatting: Arial font, dark-blue (`1F3864`) header fill with white bold text, borders on every data cell, wrapped text, frozen header row, autofilter over the full data range, column widths sized to content. Colour the Phone Type cell green (`C6EFCE`) for `Direct`, red (`FFC7CE`) for `Not found - verify`. Sort rows by Key Cluster then Company Name.

**Sheet 2 "Summary"**: COUNTIF formulas (referencing Sheet 1 ranges, not hardcoded numbers) for counts by Key Cluster, by Phone Type, by Material Type, by Company Size; a "how to read the phone column" note block; useful cluster contacts (associations, with whatever address/phone is genuinely known); 3-4 cluster facts each with its source cited inline.

**Sheet 3 "State Tracker"**: reproduce the full tracker table (read live from `tracker.md`) with a Status column; this run's row shows the Supplier Count as a formula referencing Sheet 1 (`=COUNTA(...)`), not a typed number.

## Step 4 — Check the work

Reopen the generated file with `openpyxl` in a short Python check: confirm row count, zero blank company names, zero duplicate names, every row has a non-empty Source, and that a COUNTIF-equivalent computed in Python (via `collections.Counter`) matches what the Summary formulas will produce. There is no LibreOffice in this environment to force a live formula recalculation — do the Python-side logical check instead and say so in the report. Spot-check 5 random rows' Contact No./Address against the raw source text you fetched earlier in this same run (not from memory).

## Step 5 — Save to the user's computer

Save the finished file to `/Users/pratikchoudhary/Documents/Vendor-Datasets/` (create the folder if missing).

## Step 6 — Upload to the admin panel

Use the dedicated **Vendor Import** page at `/admin/vendors/import`, which parses Sheet 1 of the xlsx directly into the `vendors` table (via the `vendor_import_batches` + `vendors` Supabase tables) and reports before/after vendor counts.

1. Start the dev server (`npm run dev` in the project root) if not already running, and load the Chrome tools (`ToolSearch` for `mcp__claude-in-chrome__*` if not yet loaded).
2. Navigate to `http://localhost:8080/admin/vendors/import`. An admin session may already be active in the browser; if the page redirects to `/auth`, stop and tell the user to log in (never enter credentials yourself).
3. Fill the form: Product category = this row's Product, State = this row's State, Cluster / City = this row's Cluster (use the short name, e.g. "Rajkot"), Source = "Research", Status = "Draft".
4. Use `find` to locate the file input, then `file_upload` with the saved file's absolute path.
5. Click "Import Vendors" and wait for the success toast, which states the before→after vendor count. Screenshot it as proof, and confirm the new row appears in the Import History list below with the correct row count.

Stop and ask the user if: the page asks to log in, a CAPTCHA appears, the import errors (e.g. header row not found), or anything asks to overwrite/delete existing data.

## Step 7 — Update the tracker and finish

Edit `tracker.md`: set this row's Status to `DONE`, fill in the Supplier count and File columns.

Reply with only:
1. The file name and where it was saved
2. Upload result (success/failed + reason)
3. Counts: total suppliers, direct phone numbers, by company size
4. Main gaps
5. NEXT ROW, written as `[Product | Rank | State | Cluster]` (read it from `tracker.md` — the next PENDING row after this one), and remind the user they can just run `/vendor-research` again in a new chat to start it — no need to paste the row.

Then stop. Do not start the next row.
