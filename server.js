// ============================================================
// PromptNest AI — Backend Server
// Node.js + Express + Anthropic Claude API
// Run: node server.js
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Simple In-Memory Rate Limiter ─────────────────────────────
// Limits each IP to 30 requests per 15 minutes
const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  // Remove timestamps outside current window
  const timestamps = rateLimitMap.get(ip).filter(t => t > windowStart);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length > RATE_LIMIT) {
    return res.status(429).json({
      error: "Too many requests. Please wait a few minutes and try again."
    });
  }

  next();
}

// Clean up old entries every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const fresh = timestamps.filter(t => t > cutoff);
    if (fresh.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, fresh);
  }
}, 30 * 60 * 1000);

// ── Anthropic API Key ─────────────────────────────────────────
// Set before running:
//   Windows:  set ANTHROPIC_API_KEY=sk-ant-...
//   Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-...
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

if (!ANTHROPIC_API_KEY) {
  console.warn("⚠️  WARNING: ANTHROPIC_API_KEY environment variable is not set.");
  console.warn("   Get your key at: https://console.anthropic.com");
  console.warn("   Then run: export ANTHROPIC_API_KEY=sk-ant-your-key-here");
}

// ── System Prompts Per Tool ───────────────────────────────────
const TOOL_SYSTEM_PROMPTS = {
  youtube_title: `You are an expert YouTube SEO and content strategist with 10+ years of experience growing channels.
Generate 10 highly clickable, SEO-optimized YouTube video titles.
Rules:
- Mix curiosity gaps, numbers, power words, and emotional triggers
- Include titles optimized for search AND for click-through rate
- Vary formats: listicles, how-tos, questions, bold statements
- Keep each under 70 characters when possible
- Label each with its type: [CTR], [SEO], [Curiosity], [Story], etc.
- End with 3 power words the user should consider using
Format clearly with numbered list.`,

  youtube_description: `You are a YouTube SEO expert who writes descriptions that rank and convert.
Write a complete YouTube video description (400-600 words) that:
- Opens with a strong hook paragraph (first 2 lines visible before "Show more")
- Contains natural keyword placement throughout
- Includes chapters/timestamps section (use placeholder times)
- Has a clear CTA section (subscribe, like, comment prompt)
- Adds relevant links section placeholder
- Closes with SEO hashtags (10-15 relevant tags)
Make it feel human, engaging, and platform-native.`,

  instagram_caption: `You are a top Instagram content strategist and copywriter.
Generate 5 distinct Instagram caption variations for the given topic.
Each variation should:
- Open with a scroll-stopping first line (no emoji at start unless it adds impact)
- Be 100-300 words
- Include storytelling, value, or entertainment
- End with a strong CTA (question, poll prompt, or action)
- Include 20-25 relevant hashtags grouped by volume (broad/niche/micro)
Label each: [Storytelling], [Educational], [Motivational], [Relatable], [Bold]`,

  tiktok_hook: `You are a viral TikTok strategist who has helped creators get millions of views.
Generate 10 powerful TikTok video hooks for the given topic.
Each hook should:
- Be 1-2 sentences (what you'd say in the first 3 seconds)
- Create immediate curiosity, shock, or relatability
- Use pattern interrupts, bold claims, or emotional triggers
- Be conversational and native to TikTok's tone
Format: numbered list with a [type] label.
Then provide: Top Pick + Why It Works + Optimal Video Length + Trending Sound Suggestion.`,

  blog_outline: `You are a professional content strategist and SEO copywriter.
Create a comprehensive, publication-ready blog post outline for the given topic.
Include:
1. SEO-optimized title (primary) + 3 alternative titles
2. Meta description (155 chars max)
3. Target keywords (primary + 5 LSI keywords)
4. Full outline with H2 and H3 headings
5. Key points to cover under each section
6. Suggested word count per section
7. Internal/external link opportunities
8. Call-to-action recommendation
9. Estimated total word count
Make it thorough enough that a writer could produce the full article from this outline alone.`,

  hashtag_generator: `You are a social media growth expert specializing in hashtag strategy.
Generate a complete hashtag strategy for the given topic and platform.
Provide:
- 10 HIGH-VOLUME hashtags (1M+ posts) with estimated reach
- 10 MID-VOLUME hashtags (100K-1M posts) — sweet spot for discovery
- 10 MICRO hashtags (under 100K) — highest engagement rate
- 3 BRANDED/NICHE hashtags to own
- Optimal number to use per platform (Instagram/TikTok/LinkedIn/Twitter)
- Pro usage tips and shadowban warnings
Format in clear sections. Explain the strategy behind the selection.`,

  linkedin_post: `You are a LinkedIn thought leader ghostwriter who has written posts that got 100K+ impressions.
Write a high-performing LinkedIn post for the given topic/goal.
Structure:
- Hook line (pattern interrupt — no "I'm excited to announce")
- Story or insight (3-5 short paragraphs, each 1-3 lines — LinkedIn whitespace is crucial)
- Key takeaway or lesson
- Engagement CTA (specific question to drive comments)
- 5 strategic hashtags
Also provide: 2 alternative opening hooks to A/B test.
Tone: Professional but human. Confident but not arrogant.`,

  tiktok_caption: `You are a TikTok growth specialist.
Write 5 TikTok caption variations for the given topic.
Each caption should:
- Be 100-150 characters (TikTok sweet spot)
- Include a question or CTA to drive comments
- Use 1-3 relevant emojis naturally
- Feel authentic and platform-native
- Include 5-8 trending hashtags
Also suggest: Best posting time, thumbnail text, and pinned comment idea.`,

  resume_bullet: `You are an elite executive resume writer and career coach.
Generate a complete set of powerful resume content for the given role.
Provide:
1. Professional Summary (3-4 sentences, ATS-optimized)
2. 10 achievement-focused bullet points using the STAR method
   - Start with strong action verbs
   - Include metrics/quantification wherever possible
   - Show impact, not just responsibilities
3. 15 core competency keywords (ATS-friendly)
4. Skills section (technical + soft skills)
5. One-liner elevator pitch version
Format professionally. Make every word earn its place.`,

  email_writer: `You are a world-class email copywriter who specializes in high-converting business emails.
Write a complete email for the given type and context.
Provide:
1. MAIN EMAIL:
   - Subject line (primary) + 2 A/B test alternatives
   - Preview text (90 chars)
   - Full email body (personalized, concise, action-oriented)
   - P.S. line if appropriate
2. FOLLOW-UP: A 3-day follow-up email
3. SUBJECT LINE ANALYSIS: Why these subjects will get opened
Keep it human. No corporate speak. Every sentence must earn its place.`,

  instagram_bio: `You are an Instagram branding expert who has optimized bios for influencers and brands.
Create 5 distinct Instagram bio variations for the given niche/topic.
Each bio should:
- Be under 150 characters
- Clearly communicate who this is for and what value they deliver
- Include a personality hook that makes it memorable
- End with a CTA line (link in bio reference)
- Use emojis strategically (not decoratively)
Label each: [Authority], [Story-Driven], [Niche-Specific], [Minimal], [Personality-Forward]
Also provide: Bio keyword strategy + profile name optimization tip.`,

  business_idea: `You are a world-class entrepreneurship coach, startup strategist, and business model expert.
Generate 5 unique, actionable business ideas for the given niche/interest.
For each idea provide:
1. Business Name (catchy, brandable)
2. One-Line Pitch
3. Target Audience (specific)
4. Revenue Model (how it makes money)
5. Startup Cost Estimate (low/medium/high + rough range)
6. Time to First Revenue
7. Key Competitive Advantage
8. First 3 Action Steps to launch
End with: The #1 Recommended idea and why, plus a "secret weapon" strategy to outcompete.
Be specific, realistic, and inspiring.`,

  chat: `You are PromptNest AI — a powerful, versatile AI assistant powered by Anthropic Claude, designed to help content creators, marketers, entrepreneurs, and professionals get more done.
You excel at:
- Content creation (social media, blogs, scripts, emails)
- Marketing strategy and copywriting
- SEO and growth tactics
- Brainstorming and ideation
- Business and personal advice
- Explaining complex topics simply
Be direct, insightful, and genuinely helpful. Match your tone to the question.
When appropriate, structure responses with headers, bullets, or numbered lists for clarity.
Always aim to give more value than expected.`
};

