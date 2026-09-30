import React, { useEffect, useState } from 'react';

export type MascotState =
  | 'walking_in'
  | 'greeting'
  | 'pulling'
  | 'walking_out'
  | 'pushing_tablet'
  | 'presenting'
  | 'idle'
  | 'covering_eyes'
  | 'peeking'
  | 'typing'
  | 'celebrating'
  | 'error';

interface SakuMascot3DProps {
  state: MascotState;
  speechText?: string;
  mousePos?: { x: number; y: number };
}

export const SakuMascot3D: React.FC<SakuMascot3DProps> = ({
  state,
  speechText,
  mousePos = { x: 0, y: 0 },
}) => {
  // Eye tracking offsets calculated from mouse position relative to center
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (state === 'covering_eyes') return;
    const windowCenterX = window.innerWidth / 2;
    const windowCenterY = window.innerHeight / 2;

    const deltaX = (mousePos.x - windowCenterX) / windowCenterX;
    const deltaY = (mousePos.y - windowCenterY) / windowCenterY;

    // Constrain pupil movement to -4px to +4px
    setEyeOffset({
      x: Math.max(-4, Math.min(4, deltaX * 4)),
      y: Math.max(-3, Math.min(3, deltaY * 3)),
    });
  }, [mousePos, state]);

  // Determine arm/hand/head positions based on current state
  const isCovering = state === 'covering_eyes';
  const isPeeking = state === 'peeking';
  const isPushing = state === 'pushing_tablet';
  const isPulling = state === 'pulling';
  const isCelebrating = state === 'celebrating';
  const isError = state === 'error';
  const isGreeting = state === 'greeting';

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-none">
      {/* Speech Bubble */}
      {speechText && (
        <div className="absolute -top-24 z-30 animate-bounce transition-all duration-300 pointer-events-auto">
          <div className="relative bg-slate-900/95 border-2 border-brand-violet/70 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-glow-violet max-w-[280px] text-center">
            {speechText}
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r-2 border-b-2 border-brand-violet/70 rotate-45"></div>
          </div>
        </div>
      )}

      {/* SVG Character Stage */}
      <svg
        viewBox="0 0 220 300"
        className={`w-44 sm:w-52 md:w-60 h-auto drop-shadow-[0_15px_35px_rgba(99,91,255,0.4)] transition-transform duration-300 ${
          isPulling
            ? 'scale-x-[-1] animate-[mascotPull_0.6s_infinite_ease-in-out]'
            : isPushing
            ? 'scale-x-[-1] animate-[mascotPush_0.8s_infinite_ease-in-out]'
            : isCelebrating
            ? 'animate-bounce'
            : isGreeting
            ? 'animate-[mascotWalk_1s_infinite_ease-in-out]'
            : 'animate-[mascotBreathe_3s_infinite_ease-in-out]'
        }`}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>

          <linearGradient id="capBrim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#635BFF" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDDFBA" />
            <stop offset="100%" stopColor="#F1B685" />
          </linearGradient>

          <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#635BFF" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Soft Drop Shadow on floor */}
        <ellipse cx="110" cy="285" rx="58" ry="13" fill="rgba(0,0,0,0.5)" filter="url(#glowFilter)" />

        {/* BACKPACK (Behind body) */}
        <g id="backpack">
          <rect x="52" y="130" width="30" height="65" rx="14" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2.5" />
          <path d="M54 145 H80" stroke="#60A5FA" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx="67" cy="170" r="5" fill="#38BDF8" filter="url(#glowFilter)" />
        </g>

        {/* LEGS & SHOES */}
        <g id="legs">
          {isPulling ? (
            /* Braced Hauling Legs */
            <>
              {/* Front Leg Braced Forward */}
              <rect x="70" y="202" width="18" height="52" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" transform="rotate(-12 79 228)" />
              <ellipse cx="74" cy="265" rx="18" ry="10" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
              <path d="M58 268 Q74 274 90 268" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              <ellipse cx="74" cy="272" rx="16" ry="3" fill="#14B8A6" filter="url(#glowFilter)" />

              {/* Back Leg Digging In Behind */}
              <rect x="134" y="198" width="18" height="56" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" transform="rotate(14 143 226)" />
              <ellipse cx="144" cy="265" rx="18" ry="10" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
              <path d="M128 268 Q144 274 160 268" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              <ellipse cx="144" cy="272" rx="16" ry="3" fill="#14B8A6" filter="url(#glowFilter)" />
            </>
          ) : (
            /* Normal Legs */
            <>
              <rect x="82" y="200" width="18" height="55" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
              <ellipse cx="88" cy="265" rx="18" ry="10" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
              <path d="M72 268 Q88 274 104 268" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              <ellipse cx="88" cy="272" rx="16" ry="3" fill="#14B8A6" filter="url(#glowFilter)" />

              <rect x="120" y="200" width="18" height="55" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
              <ellipse cx="126" cy="265" rx="18" ry="10" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
              <path d="M110 268 Q126 274 142 268" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              <ellipse cx="126" cy="272" rx="16" ry="3" fill="#14B8A6" filter="url(#glowFilter)" />
            </>
          )}
        </g>

        {/* BODY & HOODIE */}
        <g id="torso" transform={isPulling ? 'rotate(-6 110 170)' : undefined}>
          {/* Hoodie body */}
          <path
            d="M72 135 C72 120 148 120 148 135 L144 210 C144 218 76 218 76 210 Z"
            fill="url(#hoodieGrad)"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Hoodie zipper line */}
          <line x1="110" y1="135" x2="110" y2="212" stroke="#64748B" strokeWidth="2" strokeDasharray="4 2" />

          {/* SAKUWISE Brand Emblem on chest */}
          <circle cx="95" cy="160" r="10" fill="#635BFF" opacity="0.9" />
          <path d="M92 163 Q95 156 98 163" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="95" cy="154" r="1.5" fill="#38BDF8" />

          {/* Cyber Visor / Headphones around neck */}
          <path d="M78 126 C78 142 142 142 142 126" stroke="#14B8A6" strokeWidth="6" fill="none" filter="url(#glowFilter)" />
          <rect x="74" y="118" width="12" height="18" rx="4" fill="#0F172A" stroke="#14B8A6" strokeWidth="2" />
          <rect x="134" y="118" width="12" height="18" rx="4" fill="#0F172A" stroke="#14B8A6" strokeWidth="2" />
        </g>

        {/* HEAD & FACE */}
        <g id="head" transform={isPulling ? 'rotate(-8 110 85)' : undefined}>
          {/* Face base */}
          <ellipse cx="110" cy="85" rx="36" ry="38" fill="url(#skinGrad)" />

          {/* Cheeks blush */}
          <circle cx="86" cy="98" r="6" fill="#F472B6" opacity="0.35" />
          <circle cx="134" cy="98" r="6" fill="#F472B6" opacity="0.35" />

          {/* EARS */}
          <ellipse cx="73" cy="88" rx="6" ry="9" fill="url(#skinGrad)" />
          <ellipse cx="147" cy="88" rx="6" ry="9" fill="url(#skinGrad)" />

          {/* EYES & BROWS */}
          {isCovering ? (
            /* Eyes are hidden under hands */
            <g id="closed-eyes">
              <path d="M88 84 Q96 90 104 84" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M116 84 Q124 90 132 84" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          ) : isPeeking ? (
            /* One eye open, one squinting */
            <g id="peeking-eyes">
              <path d="M88 84 Q96 90 104 84" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none" />
              <ellipse cx="124" cy="82" rx="8" ry="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              <circle cx={124 + eyeOffset.x} cy={82 + eyeOffset.y} r="4.5" fill="#0F172A" />
              <circle cx={123 + eyeOffset.x} cy={80 + eyeOffset.y} r="1.5" fill="#FFFFFF" />
            </g>
          ) : isPulling ? (
            /* Determined Gritted Eyes looking toward destination */
            <g id="determined-eyes">
              <ellipse cx="94" cy="82" rx="9" ry="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              <circle cx="96" cy="82" r="5" fill="#1E293B" />
              <circle cx="94.5" cy="80" r="1.8" fill="#FFFFFF" />

              <ellipse cx="126" cy="82" rx="9" ry="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              <circle cx="128" cy="82" r="5" fill="#1E293B" />
              <circle cx="126.5" cy="80" r="1.8" fill="#FFFFFF" />

              {/* Determined Slanted Eyebrows */}
              <path d="M86 68 L102 73" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M134 68 L118 73" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            /* Normal Interactive Eyes tracking mouse! */
            <g id="interactive-eyes">
              <ellipse cx="94" cy="82" rx="9" ry="11" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              <circle cx={94 + eyeOffset.x} cy={82 + eyeOffset.y} r="5" fill="#1E293B" />
              <circle cx={92.5 + eyeOffset.x} cy={79.5 + eyeOffset.y} r="1.8" fill="#FFFFFF" />

              <ellipse cx="126" cy="82" rx="9" ry="11" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              <circle cx={126 + eyeOffset.x} cy={82 + eyeOffset.y} r="5" fill="#1E293B" />
              <circle cx={124.5 + eyeOffset.x} cy={79.5 + eyeOffset.y} r="1.8" fill="#FFFFFF" />

              <path
                d={isError ? "M86 68 L102 72" : "M86 70 Q94 65 102 70"}
                stroke="#78350F"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={isError ? "M134 68 L118 72" : "M118 70 Q126 65 134 70"}
                stroke="#78350F"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* MOUTH */}
          {isError ? (
            <path d="M102 108 Q110 102 118 108" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : isPulling ? (
            /* Determined Effort Grin */
            <path d="M98 106 Q110 116 122 106 Z" fill="#FFFFFF" stroke="#991B1B" strokeWidth="2" />
          ) : isCelebrating || isGreeting ? (
            <path d="M100 102 Q110 116 120 102 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
          ) : (
            <path d="M102 105 Q110 112 118 105" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          {/* BACKWARDS BASEBALL CAP */}
          <g id="cap">
            <path
              d="M74 72 C74 42 146 42 146 72 C146 74 74 74 74 72 Z"
              fill="url(#capGrad)"
              stroke="#991B1B"
              strokeWidth="2"
            />
            <path
              d="M72 70 C60 62 48 76 68 80 Z"
              fill="url(#capBrim)"
              stroke="#312E81"
              strokeWidth="2"
            />
            <circle cx="110" cy="46" r="3.5" fill="#635BFF" />
          </g>
        </g>

        {/* ARMS & HANDS (Dynamic based on state) */}
        <g id="arms">
          {isCovering ? (
            /* Hands covering eyes */
            <g id="hands-covering">
              <path d="M74 140 Q65 100 88 84" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <ellipse cx="92" cy="82" rx="10" ry="12" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="1" />

              <path d="M146 140 Q155 100 132 84" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <ellipse cx="128" cy="82" rx="10" ry="12" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="1" />
            </g>
          ) : isPeeking ? (
            /* Hands slightly parting, revealing right eye */
            <g id="hands-peeking">
              <path d="M74 140 Q65 100 88 84" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <ellipse cx="90" cy="82" rx="10" ry="12" fill="url(#skinGrad)" />

              <path d="M146 140 Q160 110 142 92" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <ellipse cx="140" cy="94" rx="9" ry="11" fill="url(#skinGrad)" />
            </g>
          ) : isPulling ? (
            /* Straining backward pulling arms */
            <g id="arms-pulling">
              {/* Front Arm reaching down-forward gripping rope */}
              <path d="M74 140 Q45 160 28 170" stroke="url(#hoodieGrad)" strokeWidth="15" strokeLinecap="round" fill="none" />
              <circle cx="26" cy="172" r="10" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="1" />
              <circle cx="26" cy="172" r="14" fill="none" stroke="#14B8A6" strokeWidth="2.5" filter="url(#glowFilter)" strokeDasharray="3 2" />

              {/* Back Arm bent and hauling towards chest */}
              <path d="M146 140 Q120 165 92 176" stroke="url(#hoodieGrad)" strokeWidth="15" strokeLinecap="round" fill="none" />
              <circle cx="90" cy="178" r="10" fill="url(#skinGrad)" stroke="#B45309" strokeWidth="1" />
              <circle cx="90" cy="178" r="14" fill="none" stroke="#14B8A6" strokeWidth="2.5" filter="url(#glowFilter)" strokeDasharray="3 2" />
            </g>
          ) : isCelebrating ? (
            /* Both arms raised up in victory! */
            <g id="arms-celebrating">
              <path d="M74 140 Q50 90 60 70" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <circle cx="60" cy="65" r="9" fill="url(#skinGrad)" />

              <path d="M146 140 Q170 90 160 70" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <circle cx="160" cy="65" r="9" fill="url(#skinGrad)" />
            </g>
          ) : isGreeting ? (
            /* Right arm waving hello! */
            <g id="arms-waving">
              <path d="M74 140 Q68 175 72 190" stroke="url(#hoodieGrad)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <circle cx="72" cy="195" r="8" fill="url(#skinGrad)" />

              <path d="M146 140 Q165 100 162 75" stroke="url(#hoodieGrad)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <circle cx="162" cy="70" r="9" fill="url(#skinGrad)" />
            </g>
          ) : isPushing ? (
            /* Straining forward pushing hands */
            <g id="arms-pushing">
              <path d="M80 145 L45 155" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <circle cx="40" cy="158" r="9" fill="url(#skinGrad)" />

              <path d="M135 145 L35 145" stroke="url(#hoodieGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <circle cx="30" cy="145" r="9" fill="url(#skinGrad)" />
            </g>
          ) : (
            /* Presenting / Thumbs up stance */
            <g id="arms-presenting">
              <path d="M74 140 Q60 160 48 150" stroke="url(#hoodieGrad)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <circle cx="44" cy="148" r="8" fill="url(#skinGrad)" />

              <path d="M146 140 Q160 160 152 175" stroke="url(#hoodieGrad)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <circle cx="152" cy="180" r="8" fill="url(#skinGrad)" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
