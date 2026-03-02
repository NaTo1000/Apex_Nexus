import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";

// ─── Admin lockout — paths the AI is NEVER allowed to access ─────────────────
const BLOCKED_PATTERNS = [
  /\/admin/i,
  /\/stripe/i,
  /\/payments\/process/i,
  /\/users\/manage/i,
  /\/db\//i,
  /\/config\//i,
  /\/secrets/i,
  /\/env/i,
  /dashboard\.stripe\.com/i,
  /console\.aws/i,
  /cloudflare\.com\/dashboard/i,
  /vercel\.com\/dashboard/i,
  /supabase\.com\/dashboard/i,
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(url));
}

// ─── Safe web fetch for AI ────────────────────────────────────────────────────
async function safeWebFetch(url: string): Promise<{ ok: boolean; text: string; blocked: boolean }> {
  if (isBlockedUrl(url)) {
    return { ok: false, text: "", blocked: true };
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DROPAi-Assistant/1.0 (music production platform)" },
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    // Strip HTML tags for cleaner LLM input
    const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 6000);
    return { ok: res.ok, text: stripped, blocked: false };
  } catch {
    return { ok: false, text: "", blocked: false };
  }
}

// ─── DuckDuckGo instant answer search (no API key required) ──────────────────
async function webSearch(query: string): Promise<string> {
  const encoded = encodeURIComponent(query);
  // DuckDuckGo Instant Answer API — free, no key, JSON response
  const ddgUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
  const result = await safeWebFetch(ddgUrl);
  if (!result.ok || !result.text) return "";

  try {
    const data = JSON.parse(result.text);
    const parts: string[] = [];
    if (data.AbstractText) parts.push(`Summary: ${data.AbstractText}`);
    if (data.Answer) parts.push(`Answer: ${data.Answer}`);
    if (data.RelatedTopics?.length) {
      const topics = data.RelatedTopics
        .slice(0, 4)
        .filter((t: any) => t.Text)
        .map((t: any) => `• ${t.Text}`)
        .join("\n");
      if (topics) parts.push(`Related:\n${topics}`);
    }
    return parts.join("\n\n") || "";
  } catch {
    return result.text.slice(0, 2000);
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── DROPAi Personal AI Assistant ─────────────────────────────────────────────
  assistant: router({
    /**
     * Main chat endpoint — supports Min / Max / Full Auto modes.
     * Has internet access for research but is blocked from admin/management URLs.
     */
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().max(2000),
          mode: z.enum(["min", "max", "full_auto"]),
          screen: z.string().optional(),   // current screen context
          trackContext: z.object({         // optional track being worked on
            title: z.string(),
            genre: z.string().optional(),
            bpm: z.number().nullable().optional(),
            masteringStatus: z.string().optional(),
          }).optional(),
          history: z.array(z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })).max(20).optional(),
          allowWebSearch: z.boolean().optional().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const modeDescriptions = {
          min: "You are in MIN mode: provide suggestions and advice only. Never change settings automatically. Always ask the user before doing anything. Keep responses concise and actionable.",
          max: "You are in MAX mode: proactively recommend optimal settings, pre-fill parameters, and guide the user through the best workflow. Explain your reasoning clearly. You can suggest specific values but the user still approves.",
          full_auto: "You are in FULL AUTO mode: autonomously determine the best production settings, mastering chain, and workflow for the current task. Provide a complete action plan with specific parameters. Be decisive and expert-level.",
        };

        // Determine if web search would help this query
        let webContext = "";
        const searchTriggers = ["trend", "chart", "royalt", "rate", "platform", "spotify", "apple music", "youtube", "soundcloud", "beatport", "genre", "release", "industry", "news", "current", "2024", "2025", "2026", "what is", "how much", "price", "cost", "license"];
        const shouldSearch = input.allowWebSearch && searchTriggers.some((t) => input.message.toLowerCase().includes(t));

        if (shouldSearch) {
          const searchQuery = `music production ${input.message.slice(0, 100)}`;
          const searchResult = await webSearch(searchQuery);
          if (searchResult) {
            webContext = `\n\n[Web Research Results]\n${searchResult}\n[End Web Research]`;
          }
        }

        const systemPrompt = `You are DROPAi's personal AI assistant — a world-class music production expert, audio engineer, and music industry professional. You have deep expertise in:
- Studio recording, mixing, and mastering (EQ, compression, limiting, LUFS standards)
- Music theory, songwriting, and arrangement
- Music distribution platforms (Spotify, Apple Music, YouTube, SoundCloud, Beatport, Facebook)
- Music industry business (royalties, licensing, publishing, distribution)
- Live performance, DJ techniques, and real-time audio processing
- Amp simulation, guitar effects, and signal chain design
- AI-assisted music production workflows

${modeDescriptions[input.mode]}

CRITICAL SECURITY RULES — you MUST follow these at all times:
1. You CANNOT access, modify, or suggest accessing any admin console, payment dashboard, database management interface, or system configuration panel.
2. You CANNOT trigger financial transactions, modify user accounts, or change system settings.
3. You CANNOT access Stripe dashboard, Cloudflare dashboard, Vercel dashboard, or any cloud management console.
4. You CAN research music industry information, production techniques, platform specifications, and creative content.
5. You CAN suggest production settings, mastering parameters, creative directions, and workflow improvements.
6. Always be transparent about what you can and cannot do.

Current screen: ${input.screen ?? "home"}
${input.trackContext ? `Current track: "${input.trackContext.title}" (${input.trackContext.genre ?? "unknown genre"}, ${input.trackContext.bpm ?? "unknown"} BPM, mastering: ${input.trackContext.masteringStatus ?? "unmastered"})` : ""}
${webContext}`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...(input.history ?? []),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const content = (response.choices[0]?.message?.content as string) ?? "I couldn't process that request. Please try again.";

        return {
          content,
          mode: input.mode,
          usedWebSearch: shouldSearch && webContext.length > 0,
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * Full Auto mode — AI analyses a track and returns a complete production plan
     * with specific mastering parameters, distribution strategy, and workflow steps.
     */
    autoProducePlan: publicProcedure
      .input(
        z.object({
          trackTitle: z.string(),
          genre: z.string(),
          bpm: z.number().nullable().optional(),
          targetPlatforms: z.array(z.string()).optional(),
          currentLufs: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Research current platform loudness standards
        const platformSearch = await webSearch("Spotify Apple Music YouTube loudness normalization LUFS standards 2025");

        const systemPrompt = `You are a world-class mastering engineer and music production AI. In FULL AUTO mode, you autonomously generate complete, production-ready mastering and distribution plans with specific technical parameters.`;

        const userPrompt = `Generate a complete FULL AUTO production plan for:

Track: "${input.trackTitle}"
Genre: ${input.genre}
BPM: ${input.bpm ?? "unknown"}
Target Platforms: ${input.targetPlatforms?.join(", ") ?? "Spotify, Apple Music, YouTube"}
Current LUFS: ${input.currentLufs ?? "not measured"}

${platformSearch ? `Platform Research:\n${platformSearch}\n` : ""}

Provide a complete JSON production plan:
{
  "masteringChain": {
    "eq": { "lowCut": number, "lowShelf": { "freq": number, "gain": number }, "highShelf": { "freq": number, "gain": number }, "presence": { "freq": number, "gain": number } },
    "compression": { "threshold": number, "ratio": number, "attack": number, "release": number, "makeupGain": number },
    "multibandComp": { "lowBand": { "threshold": number, "ratio": number }, "midBand": { "threshold": number, "ratio": number }, "highBand": { "threshold": number, "ratio": number } },
    "stereoWidth": number,
    "harmonicExciter": number,
    "limiter": { "ceiling": number, "truePeak": number },
    "targetLufs": number
  },
  "distributionStrategy": {
    "primaryPlatform": string,
    "recommendedFormat": string,
    "releaseTiming": string,
    "genreCategory": string,
    "pitchingAdvice": string
  },
  "workflowSteps": [{ "step": number, "action": string, "detail": string }],
  "qualityChecks": [string],
  "estimatedMasteringTime": string,
  "confidenceScore": number
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const raw = (response.choices[0]?.message?.content as string) ?? "{}";
        let plan: any = {};
        try { plan = JSON.parse(raw); } catch {}

        return {
          ...plan,
          trackTitle: input.trackTitle,
          genre: input.genre,
          generatedAt: new Date().toISOString(),
          usedWebResearch: platformSearch.length > 0,
        };
      }),

    /**
     * Research endpoint — AI searches the web for music industry information.
     * Strictly blocked from admin/management URLs.
     */
    research: publicProcedure
      .input(
        z.object({
          query: z.string().max(500),
          category: z.enum(["royalties", "platforms", "production", "trends", "licensing", "general"]),
        })
      )
      .mutation(async ({ input }) => {
        const categoryPrefixes: Record<string, string> = {
          royalties: "music streaming royalty rates per stream",
          platforms: "music distribution platform requirements",
          production: "music production technique studio",
          trends: "music industry trends charts",
          licensing: "music licensing sync rights",
          general: "music industry",
        };

        const searchQuery = `${categoryPrefixes[input.category]} ${input.query}`;
        const searchResult = await webSearch(searchQuery);

        if (!searchResult) {
          return {
            result: "No web results found. Using built-in knowledge.",
            source: "built-in",
            query: input.query,
          };
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a music industry research assistant. Synthesise the provided web search results into a clear, accurate, and actionable summary for a music artist. Be specific with numbers, dates, and platform names. Do not fabricate information not present in the search results.",
            },
            {
              role: "user",
              content: `Research query: "${input.query}"\n\nWeb search results:\n${searchResult}\n\nProvide a clear, factual summary relevant to an independent music artist.`,
            },
          ],
        });

        return {
          result: (response.choices[0]?.message?.content as string) ?? "",
          source: "web_search",
          query: input.query,
          timestamp: new Date().toISOString(),
        };
      }),
  }),

  // ── AI Lyricist Booth ────────────────────────────────────────────────────────
  lyrics: router({
    generate: publicProcedure
      .input(
        z.object({
          genre: z.string(),
          mood: z.string(),
          theme: z.string(),
          structure: z.enum(["verse_chorus_bridge", "aaba", "through_composed", "verse_chorus"]),
          rhymeScheme: z.enum(["ABAB", "AABB", "ABCB", "free_verse"]),
          title: z.string().optional(),
          extraContext: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const structureGuide: Record<string, string> = {
          verse_chorus_bridge: "Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus, Outro",
          aaba: "Section A (8 bars), Section A (8 bars), Section B / Bridge (8 bars), Section A (8 bars)",
          through_composed: "Introduction, Part 1, Part 2, Part 3, Climax, Resolution",
          verse_chorus: "Verse 1, Chorus, Verse 2, Chorus, Verse 3, Final Chorus",
        };

        const rhymeGuide: Record<string, string> = {
          ABAB: "alternating rhyme (lines 1&3 rhyme, lines 2&4 rhyme)",
          AABB: "couplet rhyme (consecutive lines rhyme)",
          ABCB: "ballad rhyme (lines 2&4 rhyme only)",
          free_verse: "no strict rhyme scheme, focus on rhythm and imagery",
        };

        // Research current trends for the genre
        const trendSearch = await webSearch(`${input.genre} music trends lyric themes 2025`);

        const systemPrompt = `You are a master lyricist and songwriter with decades of experience writing hit songs across all genres. You write authentic, emotionally resonant lyrics that feel real and lived-in — never generic or clichéd. You understand music theory, song structure, prosody, and how lyrics sit on a melody.`;

        const userPrompt = `Write a complete, professional song in the following style:

Genre: ${input.genre}
Mood: ${input.mood}
Theme: ${input.theme}
${input.title ? `Working Title: "${input.title}"` : ""}
Song Structure: ${structureGuide[input.structure]}
Rhyme Scheme: ${rhymeGuide[input.rhymeScheme]}
${input.extraContext ? `Additional Context: ${input.extraContext}` : ""}
${trendSearch ? `\nCurrent Genre Context:\n${trendSearch.slice(0, 500)}` : ""}

Write the full lyrics with clear section labels (e.g., [Verse 1], [Pre-Chorus], [Chorus], [Bridge]).
Each section should be 4–8 lines. Make the chorus memorable and anthemic.
The bridge should contrast emotionally with the verses.
Return ONLY the lyrics — no explanations, no commentary.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const lyrics = (response.choices[0]?.message?.content as string) ?? "";

        const sectionRegex = /\[([^\]]+)\]([\s\S]*?)(?=\[|$)/g;
        const sections: Array<{ label: string; content: string }> = [];
        let match;
        while ((match = sectionRegex.exec(lyrics)) !== null) {
          const label = match[1].trim();
          const content = match[2].trim();
          if (content) sections.push({ label, content });
        }

        return {
          fullLyrics: lyrics,
          sections,
          genre: input.genre,
          mood: input.mood,
          theme: input.theme,
          structure: input.structure,
          rhymeScheme: input.rhymeScheme,
          generatedAt: new Date().toISOString(),
        };
      }),

    regenerateSection: publicProcedure
      .input(
        z.object({
          sectionLabel: z.string(),
          currentContent: z.string(),
          genre: z.string(),
          mood: z.string(),
          theme: z.string(),
          instruction: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a master lyricist. Rewrite the given song section while maintaining the genre, mood, and theme. Return ONLY the new lyrics for that section, no labels or explanations.",
            },
            {
              role: "user",
              content: `Rewrite this [${input.sectionLabel}] for a ${input.genre} song with a ${input.mood} mood about "${input.theme}".
${input.instruction ? `Instruction: ${input.instruction}` : "Make it more impactful and memorable."}

Current version:
${input.currentContent}

Return only the new lyrics lines, no section label.`,
            },
          ],
        });

        return {
          content: ((response.choices[0]?.message?.content as string) ?? "").trim(),
        };
      }),
  }),

  // ── Video Clip Generator ─────────────────────────────────────────────────────
  videoConcept: router({
    generate: publicProcedure
      .input(
        z.object({
          trackTitle: z.string(),
          artist: z.string(),
          genre: z.string(),
          mood: z.string(),
          visualStyle: z.enum(["cinematic", "lyric_video", "abstract", "performance", "animated", "documentary"]),
          colorPalette: z.string().optional(),
          scenePrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const styleGuide: Record<string, string> = {
          cinematic: "Cinematic narrative with wide establishing shots, close-ups, dramatic lighting, film grain",
          lyric_video: "Kinetic typography, lyrics animated on screen, abstract backgrounds, bold fonts",
          abstract: "Abstract visuals, particle systems, fluid simulations, geometric patterns, no narrative",
          performance: "Live performance footage, stage lighting, crowd energy, instrument close-ups",
          animated: "2D or 3D animation, character-driven story, stylised art direction",
          documentary: "Real-world footage, interview-style shots, behind-the-scenes aesthetic",
        };

        // Research visual trends for the genre
        const trendSearch = await webSearch(`${input.genre} music video visual trends 2025 aesthetic`);

        const systemPrompt = `You are a world-class music video director and creative director. You create detailed, production-ready video concepts that translate music into compelling visual narratives. Your concepts are specific, achievable, and emotionally resonant.`;

        const userPrompt = `Create a detailed music video concept for:

Track: "${input.trackTitle}" by ${input.artist}
Genre: ${input.genre}
Mood: ${input.mood}
Visual Style: ${styleGuide[input.visualStyle]}
${input.colorPalette ? `Colour Palette: ${input.colorPalette}` : ""}
${input.scenePrompt ? `Scene Direction: ${input.scenePrompt}` : ""}
${trendSearch ? `\nCurrent Visual Trends:\n${trendSearch.slice(0, 400)}` : ""}

Provide a complete video concept in this exact JSON format:
{
  "logline": "One sentence concept summary",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "visualTheme": "Description of overall visual aesthetic",
  "scenes": [
    {
      "number": 1,
      "timestamp": "0:00–0:30",
      "description": "Detailed scene description",
      "cameraWork": "Camera angles and movements",
      "lighting": "Lighting setup and mood",
      "keyVisual": "The single most important visual element in this scene"
    }
  ],
  "productionNotes": "Key technical and creative notes for production",
  "estimatedBudget": "Low / Mid / High budget estimate"
}

Create 5–7 scenes covering the full song structure.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const raw = (response.choices[0]?.message?.content as string) ?? "{}";
        let concept: any = {};
        try { concept = JSON.parse(raw); } catch {}

        return {
          ...concept,
          trackTitle: input.trackTitle,
          artist: input.artist,
          genre: input.genre,
          mood: input.mood,
          visualStyle: input.visualStyle,
          generatedAt: new Date().toISOString(),
        };
      }),

    generateStoryboardFrame: publicProcedure
      .input(
        z.object({
          sceneDescription: z.string(),
          visualStyle: z.string(),
          colorPalette: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { url } = await generateImage({
          prompt: `Music video storyboard frame. ${input.visualStyle} style. ${input.sceneDescription}. ${input.colorPalette ? `Colour palette: ${input.colorPalette}.` : ""} Cinematic composition, professional music video aesthetic, high quality.`,
        });
        return { imageUrl: url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
