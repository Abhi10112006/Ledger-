import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as CANNON from 'cannon-es';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

export type MascotMood = 'asking' | 'typing' | 'welcome' | 'idle' | 'happy' | 'celebrate';
export type MascotTrick =
  | 'idle'
  | 'wink'
  | 'spin'
  | 'flip'
  | 'celebrate'
  | 'scan'
  | 'curious'
  | 'highfive'
  | 'hearts';

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
  onPhysicsBounce?: (intensity: number) => void;
  isLaunching?: boolean;
  onLaunchComplete?: () => void;
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
  onPhysicsBounce,
  isLaunching = false,
  onLaunchComplete,
}) => {
  const haptic = useHaptics();

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const domShadowRef = useRef<HTMLDivElement>(null);

  // Loading & UI States
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActivelyDragging, setIsActivelyDragging] = useState(false);
  const [currentTrick, setCurrentTrick] = useState<MascotTrick>('idle');
  const [trickSpeech, setTrickSpeech] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [idleThoughtIndex, setIdleThoughtIndex] = useState(0);

  // Pointer & Drag Physics Refs (Separated PointerDown from actual Drag)
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartTimeRef = useRef(0);
  const recentPointerMovesRef = useRef<{ x: number; y: number; time: number }[]>([]);

  // Synchronized State Refs for 60fps Loop
  const trickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBounceTimeRef = useRef<number>(0);

  const currentTrickRef = useRef<MascotTrick>('idle');
  currentTrickRef.current = currentTrick;

  const moodRef = useRef<MascotMood>(mood);
  moodRef.current = mood;

  const accentColorRef = useRef<string>(accentColor);
  accentColorRef.current = accentColor;

  const isFocusedRef = useRef<boolean>(isFocused);
  isFocusedRef.current = isFocused;

  // Normalized pointer coordinates (-1 to 1)
  const targetPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Three.js & Animation References
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const activeFinishListenerRef = useRef<((e: any) => void) | null>(null);
  const eyeMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const shadowMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const shockwaveMeshRef = useRef<THREE.Mesh | null>(null);
  const shockwaveMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const thrusterParticlesRef = useRef<THREE.Points | null>(null);
  const thrusterLightRef = useRef<THREE.PointLight | null>(null);

  // Cannon-ES Physics References
  const worldRef = useRef<CANNON.World | null>(null);
  const mascotBodyRef = useRef<CANNON.Body | null>(null);
  const bounceShockwaveAnimRef = useRef(0);
  const isPhysicsReadyRef = useRef(false);
  const loadTimeRef = useRef(0);

  // Launch Sequence Refs
  const isLaunchingRef = useRef(false);
  isLaunchingRef.current = isLaunching;

  // Speech & Timer Refs (Guaranteed no-stuck speech)
  const lastSpeechSetTimeRef = useRef<number>(0);
  const speechClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Time of Day determination for intelligent greetings
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { time: 'morning', icon: '☀️' };
    if (hour >= 12 && hour < 17) return { time: 'afternoon', icon: '✨' };
    if (hour >= 17 && hour < 22) return { time: 'evening', icon: '🌆' };
    return { time: 'night', icon: '🌙' };
  }, []);

  // Helper to set trick speech and track when it was set with guaranteed auto-clear
  const setTrickSpeechTracked = (text: string | null, durationMs = 3200) => {
    if (speechClearTimerRef.current) {
      clearTimeout(speechClearTimerRef.current);
      speechClearTimerRef.current = null;
    }
    setTrickSpeech(text);
    if (text !== null) {
      lastSpeechSetTimeRef.current = performance.now();
      speechClearTimerRef.current = setTimeout(() => {
        setTrickSpeech(null);
        lastSpeechSetTimeRef.current = 0;
        speechClearTimerRef.current = null;
      }, durationMs);
    } else {
      lastSpeechSetTimeRef.current = 0;
    }
  };

  // Unified timer reset so speech bubbles and states NEVER collide or get stuck
  const scheduleResetToIdle = (delayMs = 3500) => {
    if (trickTimeoutRef.current) {
      clearTimeout(trickTimeoutRef.current);
    }
    trickTimeoutRef.current = setTimeout(() => {
      setCurrentTrick('idle');
      currentTrickRef.current = 'idle';
      setTrickSpeechTracked(null);
      returnToStateLoop();
    }, delayMs);
  };

  // Spawn lively 3D floating particles
  const spawnParticles = (type: 'heart' | 'star' | 'party' | 'notes') => {
    if (particleTimeoutRef.current) clearTimeout(particleTimeoutRef.current);

    const newItems: FloatingParticle[] = [];
    const colors = [accentColorRef.current, '#ffffff', '#38bdf8', '#f43f5e', '#fbbf24', '#a855f7'];
    const count = type === 'party' ? 22 : 10;

    for (let i = 0; i < count; i++) {
      newItems.push({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 180,
        y: (Math.random() - 0.5) * 120 - 40,
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
    particleTimeoutRef.current = setTimeout(() => setParticles([]), 1900);
  };

  // Safe Animation Crossfader (Cleans up previous finished listeners so mixer never freezes)
  const crossfadeToAction = (
    actionName: string,
    isLoop = false,
    duration = 0.3,
    onFinished?: () => void
  ) => {
    const actions = actionsRef.current;
    const mixer = mixerRef.current;
    if (!actions || !mixer) return;

    // Fallback to default idle if requested clip name doesn't exist
    const nextAction =
      actions[actionName] ||
      actions['EVE_Idle_Loop01'] ||
      Object.values(actions)[0];

    if (!nextAction) return;

    // Always clean up any previous 'finished' listener before switching actions
    if (activeFinishListenerRef.current) {
      mixer.removeEventListener('finished', activeFinishListenerRef.current);
      activeFinishListenerRef.current = null;
    }

    const prevAction = currentActionRef.current;
    if (prevAction === nextAction && nextAction.isRunning()) {
      return;
    }

    if (prevAction && prevAction !== nextAction) {
      prevAction.fadeOut(duration);
    }

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);

    if (isLoop) {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    } else {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    }

    nextAction.fadeIn(duration);
    nextAction.play();
    currentActionRef.current = nextAction;

    if (!isLoop && onFinished) {
      const handleFinish = (e: any) => {
        if (e.action === nextAction) {
          mixer.removeEventListener('finished', handleFinish);
          activeFinishListenerRef.current = null;
          onFinished();
        }
      };
      activeFinishListenerRef.current = handleFinish;
      mixer.addEventListener('finished', handleFinish);
    }
  };

  // Return to appropriate background looping state based on mood
  const returnToStateLoop = () => {
    const m = moodRef.current;
    if (m === 'typing') {
      crossfadeToAction('EVE_ScanIdle_Loop', true, 0.35);
    } else if (m === 'celebrate') {
      crossfadeToAction('EVE_MultiPlayer_Win_Idle', true, 0.35);
    } else if (m === 'welcome') {
      crossfadeToAction('EVE_Idle_Active_Loop', true, 0.35);
    } else {
      crossfadeToAction('EVE_Idle_Loop01', true, 0.35);
    }
  };

  // Trigger playful tricks with official Pixar EVE animations + subtle physics impulse
  const triggerRandomTrick = () => {
    const availableTricks: MascotTrick[] = [
      'wink',
      'spin',
      'flip',
      'celebrate',
      'scan',
      'curious',
      'highfive',
      'hearts',
    ];

    const filtered = availableTricks.filter((t) => t !== currentTrickRef.current);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    setCurrentTrick(chosen);
    currentTrickRef.current = chosen;

    // Give a tiny, lively zero-G physics hop on tap (without slamming the floor!)
    if (mascotBodyRef.current) {
      const body = mascotBodyRef.current;
      body.velocity.y = Math.max(body.velocity.y, 1.35);
      body.angularVelocity.z = (Math.random() - 0.5) * 1.5;
    }

    switch (chosen) {
      case 'wink': {
        haptic('light');
        const winkQuotes = [
          'Stay cool! Your finances are under total control. 😎✌️',
          'Directive: Wink and keep all transactions 100% offline! 🕶️',
          'Affirmative! Everything is encrypted and private. ✨',
        ];
        setTrickSpeechTracked(winkQuotes[Math.floor(Math.random() * winkQuotes.length)], 3200);
        spawnParticles('star');
        crossfadeToAction('EVE_Idle_Wink', false, 0.2, () => returnToStateLoop());
        break;
      }
      case 'spin': {
        haptic('medium');
        const spinQuotes = [
          'Gyroscopes calibrated! 360-degree security perimeter scan complete! 🌀✨',
          'Wheee! Real zero-gravity pirouette! 🛸💫',
          'Scanning all angles... Zero cloud trackers detected! 🤖',
        ];
        setTrickSpeechTracked(spinQuotes[Math.floor(Math.random() * spinQuotes.length)], 3200);
        spawnParticles('star');
        crossfadeToAction('EVE_Idle_Active_Spin', false, 0.2, () => returnToStateLoop());
        break;
      }
      case 'flip': {
        haptic('heavy');
        const flipQuotes = [
          'Thrusters engaged! Check out this real Pixar zero-g boost! 🚀✨',
          'Supersonic flight maneuver! All systems nominal! 🌌',
          'Ten out of ten smooth landing! 🏆',
        ];
        setTrickSpeechTracked(flipQuotes[Math.floor(Math.random() * flipQuotes.length)], 3200);
        spawnParticles('star');
        crossfadeToAction('EVE_FlyForwardBoost_Start', false, 0.2, () => returnToStateLoop());
        break;
      }
      case 'celebrate': {
        haptic('success');
        const partyQuotes = [
          'Cue the celebrations! 100% offline, zero subscriptions! 🎊🎈',
          'Directive: Celebrate financial sovereignty! 🪩🎉',
          'Woohoo! We are going to build immense wealth together! 🌟',
        ];
        setTrickSpeechTracked(partyQuotes[Math.floor(Math.random() * partyQuotes.length)], 3600);
        spawnParticles('party');
        crossfadeToAction('EVE_MultiPlayer_Win_Start', false, 0.2, () => {
          crossfadeToAction('EVE_MultiPlayer_Win_Idle', true, 0.3);
        });
        break;
      }
      case 'scan': {
        haptic('selection');
        const scanQuotes = [
          'Scanning local device storage... AES-256 vault verified! 🔍🛡️',
          'Diagnostic check: Offline database is in pristine condition! ⚡',
          'Direct sensor scan: No third-party servers detected! 💎',
        ];
        setTrickSpeechTracked(scanQuotes[Math.floor(Math.random() * scanQuotes.length)], 3200);
        crossfadeToAction('EVE_ScanIdle_Loop', true, 0.25);
        break;
      }
      case 'curious': {
        haptic('selection');
        const curiousQuotes = [
          'Hmm? Got exciting transactions to record today? 🧐📝',
          'Directive: Awaiting your input! What shall we log? ✨',
          'Curious sensors active! Ready when you are! 👀',
        ];
        setTrickSpeechTracked(curiousQuotes[Math.floor(Math.random() * curiousQuotes.length)], 3200);
        crossfadeToAction('EVE_Idle_Active_PitchUp_L', false, 0.25, () => returnToStateLoop());
        break;
      }
      case 'highfive': {
        haptic('heavy');
        const highfiveQuotes = [
          'Virtual fist-bump! 👊💥 Teamwork makes the dream work!',
          'Boom! High-five! 🖐️⚡ We are going to crush your financial goals!',
          'Affirmative! Solid partnership locked in! 🚀',
        ];
        setTrickSpeechTracked(highfiveQuotes[Math.floor(Math.random() * highfiveQuotes.length)], 3200);
        spawnParticles('star');
        crossfadeToAction('EVE_BrakeFast', false, 0.2, () => returnToStateLoop());
        break;
      }
      case 'hearts': {
        haptic('double');
        const heartQuotes = [
          "Aww! You're making my battery melt! 🥰💖",
          'Directive: Maximum friendship mode activated! ❤️',
          'You are the best vault keeper in the galaxy! ✨',
        ];
        setTrickSpeechTracked(heartQuotes[Math.floor(Math.random() * heartQuotes.length)], 3200);
        spawnParticles('heart');
        crossfadeToAction('EVE_Idle_Active_Loop', true, 0.25);
        break;
      }
      default:
        break;
    }

    scheduleResetToIdle(3600);
  };

  // External celebration trigger (e.g., when saving user name)
  useEffect(() => {
    if (celebrateTrigger > 0) {
      setCurrentTrick('celebrate');
      currentTrickRef.current = 'celebrate';
      haptic('success');
      spawnParticles('party');

      const clean = userName.trim();
      const celebrationQuotes = [
        `Directive confirmed! Nice to meet you, ${clean}! 🎉`,
        `Saved locally with encryption, ${clean}! Let's build that wealth! 💎`,
        `Welcome aboard, ${clean}! Your offline profile is set! 🌟`,
      ];
      setTrickSpeechTracked(celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)], 4000);

      crossfadeToAction('EVE_MultiPlayer_Win_Start', false, 0.25, () => {
        crossfadeToAction('EVE_MultiPlayer_Win_Idle', true, 0.3);
      });

      scheduleResetToIdle(4000);
    }
  }, [celebrateTrigger]);

  // "Launch into Vault" exit sequence
  useEffect(() => {
    if (!isLaunching) return;

    // 1. Play the supersonic boost animation
    crossfadeToAction('EVE_FlyForwardBoost_Start', false, 0.15);

    // 2. 350ms delay: thrusters ignite with maximum intensity and apply launch boost
    const thrusterTimer = setTimeout(() => {
      if (mascotBodyRef.current) {
        const body = mascotBodyRef.current;
        isDraggingRef.current = true; // disable hover spring
        body.velocity.set(0, 14, 0);
        body.angularVelocity.set(0, 0, 0);
      }
      haptic('heavy');
      spawnParticles('star');
    }, 350);

    // 3. 950ms total: signal launch completion to transition to dashboard
    const completeTimer = setTimeout(() => {
      if (onLaunchComplete) onLaunchComplete();
    }, 950);

    return () => {
      clearTimeout(thrusterTimer);
      clearTimeout(completeTimer);
    };
  }, [isLaunching]);

  // React to mood changes (typing, asking, welcome, idle)
  useEffect(() => {
    if (currentTrickRef.current !== 'idle') return;
    returnToStateLoop();
  }, [mood]);

  // Periodic dynamic scenario dialogue rotation with strict anti-stuck failsafe
  useEffect(() => {
    const idleInterval = setInterval(() => {
      setIdleThoughtIndex((prev) => prev + 1);

      // Strict failsafe: if any trickSpeech has been displaying for more than 4 seconds, clear it immediately
      if (lastSpeechSetTimeRef.current > 0) {
        const elapsed = performance.now() - lastSpeechSetTimeRef.current;
        if (elapsed > 3800) {
          setTrickSpeechTracked(null);
          setCurrentTrick('idle');
          currentTrickRef.current = 'idle';
          returnToStateLoop();
        }
      }
    }, 6000);
    return () => clearInterval(idleInterval);
  }, []);

  // =========================================================================
  // FIXED POINTER & DRAG / TAP DETECTION (WITH 14PX DEADZONE)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    dragStartTimeRef.current = performance.now();
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    recentPointerMovesRef.current = [{ x: e.clientX, y: e.clientY, time: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Always update gaze pointer smoothly
    targetPointerRef.current = {
      x: Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2))),
    };

    if (!isPointerDownRef.current) return;

    const now = performance.now();
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    const distFromStart = Math.hypot(dx, dy);

    // CRITICAL FIX: Only enter drag mode if finger moved more than 14px!
    // Prevents normal taps from yanking EVE toward the finger position.
    if (!isDraggingRef.current && distFromStart > 14) {
      isDraggingRef.current = true;
      setIsActivelyDragging(true);
    }

    if (isDraggingRef.current && mascotBodyRef.current) {
      recentPointerMovesRef.current.push({ x: e.clientX, y: e.clientY, time: now });
      if (recentPointerMovesRef.current.length > 8) {
        recentPointerMovesRef.current.shift();
      }

      const worldTargetX = THREE.MathUtils.clamp(
        ((e.clientX - centerX) / (rect.width / 2)) * 1.15,
        -1.05,
        1.05
      );
      const worldTargetY = THREE.MathUtils.clamp(
        -((e.clientY - centerY) / (rect.height / 2)) * 0.95,
        -0.75,
        0.95
      );

      const body = mascotBodyRef.current;
      body.velocity.x = (worldTargetX - body.position.x) * 18;
      body.velocity.y = (worldTargetY - body.position.y) * 18;
      body.velocity.z = 0;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    const wasDragging = isDraggingRef.current;
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    setIsActivelyDragging(false);

    const now = performance.now();
    const duration = now - dragStartTimeRef.current;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    // 1. Clean Tap (Forgiving threshold on mobile glass screens)
    if (!wasDragging || (dist < 28 && duration < 450)) {
      triggerRandomTrick();
      if (onTap) onTap();
      return;
    }

    // 2. Calculate release flick velocity for intentional swipes
    const recent = recentPointerMovesRef.current;
    let velX = 0;
    let velY = 0; // Positive = downward screen swipe
    if (recent.length >= 2) {
      const oldest = recent[0];
      const newest = recent[recent.length - 1];
      const dt = Math.max(0.016, (newest.time - oldest.time) / 1000);
      velX = (newest.x - oldest.x) / dt / 220;
      velY = (newest.y - oldest.y) / dt / 220;
    }

    if (mascotBodyRef.current) {
      const body = mascotBodyRef.current;

      // Intentional downward throw (requires real downward distance + speed)
      if (dy > 65 && velY > 2.8) {
        const downSpeed = THREE.MathUtils.clamp(velY * 2.2, 6.0, 11.0);
        body.velocity.set(velX * 1.4, -downSpeed, 0);
        body.angularVelocity.set(0, 0, -velX * 3.0);

        haptic('heavy');
        const fallQuotes = [
          'Whoaaaa! Free-falling! Downward G-force! 📉💫',
          'Mayday! Brace for impact on the login card! 💥',
          'Gravity test in progress! Hold onto your coins! 🛸',
        ];
        setTrickSpeechTracked(fallQuotes[Math.floor(Math.random() * fallQuotes.length)], 3000);
        crossfadeToAction('EVE_BrakeFast', false, 0.15, () => returnToStateLoop());
        scheduleResetToIdle(3200);
      } else if (Math.abs(dx) > 60 && Math.abs(velX) > 2.5) {
        // Intentional sideways toss
        body.velocity.set(
          THREE.MathUtils.clamp(velX * 2.0, -8, 8),
          THREE.MathUtils.clamp(-velY * 1.2, -5, 5),
          0
        );
        body.angularVelocity.set(0, 0, -velX * 2.5);
        haptic('medium');
      }
    }
  };

  const handlePointerLeave = () => {
    if (!isPointerDownRef.current) {
      targetPointerRef.current = { x: 0, y: 0 };
    }
  };

  // =========================================================================
  // INTELLIGENT DIALOGUE ENGINE (Scenario-Aware & Dynamically Rotating)
  // =========================================================================
  const getSpeechText = () => {
    if (isLaunching) {
      return 'Thrusters engaged! Launching into your encrypted vault! 🚀✨';
    }
    if (isActivelyDragging) {
      return 'Wheeeee! Zero-gravity flight mode engaged! 🛸✨';
    }
    if (trickSpeech) {
      return trickSpeech;
    }
    if (isRestoring) {
      return 'Unpacking your encrypted vault with AES-256 care... 📦🔐';
    }
    if (mood === 'celebrate') {
      const clean = userName && userName.trim() ? userName.trim().split(' ')[0] : 'friend';
      return `Directive complete! Saved, ${clean}. Tap Open Dashboard whenever you're ready! ⭐`;
    }

    const cleanTyped = userName.trim();
    if (cleanTyped.length > 0 && mood === 'typing') {
      if (cleanTyped.length < 3) {
        return `Scanning... "${cleanTyped}" detected. I am listening! 👀`;
      }
      if (cleanTyped.length <= 8) {
        return `Ooh, "${cleanTyped}" has a great ring to it! Love it! ✨`;
      }
      return `Whoa, "${cleanTyped}"! That's a powerhouse name right there! 👑`;
    }

    if (isFocused) {
      return 'Type your name or jump straight in — totally up to you! 💫';
    }

    if (mood === 'welcome') {
      if (hasCustomName && cleanTyped) {
        const first = cleanTyped.split(' ')[0];
        const returningQuotes = [
          `Welcome back, ${first}! Everything is safe and sound. 🔒`,
          `Directive: All financial records encrypted and intact. Ready when you are, ${first}! 🚀`,
          `Welcome back, ${first}! Zero cloud leaks, 100% private. 🛡️`,
          `Look who is back! Systems nominal, ${first}. Let's check the ledger! 💎`,
          `All biometric & local vaults secure. Ready to manage expenses, ${first}? ✨`,
        ];
        return returningQuotes[idleThoughtIndex % returningQuotes.length];
      }
      const genericWelcomeQuotes = [
        'Welcome back! Your offline vault is safe and sound. 🔒',
        'Welcome back! All records are encrypted and ready. 🛡️',
        'Directive: Vault secured with AES-256 offline encryption. 💎',
        'Ready to roll! Tap Open Dashboard to review your ledger! 🚀',
      ];
      return genericWelcomeQuotes[idleThoughtIndex % genericWelcomeQuotes.length];
    }

    const dynamicScenarios = [
      timeGreeting.time === 'morning'
        ? `Good morning! Ready for a fresh financial day? ${timeGreeting.icon}`
        : timeGreeting.time === 'afternoon'
        ? `Good afternoon! Financial records are in tip-top shape. ${timeGreeting.icon}`
        : timeGreeting.time === 'evening'
        ? `Good evening! Ready to balance today's ledger? ${timeGreeting.icon}`
        : `Late night accounting? Your private vault never sleeps. ${timeGreeting.icon}`,
      "Hi! I'm EVE. No cloud, no signups, 100% offline & private! 🛡️",
      'Directive: Protect your offline wealth with AES-256 security! 💎',
      'Tip: Tap me for zero-G tricks, or swipe me down to see me bounce! 🛸',
      'You can write your name above or tap Open Dashboard to jump right in! 🚀',
      'Diagnostic check: Offline database is healthy and pristine! ⚡',
      'Zero third-party trackers detected. Your data stays right on this device! 🔒',
      'E-v-a! Gyroscopes calibrated and ready for action! 🤖✨',
    ];

    return dynamicScenarios[idleThoughtIndex % dynamicScenarios.length];
  };

  // =========================================================================
  // REAL CANNON-ES RIGID BODY SIMULATION & THREE.JS PIXAR SCENE
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 360;
    const height = 310;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.18, 3.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;

    // 2. Procedural Studio Reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvironment = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 1.1;
    roomEnvironment.dispose();
    pmremGenerator.dispose();

    // 3. Pixar Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.0);
    keyLight.position.set(3.2, 4.2, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.5);
    fillLight.position.set(-3.2, -0.8, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(new THREE.Color(accentColorRef.current), 5.5, 9);
    rimLight.position.set(0, 1.2, -2.5);
    scene.add(rimLight);

    const frontAccentLight = new THREE.PointLight(new THREE.Color(accentColorRef.current), 2.2, 5);
    frontAccentLight.position.set(0, -0.8, 2.4);
    scene.add(frontAccentLight);

    const thrusterLight = new THREE.PointLight(new THREE.Color(accentColorRef.current), 0, 4);
    thrusterLight.position.set(0, -0.6, 0);
    scene.add(thrusterLight);
    thrusterLightRef.current = thrusterLight;

    // 4. Ground Contact Shadow Plane inside 3D Scene
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(0.35, 'rgba(0,0,0,0.32)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.92, 0);
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;
    shadowMatRef.current = shadowMat;

    // 5. Elastic Contact Impact Shockwave Ring
    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.22, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColorRef.current),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.rotation.x = -Math.PI / 2;
    shockwaveMesh.position.set(0, -0.91, 0);
    scene.add(shockwaveMesh);
    shockwaveMeshRef.current = shockwaveMesh;
    shockwaveMatRef.current = shockwaveMat;

    // 6. Thruster Plasma Jet Particles System
    const particleCount = 24;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 0.2;
      particlePositions[i * 3 + 1] = -0.5 - Math.random() * 0.4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(accentColorRef.current),
      size: 0.045,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const thrusterParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(thrusterParticles);
    thrusterParticlesRef.current = thrusterParticles;

    // 7. Model Root Group
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    modelRootRef.current = modelRoot;

    // =========================================================================
    // CANNON-ES REAL RIGID BODY PHYSICS (CONSTRAINED & BOXED)
    // =========================================================================
    const world = new CANNON.World();
    world.gravity.set(0, -22, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    if ('iterations' in world.solver) {
      (world.solver as CANNON.GSSolver).iterations = 10;
    }
    worldRef.current = world;

    const mascotPhysicsMat = new CANNON.Material('mascot');
    const groundPhysicsMat = new CANNON.Material('ground');
    const wallPhysicsMat = new CANNON.Material('wall');

    world.addContactMaterial(
      new CANNON.ContactMaterial(mascotPhysicsMat, groundPhysicsMat, {
        restitution: 0.62,
        friction: 0.15,
      })
    );
    world.addContactMaterial(
      new CANNON.ContactMaterial(mascotPhysicsMat, wallPhysicsMat, {
        restitution: 0.7,
        friction: 0.05,
      })
    );

    // Floor Boundary
    const groundBody = new CANNON.Body({ mass: 0, material: groundPhysicsMat });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -0.88, 0);
    world.addBody(groundBody);

    // Left & Right Wall Boundaries (Tighter so EVE never clips canvas edges)
    const leftWall = new CANNON.Body({ mass: 0, material: wallPhysicsMat });
    leftWall.addShape(new CANNON.Plane());
    leftWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    leftWall.position.set(-1.15, 0, 0);
    world.addBody(leftWall);

    const rightWall = new CANNON.Body({ mass: 0, material: wallPhysicsMat });
    rightWall.addShape(new CANNON.Plane());
    rightWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    rightWall.position.set(1.15, 0, 0);
    world.addBody(rightWall);

    // Ceiling Boundary
    const ceiling = new CANNON.Body({ mass: 0, material: wallPhysicsMat });
    ceiling.addShape(new CANNON.Plane());
    ceiling.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    ceiling.position.set(0, 1.25, 0);
    world.addBody(ceiling);

    // Mascot Rigid Body
    const mascotSphere = new CANNON.Sphere(0.44);
    const mascotBody = new CANNON.Body({
      mass: 1.8,
      shape: mascotSphere,
      material: mascotPhysicsMat,
      linearDamping: 0.12,
      angularDamping: 0.4,
      linearFactor: new CANNON.Vec3(1, 1, 0),
      angularFactor: new CANNON.Vec3(0, 0, 1),
    });
    mascotBody.position.set(0, 0, 0);
    world.addBody(mascotBody);
    mascotBodyRef.current = mascotBody;

    // Collision listener with 450ms cooldown and startup protection so multiple bounces don't spam state
    mascotBody.addEventListener('collide', (e: any) => {
      // Don't register collisions before physics is ready, during startup settling (first 900ms), or during launch
      if (!isPhysicsReadyRef.current) return;
      if (performance.now() - loadTimeRef.current < 900) return;
      if (isLaunchingRef.current) return;

      const now = performance.now();
      if (now - lastBounceTimeRef.current < 450) return;

      let impactSpeed = 0;
      if (e.contact) {
        impactSpeed = Math.abs(e.contact.getImpactVelocityAlongNormal());
      }

      if (impactSpeed > 2.4) {
        lastBounceTimeRef.current = now;
        haptic('heavy');
        bounceShockwaveAnimRef.current = 1.0;
        if (onPhysicsBounce) {
          onPhysicsBounce(impactSpeed);
        }

        const bounceQuotes = [
          'Boiiing! Elastic collision test passed! 🏀✨',
          'Oof! Soft landing! Anti-gravity thrusters firing! ⚡',
          'Spring physics engaged! Re-centering altitude! 🚀',
        ];
        setTrickSpeechTracked(bounceQuotes[Math.floor(Math.random() * bounceQuotes.length)], 2600);
        scheduleResetToIdle(2800);
      } else if (impactSpeed > 1.1) {
        lastBounceTimeRef.current = now;
        haptic('light');
      }
    });

    // 8. Load official Pixar EVE GLB Model (Supports Both Single & Array Materials)
    const loader = new GLTFLoader();
    loader.load(
      '/models/EVE.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(1.36);
        model.position.set(0, -0.65, 0);
        modelRoot.add(model);

        const physicalShellMat = new THREE.MeshPhysicalMaterial({
          color: 0xfbfcfe,
          roughness: 0.14,
          metalness: 0.02,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          sheen: 0.35,
          sheenRoughness: 0.25,
          sheenColor: new THREE.Color(0xffffff),
          envMapIntensity: 1.35,
        });

        const upgradeMaterial = (mat: THREE.Material): THREE.Material => {
          if (mat.name === 'mat_0' || mat.name === 'mat_1' || mat.name === 'mat_6') {
            const shell = physicalShellMat.clone();
            shell.name = mat.name;
            return shell;
          } else if (mat.name === 'EVE_Head_COMN') {
            const stdMat = mat as THREE.MeshStandardMaterial;
            const visorMat = new THREE.MeshPhysicalMaterial({
              color: 0x111624,
              map: stdMat.map || null,
              roughness: 0.08,
              metalness: 0.18,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
              envMapIntensity: 1.45,
              transparent: stdMat.transparent,
              opacity: stdMat.opacity,
            });
            visorMat.name = mat.name;
            return visorMat;
          } else if (mat.name === 'EVE_Eye_COMN') {
            const eyeMat = mat as THREE.MeshStandardMaterial;
            eyeMat.toneMapped = false;
            eyeMat.emissive = new THREE.Color(accentColorRef.current);
            eyeMat.emissiveIntensity = 2.8;
            eyeMatRef.current = eyeMat;
            return eyeMat;
          }
          return mat;
        };

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.SkinnedMesh;
            mesh.frustumCulled = false;

            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map(upgradeMaterial);
            } else if (mesh.material) {
              mesh.material = upgradeMaterial(mesh.material);
            }
          }
        });

        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;

        const actionsMap: Record<string, THREE.AnimationAction> = {};
        gltf.animations.forEach((clip) => {
          actionsMap[clip.name] = mixer.clipAction(clip);
        });
        actionsRef.current = actionsMap;

        const initialClipName =
          moodRef.current === 'typing'
            ? 'EVE_ScanIdle_Loop'
            : moodRef.current === 'welcome'
            ? 'EVE_Idle_Active_Loop'
            : 'EVE_Idle_Loop01';

        const startAction = actionsMap[initialClipName] || actionsMap['EVE_Idle_Loop01'];
        if (startAction) {
          startAction.setLoop(THREE.LoopRepeat, Infinity);
          startAction.play();
          currentActionRef.current = startAction;
        }

        // Reset physics body at equilibrium position before enabling physics simulation
        mascotBody.position.set(0, 0, 0);
        mascotBody.velocity.set(0, 0, 0);
        mascotBody.angularVelocity.set(0, 0, 0);
        loadTimeRef.current = performance.now();
        isPhysicsReadyRef.current = true;

        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Failed to load EVE.glb:', error);
      }
    );

    // =========================================================================
    // DYNAMICS SIMULATION & ANIMATION LOOP
    // =========================================================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    let gazePitch = 0;
    let gazeYaw = 0;
    let gazeVelPitch = 0;
    let gazeVelYaw = 0;

    const physicsRollQuat = new THREE.Quaternion();
    const gazeTiltEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    const gazeTiltQuat = new THREE.Quaternion();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      // Theme color sync
      const activeColor = new THREE.Color(accentColorRef.current);
      if (eyeMatRef.current) {
        eyeMatRef.current.emissive.copy(activeColor);
        eyeMatRef.current.emissiveIntensity = 2.8 + Math.sin(elapsedTime * 3.0) * 0.4;
      }
      rimLight.color.copy(activeColor);
      frontAccentLight.color.copy(activeColor);
      if (shockwaveMatRef.current) shockwaveMatRef.current.color.copy(activeColor);
      if (thrusterLightRef.current) thrusterLightRef.current.color.copy(activeColor);

      // 1. Step Cannon-ES Physics World
      if (worldRef.current && mascotBodyRef.current) {
        const body = mascotBodyRef.current;

        // If physics is not ready yet, keep EVE stably anchored at equilibrium with 0 velocity
        if (!isPhysicsReadyRef.current) {
          body.position.set(0, 0, 0);
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          worldRef.current.step(1 / 60, dt, 3);
          if (modelRootRef.current) {
            modelRootRef.current.position.set(0, 0, 0);
          }
          renderer.render(scene, camera);
          return;
        }

        // Hard clamp position inside visible frustum so EVE never escapes the box
        body.position.x = THREE.MathUtils.clamp(body.position.x, -1.12, 1.12);
        body.position.y = THREE.MathUtils.clamp(body.position.y, -0.88, 1.2);
        body.position.z = 0;
        body.velocity.z = 0;
        body.angularVelocity.x = 0;
        body.angularVelocity.y = 0;

        if (!isDraggingRef.current) {
          const hoverTargetY = Math.sin(elapsedTime * 2.2) * 0.045;
          const hoverTargetX = 0;

          const kSpringY = 38;
          const kDampY = 10.5;
          const kSpringX = 20;
          const kDampX = 7.5;

          const fAntiGrav = -body.mass * world.gravity.y;
          const fSpringY = -kSpringY * (body.position.y - hoverTargetY) - kDampY * body.velocity.y;
          const fSpringX = -kSpringX * (body.position.x - hoverTargetX) - kDampX * body.velocity.x;

          body.applyForce(new CANNON.Vec3(fSpringX, fAntiGrav + fSpringY, 0));
          body.angularVelocity.z += (-body.quaternion.z * 20 - body.angularVelocity.z * 8) * dt;
        }

        worldRef.current.step(1 / 60, dt, 3);

        // 2. Smooth 3D Gaze Tilt Applied to modelRoot (100% immune to neck/head detachment!)
        const isIdleOrTyping =
          currentTrickRef.current === 'idle' ||
          currentTrickRef.current === 'scan' ||
          currentTrickRef.current === 'hearts';

        const targetYaw = isIdleOrTyping
          ? THREE.MathUtils.clamp(targetPointerRef.current.x * 0.32, -0.32, 0.32)
          : 0;
        const targetPitch = isIdleOrTyping
          ? THREE.MathUtils.clamp(
              isFocusedRef.current ? 0.22 : targetPointerRef.current.y * 0.2,
              -0.22,
              0.24
            )
          : 0;

        const kGazeSpring = 22;
        const dGazeDamping = 7.5;
        gazeVelYaw += ((targetYaw - gazeYaw) * kGazeSpring - gazeVelYaw * dGazeDamping) * dt;
        gazeVelPitch += ((targetPitch - gazePitch) * kGazeSpring - gazeVelPitch * dGazeDamping) * dt;
        gazeYaw += gazeVelYaw * dt;
        gazePitch += gazeVelPitch * dt;

        if (modelRootRef.current) {
          modelRootRef.current.position.set(body.position.x, body.position.y, 0);

          // Combine Cannon Z-roll with smooth 3D pointer gaze
          physicsRollQuat.set(0, 0, body.quaternion.z, body.quaternion.w).normalize();
          gazeTiltEuler.set(gazePitch, gazeYaw, -gazeYaw * 0.1, 'YXZ');
          gazeTiltQuat.setFromEuler(gazeTiltEuler);

          modelRootRef.current.quaternion.copy(physicsRollQuat).multiply(gazeTiltQuat);
        }

        // 3. Thruster Jet Particle Exhaust Effect
        let upwardThrust = Math.max(0, -body.velocity.y * 0.15 + (body.position.y < -0.2 ? 0.6 : 0.1));
        if (isLaunchingRef.current) {
          upwardThrust = 4.0;
        }

        if (thrusterLightRef.current) {
          thrusterLightRef.current.position.set(body.position.x, body.position.y - 0.45, 0);
          thrusterLightRef.current.intensity = isLaunchingRef.current ? 16 : upwardThrust * 3.5;
        }

        if (thrusterParticlesRef.current) {
          thrusterParticlesRef.current.position.set(body.position.x, body.position.y, 0);
          const mat = thrusterParticlesRef.current.material as THREE.PointsMaterial;
          mat.opacity = isLaunchingRef.current ? 0.95 : Math.min(0.9, upwardThrust * 1.2);
        }

        // 4. Ground Contact Shadow in 3D Scene
        if (shadowMeshRef.current && shadowMatRef.current) {
          const altitude = body.position.y - -0.88;
          const shadowScale = Math.max(0.6, 1 + altitude * 0.35);
          shadowMeshRef.current.position.x = body.position.x * 0.85;
          shadowMeshRef.current.scale.setScalar(shadowScale);
          shadowMatRef.current.opacity = Math.max(0.12, Math.min(0.85, 0.7 - altitude * 0.4));
        }

        // 5. Direct DOM shadow mutation (Zero React Re-Renders)
        if (domShadowRef.current) {
          const alt = body.position.y - -0.88;
          const domBlur = Math.max(4, 8 + alt * 18);
          const domOpacity = Math.max(0.12, Math.min(0.78, 0.7 - alt * 0.35));
          const domX = body.position.x * 40;
          const domOffsetY = Math.max(2, 10 - alt * 6);
          const domScale = Math.max(0.75, 1.05 - alt * 0.15);

          domShadowRef.current.style.transform = `translate3d(${domX}px, ${domOffsetY}px, 0) scaleX(${domScale})`;
          domShadowRef.current.style.filter = `blur(${domBlur}px)`;
          domShadowRef.current.style.opacity = `${domOpacity}`;
        }

        // 6. Contact Impact Shockwave Ring Animation
        if (bounceShockwaveAnimRef.current > 0 && shockwaveMeshRef.current && shockwaveMatRef.current) {
          bounceShockwaveAnimRef.current = Math.max(0, bounceShockwaveAnimRef.current - dt * 2.5);
          const progress = 1 - bounceShockwaveAnimRef.current;
          const s = 0.3 + progress * 2.4;
          shockwaveMeshRef.current.position.x = body.position.x;
          shockwaveMeshRef.current.scale.set(s, s, s);
          shockwaveMatRef.current.opacity = Math.sin(bounceShockwaveAnimRef.current * Math.PI) * 0.85;
        }
      }

      // 7. Update Skeletal Animation Mixer (No manual bone overrides afterward!)
      if (mixerRef.current) {
        mixerRef.current.update(dt);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
      if (particleTimeoutRef.current) clearTimeout(particleTimeoutRef.current);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (scene.environment) {
        scene.environment.dispose();
      }
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
      shockwaveGeo.dispose();
      shockwaveMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ perspective: 1200, touchAction: 'none' }}
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
        className="relative z-30 mb-2 max-w-[320px]"
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

      {/* --- REAL THREE.JS 3D CANVAS WITH CANNON RIGID BODY PHYSICS --- */}
      <div
        className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-visible"
        style={{ width: 360, height: 310 }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-16 h-16 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            width: 360,
            height: 310,
            display: 'block',
            outline: 'none',
          }}
        />
      </div>

      {/* --- PHYSICALLY ACCURATE SOFT SHADOW CAST DIRECTLY ONTO LOGIN FORM UI --- */}
      <div
        className="pointer-events-none w-full flex justify-center"
        style={{
          height: 12,
          marginTop: -16,
          zIndex: 5,
        }}
      >
        <div
          ref={domShadowRef}
          style={{
            width: 160,
            height: 12,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 80%)',
            transform: 'translate3d(0px, 8px, 0) scaleX(1)',
            filter: 'blur(20px)',
            opacity: 0.45,
            willChange: 'transform, filter, opacity',
          }}
        />
      </div>
    </div>
  );
};

export default Mascot3D;