# SafeWork PTW — Permit to Work System

A fully client-side, web-based Permit to Work (PTW) management system. Runs entirely in the browser — no server required. Deploy directly to GitHub Pages.

## Features

### Permit Types
- **Work at Height (WAH)** — height, access equipment, anchor checks
- **Confined Space (CS)** — atmospheric testing, standby person, class rating
- **Lockout/Tagout (LOTO)** — energy source isolation, try-out verification
- **Hot Work (HW)** — fire watch, combustibles clearance, extinguisher check
- **Electrical Work (ELEC)** — voltage, circuit ref, isolation status

### Core Functionality
- **5-step guided wizard** for permit creation
- **Automated routing** — each permit type routes to the correct certified assessor
- **Risk matrix** — 5×5 likelihood × consequence scoring (LOW / MEDIUM / HIGH / EXTREME)
- **Hierarchy of Controls** — elimination → substitution → engineering → administrative → PPE
- **Digital signature** — canvas-based signature capture
- **Approve / Reject / Complete** workflow
- **Excel export** — full permit log, active-only, hot work log, risk register
- **Dashboard** with live stats, routing queue, type breakdown

### Data Storage
All permit data is stored in **browser localStorage** — no backend required. For production use, integrate with a backend API or Google Sheets.

## Deployment to GitHub Pages

1. Fork or upload this repository to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Click **Save** — your site will be live at `https://<username>.github.io/<repo-name>`

## File Structure

```
/
├── index.html          — Main application shell
├── css/
│   └── main.css        — All styles (dark industrial theme)
├── js/
│   ├── data.js         — Config: permit types, routing rules, assessors, controls
│   ├── controls.js     — Controls renderer, risk matrix, type-specific fields
│   └── app.js          — Main app logic, state, navigation, wizard, export
└── README.md
```

## Customisation

### Adding Assessors
Edit `PTW_CONFIG.routingRules` in `js/data.js`:
```javascript
WAH: {
  assessors: [
    { id: 'HSA-001', name: 'Your Name', title: 'Your Title', badge: 'WAH Cert.' },
    ...
  ]
}
```

### Adding Control Measures
Edit `PTW_CONFIG.controls` in `js/data.js` for each permit type and hierarchy level.

### Adding Custom Fields
Edit `PTW_CONFIG.typeFields` in `js/data.js` — supports `text`, `number`, and `select` field types.

## Export Formats

| Export | Contents |
|--------|----------|
| All Permits | Full register with all fields |
| Active Permits | Currently active/approved only |
| Hot Work Log | Hot work permits with fire watch |
| Risk Register | HIGH and EXTREME risk permits |

All exports include a summary sheet with breakdowns by type, status, and risk level.

## Tech Stack

- Vanilla HTML/CSS/JavaScript — zero dependencies
- [SheetJS (xlsx)](https://sheetjs.com/) — Excel export (loaded from CDN)
- Google Fonts — Syne, DM Mono, DM Sans
- Browser localStorage for persistence

## License

MIT — free to use and adapt for your organisation.
