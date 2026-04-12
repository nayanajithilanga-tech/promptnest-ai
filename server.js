// ============================================================
// PromptNest AI — Backend Server
// Node.js + Express + OpenAI API
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

// ── OpenAI Key (set via env var — never hardcode!) ──────────
// Before running, set your key:
//   Windows:  set OPENAI_API_KEY=sk-...
//   Mac/Linux: export OPENAI_API_KEY=sk-...
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: OPENAI_API_KEY environment variable is not set.");
  console.warn("   Set it before starting the server:");
  console.warn("   export OPENAI_API_KEY=sk-your-key-here");
}

// ── System prompts per tool ───────────────────────────────────
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

  chat: `You are PromptNest AI — a powerful, versatile AI assistant designed to help content creators, marketers, entrepreneurs, and professionals get more done.
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

// ── OpenAI API helper ─────────────────────────────────────────
async function callOpenAI(systemPrompt, userMessage, maxTokens = 1200) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.2
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── Routes ────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!OPENAI_API_KEY,
    model: "gpt-4o-mini",
    timestamp: new Date().toISOString()
  });
});

// Main generation endpoint
app.post("/api/generate", async (req, res) => {
  const { tool, inputs } = req.body;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OpenAI API key not configured. Set OPENAI_API_KEY environment variable on the server."
    });
  }

  if (!tool || !inputs) {
    return res.status(400).json({ error: "Missing 'tool' or 'inputs' in request body." });
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

    case "chat":
    default:
      userMessage = inputs.message || inputs.topic || "";
      break;
  }

  try {
    const result = await callOpenAI(systemPrompt, userMessage, tool === "blog_outline" ? 2000 : 1400);
    res.json({ result, tool, model: "gpt-4o-mini" });
  } catch (err) {
    console.error(`[Generate Error] Tool: ${tool}`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint (streaming-ready, kept simple for compatibility)
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured on server." });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing 'messages' array." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: TOOL_SYSTEM_PROMPTS.chat },
          ...messages
        ],
        max_tokens: 1500,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI error");
    }

    const data = await response.json();
    res.json({ result: data.choices[0].message.content, model: "gpt-4o-mini" });
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
  console.log(`   OpenAI key: ${OPENAI_API_KEY ? "✅ Set" : "❌ NOT SET — set OPENAI_API_KEY env var"}`);
  console.log(`   Model: gpt-4o-mini\n`);
});
