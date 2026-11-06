import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

export type MascotMood = 'asking' | 'typing' | 'welcome' | 'idle' | 'happy' | 'celebrate';
export type MascotTrick =
  | 'idle'
  | 'flip'
  | 'hearts'
  | 'dizzy'
  | 'tickle'
  | 'highfive'
  | 'party'
  | 'wink'
  | 'curious';

interface Mascot3DProps {
  mood?: MascotMood;
  userName?: string;
  accentColor?: string;
  isFocused?: boolean;
  onTap?: () => void;
  className?: string;
  celebrateTrigger?: number;
  isRestoring?: boolean;
  hasCustomName?: boolean;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  type: 'star' | 'heart' | 'sparkle' | 'circle' | 'note';
}

export const Mascot3D: React.FC<Mascot3DProps> = ({
  mood = 'asking',
  userName = '',
  accentColor = '#10b981',
  isFocused = false,
  onTap,
  className = '',
  celebrateTrigger = 0,
  isRestoring = false,
  hasCustomName = false,
}) => {
  const haptic = useHaptics();

  // Trick & Interaction States
  const [currentTrick, setCurrentTrick] = useState<MascotTrick>('idle');
  const [trickSpeech, setTrickSpeech] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleThoughtIndex, setIdleThoughtIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const trickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Pointer coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for natural Pixar-grade weight and responsiveness
  const springConfig = { damping: 18, stiffness: 220, mass: 0.55 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // 3D Parallax transforms
  const rotateY = useTransform(smoothX, [-100, 100], [-22, 22]);
  const rotateX = useTransform(smoothY, [-100, 100], [18, -18]);
  const headTranslateX = useTransform(smoothX, [-100, 100], [-9, 9]);
  const headTranslateY = useTransform(smoothY, [-100, 100], [-7, 7]);

  // Deep visor parallax (simulates inside of curved glass helmet)
  const visorX = useTransform(smoothX, [-100, 100], [-14, 14]);
  const visorY = useTransform(smoothY, [-100, 100], [-10, 10]);

  // Eyes gaze tracking (tracks pointer + glances down when typing)
  const eyeBaseY = isFocused || mood === 'typing' ? 6 : 0;
  const eyeX = useTransform(smoothX, [-100, 100], [-8, 8]);
  const eyeY = useTransform(smoothY, [-100, 100], [-5, 5]);

  // Ears parallax in opposite perspective
  const leftEarRotate = useTransform(smoothX, [-100, 100], [-12, 6]);
  const rightEarRotate = useTransform(smoothX, [-100, 100], [-6, 12]);

  // Hands dynamic tracking
  const leftHandX = useTransform(smoothX, [-100, 100], [-4, 8]);
  const rightHandX = useTransform(smoothX, [-100, 100], [-8, 4]);

  // Time of Day determination for smart contextual greetings
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { time: 'morning', icon: '☀️' };
    if (hour >= 12 && hour < 17) return { time: 'afternoon', icon: '✨' };
    if (hour >= 17 && hour < 22) return { time: 'evening', icon: '🌆' };
    return { time: 'night', icon: '🌙' };
  }, []);

  // Spawn lively 3D floating particles
  const spawnParticles = (type: 'heart' | 'star' | 'party' | 'notes') => {
    const newItems: FloatingParticle[] = [];
    const colors = [accentColor, '#ffffff', '#38bdf8', '#f43f5e', '#fbbf24', '#a855f7'];

    const count = type === 'party' ? 22 : 9;
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 170,
        y: (Math.random() - 0.5) * 110 - 35,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        type:
          type === 'heart'
            ? 'heart'
            : type === 'star'
            ? 'star'
            : type === 'notes'
            ? 'note'
            : 'circle',
      });
    }
    setParticles(newItems);
    setTimeout(() => setParticles([]), 2000);
  };

  // Trigger playful tricks with lively animation and speech
  const triggerRandomTrick = () => {
    const availableTricks: MascotTrick[] = [
      'flip',
      'hearts',
      'dizzy',
      'tickle',
      'highfive',
      'party',
      'wink',
      'curious',
    ];

    // Pick a trick different from current one
    const filtered = availableTricks.filter((t) => t !== currentTrick);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
    setCurrentTrick(chosen);

    switch (chosen) {
      case 'flip': {
        haptic('medium');
        const flipQuotes = [
          'Woohoo! Check out this zero-gravity 360° flip! 🤸‍♂️🚀',
          'Wheee! Pixar physics in action! 🌟',
          'Ten out of ten landing! 🏆',
        ];
        setTrickSpeech(flipQuotes[Math.floor(Math.random() * flipQuotes.length)]);
        spawnParticles('star');
        break;
      }
      case 'hearts': {
        haptic('double');
        const heartQuotes = [
          "Aww! You're making my battery melt! 🥰💖",
          'Maximum friendship detected! Sending love your way! ❤️',
          "You're the coolest vault keeper ever! ✨",
        ];
        setTrickSpeech(heartQuotes[Math.floor(Math.random() * heartQuotes.length)]);
        spawnParticles('heart');
        break;
      }
      case 'dizzy': {
        haptic('light');
        const dizzyQuotes = [
          'Whoaaa... the ledger is spinning! Or is it me? 😵🌀',
          'Too much speed! Hold onto your coins! 💫',
          'Woah, my gyroscope is recalibrating haha! 🤖',
        ];
        setTrickSpeech(dizzyQuotes[Math.floor(Math.random() * dizzyQuotes.length)]);
        break;
      }
      case 'tickle': {
        haptic('selection');
        const tickleQuotes = [
          'Hahaha! Stop that, my tickle sensors are sensitive! 🤖😂',
          'Hehe, that tickles right in the microchips! ⚡',
          'No fair, tickling a robot is against the rules! 🤭',
        ];
        setTrickSpeech(tickleQuotes[Math.floor(Math.random() * tickleQuotes.length)]);
        break;
      }
      case 'highfive': {
        haptic('heavy');
        const highfiveQuotes = [
          "Boom! High-five! 🖐️⚡ We're gonna crush your debts!",
          'Virtual fist-bump! 👊💥 Your money is safe with me.',
          'Teamwork makes the dream work! 🚀',
        ];
        setTrickSpeech(highfiveQuotes[Math.floor(Math.random() * highfiveQuotes.length)]);
        spawnParticles('star');
        break;
      }
      case 'party': {
        haptic('success');
        const partyQuotes = [
          'Cue the music! Time to celebrate financial freedom! 🪩🎉',
          'Party time! 100% offline, zero subscriptions! 🎊',
          'Woohoo! Debt-free life is the best life! 🎈',
        ];
        setTrickSpeech(partyQuotes[Math.floor(Math.random() * partyQuotes.length)]);
        spawnParticles('party');
        break;
      }
      case 'wink': {
        haptic('light');
        const winkQuotes = [
          'Stay cool! Your finances are under total control. 😎✌️',
          "Smooth as butter! I've got everything locked down. 🕶️",
        ];
        setTrickSpeech(winkQuotes[Math.floor(Math.random() * winkQuotes.length)]);
        spawnParticles('star');
        break;
      }
      case 'curious': {
        haptic('selection');
        const curiousQuotes = [
          'Hmm? What are we recording today? 🧐',
          "Got some exciting transactions to log? I'm ready! 📝",
        ];
        setTrickSpeech(curiousQuotes[Math.floor(Math.random() * curiousQuotes.length)]);
        break;
      }
      default:
        break;
    }

    trickTimeoutRef.current = setTimeout(() => {
      setCurrentTrick('idle');
      setTrickSpeech(null);
    }, 3200);
  };

  // External celebration trigger (e.g. when user saves name)
  useEffect(() => {
    if (celebrateTrigger > 0) {
      if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
      setCurrentTrick('party');
      haptic('success');
      spawnParticles('party');

      const clean = userName.trim();
      const celebrationQuotes = [
        `It's official! Nice to meet you, ${clean}! 🎉`,
        `Got it memorized, ${clean}! Let's build that wealth! 💎`,
        `Welcome to the family, ${clean}! Your profile is all set! 🌟`,
      ];
      setTrickSpeech(celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)]);

      trickTimeoutRef.current = setTimeout(() => {
        setCurrentTrick('idle');
        setTrickSpeech(null);
      }, 3800);
    }
  }, [celebrateTrigger]);

  // Periodic natural blinking
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
      const nextInterval = 2600 + Math.random() * 2800;
      blinkTimeout = setTimeout(triggerBlink, nextInterval);
    };
    blinkTimeout = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Periodic idle thought rotation (when user is just viewing the screen)
  useEffect(() => {
    const idleInterval = setInterval(() => {
      setIdleThoughtIndex((prev) => prev + 1);
    }, 14000);
    return () => clearInterval(idleInterval);
  }, []);

  // Pointer tracking
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

  // Tap handler (Random trick every time user touches the mascot)
  const handleMascotTap = () => {
    triggerRandomTrick();
    if (onTap) onTap();
  };

  // =========================================================================
  // INTELLIGENT DIALOGUE ENGINE FOR MULTIPLE REAL-WORLD SCENARIOS
  // =========================================================================
  const getSpeechText = () => {
    // Priority 1: User dragging the mascot
    if (isDragging) {
      return 'Wheeeee! Where are we flying to? 🎈';
    }

    // Priority 2: Active trick reaction speech
    if (trickSpeech) {
      return trickSpeech;
    }

    // Priority 3: Restoring backup scenario
    if (isRestoring) {
      return 'Unpacking your encrypted vault with AES-256 care... 📦🔐';
    }

    // Priority 4: Celebrate mood
    if (mood === 'celebrate') {
      const clean = userName && userName.trim() ? userName.trim().split(' ')[0] : 'friend';
      return `Awesome, ${clean}! Name saved. Press Open Dashboard whenever you're ready! ⭐`;
    }

    // Priority 5: User is typing into the name box
    const cleanTyped = userName.trim();
    if (cleanTyped.length > 0 && mood === 'typing') {
      if (cleanTyped.length < 3) {
        return `Ooh, starting with "${cleanTyped}"... I'm listening! 👀`;
      }
      if (cleanTyped.length <= 8) {
        return `Ooh, "${cleanTyped}" sounds so friendly! Love it! ✨`;
      }
      return `Whoa, "${cleanTyped}"! That's a powerhouse name right there! 👑`;
    }

    // Priority 6: Input field is focused
    if (isFocused) {
      return 'Type your name or jump straight in — totally up to you! 💫';
    }

    // Priority 7: Returning user (Welcome Back)
    if (mood === 'welcome') {
      if (hasCustomName && cleanTyped) {
        const first = cleanTyped.split(' ')[0];
        const returningQuotes = [
          `Welcome back, ${first}! Everything is safe and sound. 🔒`,
          `Hey ${first}! Missed ya! Ready to check your dashboard? 📊`,
          `Welcome back, ${first}! Zero cloud leaks, 100% private. 🛡️`,
          `Look who's back! All records are in order, ${first}. 🚀`,
        ];
        return returningQuotes[idleThoughtIndex % returningQuotes.length];
      }
      const genericWelcomeQuotes = [
        'Welcome back! Your offline vault is safe and sound. 🔒',
        'Welcome back! All records are encrypted and ready. 🛡️',
      ];
      return genericWelcomeQuotes[idleThoughtIndex % genericWelcomeQuotes.length];
    }

    // Priority 8: First-time user idle (Contextual time-of-day greetings & tips)
    const timeGreetingsMap: Record<string, string[]> = {
      morning: [
        `Good morning! Ready to start a fresh financial day? ${timeGreeting.icon}`,
        "Rise and shine! Your private vault is unlocked and safe. ☕",
        "Hi! I'm Ledgie, your Pixar-trained vault buddy. No cloud, 100% private! 🛡️",
      ],
      afternoon: [
        `Good afternoon! Your financial records are in tip-top shape. ${timeGreeting.icon}`,
        "Midday check-in! Everything is stored right on your phone. ✨",
        "Hi! Feel free to write your name, or jump right into your dashboard! 🚀",
      ],
      evening: [
        `Good evening! Ready to balance today's ledger? ${timeGreeting.icon}`,
        "Evening! All your transactions are resting safely. 🌙",
        "Hi! Tap on me if you want to see some fun tricks! 🎩",
      ],
      night: [
        `Burning the midnight oil? Your private vault never sleeps. ${timeGreeting.icon}`,
        "Late night accounting? Your data stays 100% offline. 🌌",
        "Hi! I'm Ledgie. No logins needed, just pure private security! 🤖",
      ],
    };

    const currentList = timeGreetingsMap[timeGreeting.time] || timeGreetingsMap.morning;
    return currentList[idleThoughtIndex % currentList.length];
  };

  // =========================================================================
  // PIXAR EXPRESSIVE EYE ENGINE
  // =========================================================================
  const renderPixarEyes = () => {
    // 1. Organic Blinking
    if (isBlinking && currentTrick !== 'dizzy' && currentTrick !== 'hearts') {
      return (
        <div className="flex items-center gap-5">
          <div
            style={{
              width: 22,
              height: 3,
              background: '#ffffff',
              borderRadius: 3,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          <div
            style={{
              width: 22,
              height: 3,
              background: '#ffffff',
              borderRadius: 3,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
        </div>
      );
    }

    // 2. Love / Heart Eyes
    if (currentTrick === 'hearts') {
      return (
        <div className="flex items-center gap-4">
          <motion.span
            animate={{ scale: [1, 1.28, 1] }}
            transition={{ duration: 0.55, repeat: Infinity }}
            style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px #f43f5e)' }}
          >
            ❤️
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.28, 1] }}
            transition={{ duration: 0.55, repeat: Infinity, delay: 0.12 }}
            style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px #f43f5e)' }}
          >
            ❤️
          </motion.span>
        </div>
      );
    }

    // 3. Dizzy Spiral Eyes
    if (currentTrick === 'dizzy') {
      return (
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2.5px dashed ${accentColor}`,
              borderTopColor: '#ffffff',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2.5px dashed ${accentColor}`,
              borderTopColor: '#ffffff',
            }}
          />
        </div>
      );
    }

    // 4. Star Eyes on Flip / Party / Celebrate
    if (currentTrick === 'flip' || currentTrick === 'party' || mood === 'celebrate') {
      return (
        <div className="flex items-center gap-4">
          <motion.span
            animate={{ rotate: [0, 16, -16, 0], scale: [1, 1.22, 1] }}
            transition={{ duration: 0.75, repeat: Infinity }}
            style={{ fontSize: 20, filter: `drop-shadow(0 0 10px ${accentColor})` }}
          >
            ⭐
          </motion.span>
          <motion.span
            animate={{ rotate: [0, -16, 16, 0], scale: [1, 1.22, 1] }}
            transition={{ duration: 0.75, repeat: Infinity, delay: 0.1 }}
            style={{ fontSize: 20, filter: `drop-shadow(0 0 10px ${accentColor})` }}
          >
            ⭐
          </motion.span>
        </div>
      );
    }

    // 5. Cool Wink Trick
    if (currentTrick === 'wink') {
      return (
        <div className="flex items-center gap-5">
          {/* Left Winking Eye */}
          <div
            style={{
              width: 20,
              height: 3,
              background: '#ffffff',
              borderRadius: 3,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          {/* Right Wide Cool Eye with Sparkle */}
          <div
            style={{
              width: 20,
              height: 25,
              borderRadius: 12,
              background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accentColor} 80%)`,
              boxShadow: `0 0 14px ${accentColor}`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ffffff',
              }}
            />
          </div>
        </div>
      );
    }

    // 6. Joyful Arched Eyes on Welcome or Tickle (^)
    if (mood === 'welcome' || currentTrick === 'tickle') {
      return (
        <div className="flex items-center gap-4">
          <div
            style={{
              width: 20,
              height: 14,
              borderRadius: '14px 14px 0 0',
              borderTop: `4px solid ${accentColor}`,
              borderLeft: `3px solid ${accentColor}`,
              borderRight: `3px solid ${accentColor}`,
              filter: `drop-shadow(0 0 8px ${accentColor})`,
            }}
          />
          <div
            style={{
              width: 20,
              height: 14,
              borderRadius: '14px 14px 0 0',
              borderTop: `4px solid ${accentColor}`,
              borderLeft: `3px solid ${accentColor}`,
              borderRight: `3px solid ${accentColor}`,
              filter: `drop-shadow(0 0 8px ${accentColor})`,
            }}
          />
        </div>
      );
    }

    // 7. Curious Tilt Eyes
    if (currentTrick === 'curious') {
      return (
        <div className="flex items-center gap-4">
          <div
            style={{
              width: 22,
              height: 24,
              borderRadius: 12,
              background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accentColor} 85%)`,
              boxShadow: `0 0 14px ${accentColor}`,
              position: 'relative',
              transform: 'rotate(10deg)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ffffff',
              }}
            />
          </div>
          <div
            style={{
              width: 18,
              height: 20,
              borderRadius: 10,
              background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accentColor} 85%)`,
              boxShadow: `0 0 14px ${accentColor}`,
              position: 'relative',
              transform: 'rotate(-5deg)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#ffffff',
              }}
            />
          </div>
        </div>
      );
    }

    // 8. Pixar Classic Large Expressive Eyes with Dual Catchlights
    return (
      <div className="flex items-center gap-4">
        {/* Left Eye */}
        <div
          style={{
            width: 20,
            height: 26,
            borderRadius: 12,
            background: `radial-gradient(circle at 40% 32%, #ffffff 0%, #d1fae5 25%, ${accentColor} 80%, #064e3b 100%)`,
            boxShadow: `0 0 16px ${accentColor}, 0 0 24px ${accentColor}88`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Primary Pixar catchlight */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 3px #ffffff',
            }}
          />
          {/* Secondary softer catchlight */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 3.5,
              height: 3.5,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.75)',
            }}
          />
        </div>

        {/* Right Eye */}
        <div
          style={{
            width: 20,
            height: 26,
            borderRadius: 12,
            background: `radial-gradient(circle at 40% 32%, #ffffff 0%, #d1fae5 25%, ${accentColor} 80%, #064e3b 100%)`,
            boxShadow: `0 0 16px ${accentColor}, 0 0 24px ${accentColor}88`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Primary Pixar catchlight */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 3px #ffffff',
            }}
          />
          {/* Secondary softer catchlight */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 3.5,
              height: 3.5,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.75)',
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
      style={{ perspective: 1200 }}
    >
      {/* --- FLOATING BURST PARTICLES --- */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.45, 0.7],
              x: p.x,
              y: p.y,
              rotate: [0, 220],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 50,
              color: p.color,
              fontSize: p.size * 2,
            }}
          >
            {p.type === 'heart' ? '❤️' : p.type === 'star' ? '✨' : p.type === 'note' ? '🎵' : '●'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* --- INTELLIGENT DIALOGUE SPEECH BUBBLE --- */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 mb-3 max-w-[310px]"
      >
        <div
          style={{
            background: 'rgba(15, 17, 24, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '0.5px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 18,
            padding: '11px 16px',
            boxShadow: `0 16px 36px rgba(0,0,0,0.55), 0 0 24px ${accentColor}18`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Bioluminescent Pulse Dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: accentColor }}
            />
          </span>

          <AnimatePresence mode="wait">
            <motion.p
              key={getSpeechText()}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.95)',
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
            background: 'rgba(15, 17, 24, 0.88)',
            borderRight: '0.5px solid rgba(255, 255, 255, 0.16)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.16)',
            zIndex: 1,
          }}
        />
      </motion.div>

      {/* --- 3D PIXAR CHARACTER CHASSIS (DRAGGABLE & TOUCH-RESPONSIVE) --- */}
      <motion.div
        drag
        dragConstraints={{ left: -35, right: 35, top: -25, bottom: 25 }}
        dragElastic={0.4}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleMascotTap}
        className="relative flex items-center justify-center"
      >
        {/* Animated movement controller with Disney/Pixar squash & stretch */}
        <motion.div
          animate={
            currentTrick === 'flip'
              ? {
                  rotateX: [0, -30, 390, 360],
                  y: [0, 8, -48, 0],
                  scaleY: [1, 0.85, 1.25, 1],
                  scaleX: [1, 1.15, 0.85, 1],
                }
              : currentTrick === 'dizzy'
              ? {
                  rotateY: [0, 720],
                  rotateZ: [-6, 6, -4, 4, 0],
                  scale: [1, 1.05, 0.95, 1],
                }
              : currentTrick === 'tickle'
              ? {
                  x: [-9, 9, -7, 7, -4, 4, 0],
                  scaleY: [1, 0.92, 1.08, 1],
                }
              : currentTrick === 'party'
              ? {
                  y: [0, -18, 0, -12, 0],
                  rotateZ: [-4, 4, -3, 3, 0],
                  scale: [1, 1.08, 1],
                }
              : currentTrick === 'highfive'
              ? {
                  scale: [1, 1.12, 1],
                  z: [0, 30, 0],
                }
              : currentTrick === 'curious'
              ? {
                  rotateZ: [0, 16, 14],
                  y: [0, -4, -4],
                }
              : {
                  y: mood === 'welcome' || mood === 'celebrate' ? [0, -13, 0] : [0, -9, 0],
                  rotateZ: mood === 'welcome' ? [0, 2.5, -2.5, 0] : [-1.2, 1.2, -1.2],
                  scale: [1, 1.028, 1], // Organic breathing cycle
                }
          }
          transition={
            currentTrick === 'flip'
              ? { duration: 1.15, ease: [0.34, 1.56, 0.64, 1] }
              : currentTrick === 'dizzy'
              ? { duration: 1.3, ease: 'easeOut' }
              : currentTrick === 'tickle'
              ? { duration: 0.65, repeat: 3, ease: 'easeInOut' }
              : currentTrick === 'party'
              ? { duration: 0.85, repeat: 2, ease: 'easeInOut' }
              : currentTrick === 'highfive'
              ? { duration: 0.7, ease: 'easeOut' }
              : currentTrick === 'curious'
              ? { duration: 0.8, ease: 'easeOut' }
              : {
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="relative flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Ambient Pixar Rim Glow behind character */}
          <div
            style={{
              position: 'absolute',
              width: 195,
              height: 195,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}38 0%, ${accentColor}08 55%, transparent 75%)`,
              filter: 'blur(26px)',
              pointerEvents: 'none',
              transform: 'translateZ(-50px)',
            }}
          />

          {/* --- LEFT FLOATING MAGNETIC EAR POD --- */}
          <motion.div
            style={{
              rotateZ: leftEarRotate,
              position: 'absolute',
              left: -20,
              top: 36,
              width: 24,
              height: 38,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #475569 0%, #1e293b 60%, #0f172a 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.22)',
              boxShadow: `
                0 8px 18px rgba(0,0,0,0.6),
                inset 0 1px 3px rgba(255,255,255,0.4),
                inset -2px -2px 6px rgba(0,0,0,0.7)
              `,
              transform: 'translateZ(-12px)',
            }}
            animate={
              currentTrick === 'curious'
                ? { y: [-2, -8, -2], rotateZ: [0, -15, 0] }
                : currentTrick === 'dizzy'
                ? { y: [0, 8, 0], rotateZ: [0, 20, 0] }
                : { y: [0, 3, 0] }
            }
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Ear inner glow speaker ring */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12,
                height: 18,
                borderRadius: 8,
                background: `radial-gradient(ellipse, ${accentColor} 0%, transparent 80%)`,
                opacity: 0.7,
              }}
            />
          </motion.div>

          {/* --- RIGHT FLOATING MAGNETIC EAR POD --- */}
          <motion.div
            style={{
              rotateZ: rightEarRotate,
              position: 'absolute',
              right: -20,
              top: 36,
              width: 24,
              height: 38,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #475569 0%, #1e293b 60%, #0f172a 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.22)',
              boxShadow: `
                0 8px 18px rgba(0,0,0,0.6),
                inset 0 1px 3px rgba(255,255,255,0.4),
                inset -2px -2px 6px rgba(0,0,0,0.7)
              `,
              transform: 'translateZ(-12px)',
            }}
            animate={
              currentTrick === 'curious'
                ? { y: [-2, -10, -2], rotateZ: [0, 22, 0] }
                : currentTrick === 'dizzy'
                ? { y: [0, 8, 0], rotateZ: [0, -20, 0] }
                : { y: [0, -3, 0] }
            }
            transition={{ duration: 2.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Ear inner glow speaker ring */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12,
                height: 18,
                borderRadius: 8,
                background: `radial-gradient(ellipse, ${accentColor} 0%, transparent 80%)`,
                opacity: 0.7,
              }}
            />
          </motion.div>

          {/* --- LEFT ARTICULATED PIXAR HAND --- */}
          <motion.div
            style={{
              x: leftHandX,
              position: 'absolute',
              left: -32,
              top: 72,
              width: 24,
              height: 32,
              borderRadius: 14,
              background: 'radial-gradient(circle at 40% 30%, #f1f5f9 0%, #94a3b8 40%, #1e293b 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.24)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.6)',
              transform: 'translateZ(10px)',
            }}
            animate={
              currentTrick === 'party'
                ? {
                    y: [-8, 4, -8],
                    rotateZ: [-25, 20, -25],
                    x: [0, 10, 0], // Clapping gesture
                  }
                : currentTrick === 'tickle'
                ? {
                    y: [-12, -4, -12],
                    rotateZ: [20, -10, 20],
                    x: [8, 14, 8], // Covering mouth/cheeks
                  }
                : {
                    y: [0, 5, 0],
                    rotateZ: [-4, 6, -4],
                  }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Hand palm bioluminescent indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 5,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
          </motion.div>

          {/* --- RIGHT ARTICULATED PIXAR HAND (WAVING, HIGH-FIVE, CLAP) --- */}
          <motion.div
            style={{
              x: rightHandX,
              position: 'absolute',
              right: -32,
              top: 66,
              width: 24,
              height: 32,
              borderRadius: 14,
              background: 'radial-gradient(circle at 40% 30%, #f1f5f9 0%, #94a3b8 40%, #1e293b 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.24)',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.6)',
              transformOrigin: 'bottom center',
              transform: 'translateZ(20px)',
            }}
            animate={
              currentTrick === 'highfive'
                ? {
                    y: [-22, -30, -22],
                    rotateZ: [25, 45, 25],
                    scale: [1, 1.35, 1],
                  }
                : currentTrick === 'party'
                ? {
                    y: [-8, 4, -8],
                    rotateZ: [25, -20, 25],
                    x: [0, -10, 0], // Clapping gesture
                  }
                : currentTrick === 'tickle'
                ? {
                    y: [-12, -4, -12],
                    rotateZ: [-20, 10, -20],
                    x: [-8, -14, -8], // Covering mouth/cheeks
                  }
                : mood === 'welcome' || mood === 'celebrate'
                ? {
                    y: [-6, -20, -6],
                    rotateZ: [16, 44, 10, 44, 16],
                  }
                : {
                    y: [0, -4, 0],
                    rotateZ: [10, 22, 10],
                  }
            }
            transition={{
              duration: currentTrick === 'highfive' ? 0.6 : 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Hand palm bioluminescent indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 5,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 10px ${accentColor}`,
              }}
            />
          </motion.div>

          {/* --- MAIN 3D PIXAR BODY & HEAD CHASSIS --- */}
          <motion.div
            style={{
              x: headTranslateX,
              y: headTranslateY,
              width: 142,
              height: 144,
              borderRadius: '50% 50% 46% 46%',
              position: 'relative',
              background:
                'radial-gradient(circle at 35% 26%, #ffffff 0%, #e2e8f0 22%, #64748b 55%, #1e293b 80%, #090d16 100%)',
              boxShadow: `
                0 24px 55px rgba(0,0,0,0.8),
                0 0 35px ${accentColor}25,
                inset 0 2.5px 5px rgba(255,255,255,0.65),
                inset -6px -8px 22px rgba(0,0,0,0.85)
              `,
              border: '0.5px solid rgba(255, 255, 255, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Top Antenna with Pulsing Pixar Gem */}
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%) translateZ(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <motion.div
                animate={{
                  scale: currentTrick === 'party' ? [1, 1.45, 1] : [1, 1.25, 1],
                  boxShadow: [
                    `0 0 12px ${accentColor}`,
                    `0 0 28px ${accentColor}, 0 0 36px ${accentColor}99`,
                    `0 0 12px ${accentColor}`,
                  ],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: `2.5px solid ${accentColor}`,
                }}
              />
              <div
                style={{
                  width: 4,
                  height: 11,
                  background: 'linear-gradient(to bottom, #94a3b8, #1e293b)',
                  borderRadius: 2,
                }}
              />
            </div>

            {/* Pixar Studio Specular Glare (Soft Automotive Clearcoat Sheen) */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 18,
                width: 52,
                height: 26,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 80%)',
                transform: 'rotate(-25deg)',
                pointerEvents: 'none',
              }}
            />

            {/* --- DEEP CURVED OLED VISOR SCREEN (PIXAR EYES DISPLAY) --- */}
            <motion.div
              style={{
                x: visorX,
                y: visorY,
                width: 104,
                height: 66,
                borderRadius: 30,
                background: 'linear-gradient(145deg, #05070a 0%, #0d121c 60%, #151d2d 100%)',
                border: '0.5px solid rgba(255, 255, 255, 0.2)',
                boxShadow: `
                  inset 0 3px 8px rgba(0,0,0,0.95),
                  inset 0 -1px 4px rgba(255,255,255,0.15),
                  0 6px 20px rgba(0,0,0,0.7)
                `,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateZ(26px)',
              }}
            >
              {/* Visor internal 3D curved glass reflection */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
                  borderRadius: '30px 30px 0 0',
                  pointerEvents: 'none',
                }}
              />

              {/* Holographic micro scanlines */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
                  pointerEvents: 'none',
                }}
              />

              {/* --- PIXAR EXPRESSIVE EYEBROWS --- */}
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 3,
                  zIndex: 2,
                }}
              >
                <motion.div
                  animate={
                    currentTrick === 'curious'
                      ? { rotate: 20, y: -2 }
                      : isFocused
                      ? { y: 2, rotate: -6 }
                      : { y: 0, rotate: 0 }
                  }
                  style={{
                    width: 14,
                    height: 2.5,
                    borderRadius: 2,
                    background: accentColor,
                    opacity: 0.85,
                  }}
                />
                <motion.div
                  animate={
                    currentTrick === 'curious'
                      ? { rotate: -10, y: -4 }
                      : isFocused
                      ? { y: 2, rotate: 6 }
                      : { y: 0, rotate: 0 }
                  }
                  style={{
                    width: 14,
                    height: 2.5,
                    borderRadius: 2,
                    background: accentColor,
                    opacity: 0.85,
                  }}
                />
              </div>

              {/* --- EYES CONTAINER --- */}
              <motion.div
                style={{
                  x: eyeX,
                  y: eyeY,
                  marginTop: eyeBaseY,
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 2,
                }}
              >
                {renderPixarEyes()}
              </motion.div>

              {/* Glowing Rosy Pixar Cheeks on Hearts / Giggles */}
              {(currentTrick === 'hearts' || currentTrick === 'tickle') && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      bottom: 11,
                      width: 12,
                      height: 6,
                      borderRadius: '50%',
                      background: '#f43f5e',
                      boxShadow: '0 0 10px #f43f5e',
                      opacity: 0.9,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 14,
                      bottom: 11,
                      width: 12,
                      height: 6,
                      borderRadius: '50%',
                      background: '#f43f5e',
                      boxShadow: '0 0 10px #f43f5e',
                      opacity: 0.9,
                    }}
                  />
                </>
              )}

              {/* Gentle Pixar Smile Mouth */}
              {(mood === 'welcome' ||
                mood === 'celebrate' ||
                currentTrick === 'hearts' ||
                currentTrick === 'party' ||
                currentTrick === 'wink' ||
                (userName && userName.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: 7,
                    width: 14,
                    height: 5,
                    borderRadius: '0 0 9px 9px',
                    borderBottom: `2.5px solid ${accentColor}`,
                    borderLeft: `1.5px solid ${accentColor}`,
                    borderRight: `1.5px solid ${accentColor}`,
                    filter: `drop-shadow(0 0 5px ${accentColor})`,
                  }}
                />
              )}
            </motion.div>

            {/* Belly Bioluminescent Energy Core Indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                width: 16,
                height: 8,
                borderRadius: 4,
                background: `radial-gradient(ellipse, ${accentColor} 0%, transparent 80%)`,
                boxShadow: `0 0 10px ${accentColor}88`,
                opacity: 0.85,
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* --- DYNAMIC PIXAR CONTACT FLOOR SHADOW --- */}
      <motion.div
        animate={{
          scale: currentTrick === 'flip' ? [0.55, 1.45, 0.55] : [0.88, 1.15, 0.88],
          opacity: currentTrick === 'flip' ? [0.15, 0.65, 0.15] : [0.6, 0.28, 0.6],
        }}
        transition={{
          duration: currentTrick === 'flip' ? 1.15 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: 120,
          height: 18,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, transparent 75%)',
          filter: 'blur(6px)',
          marginTop: 16,
        }}
      />
    </div>
  );
};

export default Mascot3D;
