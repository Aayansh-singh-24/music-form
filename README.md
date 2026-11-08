# 🪔 Music Mood Mehfil: Diwali music survey

An anonymous, tap-to-answer survey that collects listening-preference data for a music recommendation ML project.

- **Frontend:** plain HTML, CSS, JavaScript (`public/`)
- **Backend:** Node.js, Express REST API, MVC structure (`src/`)
- **Database:** MongoDB Atlas (via Mongoose)
- The Express server also serves the frontend, so you deploy **one** app.

## Project structure

```
music-form/
├── public/                  ← the website (what visitors see)
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js            ← questions/options are plain lists at the top
├── src/
│   ├── server.js            ← starts DB + server
│   ├── app.js               ← Express setup, security headers, routes
│   ├── config/              ← env.js (settings), db.js (MongoDB connection)
│   ├── routes/              ← URL → controller mapping
│   ├── controllers/         ← the logic for each endpoint
│   ├── models/              ← MongoDB schema (Participant)
│   ├── validators/          ← what a valid response looks like (zod)
│   ├── middleware/          ← validation, rate limiting, error handling
│   └── utils/hash.js        ← scrambles the anonymous id
├── scripts/exportCsv.js     ← `npm run export` → CSV files for your ML work
├── .env.example
└── package.json
```

## 1. Run it on your computer

1. Install Node.js 18 or newer.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and fill it in (see below).
4. Run `npm run dev` and open <http://localhost:3000>.

### MongoDB Atlas setup

1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user (username + strong password).
3. **Network Access** → add an IP address. For local testing choose *Add current IP*. For hosting on Render (see below) you need *Allow access from anywhere* (`0.0.0.0/0`), because free hosts don't have a fixed IP. Use a strong database password.
4. **Connect → Drivers** → copy the connection string into `MONGODB_URI` in `.env`.
   Replace `<db_password>` with your password (URL-encode special characters such as `@` → `%40`) and put a database name before the `?`, for example `.../musicSurvey?retryWrites=true&w=majority`.
5. Generate `HASH_SECRET`:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   ⚠️ Keep it safe and **never change it** after you start collecting data, otherwise returning visitors can no longer be linked to their earlier responses.

## 2. Deploy (recommended: Render, free)

1. Push this folder to a GitHub repository (`.env` is git-ignored, so your secrets stay private).
2. On <https://render.com> → **New → Web Service** → connect the repo.
3. Settings: **Runtime** Node · **Build command** `npm install` · **Start command** `npm start` · **Instance type** Free.
4. Under **Environment** add: `MONGODB_URI`, `HASH_SECRET`, `NODE_ENV=production`.
5. Deploy. Your survey is live at `https://<your-service>.onrender.com`.

**Good to know about the free plan:** the app goes to sleep after about 15 minutes without visitors, and the next visitor waits roughly a minute while it wakes up. To avoid that while you're collecting responses, create a free monitor on a service such as <https://cron-job.org> or UptimeRobot that opens `https://<your-service>.onrender.com/api/health` every 10 minutes.

Other easy hosts that work the same way: Railway, Koyeb, Fly.io.

## 3. Getting your data

- Browse it in Atlas: **Browse Collections → participants**.
- Or export CSVs: `npm run export` (needs the same `.env`). It writes `exports/responses.csv` (one row per submitted form) and `exports/mood_song_pairs.csv` (one row per mood/activity → song answer).

### How a response is stored

One document per anonymous person; each new form they submit is added to their `submissions` array:

```json
{
  "anonId": "9f2c…(scrambled)",
  "submissionCount": 2,
  "submissions": [
    {
      "gender": { "choice": "Female", "other": "" },
      "moodActivities": [{ "label": "Studying", "isCustom": false, "song": "Lofi beats" }],
      "comfortSongs": ["Tum Hi Ho"],
      "listeningTimes": { "selected": ["Night (8 pm–12)"], "other": [] },
      "platformIssues": { "selected": ["Same songs keep repeating"], "other": [] },
      "idealRecs": { "selected": ["Based on my mood"], "other": [] },
      "suggestion": "…",
      "submittedAt": "2026-11-07T09:08:07.635Z"
    }
  ]
}
```

## How anonymity works

- No name, phone, email or login is ever asked for. IP addresses are not stored in the database.
- The visitor's browser creates a random code and keeps it in `localStorage`. The server scrambles it (HMAC-SHA256 with your `HASH_SECRET`) before saving, so the database never holds the raw code.
- Same browser → same scrambled id → responses are grouped together. Clearing browser data, private mode or another device creates a new id.

## Security included (kept simple)

- `helmet`: security headers and a strict Content-Security-Policy.
- Every input is validated and cleaned with `zod` (types, lengths, max list sizes, unknown fields dropped); this also blocks NoSQL-injection attempts.
- Request size limit (20 KB), rate limiting (per IP), and a cap of 25 stored responses per anonymous person.
- Hidden honeypot field to quietly drop simple bots.
- Secrets live in environment variables; generic error messages for visitors, details only in server logs.
- The frontend only ever uses `textContent` (never `innerHTML`), so typed text can't run as code.

> If you later build a page that **displays** the typed answers, escape them as HTML first. They are stored exactly as typed.

## Customising

- **Questions / options:** edit the lists at the top of `public/js/app.js`.
- **Colours:** the variables at the top of `public/css/styles.css`.
- **Title / privacy text:** `public/index.html`.
- **Submission limits:** `SUBMIT_LIMIT_PER_15_MIN` in `.env` and `maxSubmissionsPerParticipant` in `src/config/env.js`.
