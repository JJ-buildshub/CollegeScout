"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Compass, Mic, Send, Volume2, VolumeX, X } from "lucide-react";

/**
 * Scout, the talking guide. Speech-to-text and the voice both come from the
 * browser (the Web Speech API), so no audio leaves the student's device: only
 * the recognized text is sent to /api/scout, and neither end stores it.
 * Where the browser has no speech recognition (Firefox), the mic button is
 * hidden and Scout works by typing; captions are always shown.
 */

type Card = { kind: "college" | "scholarship"; id: string; name: string; href: string };
type Turn = { role: "user" | "assistant"; content: string; cards?: Card[] };

const GREETING: Turn = {
  role: "assistant",
  content:
    "Hi, I'm Scout! Ask me about colleges or scholarships. Try: what scholarships can I go for in 10th grade?",
};

const VOICE_KEY = "collegescout.scout.voice";

// The Web Speech API's recognition interface is not in TypeScript's DOM types,
// and Chrome and Safari still ship it under a webkit prefix.
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  // Prefer a natural-sounding English voice where the device has one.
  const preferred =
    voices.find((voice) => voice.lang.startsWith("en") && /natural|neural|samantha|google us/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.startsWith("en-US"));
  if (preferred) utterance.voice = preferred;
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

export default function ScoutChat() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [canListen, setCanListen] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef("");

  useEffect(() => {
    setCanListen(recognitionConstructor() !== null);
    try {
      setVoiceOn(window.localStorage.getItem(VOICE_KEY) !== "off");
    } catch {
      // storage blocked: voice stays on
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns, busy, open]);

  // Stop talking and listening when the panel closes.
  useEffect(() => {
    if (!open) {
      recognition.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    }
  }, [open]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) window.speechSynthesis?.cancel();
    try {
      window.localStorage.setItem(VOICE_KEY, next ? "on" : "off");
    } catch {
      // storage blocked: setting lasts this visit only
    }
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    window.speechSynthesis?.cancel();
    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setDraft("");
    draftRef.current = "";
    setBusy(true);
    try {
      const response = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = (await response.json().catch(() => null)) as { reply?: string; cards?: Card[] } | null;
      const answer = data?.reply || "Something went wrong on my end. Try again in a moment.";
      setTurns((current) => [...current, { role: "assistant", content: answer, cards: data?.cards ?? [] }]);
      if (voiceOn) speak(answer);
    } catch {
      setTurns((current) => [
        ...current,
        { role: "assistant", content: "I couldn't reach the internet just now. Check your connection and try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const listen = () => {
    const Constructor = recognitionConstructor();
    if (!Constructor || busy) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    window.speechSynthesis?.cancel();
    const rec = new Constructor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      draftRef.current = transcript;
      setDraft(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      // Send what was heard as soon as the student stops talking.
      if (draftRef.current.trim()) void send(draftRef.current);
    };
    recognition.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-navy-900 py-3 pl-3 pr-5 text-sm font-bold text-white shadow-cardHover hover:bg-navy-800"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400 text-navy-950">
            <Compass className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          Ask Scout
        </button>
      )}

      {open && (
        <section
          aria-label="Chat with Scout"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(640px,calc(100vh-6rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-cardHover sm:inset-x-auto sm:right-5 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 bg-navy-900 px-4 py-3 text-white">
            <span
              className={clsx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400 text-navy-950",
                busy && "animate-pulse"
              )}
            >
              <Compass className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold leading-none">Scout</p>
              <p className="mt-0.5 text-xs text-white/70">Your CollegeScout guide</p>
            </div>
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceOn ? "Turn Scout's voice off" : "Turn Scout's voice on"}
              aria-pressed={voiceOn}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Scout"
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-sand-50 px-4 py-4" aria-live="polite">
            {turns.map((turn, i) => (
              <div key={i} className={clsx("flex", turn.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    turn.role === "user" ? "bg-navy-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                  )}
                >
                  {turn.content}
                  {turn.cards && turn.cards.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {turn.cards.map((card) => (
                        <Link
                          key={card.id}
                          href={card.href}
                          className="rounded-xl bg-sand-50 px-3 py-2 text-xs font-bold text-navy-900 ring-1 ring-slate-200 hover:bg-sand-100"
                        >
                          {card.kind === "college" ? "College: " : "Scholarship: "}
                          {card.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3.5 py-2.5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Scout is looking that up…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
            className="border-t border-slate-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              {canListen && (
                <button
                  type="button"
                  onClick={listen}
                  disabled={busy}
                  aria-label={listening ? "Stop listening" : "Talk to Scout"}
                  aria-pressed={listening}
                  className={clsx(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
                    listening ? "animate-pulse bg-gold-400 text-navy-950" : "bg-navy-900 text-gold-400 hover:bg-navy-800"
                  )}
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
              <input
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  draftRef.current = event.target.value;
                }}
                maxLength={600}
                placeholder={listening ? "Listening…" : "Ask Scout anything about college"}
                aria-label="Message Scout"
                className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400 text-navy-950 hover:bg-gold-300 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Scout doesn&apos;t save what you say or type. Answers come from CollegeScout&apos;s data; check official
              pages before you apply.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
