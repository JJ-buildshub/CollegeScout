"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award, ScanSearch, Volume2, VolumeX, X } from "lucide-react";
import ScoutCartoon, { type ScoutMood } from "./ScoutCartoon";

/**
 * Scout, the talking guide: tap the cartoon, ask out loud, hear the answer.
 * There is deliberately no text box. Speech-to-text and the voice both come
 * from the browser (the Web Speech API), so no audio leaves the device: only
 * the recognized words are sent to /api/scout, and neither end stores them.
 * Where the browser can't listen (Firefox) or the microphone is blocked, Scout
 * says so and points to the browse-it-yourself buttons, which always show.
 */

type Card = { kind: "college" | "scholarship"; id: string; name: string; href: string };
type Turn = { role: "user" | "assistant"; content: string };

const HELLO = "Hey, I'm Scout! Tap me and ask me anything about colleges or scholarships.";
const NO_EARS =
  "My ears don't work in this browser. Try Chrome, Edge or Safari, or explore on your own with the buttons below!";
const MIC_BLOCKED =
  "I can't hear you, because the microphone is blocked. Allow it in your browser settings, or explore on your own below.";
const DIDNT_CATCH = "Hmm, I didn't catch that. Tap me and try again!";

const VOICE_KEY = "collegescout.scout.voice";

// The Web Speech API's recognition interface is not in TypeScript's DOM types,
// and Chrome and Safari still ship it under a webkit prefix.
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// The brightest, most natural-sounding young voices each platform ships, best
// first: Edge's online "Natural" voices, then Chrome's, then Apple's. Browser
// voices are adult voices; these are the youngest-sounding of them.
const VOICE_PREFERENCE = [
  /Ava.*Natural/i, // Edge
  /Emma.*Natural/i, // Edge
  /Jenny.*Natural/i, // Edge
  /Aria.*Natural/i, // Edge
  /Google US English/i, // Chrome
  /Samantha/i, // Safari, iPhone and Mac
  /Zira/i, // Windows offline
];

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
  for (const pattern of VOICE_PREFERENCE) {
    const match = voices.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }
  return voices.find((voice) => voice.lang === "en-US") ?? voices[0];
}

/**
 * Scout's voice: a natural voice, lifted a little and a touch quick so it
 * sounds young and upbeat. Natural voices distort if pushed much further than
 * this, so the excitement mostly comes from Scout's wording.
 */
function makeUtterance(text: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  const natural = Boolean(voice && /natural|google/i.test(voice.name));
  utterance.pitch = natural ? 1.1 : 1.2;
  utterance.rate = 1.06;
  return utterance;
}

