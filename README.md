# Yalla Fourth

Padel matchmaking for the UAE. Players find others at their own skill level and
either join an open match or create their own. No court booking, no payments.

Built with the MERN stack: **MongoDB Atlas · Express · React (Vite) · Node.js**.

## Project layout

```
yalla-fourth-app/
├── client/   React + Vite frontend
└── server/   Node + Express API (also serves the built client in production)
```

## Run locally (development)

Two terminals from the `yalla-fourth-app` folder:

```bash
# 1) API server on http://localhost:5000
npm run install:server
npm run dev:server

# 2) React app on http://localhost:5173  (proxies /api to the server)
npm run install:client
npm run dev:client
```

Open http://localhost:5173.

## Production build (what Render runs)

```bash
npm run build   # installs everything and builds client/dist
npm start       # Express serves the API + the built React app on one port
```

Render settings:

- Build command: `npm run build`
- Start command: `npm start`
- Environment: `NODE_ENV=production` (plus `MONGODB_URI` and `JWT_SECRET`
  once those stages land)

The database stays on the MongoDB Atlas free tier throughout. The Render web
service starts on the free tier and can later be switched to the cheap
always-on tier with no code changes.
```