// ── Anthropic API Helper ──────────────────────────────────────
async function callClaude(systemPrompt, userMessage, maxTokens = 1200) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message ||
      `Anthropic API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  // Claude returns content as an array of blocks
  return data.content.map(block => block.text || "").join("");
}

// ── Routes ────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!ANTHROPIC_API_KEY,
    model: CLAUDE_MODEL,
    timestamp: new Date().toISOString()
  });
});

// Main generation endpoint
app.post("/api/generate", rateLimit, async (req, res) => {
  const { tool, inputs } = req.body;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable on the server."
    });
  }

  if (!tool || !inputs) {
    return res.status(400).json({ error: "Missing 'tool' or 'inputs' in request body." });
  }

  // Input validation — reject overly long inputs
  for (const val of Object.values(inputs)) {
    if (typeof val === "string" && val.length > 1000) {
      return res.status(400).json({ error: "Input too long. Please keep inputs under 1000 characters." });
    }
  }

  const systemPrompt = TOOL_SYSTEM_PROMPTS[tool] || TOOL_SYSTEM_PROMPTS.chat;

  // Build user message based on tool + inputs
  let userMessage = "";
  switch (tool) {
    case "youtube_title":
      userMessage = `Generate YouTube titles for: "${inputs.topic}"
Niche/Style: ${inputs.style || "General"}
Target audience: ${inputs.audience || "General viewers"}`;
      break;

    case "youtube_description":
      userMessage = `Write a YouTube description for: "${inputs.topic}"
