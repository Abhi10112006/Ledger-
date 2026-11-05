import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

export type MascotMood = 'asking' | 'typing' | 'welcome' | 'idle' | 'happy';

interface Mascot3DProps {
  mood?: MascotMood;
  userName?: string;
  accentColor?: string;
  isFocused?: boolean;
  onTap?: () => void;
  className?: string;
}

export const Mascot3D: React.FC<Mascot3DProps> = ({
  mood = 'asking',
  userName = '',
  accentColor = '#10b981',
  isFocused = false,
  onTap,
  className = '',
}) => {
  const haptic = useHaptics();
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [isTickled, setIsTickled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse / Touch 3D tilt coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid, organic 3D rotation
  const springConfig = { damping: 20, stiffness: 180, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Derive 3D transforms
  const rotateY = useTransform(smoothX, [-100, 100], [-18, 18]);
  const rotateX = useTransform(smoothY, [-100, 100], [14, -14]);
  const headTranslateX = useTransform(smoothX, [-100, 100], [-6, 6]);
  const headTranslateY = useTransform(smoothY, [-100, 100], [-5, 5]);

  // Visor parallax (moves more than head for deep 3D effect)
  const visorX = useTransform(smoothX, [-100, 100], [-10, 10]);
  const visorY = useTransform(smoothY, [-100, 100], [-8, 8]);

  // Eye gaze translation
  const eyeBaseY = isFocused || mood === 'typing' ? 5 : 0;
  const eyeX = useTransform(smoothX, [-100, 100], [-7, 7]);
  const eyeY = useTransform(smoothY, [-100, 100], [-5, 5]);

  // Periodic natural blinking
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
      const nextInterval = 2800 + Math.random() * 2500;
      blinkTimeout = setTimeout(triggerBlink, nextInterval);
    };
    blinkTimeout = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Handle pointer tracking
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(Math.max(-100, Math.min(100, e.clientX - centerX)));
    mouseY.set(Math.max(-100, Math.min(100, e.clientY - centerY)));
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Tap interaction
  const handleMascotTap = () => {
    haptic('selection');
    setIsWinking(true);
    setIsTickled(true);
    setTimeout(() => setIsWinking(false), 900);
    setTimeout(() => setIsTickled(false), 2400);
    if (onTap) onTap();
  };

  // Determine speech text
  const getSpeechText = () => {
    if (isTickled) return 'Hehe, that tickles! 🤖✨';
    if (mood === 'welcome') {
      const cleanName = userName ? userName.split(' ')[0] : 'friend';
      return `Welcome back, ${cleanName}! Everything is secure.`;
    }
    if (userName && userName.trim().length > 0) {
      return `Nice to meet you, ${userName.trim()}! Looking sharp.`;
    }
    if (isFocused) {
      return 'Type your name so I know what to call you! ✨';
    }
    return "Hi! I'm Ledgie, your private ledger guard. What's your name?";
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ perspective: 1000 }}
    >
      {/* --- SPEECH BUBBLE --- */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 mb-4 max-w-[280px]"
      >
        <div
          style={{
            background: 'rgba(18, 18, 24, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            padding: '10px 16px',
            boxShadow: `0 12px 32px rgba(0,0,0,0.45), 0 0 20px ${accentColor}18`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Pulsing status dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: accentColor }}
            />
          </span>

          <AnimatePresence mode="wait">
            <motion.p
              key={getSpeechText()}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: 1.35,
                letterSpacing: '-0.01em',
              }}
            >
              {getSpeechText()}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Speech tail */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12,
            height: 12,
            background: 'rgba(18, 18, 24, 0.75)',
            borderRight: '0.5px solid rgba(255, 255, 255, 0.12)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.12)',
            zIndex: 1,
          }}
        />
      </motion.div>

      {/* --- 3D MASCOT CONTAINER WITH SPRING ROTATION --- */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
        }}
        whileTap={{ scale: 0.94 }}
        onClick={handleMascotTap}
        className="relative flex items-center justify-center"
      >
        {/* Continuous organic float */}
        <motion.div
          animate={{
            y: mood === 'welcome' ? [0, -12, 0] : [0, -8, 0],
            rotateZ: mood === 'welcome' ? [0, 2, -2, 0] : [-1, 1, -1],
          }}
          transition={{
            duration: mood === 'welcome' ? 2.2 : 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Ambient Glow behind mascot */}
          <div
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}08 45%, transparent 70%)`,
              filter: 'blur(20px)',
              pointerEvents: 'none',
              transform: 'translateZ(-40px)',
            }}
          />

          {/* --- ORBITING 3D ENERGY RING --- */}
          <div
            style={{
              position: 'absolute',
              width: 175,
              height: 75,
              borderRadius: '50%',
              border: `1.5px solid ${accentColor}44`,
              boxShadow: `0 0 16px ${accentColor}33, inset 0 0 12px ${accentColor}22`,
              transform: 'rotateX(72deg) rotateY(12deg) translateZ(-10px)',
              pointerEvents: 'none',
            }}
          >
            {/* Orbiting energy spark */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: `0 0 10px #fff, 0 0 16px ${accentColor}`,
                }}
              />
            </motion.div>
          </div>

          {/* --- LEFT FLOATING THRUSTER HAND --- */}
          <motion.div
            animate={{
              y: [0, 4, 0],
              rotateZ: [-2, 4, -2],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: -32,
              top: 56,
              width: 22,
              height: 38,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #2a2d39 0%, #171821 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.16)',
              boxShadow: `0 8px 16px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.3)`,
              transform: 'translateZ(-10px)',
            }}
          >
            {/* Small glow emitter on hand */}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
          </motion.div>

          {/* --- RIGHT FLOATING HAND (WAVING) --- */}
          <motion.div
            animate={
              mood === 'welcome' || mood === 'asking'
                ? {
                    y: [-4, -14, -4],
                    rotateZ: [15, 38, 10, 38, 15],
                  }
                : {
                    y: [0, -3, 0],
                    rotateZ: [6, 14, 6],
                  }
            }
            transition={{
              duration: mood === 'welcome' || mood === 'asking' ? 1.6 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              right: -32,
              top: 48,
              width: 22,
              height: 38,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #2a2d39 0%, #171821 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.16)',
              boxShadow: `0 8px 16px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.3)`,
              transformOrigin: 'bottom center',
              transform: 'translateZ(15px)',
            }}
          >
            {/* Small glow emitter on hand */}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
          </motion.div>

          {/* --- MAIN 3D HEAD & CHASSIS SPHERE --- */}
          <motion.div
            style={{
              x: headTranslateX,
              y: headTranslateY,
              width: 136,
              height: 136,
              borderRadius: '50%',
              position: 'relative',
              background:
                'radial-gradient(circle at 35% 28%, #3e4252 0%, #20232e 45%, #10121a 80%, #08090e 100%)',
              boxShadow: `
                0 20px 48px rgba(0,0,0,0.7),
                0 0 35px ${accentColor}26,
                inset 0 2px 4px rgba(255,255,255,0.4),
                inset -6px -8px 20px rgba(0,0,0,0.85)
              `,
              border: '0.5px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Top Antenna / Holographic Crown */}
            <div
              style={{
                position: 'absolute',
                top: -18,
                left: '50%',
                transform: 'translateX(-50%) translateZ(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Antenna gem */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  boxShadow: [
                    `0 0 10px ${accentColor}`,
                    `0 0 22px ${accentColor}, 0 0 30px ${accentColor}88`,
                    `0 0 10px ${accentColor}`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#fff',
                  border: `2px solid ${accentColor}`,
                }}
              />
              {/* Antenna stem */}
              <div
                style={{
                  width: 4,
                  height: 10,
                  background: 'linear-gradient(to bottom, #4a4d5e, #1c1e28)',
                  borderRadius: 2,
                }}
              />
            </div>

            {/* Specular gloss highlight on top-left of sphere */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 18,
                width: 46,
                height: 24,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 80%)',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none',
              }}
            />

            {/* --- VISOR DISPLAY (OLED Face Screen) --- */}
            <motion.div
              style={{
                x: visorX,
                y: visorY,
                width: 96,
                height: 60,
                borderRadius: 28,
                background: 'linear-gradient(145deg, #07080c 0%, #12141d 100%)',
                border: '0.5px solid rgba(255, 255, 255, 0.14)',
                boxShadow: `
                  inset 0 2px 6px rgba(0,0,0,0.9),
                  inset 0 -1px 3px rgba(255,255,255,0.1),
                  0 4px 16px rgba(0,0,0,0.6)
                `,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateZ(25px)',
              }}
            >
              {/* Visor internal reflection sheen */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '48%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                  borderRadius: '28px 28px 0 0',
                  pointerEvents: 'none',
                }}
              />

              {/* Visor scanlines / cyber grid */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
                  pointerEvents: 'none',
                }}
              />

              {/* --- EXPRESSIVE CYBER EYES --- */}
              <motion.div
                style={{
                  x: eyeX,
                  y: eyeY,
                  marginTop: eyeBaseY,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  zIndex: 2,
                }}
              >
                {/* LEFT EYE */}
                <motion.div
                  animate={{
                    scaleY: isBlinking ? 0.08 : 1,
                  }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'relative',
                  }}
                >
                  {mood === 'welcome' || isTickled ? (
                    // Happy Joyful Arched Eye (^)
                    <div
                      style={{
                        width: 18,
                        height: 12,
                        borderRadius: '12px 12px 0 0',
                        borderTop: `3.5px solid ${accentColor}`,
                        borderLeft: `2.5px solid ${accentColor}`,
                        borderRight: `2.5px solid ${accentColor}`,
                        filter: `drop-shadow(0 0 6px ${accentColor})`,
                      }}
                    />
                  ) : (
                    // Oval Luminous Eye
                    <div
                      style={{
                        width: 16,
                        height: 22,
                        borderRadius: 10,
                        background: `linear-gradient(180deg, #ffffff 0%, ${accentColor} 100%)`,
                        boxShadow: `0 0 12px ${accentColor}, 0 0 20px ${accentColor}99`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Pupil reflection shine */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: 3,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: '#fff',
                        }}
                      />
                    </div>
                  )}
                </motion.div>

                {/* RIGHT EYE */}
                <motion.div
                  animate={{
                    scaleY: isBlinking || isWinking ? 0.08 : 1,
                  }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'relative',
                  }}
                >
                  {mood === 'welcome' || isTickled ? (
                    // Happy Joyful Arched Eye (^)
                    <div
                      style={{
                        width: 18,
                        height: 12,
                        borderRadius: '12px 12px 0 0',
                        borderTop: `3.5px solid ${accentColor}`,
                        borderLeft: `2.5px solid ${accentColor}`,
                        borderRight: `2.5px solid ${accentColor}`,
                        filter: `drop-shadow(0 0 6px ${accentColor})`,
                      }}
                    />
                  ) : (
                    // Oval Luminous Eye (or wink)
                    <div
                      style={{
                        width: 16,
                        height: 22,
                        borderRadius: 10,
                        background: `linear-gradient(180deg, #ffffff 0%, ${accentColor} 100%)`,
                        boxShadow: `0 0 12px ${accentColor}, 0 0 20px ${accentColor}99`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Pupil reflection shine */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: 3,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: '#fff',
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* Gentle smile mouth */}
              {(mood === 'welcome' || isTickled || (userName && userName.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    width: 12,
                    height: 5,
                    borderRadius: '0 0 8px 8px',
                    borderBottom: `2px solid ${accentColor}`,
                    borderLeft: `1px solid ${accentColor}`,
                    borderRight: `1px solid ${accentColor}`,
                    filter: `drop-shadow(0 0 4px ${accentColor})`,
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* --- DYNAMIC 3D FLOOR SHADOW --- */}
      <motion.div
        animate={{
          scale: mood === 'welcome' ? [0.85, 1.2, 0.85] : [0.9, 1.12, 0.9],
          opacity: mood === 'welcome' ? [0.65, 0.25, 0.65] : [0.55, 0.25, 0.55],
        }}
        transition={{
          duration: mood === 'welcome' ? 2.2 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: 110,
          height: 18,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)',
          filter: 'blur(5px)',
          marginTop: 18,
        }}
      />
    </div>
  );
};

export default Mascot3D;
