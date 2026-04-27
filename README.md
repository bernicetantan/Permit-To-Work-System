# Permit to Work (PTW) System

A dynamic, web-based Permit to Work management system built for GitHub Pages. No server, no database — runs entirely in the browser.

## Features

- **5 Permit Types** — Work at Height, Confined Space, LOTO, Hot Work, Electrical Work
- **Distinct Approval Workflows** per permit type:
  - WAH, CS, ELEC → 3-stage approval
  - LOTO, HW → 2-stage approval
- **Digital Signatures** — canvas-based signing for requesters and approvers
- **Risk Assessment Matrix** — Likelihood × Consequence scoring
- **Per-type Checklists** — hazards, PPE, and pre-work safety checks
- **Excel Export** — structured `.xlsx` with:
  - Summary tab
  - All Permits tab
  - One tab per permit type (WAH, CS, LOTO, HW, ELEC)
  - Approval Log tab
- **Shopee-inspired UI** — orange/red colour palette, Be Vietnam Pro typography
- **Analytics Dashboard** — permit breakdowns by type, status, and risk level

## Approval Workflows

| Permit Type | Stages | Stage 1 | Stage 2 | Stage 3 |
|-------------|--------|---------|---------|---------|
| Work at Height | 3 | WAH Certified Assessor | Safety Officer | Area Manager |
| Confined Space | 3 | CS Entry Supervisor | Safety Officer | Operations Manager |
| LOTO | 2 | Electrical Safety Officer | Area Manager | — |
| Hot Work | 2 | Fire Safety Manager | Area Manager | — |
| Electrical Work | 3 | Licensed Electrical Worker (LEW) | Safety Officer | Area Manager |

## Deployment — GitHub Pages

1. Fork or clone this repository
2. Go to **Settings → Pages**
3. Set Source to `Deploy from a branch`, branch `main`, folder `/` (root)
4. Access at `https://yourusername.github.io/your-repo-name/`

## File Structure

```
ptw-system/
├── index.html          # Main application shell
├── css/
│   └── style.css       # Shopee-inspired design system
├── js/
│   ├── config.js       # Permit type configs, workflows, checklists
│   ├── app.js          # Core state, navigation, rendering
│   ├── workflows.js    # Workflow diagram rendering
│   ├── forms.js        # New permit multi-step form
│   ├── export.js       # Excel export (structured tabs)
│   └── init.js         # Application bootstrap
└── README.md
```

## Data

All data is held in memory for the current session. Refreshing the page resets all permits. To persist data, add `localStorage` save/restore calls in `init.js` and `app.js` (`addPermit`).

## Tech Stack

- Pure HTML / CSS / JavaScript — no frameworks
- [SheetJS (xlsx.js)](https://sheetjs.com/) — Excel export via CDN
- [Google Fonts — Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro)

## Customisation

- Edit `js/config.js` to modify permit types, approval workflows, hazard lists, PPE requirements, and pre-work checklists
- Edit `css/style.css` CSS variables in `:root` to change the colour palette
- Add `localStorage` persistence in `js/app.js` for data retention across sessions