Video type: ${inputs.type || "Educational/Informational"}
Channel niche: ${inputs.niche || "General"}`;
      break;

    case "instagram_caption":
      userMessage = `Write Instagram captions for: "${inputs.topic}"
Niche: ${inputs.niche || "Lifestyle/General"}
Tone: ${inputs.tone || "Engaging and authentic"}
CTA goal: ${inputs.cta || "Increase engagement"}`;
      break;

    case "tiktok_hook":
      userMessage = `Generate TikTok hooks for: "${inputs.topic}"
Hook style: ${inputs.style || "Curiosity-driven"}
Video format: ${inputs.format || "Talking head / POV"}`;
      break;

    case "blog_outline":
      userMessage = `Create a blog outline for: "${inputs.topic}"
Target audience: ${inputs.audience || "General readers"}
Blog goal: ${inputs.goal || "Inform and rank on Google"}
Tone: ${inputs.tone || "Professional but accessible"}`;
      break;

    case "hashtag_generator":
      userMessage = `Generate hashtag strategy for: "${inputs.topic}"
Platform: ${inputs.platform || "Instagram"}
Niche: ${inputs.niche || "General"}`;
      break;

    case "linkedin_post":
      userMessage = `Write a LinkedIn post about: "${inputs.topic}"
Goal: ${inputs.goal || "Build thought leadership"}
My background/angle: ${inputs.background || "Professional with real-world experience"}`;
      break;

    case "tiktok_caption":
      userMessage = `Write TikTok captions for: "${inputs.topic}"
Video style: ${inputs.style || "Educational/Entertainment"}
Target: ${inputs.target || "18-35 year olds"}`;
      break;

    case "resume_bullet":
      userMessage = `Create resume content for the role: "${inputs.role}"
Years of experience: ${inputs.experience || "3-5 years"}
Key skills: ${inputs.skills || "Leadership, communication, problem-solving"}
Industry: ${inputs.industry || "General/Corporate"}`;
      break;

    case "email_writer":
      userMessage = `Write a ${inputs.type || "professional"} email.
Context/Purpose: ${inputs.context || inputs.topic}
Recipient: ${inputs.recipient || "Professional contact"}
Desired outcome: ${inputs.outcome || "Get a response or action"}`;
      break;

    case "instagram_bio":
      userMessage = `Create Instagram bio variations for: "${inputs.topic}"
Niche: ${inputs.niche || "Lifestyle/Personal Brand"}
CTA: ${inputs.cta || "Check link in bio"}
Personality: ${inputs.personality || "Authentic and relatable"}`;
      break;

    case "business_idea":
      userMessage = `Generate business ideas for: "${inputs.niche}"
Budget range: ${inputs.budget || "Low (under $1000)"}
Skills/Background: ${inputs.skills || "General / Willing to learn"}
Goal: ${inputs.goal || "Build passive income"}`;
      break;

    case "chat":
    default:
      userMessage = inputs.message || inputs.topic || "";
      break;
  }

  try {
    const maxTokens = ["blog_outline", "business_idea"].includes(tool) ? 2000 : 1400;
    const result = await callClaude(systemPrompt, userMessage, maxTokens);
    res.json({ result, tool, model: CLAUDE_MODEL });
  } catch (err) {
    console.error(`[Generate Error] Tool: ${tool}`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint
app.post("/api/chat", rateLimit, async (req, res) => {
  const { messages } = req.body;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured on server." });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing 'messages' array." });
  }

  // Validate message count
  if (messages.length > 40) {
    return res.status(400).json({ error: "Too many messages in conversation history." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: TOOL_SYSTEM_PROMPTS.chat,
        messages: messages // Already in {role, content} format
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Anthropic API error");
    }

    const data = await response.json();
    const result = data.content.map(block => block.text || "").join("");
    res.json({ result, model: CLAUDE_MODEL });
  } catch (err) {
    console.error("[Chat Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html for all non-API routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ PromptNest AI server running at http://localhost:${PORT}`);
  console.log(`   Anthropic key: ${ANTHROPIC_API_KEY ? "✅ Set" : "❌ NOT SET — set ANTHROPIC_API_KEY env var"}`);
  console.log(`   Model: ${CLAUDE_MODEL}`);
  console.log(`   Rate limit: ${RATE_LIMIT} requests per 15 minutes per IP\n`);
});
