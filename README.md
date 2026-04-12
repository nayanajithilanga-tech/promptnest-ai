# PromptNest AI v2.0 — Real OpenAI-Powered Content Creator Tools

A production-ready AI web application with 11 tools + full AI chat, powered by OpenAI GPT-4o.

---

## 📁 Project Structure

```
promptnest-ai/
├── server.js          ← Node.js + Express backend (handles OpenAI API securely)
├── package.json       ← Dependencies
├── README.md          ← This file
└── public/
    └── index.html     ← Frontend (put index.html inside a /public folder)
```

**IMPORTANT:** Move `index.html` into a folder called `public/` next to `server.js`.

---

## ✅ Prerequisites

- **Node.js** v18 or higher — https://nodejs.org
- An **OpenAI API key** — https://platform.openai.com/api-keys

---

## 🚀 Quick Start (5 minutes)

### Step 1 — Set up the project folder

```bash
mkdir promptnest-ai
cd promptnest-ai
```

Place `server.js` and `package.json` here.  
Create a `public/` subfolder and place `index.html` inside it:

```
promptnest-ai/
├── server.js
├── package.json
└── public/
    └── index.html
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs `express` and `cors` (takes ~10 seconds).

### Step 3 — Set your OpenAI API key

**Mac / Linux:**
```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=sk-your-api-key-here
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-your-api-key-here"
```

> ⚠️ Never hardcode your API key in any file. Always use environment variables.

### Step 4 — Start the server

```bash
node server.js
```

You should see:
```
✅ PromptNest AI server running at http://localhost:3000
   OpenAI key: ✅ Set
   Model: gpt-4o-mini
```

### Step 5 — Open your browser

Go to: **http://localhost:3000**

That's it! 🎉

---

## 🛠 Tools Available

| Tool | What It Does |
|------|-------------|
| YouTube Title Generator | 10 SEO + CTR optimized titles |
| YouTube Description Writer | Full descriptions with chapters & hashtags |
| Instagram Caption Generator | 5 caption styles with hashtag strategy |
| TikTok Hook Generator | 10 viral opening hooks |
| Blog Post Outline | Full SEO outline with H2/H3 structure |
| Hashtag Strategy Generator | 30 hashtags across 3 tiers |
| LinkedIn Post Writer | Thought leadership posts |
| TikTok Caption Writer | Captions + hashtags + posting tips |
| Resume Bullet Points | ATS-optimized achievement bullets |
| Email Writer | Full emails + subject lines + follow-up |
| Instagram Bio Creator | 5 bio variations with keyword strategy |
| AI Chat | Full conversational AI assistant |

---

## 🌐 Deploying Online

### Option A: Railway (recommended — easiest)
1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variable: `OPENAI_API_KEY=sk-...`
4. Done — Railway handles everything

### Option B: Render
1. Push to GitHub
2. New Web Service on https://render.com
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add `OPENAI_API_KEY` in Environment settings

### Option C: VPS (DigitalOcean, Linode, etc.)
```bash
# On your server
git clone your-repo
cd promptnest-ai
npm install
export OPENAI_API_KEY=sk-...
node server.js
# Use PM2 for production: pm2 start server.js
```

---

## 💡 Tips

- **Model**: Uses `gpt-4o-mini` (fast + affordable). Change to `gpt-4o` in server.js for higher quality.
- **Costs**: gpt-4o-mini costs ~$0.00015 per 1K tokens input. Average tool use ≈ $0.001-0.003.
- **Rate limits**: OpenAI rate limits apply to your API key tier.
- **Dev mode**: Use `npm run dev` with nodemon for auto-restart during development.

---

## 🔒 Security Notes

- The OpenAI API key is ONLY on the server — never exposed to the browser
- All API calls go through your backend, not directly from the frontend
- Input validation is handled server-side
- Use HTTPS in production (Railway/Render provide this automatically)

---

Created by Dilshan Nayanajith Ilangasinghe · PromptNest AI v2.0
