# Mission — Daily Learning OS

A responsive React + Vite daily learning tracker. It includes custom one-hour missions, task checklists, automatic focus/rest timers, a two-hour revision session, progress metrics, daily reflections, and browser-local persistence.

## Run locally
1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. In the terminal run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the localhost URL printed by Vite.

## Notes
- Progress is stored in this browser using localStorage; it is not synced between devices.
- Keep the app open for the most reliable timer experience. The timer uses timestamps, so it recalculates remaining time when the page is active again.
- Daily rollover uses the browser's local date.
