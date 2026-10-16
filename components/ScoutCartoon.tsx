/**
 * Scout, drawn. One SVG with four moods driven by `mood`: idle (bobs and
 * blinks), listening (a pulsing ring), thinking (eyes up, thought bubbles) and
 * talking (mouth moves). Chibi proportions (big head, big eyes, small body)
 * keep it friendly at the small size of the launcher button. Hat and badge use
 * the site's navy and gold, so Scout reads as part of CollegeScout.
 */
export type ScoutMood = "idle" | "listening" | "thinking" | "talking";

const SKIN = "#ffd9b0";
const SKIN_SHADE = "#f7b995";
const INK = "#10291c";
const HAT = "#27523a";
const HAT_DARK = "#1a3b29";
const GOLD = "#d6e85c";
const HAIR = "#6b3e26";

export default function ScoutCartoon({ mood, size = 200 }: { mood: ScoutMood; size?: number }) {
  const up = mood === "thinking" ? -4 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <style>{`
        .scout-bob { animation: scout-bob 2.4s ease-in-out infinite; }
        .scout-blink { animation: scout-blink 4s infinite; transform-box: fill-box; transform-origin: center; }
        .scout-ring { animation: scout-ring 1.2s ease-out infinite; transform-origin: 120px 122px; }
        .scout-talk { animation: scout-talk 0.24s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
        .scout-dot { animation: scout-dot 1.2s ease-in-out infinite; }
        .scout-wave { animation: scout-wave 1.6s ease-in-out infinite; transform-origin: 166px 206px; }
        @keyframes scout-bob { 50% { transform: translateY(-4px); } }
        @keyframes scout-blink { 0%, 93%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
        @keyframes scout-ring { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.18); opacity: 0; } }
        @keyframes scout-talk { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        @keyframes scout-dot { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes scout-wave { 0%, 60%, 100% { transform: rotate(0deg); } 20% { transform: rotate(-18deg); } 40% { transform: rotate(10deg); } }
        @media (prefers-reduced-motion: reduce) {
          .scout-bob, .scout-blink, .scout-ring, .scout-talk, .scout-dot, .scout-wave { animation: none; }
        }
      `}</style>

      {mood === "listening" && (
        <circle className="scout-ring" cx="120" cy="122" r="84" fill="none" stroke="#b4c93c" strokeWidth="7" />
      )}

      {/* soft ground shadow, outside the bob so it stays put */}
      <ellipse cx="120" cy="228" rx="44" ry="7" fill={HAT_DARK} opacity="0.18" />

      <g className="scout-bob">
        {/* little body with the compass badge */}
        <rect x="86" y="182" width="68" height="44" rx="22" fill={HAT} />
        <circle cx="120" cy="202" r="9" fill={GOLD} />
        <path d="M120 194.5 L123.5 202 L120 209.5 L116.5 202 Z" fill={INK} />
        {/* hands: the right one waves when Scout is idle */}
        <circle cx="80" cy="204" r="9" fill={SKIN} />
        <circle className={mood === "idle" ? "scout-wave" : undefined} cx="160" cy="204" r="9" fill={SKIN} />

        {/* ears */}
        <circle cx="56" cy="124" r="12" fill={SKIN} />
        <circle cx="56" cy="124" r="6" fill={SKIN_SHADE} />
        <circle cx="184" cy="124" r="12" fill={SKIN} />
        <circle cx="184" cy="124" r="6" fill={SKIN_SHADE} />

        {/* big round head */}
        <circle cx="120" cy="120" r="66" fill={SKIN} />

        {/* hair peeking out under the brim */}
        <path
          d="M70 98 Q78 114 88 100 Q96 116 106 101 Q114 115 122 101 Q130 115 140 101 Q148 116 156 100 Q164 114 170 98 Z"
          fill={HAIR}
        />

        {/* rounded scout hat with a gold band and compass pin */}
        <path d="M66 94 Q66 40 120 40 Q174 40 174 94 Z" fill={HAT} />
        <rect x="52" y="88" width="136" height="16" rx="8" fill={HAT_DARK} />
        <rect x="68" y="84" width="104" height="7" rx="3.5" fill={GOLD} />
        <circle cx="120" cy="62" r="10" fill={GOLD} />
        <path d="M120 54 L124 62 L120 70 L116 62 Z" fill={INK} />

        {/* rosy cheeks */}
        <ellipse cx="78" cy="146" rx="12" ry="8" fill="#ff8f8f" opacity="0.45" />
        <ellipse cx="162" cy="146" rx="12" ry="8" fill="#ff8f8f" opacity="0.45" />

        {/* big sparkly eyes */}
        <g className={mood === "idle" ? "scout-blink" : undefined}>
          <ellipse cx="96" cy={126 + up} rx="13" ry="16" fill={INK} />
          <ellipse cx="144" cy={126 + up} rx="13" ry="16" fill={INK} />
          <circle cx="101" cy={119 + up * 1.5} r="5" fill="#ffffff" />
          <circle cx="149" cy={119 + up * 1.5} r="5" fill="#ffffff" />
          <circle cx="91" cy={133 + up} r="2.5" fill="#ffffff" />
          <circle cx="139" cy={133 + up} r="2.5" fill="#ffffff" />
        </g>

        {/* mouth */}
        {mood === "talking" ? (
          <g className="scout-talk">
            <ellipse cx="120" cy="157" rx="11" ry="9" fill="#8a2f2b" />
            <ellipse cx="120" cy="161" rx="6" ry="3.5" fill="#ff8f8f" />
          </g>
        ) : mood === "listening" ? (
          <ellipse cx="120" cy="156" rx="6" ry="6" fill="#8a2f2b" />
        ) : mood === "thinking" ? (
          <path d="M111 155 Q121 161 130 152" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M108 151 Q120 164 132 151" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        )}

        {mood === "thinking" && (
          <g>
            <circle className="scout-dot" cx="192" cy="76" r="6" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
            <circle className="scout-dot" style={{ animationDelay: "0.2s" }} cx="206" cy="58" r="8.5" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
            <circle className="scout-dot" style={{ animationDelay: "0.4s" }} cx="222" cy="36" r="12" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
          </g>
        )}
      </g>
    </svg>
  );
}
