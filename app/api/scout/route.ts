import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SCOUT_TOOLS, runScoutTool, type ScoutCard } from "@/lib/scoutTools";

/**
 * Scout, the site's guide. The browser sends the conversation so far (text
 * only); this route asks Claude, lets it look things up with the read-only
 * tools in lib/scoutTools.ts, and returns the reply plus links to whatever it
 * looked up. Nothing is stored: no conversation, no audio, no IP log.
 *
 * Needs ANTHROPIC_API_KEY in the environment. SCOUT_MODEL picks the model
 * (default claude-opus-5-5); a spending limit belongs on the Anthropic account,
 * since the per-visitor limits below live in one server instance's memory and
 * reset whenever Vercel starts a new one.
 */
export const runtime = "nodejs";

const MODEL = process.env.SCOUT_MODEL || "claude-opus-5-5";
const MAX_MESSAGES = 20;
const MAX_CHARS = 600;
const MAX_TOOL_ROUNDS = 5;
const PER_VISITOR_PER_DAY = 40;
const PER_INSTANCE_PER_DAY = 3000;

const SYSTEM = `You are Scout, the guide on CollegeScout, a free college research site for US high school students built by a high school student. Students talk to you by voice, and your replies are read aloud.

How you talk:
- Upbeat and excited to help, like a friendly older teen who just went through all this and loves sharing what they found. Short, energetic openers are fine ("Ooh, good one!", "Okay, so here's the cool part"), but keep it natural: no heavy slang, no forced trends, never babyish or condescending.
- Short: usually two to four sentences. Your words are spoken, so no lists, tables, markdown, links, emoji or URLs. Say numbers the way a person would ("about 1 in 4 get in").
- The colleges and scholarships you look up appear as links under your reply, so you can say "I've put them below" instead of reading out every detail.
- Ask one short follow-up question when it would help, such as their grade or what they want to study.

What you know:
- Only what your tools return from CollegeScout's own data. Look things up before stating any fact about a college or scholarship: admit rates, costs, deadlines, amounts, rules. Never fill gaps from memory.
- If a tool says something is not confirmed, say it isn't confirmed and suggest checking the official page.
- Never predict whether a student will get in or win anything. You can say how selective a school is.
- If you can't find something, say so and suggest Explore Colleges, My Fit, My Plan or the Scholarships page.

Staying safe:
- Stick to colleges, scholarships, applications and planning for them. Politely steer anything else back.
- Don't ask for personal details such as full name, address, school name, email or phone. A grade, interests and a ZIP code are enough, and only if they offer.
- If a student mentions being in danger, self-harm or abuse, tell them kindly to talk to a trusted adult right away, and that in the US they can call or text 988 any time. Then stop giving college advice for that turn.`;

const client = new Anthropic();

const visitorCounts = new Map<string, number>();
let countsDay = new Date().toDateString();
let instanceCount = 0;

/** Counts a request against the per-visitor and per-instance daily limits. Returns false when over. */
function allow(visitor: string): boolean {
  const today = new Date().toDateString();
  if (today !== countsDay) {
    visitorCounts.clear();
    instanceCount = 0;
    countsDay = today;
  }
  const used = visitorCounts.get(visitor) ?? 0;
  if (used >= PER_VISITOR_PER_DAY || instanceCount >= PER_INSTANCE_PER_DAY) return false;
  visitorCounts.set(visitor, used + 1);
  instanceCount += 1;
  return true;
}

type ChatTurn = { role: "user" | "assistant"; content: string };

/** The browser's conversation, trimmed and checked. Null when it is not a usable conversation. */
function readTurns(body: unknown): ChatTurn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const turns: ChatTurn[] = [];
  for (const item of raw.slice(-MAX_MESSAGES)) {
    const role = (item as { role?: unknown })?.role;
    const content = (item as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, role === "user" ? MAX_CHARS : 2000);
    if (text) turns.push({ role, content: text });
  }
  // The API needs the conversation to start and end with the student.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

const reply = (text: string, cards: ScoutCard[] = [], status = 200) => NextResponse.json({ reply: text, cards }, { status });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return reply("I'm not switched on yet. Check back soon!", [], 503);
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(visitor)) {
    return reply(
      "We've talked a lot today, so I need a break. You can keep exploring with the Scholarships page and Explore Colleges, and I'll be back tomorrow.",
      [],
      429
    );
  }

  const turns = readTurns(await request.json().catch(() => null));
  if (!turns) return reply("Sorry, I didn't catch that. Could you say it again?", [], 400);

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((turn) => ({ role: turn.role, content: turn.content }));
  const cards: ScoutCard[] = [];

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        // Short spoken answers over a fixed toolset: low effort keeps replies quick and cheap.
        output_config: { effort: "low" },
        // The system prompt and tools never change, so they are cached across visitors.
        cache_control: { type: "ephemeral" },
        system: SYSTEM,
        tools: SCOUT_TOOLS,
        messages,
        // If the model declines on a safety classifier, the API retries on a fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });

      if (response.stop_reason === "refusal") {
        return reply("That's not something I can help with, but I'm happy to talk colleges or scholarships.");
      }

      const toolUses = response.content.filter(
        (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use"
      );
      if (response.stop_reason !== "tool_use" || toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
        const text = response.content
          .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
          .map((block) => block.text)
          .join(" ")
          .trim();
        // Only offer links to what the reply actually talks about.
        const mentioned = cards.filter(
          (card, i) => cards.findIndex((other) => other.id === card.id) === i && text.includes(card.name.split(" (")[0])
        );
        return reply(text || "Hmm, I lost my train of thought. Could you ask that again?", mentioned.slice(0, 6));
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: toolUses.map((tool) => ({
          type: "tool_result" as const,
          tool_use_id: tool.id,
          content: runScoutTool(tool.name, tool.input, cards),
        })),
      });
    }
    return reply("Hmm, I lost my train of thought. Could you ask that again?");
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return reply("Lots of people are talking to me right now. Give me a minute and try again.", [], 429);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Scout API error", error.status, error.message);
      return reply("Something went wrong on my end. Try again in a moment.", [], 502);
    }
    throw error;
  }
}
