import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

export type MascotMood = 'asking' | 'typing' | 'welcome' | 'idle' | 'happy' | 'celebrate';
export type MascotTrick = 'idle' | 'flip' | 'hearts' | 'dizzy' | 'tickle' | 'highfive' | 'party';

interface Mascot3DProps {
  mood?: MascotMood;
  userName?: string;
  accentColor?: string;
  isFocused?: boolean;
  onTap?: () => void;
  className?: string;
  celebrateTrigger?: number;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  type: 'star' | 'heart' | 'sparkle' | 'circle';
}

export const Mascot3D: React.FC<Mascot3DProps> = ({
  mood = 'asking',
  userName = '',
  accentColor = '#10b981',
  isFocused = false,
  onTap,
  className = '',
  celebrateTrigger = 0,
}) => {
  const haptic = useHaptics();
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<MascotTrick>('idle');
  const [trickSpeech, setTrickSpeech] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse / Touch 3D tilt coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid, organic 3D rotation
  const springConfig = { damping: 18, stiffness: 190, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Derive 3D transforms
  const rotateY = useTransform(smoothX, [-100, 100], [-20, 20]);
  const rotateX = useTransform(smoothY, [-100, 100], [16, -16]);
  const headTranslateX = useTransform(smoothX, [-100, 100], [-8, 8]);
  const headTranslateY = useTransform(smoothY, [-100, 100], [-6, 6]);

  // Visor parallax (moves faster than head for physical 3D interior depth)
  const visorX = useTransform(smoothX, [-100, 100], [-12, 12]);
  const visorY = useTransform(smoothY, [-100, 100], [-9, 9]);

  // Eye gaze translation
  const eyeBaseY = isFocused || mood === 'typing' ? 6 : 0;
  const eyeX = useTransform(smoothX, [-100, 100], [-8, 8]);
  const eyeY = useTransform(smoothY, [-100, 100], [-6, 6]);

  // Spawn fun particles
  const spawnParticles = (type: 'heart' | 'star' | 'party') => {
    const newItems: FloatingParticle[] = [];
    const colors = [accentColor, '#ffffff', '#38bdf8', '#f43f5e', '#fbbf24', '#a855f7'];

    for (let i = 0; i < (type === 'party' ? 18 : 8); i++) {
      newItems.push({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 160,
        y: (Math.random() - 0.5) * 100 - 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        type: type === 'heart' ? 'heart' : type === 'star' ? 'star' : 'circle',
      });
    }
    setParticles(newItems);
    setTimeout(() => setParticles([]), 1800);
  };

  // Perform a specific trick with speech and haptic
  const triggerTrick = (trick: MascotTrick) => {
    if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
    setCurrentTrick(trick);

    switch (trick) {
      case 'flip':
        haptic('medium');
        setTrickSpeech('Woohoo! Zero-gravity 360° flip! 🚀');
        spawnParticles('star');
        break;
      case 'hearts':
        haptic('double');
        setTrickSpeech("Aww, you're awesome! 🥰");
        spawnParticles('heart');
        break;
      case 'dizzy':
        haptic('light');
        setTrickSpeech('Whoa, dizzy spin! 😵💫');
        break;
      case 'tickle':
        haptic('selection');
        setTrickSpeech('Hehe, that tickles! 🤖✨');
        break;
      case 'highfive':
        haptic('heavy');
        setTrickSpeech('High-five! 🖐️⚡ Your ledger is safe with me!');
        spawnParticles('star');
        break;
      case 'party':
        haptic('success');
        setTrickSpeech('Party mode! 🎉✨ 100% private & offline!');
        spawnParticles('party');
        break;
      default:
        break;
    }

    trickTimeoutRef.current = setTimeout(() => {
      setCurrentTrick('idle');
      setTrickSpeech(null);
    }, 2800);
  };

  // External celebration trigger (e.g. when user saves name)
  useEffect(() => {
    if (celebrateTrigger > 0) {
      triggerTrick('party');
      if (userName && userName.trim()) {
        setTrickSpeech(`Nice to meet you, ${userName.trim()}! Name saved! ⭐`);
      }
    }
  }, [celebrateTrigger]);

  // Periodic natural blinking and curious head tilts
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 130);
      const nextInterval = 2500 + Math.random() * 2600;
      blinkTimeout = setTimeout(triggerBlink, nextInterval);
    };
    blinkTimeout = setTimeout(triggerBlink, 1800);
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

  // Tap interaction: cycles through exciting tricks
  const handleMascotTap = () => {
    const tricks: MascotTrick[] = ['tickle', 'flip', 'hearts', 'party', 'dizzy', 'highfive'];
    const nextTrick = tricks[tapCount % tricks.length];
    setTapCount((prev) => prev + 1);
    triggerTrick(nextTrick);
    if (onTap) onTap();
  };

  // Determine speech text
  const getSpeechText = () => {
    if (trickSpeech) return trickSpeech;
    if (mood === 'celebrate') {
      const cleanName = userName ? userName.split(' ')[0] : 'friend';
      return `Awesome, ${cleanName}! Your name is saved! 🎉`;
    }
    if (mood === 'welcome') {
      const cleanName = userName && userName.trim() ? userName.split(' ')[0] : 'friend';
      return `Welcome back, ${cleanName}! Your private vault is ready. 🚀`;
    }
    if (userName && userName.trim().length > 0) {
      return `Looking great, ${userName.trim()}! Press Enter or Save when ready. ✨`;
    }
    if (isFocused) {
      return "Type your name or jump straight into the vault! 💫";
    }
    return "Hi! I'm Ledgie, your private vault companion. Tap me for tricks! 👋";
  };

  // Determine Eye Display Style
  const renderEyes = () => {
    // 1. Blinking
    if (isBlinking && currentTrick !== 'dizzy' && currentTrick !== 'hearts') {
      return (
        <div className="flex items-center gap-4">
          <div style={{ width: 16, height: 2, background: accentColor, borderRadius: 2 }} />
          <div style={{ width: 16, height: 2, background: accentColor, borderRadius: 2 }} />
        </div>
      );
    }

    // 2. Heart Eyes Trick
    if (currentTrick === 'hearts') {
      return (
        <div className="flex items-center gap-4">
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ fontSize: 18, filter: 'drop-shadow(0 0 6px #f43f5e)' }}
          >
            ❤️
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            style={{ fontSize: 18, filter: 'drop-shadow(0 0 6px #f43f5e)' }}
          >
            ❤️
          </motion.span>
        </div>
      );
    }

    // 3. Dizzy Spiral Eyes Trick
    if (currentTrick === 'dizzy') {
      return (
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px dashed ${accentColor}`,
              borderTopColor: '#fff',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px dashed ${accentColor}`,
              borderTopColor: '#fff',
            }}
          />
        </div>
      );
    }

    // 4. Star Eyes on Flip / Celebrate
    if (currentTrick === 'flip' || currentTrick === 'party' || mood === 'celebrate') {
      return (
        <div className="flex items-center gap-4">
          <motion.span
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ fontSize: 17, filter: `drop-shadow(0 0 8px ${accentColor})` }}
          >
            ⭐
          </motion.span>
          <motion.span
            animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
            style={{ fontSize: 17, filter: `drop-shadow(0 0 8px ${accentColor})` }}
          >
            ⭐
          </motion.span>
        </div>
      );
    }

    // 5. Joyful Arched Eyes on Welcome or Tickle (^)
    if (mood === 'welcome' || currentTrick === 'tickle') {
      return (
        <div className="flex items-center gap-4">
          <div
            style={{
              width: 18,
              height: 13,
              borderRadius: '14px 14px 0 0',
              borderTop: `3.5px solid ${accentColor}`,
              borderLeft: `2.5px solid ${accentColor}`,
              borderRight: `2.5px solid ${accentColor}`,
              filter: `drop-shadow(0 0 8px ${accentColor})`,
            }}
          />
          <div
            style={{
              width: 18,
              height: 13,
              borderRadius: '14px 14px 0 0',
              borderTop: `3.5px solid ${accentColor}`,
              borderLeft: `2.5px solid ${accentColor}`,
              borderRight: `2.5px solid ${accentColor}`,
              filter: `drop-shadow(0 0 8px ${accentColor})`,
            }}
          />
        </div>
      );
    }

    // 6. Default Sleek Glowing Visor Eyes (with tracking pupils)
    return (
      <div className="flex items-center gap-4">
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
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ perspective: 1000 }}
    >
      {/* --- FLOATING BURST PARTICLES --- */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.4, 0.8],
              x: p.x,
              y: p.y,
              rotate: [0, 180],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 40,
              color: p.color,
              fontSize: p.size * 2,
            }}
          >
            {p.type === 'heart' ? '❤️' : p.type === 'star' ? '✨' : '●'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* --- SPEECH BUBBLE WITH DYNAMIC REACTIONS --- */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 mb-3 max-w-[290px]"
      >
        <div
          style={{
            background: 'rgba(18, 19, 26, 0.85)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '0.5px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            padding: '10px 16px',
            boxShadow: `0 14px 34px rgba(0,0,0,0.5), 0 0 24px ${accentColor}20`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Pulsing online status indicator */}
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
              transition={{ duration: 0.22 }}
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.94)',
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
            background: 'rgba(18, 19, 26, 0.85)',
            borderRight: '0.5px solid rgba(255, 255, 255, 0.15)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.15)',
            zIndex: 1,
          }}
        />
      </motion.div>

      {/* --- 3D MASCOT CHASSIS WITH ADVANCED TOUCH INTERACTIONS --- */}
      <motion.div
        drag
        dragConstraints={{ left: -30, right: 30, top: -20, bottom: 20 }}
        dragElastic={0.4}
        whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          cursor: 'grab',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.93 }}
        onClick={handleMascotTap}
        className="relative flex items-center justify-center"
      >
        {/* Animated trick movements (Flips, Spins, Somersaults, Wiggles) */}
        <motion.div
          animate={
            currentTrick === 'flip'
              ? {
                  rotateX: [0, 360],
                  y: [0, -42, 0],
                  scale: [1, 1.15, 1],
                }
              : currentTrick === 'dizzy'
              ? {
                  rotateY: [0, 720],
                  rotateZ: [-5, 5, -3, 3, 0],
                }
              : currentTrick === 'tickle'
              ? {
                  x: [-8, 8, -6, 6, -3, 3, 0],
                  scaleY: [1, 0.94, 1.04, 1],
                }
              : currentTrick === 'party'
              ? {
                  y: [0, -16, 0, -10, 0],
                  rotateZ: [-3, 3, -2, 2, 0],
                }
              : {
                  y: mood === 'welcome' || mood === 'celebrate' ? [0, -12, 0] : [0, -8, 0],
                  rotateZ: mood === 'welcome' ? [0, 2, -2, 0] : [-1, 1, -1],
                  scale: [1, 1.025, 1], // Gentle breathing
                }
          }
          transition={
            currentTrick === 'flip'
              ? { duration: 1.1, ease: 'easeInOut' }
              : currentTrick === 'dizzy'
              ? { duration: 1.2, ease: 'easeOut' }
              : currentTrick === 'tickle'
              ? { duration: 0.6, repeat: 3, ease: 'easeInOut' }
              : currentTrick === 'party'
              ? { duration: 0.9, repeat: 2, ease: 'easeInOut' }
              : {
                  duration: 3.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="relative flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Ambient Glow Aura */}
          <div
            style={{
              position: 'absolute',
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}35 0%, ${accentColor}08 50%, transparent 75%)`,
              filter: 'blur(22px)',
              pointerEvents: 'none',
              transform: 'translateZ(-45px)',
            }}
          />

          {/* --- ORBITING 3D HOLOGRAPHIC RING WITH DUAL SPARKS --- */}
          <div
            style={{
              position: 'absolute',
              width: 180,
              height: 80,
              borderRadius: '50%',
              border: `1.5px solid ${accentColor}44`,
              boxShadow: `0 0 18px ${accentColor}33, inset 0 0 14px ${accentColor}22`,
              transform: 'rotateX(72deg) rotateY(14deg) translateZ(-10px)',
              pointerEvents: 'none',
            }}
          >
            {/* Spark 1 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  left: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: `0 0 10px #fff, 0 0 18px ${accentColor}`,
                }}
              />
            </motion.div>

            {/* Spark 2 (opposite orbit) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
            </motion.div>
          </div>

          {/* --- LEFT FLOATING THRUSTER HAND --- */}
          <motion.div
            animate={{
              y: currentTrick === 'party' ? [-6, 6, -6] : [0, 4, 0],
              rotateZ: [-2, 5, -2],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: -32,
              top: 56,
              width: 22,
              height: 38,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #2b2e3a 0%, #171822 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.16)',
              boxShadow: `0 8px 16px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.3)`,
              transform: 'translateZ(-10px)',
            }}
          >
            {/* Hand glow emitter */}
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

          {/* --- RIGHT FLOATING HAND (WAVING / HIGH-FIVES) --- */}
          <motion.div
            animate={
              currentTrick === 'highfive'
                ? {
                    y: [-15, -22, -15],
                    rotateZ: [20, 45, 20],
                    scale: [1, 1.25, 1],
                  }
                : mood === 'welcome' || mood === 'celebrate' || currentTrick === 'party'
                ? {
                    y: [-4, -16, -4],
                    rotateZ: [15, 42, 8, 42, 15],
                  }
                : {
                    y: [0, -3, 0],
                    rotateZ: [8, 16, 8],
                  }
            }
            transition={{
              duration: currentTrick === 'highfive' ? 0.6 : 1.5,
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
              background: 'linear-gradient(135deg, #2b2e3a 0%, #171822 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.16)',
              boxShadow: `0 8px 16px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.3)`,
              transformOrigin: 'bottom center',
              transform: 'translateZ(15px)',
            }}
          >
            {/* Hand glow emitter */}
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
                boxShadow: `0 0 10px ${accentColor}`,
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
                'radial-gradient(circle at 35% 28%, #3f4454 0%, #212430 45%, #10121b 80%, #08090e 100%)',
              boxShadow: `
                0 22px 50px rgba(0,0,0,0.75),
                0 0 35px ${accentColor}28,
                inset 0 2px 4px rgba(255,255,255,0.45),
                inset -6px -8px 20px rgba(0,0,0,0.85)
              `,
              border: '0.5px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Top Antenna / Holographic Radar */}
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
              {/* Antenna gem with energetic breathing pulse */}
              <motion.div
                animate={{
                  scale: currentTrick === 'party' ? [1, 1.4, 1] : [1, 1.25, 1],
                  boxShadow: [
                    `0 0 10px ${accentColor}`,
                    `0 0 24px ${accentColor}, 0 0 32px ${accentColor}88`,
                    `0 0 10px ${accentColor}`,
                  ],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: `2px solid ${accentColor}`,
                }}
              />
              {/* Antenna stem */}
              <div
                style={{
                  width: 4,
                  height: 10,
                  background: 'linear-gradient(to bottom, #4b4f62, #1b1d28)',
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
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, transparent 80%)',
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
                background: 'linear-gradient(145deg, #06070a 0%, #12141e 100%)',
                border: '0.5px solid rgba(255, 255, 255, 0.16)',
                boxShadow: `
                  inset 0 2px 6px rgba(0,0,0,0.92),
                  inset 0 -1px 3px rgba(255,255,255,0.12),
                  0 4px 18px rgba(0,0,0,0.65)
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
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)',
                  borderRadius: '28px 28px 0 0',
                  pointerEvents: 'none',
                }}
              />

              {/* Visor cyber scanlines */}
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
                {renderEyes()}
              </motion.div>

              {/* Cute Blushing Cheeks on Hearts / Giggles */}
              {(currentTrick === 'hearts' || currentTrick === 'tickle') && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      bottom: 12,
                      width: 10,
                      height: 5,
                      borderRadius: '50%',
                      background: '#f43f5e',
                      boxShadow: '0 0 8px #f43f5e',
                      opacity: 0.85,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 14,
                      bottom: 12,
                      width: 10,
                      height: 5,
                      borderRadius: '50%',
                      background: '#f43f5e',
                      boxShadow: '0 0 8px #f43f5e',
                      opacity: 0.85,
                    }}
                  />
                </>
              )}

              {/* Gentle smile mouth */}
              {(mood === 'welcome' ||
                mood === 'celebrate' ||
                currentTrick === 'hearts' ||
                currentTrick === 'party' ||
                (userName && userName.length > 0)) && (
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
          scale: currentTrick === 'flip' ? [0.6, 1.4, 0.6] : [0.9, 1.14, 0.9],
          opacity: currentTrick === 'flip' ? [0.2, 0.6, 0.2] : [0.55, 0.25, 0.55],
        }}
        transition={{
          duration: currentTrick === 'flip' ? 1.1 : 3.4,
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

      {/* --- FUN INTERACTIVE TRICK CONTROLS --- */}
      <div className="flex items-center gap-1.5 mt-2 z-20">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => triggerTrick('flip')}
          className="text-[11px] px-2.5 py-1 rounded-full text-white/60 hover:text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '0.5px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Make Ledgie do a flip!"
        >
          🚀 Flip
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => triggerTrick('hearts')}
          className="text-[11px] px-2.5 py-1 rounded-full text-white/60 hover:text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '0.5px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Send Ledgie love!"
        >
          💖 Love
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => triggerTrick('dizzy')}
          className="text-[11px] px-2.5 py-1 rounded-full text-white/60 hover:text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '0.5px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Spin Ledgie round!"
        >
          🌀 Spin
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => triggerTrick('party')}
          className="text-[11px] px-2.5 py-1 rounded-full text-white/60 hover:text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '0.5px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Party mode!"
        >
          🎉 Party
        </motion.button>
      </div>
    </div>
  );
};

export default Mascot3D;