export default function ScoutChat() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<ScoutMood>("idle");
  const [bubble, setBubble] = useState(HELLO);
  const [heard, setHeard] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [voiceOn, setVoiceOn] = useState(true);
  const turns = useRef<Turn[]>([]);
  const recognition = useRef<Recognition | null>(null);
  const transcript = useRef("");

  useEffect(() => {
    // Chrome loads its voice list after the page; asking once warms it up.
    window.speechSynthesis?.getVoices();
    try {
      setVoiceOn(window.localStorage.getItem(VOICE_KEY) !== "off");
    } catch {
      // storage blocked: voice stays on
    }
  }, []);

  const stopEverything = useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!open) {
      stopEverything();
      setMood("idle");
    }
  }, [open, stopEverything]);

  /** Shows `text` in the bubble and, with the voice on, says it with a moving mouth. */
  const say = useCallback(
    (text: string) => {
      setBubble(text);
      if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) {
        setMood("idle");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = makeUtterance(text);
      utterance.onstart = () => setMood("talking");
      utterance.onend = () => setMood("idle");
      utterance.onerror = () => setMood("idle");
      setMood("talking");
      window.speechSynthesis.speak(utterance);
    },
    [voiceOn]
  );

  const ask = useCallback(
    async (question: string) => {
      setHeard(question);
      setCards([]);
      setMood("thinking");
      setBubble("Let me look that up…");
      turns.current = [...turns.current, { role: "user" as const, content: question }].slice(-20);
      try {
        const response = await fetch("/api/scout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: turns.current }),
        });
        const data = (await response.json().catch(() => null)) as { reply?: string; cards?: Card[] } | null;
        const answer = data?.reply || "Something went wrong on my end. Tap me and try again in a moment.";
        if (response.ok) turns.current = [...turns.current, { role: "assistant" as const, content: answer }];
        setCards(data?.cards ?? []);
        say(answer);
      } catch {
        say("I couldn't reach the internet just now. Check your connection and tap me again.");
      }
    },
    [say]
  );

  const listen = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      say(NO_EARS);
      return;
    }
    window.speechSynthesis?.cancel();
    transcript.current = "";
    setHeard("");
    setCards([]);
    const rec = new Constructor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      transcript.current = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setHeard(transcript.current);
    };
    rec.onerror = (event) => {
      recognition.current = null;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") say(MIC_BLOCKED);
      else if (event.error !== "aborted") say(DIDNT_CATCH);
    };
    rec.onend = () => {
      if (recognition.current !== rec) return; // stopped by an error or by closing
      recognition.current = null;
      const question = transcript.current.trim();
      if (question) void ask(question);
      else say(DIDNT_CATCH);
    };
    recognition.current = rec;
    setMood("listening");
    setBubble("I'm listening…");
    rec.start();
  }, [ask, say]);

  /** One tap does the obvious thing for the current mood. */
  const tapScout = () => {
    if (mood === "thinking") return;
    if (mood === "listening") {
      recognition.current?.stop(); // onend sends what was heard
      return;
    }
    if (mood === "talking") {
      window.speechSynthesis?.cancel();
      setMood("idle");
      return;
    }
    listen();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) {
      window.speechSynthesis?.cancel();
      if (mood === "talking") setMood("idle");
    }
    try {
      window.localStorage.setItem(VOICE_KEY, next ? "on" : "off");
    } catch {
      // storage blocked: setting lasts this visit only
    }
  };

  const hint =
    mood === "listening"
      ? "Listening. Tap Scout when you're done."
      : mood === "thinking"
        ? "Looking it up…"
        : mood === "talking"
          ? "Tap Scout to stop talking"
          : "Tap Scout to talk";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Talk to Scout, your CollegeScout guide"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full bg-navy-900 py-1.5 pl-1.5 pr-5 text-sm font-bold text-white shadow-cardHover hover:bg-navy-800"
        >
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-sand-100">
            <ScoutCartoon mood="idle" size={52} />
          </span>
          Ask Scout
        </button>
      )}

      {open && (
        <section
          aria-label="Scout, your CollegeScout guide"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100vh-5rem)] flex-col items-center overflow-y-auto rounded-3xl border border-slate-200 bg-sand-50 px-5 pb-5 pt-3 shadow-cardHover sm:inset-x-auto sm:right-5 sm:w-[380px]"
        >
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceOn ? "Turn Scout's voice off" : "Turn Scout's voice on"}
              aria-pressed={voiceOn}
              className="rounded-full p-2 text-slate-500 hover:bg-sand-100 hover:text-navy-900"
            >
              {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <p className="font-display text-lg font-extrabold text-navy-900">Scout</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Scout"
              className="rounded-full p-2 text-slate-500 hover:bg-sand-100 hover:text-navy-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-center text-[15px] leading-relaxed text-navy-900 ring-1 ring-slate-200"
            aria-live="polite"
          >
            {bubble}
          </div>
          {heard && mood !== "listening" && (
            <p className="mt-2 text-center text-xs italic text-slate-500">You asked: &ldquo;{heard}&rdquo;</p>
          )}
          {heard && mood === "listening" && (
            <p className="mt-2 text-center text-xs italic text-slate-500">&ldquo;{heard}&rdquo;</p>
          )}

          <button
            type="button"
            onClick={tapScout}
            aria-label={hint}
            className="mt-2 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-400"
          >
            <ScoutCartoon mood={mood} size={190} />
          </button>
          <p className="text-sm font-semibold text-slate-600">{hint}</p>

          {cards.length > 0 && (
            <div className="mt-3 flex w-full flex-col gap-1.5">
              {cards.map((card) => (
                <Link
                  key={card.id}
                  href={card.href}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-sand-100"
                >
                  {card.kind === "college" ? "College: " : "Scholarship: "}
                  {card.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex w-full flex-wrap justify-center gap-2 border-t border-slate-200 pt-4">
            <Link
              href="/directory"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-slate-200 hover:bg-sand-100"
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              Explore colleges myself
            </Link>
            <Link
              href="/scholarships"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-slate-200 hover:bg-sand-100"
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              Browse scholarships myself
            </Link>
          </div>
          <p className="mt-3 text-center text-[11px] leading-snug text-slate-400">
            Scout doesn&apos;t save what you say. Answers come from CollegeScout&apos;s data; check official pages
            before you apply.
          </p>
        </section>
      )}
    </>
  );
}
