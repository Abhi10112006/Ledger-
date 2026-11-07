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
}) => {
  const haptic = useHaptics();

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Loading & Readiness state
  const [isLoaded, setIsLoaded] = useState(false);

  // Direct DOM ref for soft shadow to eliminate 60fps React re-renders!
  const domShadowRef = useRef<HTMLDivElement>(null);

  // Trick & Interaction States
  const [currentTrick, setCurrentTrick] = useState<MascotTrick>('idle');
  const [trickSpeech, setTrickSpeech] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [idleThoughtIndex, setIdleThoughtIndex] = useState(0);

  // Drag physics states
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartTimeRef = useRef(0);
  const recentPointerMovesRef = useRef<{ x: number; y: number; time: number }[]>([]);

  // Animation Refs
  const trickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const eyeMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const headBoneRef = useRef<THREE.Object3D | null>(null);
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
  const isFallingRef = useRef(false);
  const bounceShockwaveAnimRef = useRef(0); // 0 to 1

  // Time of Day determination for intelligent greetings
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

    const count = type === 'party' ? 24 : 10;
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
    setTimeout(() => setParticles([]), 2000);
  };

  // Helper to crossfade animation actions smoothly
  const crossfadeToAction = (
    actionName: string,
    isLoop = false,
    duration = 0.35,
    onFinished?: () => void
  ) => {
    const actions = actionsRef.current;
    if (!actions || !actions[actionName]) return;

    const nextAction = actions[actionName];
    const prevAction = currentActionRef.current;

    if (prevAction === nextAction && nextAction.isRunning()) {
      return;
    }

    if (prevAction && prevAction !== nextAction) {
      prevAction.fadeOut(duration);
    }

    nextAction.reset();
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

    if (!isLoop && onFinished && mixerRef.current) {
      const mixer = mixerRef.current;
      const handleFinish = (e: any) => {
        if (e.action === nextAction) {
          mixer.removeEventListener('finished', handleFinish);
          onFinished();
        }
      };
      mixer.addEventListener('finished', handleFinish);
    }
  };

  // Return to appropriate background looping state based on mood
  const returnToStateLoop = () => {
    const m = moodRef.current;
    if (m === 'typing') {
      crossfadeToAction('EVE_ScanIdle_Loop', true, 0.4);
    } else if (m === 'celebrate') {
      crossfadeToAction('EVE_MultiPlayer_Win_Idle', true, 0.4);
    } else if (m === 'welcome') {
      crossfadeToAction('EVE_Idle_Active_Loop', true, 0.4);
    } else {
      crossfadeToAction('EVE_Idle_Loop01', true, 0.4);
    }
  };

  // Trigger playful tricks with official Pixar EVE animations
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

    const filtered = availableTricks.filter((t) => t !== currentTrick);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
    setCurrentTrick(chosen);

    switch (chosen) {
      case 'wink': {
        haptic('light');
        const winkQuotes = [
          'Stay cool! Your finances are under total control. 😎✌️',
          "Directive: Wink and keep all transactions 100% offline! 🕶️",
          'Affirmative! Everything is encrypted and private. ✨',
        ];
        setTrickSpeech(winkQuotes[Math.floor(Math.random() * winkQuotes.length)]);
        spawnParticles('star');
        crossfadeToAction('EVE_Idle_Wink', false, 0.25, () => {
          returnToStateLoop();
        });
        break;
      }
      case 'spin': {
        haptic('medium');
        const spinQuotes = [
          'Gyroscopes calibrated! 360-degree security perimeter scan complete! 🌀✨',
          'Wheee! Real zero-gravity pirouette! 🛸💫',
          'Scanning all angles... Zero cloud trackers detected! 🤖',
        ];
        setTrickSpeech(spinQuotes[Math.floor(Math.random() * spinQuotes.length)]);
        spawnParticles('star');
        crossfadeToAction('EVE_Idle_Active_Spin', false, 0.25, () => {
          returnToStateLoop();
        });
        break;
      }
      case 'flip': {
        haptic('heavy');
        const flipQuotes = [
          'Thrusters engaged! Check out this real Pixar zero-g boost! 🚀✨',
          'Supersonic flight maneuver! All systems nominal! 🌌',
          'Ten out of ten smooth landing! 🏆',
        ];
        setTrickSpeech(flipQuotes[Math.floor(Math.random() * flipQuotes.length)]);
        spawnParticles('star');
        crossfadeToAction('EVE_FlyForwardBoost_Start', false, 0.25, () => {
          returnToStateLoop();
        });
        break;
      }
      case 'celebrate': {
        haptic('success');
        const partyQuotes = [
          'Cue the celebrations! 100% offline, zero subscriptions! 🎊🎈',
          'Directive: Celebrate financial sovereignty! 🪩🎉',
          'Woohoo! We are going to build immense wealth together! 🌟',
        ];
        setTrickSpeech(partyQuotes[Math.floor(Math.random() * partyQuotes.length)]);
        spawnParticles('party');
        crossfadeToAction('EVE_MultiPlayer_Win_Start', false, 0.25, () => {
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
        setTrickSpeech(scanQuotes[Math.floor(Math.random() * scanQuotes.length)]);
        crossfadeToAction('EVE_ScanIdle_Loop', false, 0.3, () => {
          returnToStateLoop();
        });
        break;
      }
      case 'curious': {
        haptic('selection');
        const curiousQuotes = [
          'Hmm? Got exciting transactions to record today? 🧐📝',
          'Directive: Awaiting your input! What shall we log? ✨',
          'Curious sensors active! Ready when you are! 👀',
        ];
        setTrickSpeech(curiousQuotes[Math.floor(Math.random() * curiousQuotes.length)]);
        crossfadeToAction('EVE_Idle_Active_PitchUp_L', false, 0.3, () => {
          returnToStateLoop();
        });
        break;
      }
      case 'highfive': {
        haptic('heavy');
        const highfiveQuotes = [
          'Virtual fist-bump! 👊💥 Teamwork makes the dream work!',
          'Boom! High-five! 🖐️⚡ We are going to crush your financial goals!',
          'Affirmative! Solid partnership locked in! 🚀',
        ];
        setTrickSpeech(highfiveQuotes[Math.floor(Math.random() * highfiveQuotes.length)]);
        spawnParticles('star');
        crossfadeToAction('EVE_BrakeFast', false, 0.25, () => {
          returnToStateLoop();
        });
        break;
      }
      case 'hearts': {
        haptic('double');
        const heartQuotes = [
          "Aww! You're making my battery melt! 🥰💖",
          'Directive: Maximum friendship mode activated! ❤️',
          'You are the best vault keeper in the galaxy! ✨',
        ];
        setTrickSpeech(heartQuotes[Math.floor(Math.random() * heartQuotes.length)]);
        spawnParticles('heart');
        crossfadeToAction('EVE_Idle_Active_Loop', false, 0.3, () => {
          returnToStateLoop();
        });
        break;
      }
      default:
        break;
    }

    trickTimeoutRef.current = setTimeout(() => {
      setCurrentTrick('idle');
      setTrickSpeech(null);
      returnToStateLoop();
    }, 3800);
  };

  // External celebration trigger
  useEffect(() => {
    if (celebrateTrigger > 0) {
      if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
      setCurrentTrick('celebrate');
      haptic('success');
      spawnParticles('party');

      const clean = userName.trim();
      const celebrationQuotes = [
        `Directive confirmed! Nice to meet you, ${clean}! 🎉`,
        `Saved locally with encryption, ${clean}! Let's build that wealth! 💎`,
        `Welcome aboard, ${clean}! Your offline profile is set! 🌟`,
      ];
      setTrickSpeech(celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)]);

      crossfadeToAction('EVE_MultiPlayer_Win_Start', false, 0.25, () => {
        crossfadeToAction('EVE_MultiPlayer_Win_Idle', true, 0.3);
      });

      trickTimeoutRef.current = setTimeout(() => {
        setCurrentTrick('idle');
        setTrickSpeech(null);
        returnToStateLoop();
      }, 4200);
    }
  }, [celebrateTrigger]);

  // React to mood changes (typing, asking, welcome, idle)
  useEffect(() => {
    if (currentTrick !== 'idle') return;

    if (mood === 'typing') {
      crossfadeToAction('EVE_ScanIdle_Loop', true, 0.35);
    } else if (mood === 'celebrate') {
      crossfadeToAction('EVE_MultiPlayer_Win_Idle', true, 0.35);
    } else if (mood === 'welcome') {
      crossfadeToAction('EVE_Idle_Active_Loop', true, 0.35);
    } else {
      crossfadeToAction('EVE_Idle_Loop01', true, 0.35);
    }
  }, [mood]);

  // Periodic idle thought rotation
  useEffect(() => {
    const idleInterval = setInterval(() => {
      setIdleThoughtIndex((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(idleInterval);
  }, []);

  // Pointer & Drag / Swipe handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    dragStartTimeRef.current = performance.now();
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    recentPointerMovesRef.current = [{ x: e.clientX, y: e.clientY, time: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    targetPointerRef.current = {
      x: Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2))),
    };

    if (isDraggingRef.current && mascotBodyRef.current) {
      const now = performance.now();
      recentPointerMovesRef.current.push({ x: e.clientX, y: e.clientY, time: now });
      if (recentPointerMovesRef.current.length > 8) {
        recentPointerMovesRef.current.shift();
      }

      // Convert 2D client coordinates to 3D world space coordinates
      const worldTargetX = ((e.clientX - centerX) / (rect.width / 2)) * 1.35;
      const worldTargetY = -((e.clientY - centerY) / (rect.height / 2)) * 1.15;

      const body = mascotBodyRef.current;
      // Spring follow while being dragged in x and y (z is strictly locked to 0)
      body.velocity.x = (worldTargetX - body.position.x) * 22;
      body.velocity.y = (worldTargetY - body.position.y) * 22;
      body.velocity.z = 0;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const now = performance.now();
    const duration = now - dragStartTimeRef.current;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    // Calculate release velocity vector from recent pointer moves
    const recent = recentPointerMovesRef.current;
    let velX = 0;
    let velY = 0;
    if (recent.length >= 2) {
      const oldest = recent[0];
      const newest = recent[recent.length - 1];
      const dt = Math.max(0.016, (newest.time - oldest.time) / 1000);
      velX = (newest.x - oldest.x) / dt / 180;
      velY = (newest.y - oldest.y) / dt / 180;
    }

    if (mascotBodyRef.current) {
      const body = mascotBodyRef.current;

      // Detect downward flick / swipe (user swiping her down)
      if (velY > 2.0 || (dy > 45 && duration < 320)) {
        // SWIPED DOWN: Free fall, slam onto card floor, bounce and spring recover!
        isFallingRef.current = true;
        body.velocity.set(velX * 1.5, Math.min(-7.5, -velY * 2.5), 0);
        body.angularVelocity.set(0, 0, -velX * 4);

        haptic('heavy');
        const fallQuotes = [
          'Whoaaaa! Free-falling! Downward G-force! 📉💫',
          'Mayday! Brace for impact on the login card! 💥',
          'Gravity test in progress! Hold onto your coins! 🛸',
        ];
        setTrickSpeech(fallQuotes[Math.floor(Math.random() * fallQuotes.length)]);
        crossfadeToAction('EVE_BrakeFast', false, 0.15);

        setTimeout(() => {
          if (currentTrickRef.current === 'idle') {
            setTrickSpeech(null);
            returnToStateLoop();
          }
        }, 3200);
      } else if (Math.abs(velX) > 2.0 || Math.abs(dx) > 50) {
        // SWIPED SIDEWAYS: Ricochet off invisible walls
        body.velocity.set(velX * 2.2, -velY * 1.5, 0);
        body.angularVelocity.set(0, 0, -velX * 3.5);
        haptic('medium');
      } else if (dist < 12 && duration < 300) {
        // Clean tap!
        handleMascotTap();
      }
    }
  };

  const handleMascotTap = () => {
    triggerRandomTrick();
    if (onTap) onTap();
  };

  // =========================================================================
  // INTELLIGENT DIALOGUE ENGINE
  // =========================================================================
  const getSpeechText = () => {
    if (isDraggingRef.current) {
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
      return `Directive complete! Name saved, ${clean}. Press Open Dashboard whenever you're ready! ⭐`;
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
        ];
        return returningQuotes[idleThoughtIndex % returningQuotes.length];
      }
      const genericWelcomeQuotes = [
        'Welcome back! Your offline vault is safe and sound. 🔒',
        'Welcome back! All records are encrypted and ready. 🛡️',
      ];
      return genericWelcomeQuotes[idleThoughtIndex % genericWelcomeQuotes.length];
    }

    const timeGreetingsMap: Record<string, string[]> = {
      morning: [
        `Good morning! Ready to start a fresh financial day? ${timeGreeting.icon}`,
        'Directive: Protect your offline vault with AES-256 security! ☕',
        "Hi! I'm EVE. No cloud, 100% private and offline! 🛡️",
      ],
      afternoon: [
        `Good afternoon! Financial records are in tip-top shape. ${timeGreeting.icon}`,
        'Midday check-in! Everything is stored right on your device. ✨',
        'Hi! Write your name above, or tap Open Dashboard to jump right in! 🚀',
      ],
      evening: [
        `Good evening! Ready to balance today's ledger? ${timeGreeting.icon}`,
        'Evening! All transactions resting securely in encrypted SQLite. 🌙',
        'Swipe me down to see me bounce, or tap me for cool maneuvers! 🎩',
      ],
      night: [
        `Burning the midnight oil? Your private vault never sleeps. ${timeGreeting.icon}`,
        'Late night accounting? Your data stays 100% offline. 🌌',
        "E-v-a! No signups needed, just pure private security! 🤖",
      ],
    };

    const currentList = timeGreetingsMap[timeGreeting.time] || timeGreetingsMap.morning;
    return currentList[idleThoughtIndex % currentList.length];
  };

  // =========================================================================
  // REAL CANNON-ES RIGID BODY SIMULATION & THREE.JS PIXAR SCENE WITH ROOM ENVIRONMENT
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
    renderer.toneMappingExposure = 1.35;

    // 2. Procedural Studio Reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvironment = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 1.15;
    roomEnvironment.dispose();
    pmremGenerator.dispose();

    // 3. Pixar Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.0);
    keyLight.position.set(3.2, 4.2, 3.5);
    scene.add(keyLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.5);
    fillLight.position.set(-3.2, -0.8, 2.5);
    scene.add(fillLight);

    // Electric Pixar Rim Backlight (Tinted by active theme)
    const rimLight = new THREE.PointLight(new THREE.Color(accentColor), 5.5, 9);
    rimLight.position.set(0, 1.2, -2.5);
    scene.add(rimLight);

    // Front Chest Fill Light (Tinted by active theme)
    const frontAccentLight = new THREE.PointLight(new THREE.Color(accentColor), 2.2, 5);
    frontAccentLight.position.set(0, -0.8, 2.4);
    scene.add(frontAccentLight);

    // Thruster Jet Light (Flares up during anti-gravity thrust)
    const thrusterLight = new THREE.PointLight(new THREE.Color(accentColor), 0, 4);
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
      color: new THREE.Color(accentColor),
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
      color: new THREE.Color(accentColor),
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
    // CANNON-ES REAL RIGID BODY PHYSICS (LOCKED STRICTLY TO Z=0 PLANE)
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

    const mascotGroundContact = new CANNON.ContactMaterial(mascotPhysicsMat, groundPhysicsMat, {
      restitution: 0.65,
      friction: 0.15,
    });
    world.addContactMaterial(mascotGroundContact);

    const mascotWallContact = new CANNON.ContactMaterial(mascotPhysicsMat, wallPhysicsMat, {
      restitution: 0.75,
      friction: 0.05,
    });
    world.addContactMaterial(mascotWallContact);

    // Floor Boundary
    const groundBody = new CANNON.Body({ mass: 0, material: groundPhysicsMat });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -0.92, 0);
    world.addBody(groundBody);

    // Left & Right Wall Boundaries
    const leftWall = new CANNON.Body({ mass: 0, material: wallPhysicsMat });
    leftWall.addShape(new CANNON.Plane());
    leftWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    leftWall.position.set(-1.45, 0, 0);
    world.addBody(leftWall);

    const rightWall = new CANNON.Body({ mass: 0, material: wallPhysicsMat });
    rightWall.addShape(new CANNON.Plane());
    rightWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    rightWall.position.set(1.45, 0, 0);
    world.addBody(rightWall);

    // Ceiling Boundary
    const ceiling = new CANNON.Body({ mass: 0, material: wallPhysicsMat });
    ceiling.addShape(new CANNON.Plane());
    ceiling.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    ceiling.position.set(0, 1.55, 0);
    world.addBody(ceiling);

    // Mascot Rigid Body
    const mascotSphere = new CANNON.Sphere(0.46);
    const mascotBody = new CANNON.Body({
      mass: 1.8,
      shape: mascotSphere,
      material: mascotPhysicsMat,
      linearDamping: 0.08,
      angularDamping: 0.35,
    });
    mascotBody.position.set(0, 0, 0);

    // ITEM 3: Lock Physics to Z=0 Plane via linearFactor & angularFactor
    // Only moves horizontally/vertically (X and Y), only tilts on Z roll axis
    mascotBody.linearFactor = new CANNON.Vec3(1, 1, 0);
    mascotBody.angularFactor = new CANNON.Vec3(0, 0, 1);

    world.addBody(mascotBody);
    mascotBodyRef.current = mascotBody;

    // Collision listener for impact haptics, shockwaves, and speech
    mascotBody.addEventListener('collide', (e: any) => {
      let impactSpeed = 4.0;
      if (e.contact) {
        impactSpeed = Math.abs(e.contact.getImpactVelocityAlongNormal());
      }

      if (impactSpeed > 1.8) {
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
        setTrickSpeech(bounceQuotes[Math.floor(Math.random() * bounceQuotes.length)]);

        setTimeout(() => {
          if (currentTrickRef.current === 'idle') {
            setTrickSpeech(null);
            returnToStateLoop();
          }
        }, 3200);
      } else if (impactSpeed > 0.7) {
        haptic('medium');
      }
    });

    // 8. Load official Pixar EVE GLB Model & Upgrade Shell to MeshPhysicalMaterial
    const loader = new GLTFLoader();
    loader.load(
      '/models/EVE.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(1.36);
        model.position.set(0, -0.65, 0);
        modelRoot.add(model);

        // ITEM 2: Upgrade shell to MeshPhysicalMaterial with clearcoat: 1.0 and clearcoatRoughness: 0.08
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

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.SkinnedMesh;
            mesh.frustumCulled = false;

            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((mat) => {
                if (mat.name === 'mat_0' || mat.name === 'mat_1' || mat.name === 'mat_6') {
                  const shell = physicalShellMat.clone();
                  shell.name = mat.name;
                  return shell;
                } else if (mat.name === 'EVE_Head_COMN') {
                  const visorMat = new THREE.MeshPhysicalMaterial({
                    color: 0x111624,
                    map: (mat as THREE.MeshStandardMaterial).map || null,
                    roughness: 0.08,
                    metalness: 0.18,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05,
                    envMapIntensity: 1.45,
                    transparent: mat.transparent,
                    opacity: mat.opacity,
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
              });
            }
          }
        });

        const headBone = model.getObjectByName('bone_002');
        headBoneRef.current = headBone || null;

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

    // Physics state vectors for spring-damped head look-at
    let headRotX = 0;
    let headRotY = 0;
    let headVelX = 0;
    let headVelY = 0;

    // Persistent Math objects for safe Quaternion gaze multiplication without GC pressure
    const gazeEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    const gazeQuat = new THREE.Quaternion();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      // Color synchronization with user theme
      const activeColor = new THREE.Color(accentColorRef.current);
      if (eyeMatRef.current) {
        eyeMatRef.current.emissive.copy(activeColor);
        eyeMatRef.current.emissiveIntensity = 2.8 + Math.sin(elapsedTime * 3.0) * 0.4;
      }
      rimLight.color.copy(activeColor);
      frontAccentLight.color.copy(activeColor);
      if (shockwaveMatRef.current) shockwaveMatRef.current.color.copy(activeColor);
      if (thrusterLightRef.current) thrusterLightRef.current.color.copy(activeColor);

      // 1. Step Cannon-ES Physics World (Strictly locked to Z=0)
      if (worldRef.current && mascotBodyRef.current) {
        const body = mascotBodyRef.current;

        // Strict Z plane constraint enforcement
        body.position.z = 0;
        body.velocity.z = 0;
        body.angularVelocity.x = 0;
        body.angularVelocity.y = 0;

        if (!isDraggingRef.current) {
          const hoverTargetY = Math.sin(elapsedTime * 2.2) * 0.045;
          const hoverTargetX = 0;

          const kSpringY = 38;
          const kDampY = 9.5;
          const kSpringX = 18;
          const kDampX = 6.5;

          const fAntiGrav = -body.mass * world.gravity.y;
          const fSpringY = -kSpringY * (body.position.y - hoverTargetY) - kDampY * body.velocity.y;
          const fSpringX = -kSpringX * (body.position.x - hoverTargetX) - kDampX * body.velocity.x;

          body.applyForce(new CANNON.Vec3(fSpringX, fAntiGrav + fSpringY, 0));

          // Clean Z-axis roll restoring torque
          body.angularVelocity.z += (-body.quaternion.z * 18 - body.angularVelocity.z * 7) * dt;
        }

        worldRef.current.step(1 / 60, dt, 3);

        // Sync Three.js Model Group strictly on x, y, and z roll rotation
        if (modelRootRef.current) {
          modelRootRef.current.position.set(body.position.x, body.position.y, 0);
          modelRootRef.current.quaternion.set(
            0,
            0,
            body.quaternion.z,
            body.quaternion.w
          );
          modelRootRef.current.quaternion.normalize();
        }

        // 2. Thruster Jet Particle Exhaust Effect
        const upwardThrust = Math.max(0, -body.velocity.y * 0.15 + (body.position.y < -0.2 ? 0.6 : 0.1));
        if (thrusterLightRef.current) {
          thrusterLightRef.current.position.set(body.position.x, body.position.y - 0.45, 0);
          thrusterLightRef.current.intensity = upwardThrust * 3.5;
        }

        if (thrusterParticlesRef.current) {
          thrusterParticlesRef.current.position.set(body.position.x, body.position.y, 0);
          const mat = thrusterParticlesRef.current.material as THREE.PointsMaterial;
          mat.opacity = Math.min(0.9, upwardThrust * 1.2);
        }

        // 3. Ground Contact Shadow in 3D Scene
        if (shadowMeshRef.current && shadowMatRef.current) {
          const altitude = body.position.y - (-0.92);
          const shadowScale = Math.max(0.6, 1 + altitude * 0.35);
          shadowMeshRef.current.position.x = body.position.x * 0.85;
          shadowMeshRef.current.scale.setScalar(shadowScale);
          shadowMatRef.current.opacity = Math.max(0.12, Math.min(0.85, 0.7 - altitude * 0.4));
        }

        // ITEM 1: Direct DOM shadow mutation (ZERO React Re-Renders!)
        if (domShadowRef.current) {
          const alt = body.position.y - (-0.92);
          const domBlur = Math.max(4, 8 + alt * 18);
          const domOpacity = Math.max(0.12, Math.min(0.78, 0.7 - alt * 0.35));
          const domX = body.position.x * 40;
          const domOffsetY = Math.max(2, 10 - alt * 6);
          const domScale = Math.max(0.75, 1.05 - alt * 0.15);

          domShadowRef.current.style.transform = `translateX(${domX}px) scaleX(${domScale}) translateY(${domOffsetY}px)`;
          domShadowRef.current.style.filter = `blur(${domBlur}px)`;
          domShadowRef.current.style.opacity = `${domOpacity}`;
        }

        // 4. Contact Impact Shockwave Ring Animation
        if (bounceShockwaveAnimRef.current > 0 && shockwaveMeshRef.current && shockwaveMatRef.current) {
          bounceShockwaveAnimRef.current = Math.max(0, bounceShockwaveAnimRef.current - dt * 2.5);
          const progress = 1 - bounceShockwaveAnimRef.current;
          const s = 0.3 + progress * 2.4;
          shockwaveMeshRef.current.position.x = body.position.x;
          shockwaveMeshRef.current.scale.set(s, s, s);
          shockwaveMatRef.current.opacity = Math.sin(bounceShockwaveAnimRef.current * Math.PI) * 0.85;
        }
      }

      // 5. Update Skeletal Animation Mixer
      if (mixerRef.current) {
        mixerRef.current.update(dt);
      }

      // ITEM 4: Safe Head Gaze Using Quaternion Multiplication (No Neck Detachment)
      // Clamped anatomical angles: yaw ±0.36 rad (~20°), pitch -0.24 to +0.28 rad (~15°)
      const targetYaw = Math.max(-0.36, Math.min(0.36, targetPointerRef.current.x * 0.36));
      // When typing box is focused, smoothly tilt head down toward the name field (+0.25 rad)
      const targetPitch = Math.max(
        -0.24,
        Math.min(0.28, isFocusedRef.current ? 0.25 : -targetPointerRef.current.y * 0.24)
      );

      const kGazeSpring = 24;
      const dGazeDamping = 7.5;
      headVelX += ((targetYaw - headRotY) * kGazeSpring - headVelX * dGazeDamping) * dt;
      headVelY += ((targetPitch - headRotX) * kGazeSpring - headVelY * dGazeDamping) * dt;
      headRotY += headVelX * dt;
      headRotX += headVelY * dt;

      // Multiply local rotation quaternion on top of skeletal animation pose
      if (headBoneRef.current) {
        gazeEuler.set(
          headRotX,             // Pitch (nod toward finger or input box)
          headRotY,             // Yaw (look left/right)
          headRotY * -0.12,     // Subtle natural curious roll
          'YXZ'
        );
        gazeQuat.setFromEuler(gazeEuler);
        // Bone translation is completely untouched -> mathematically zero neck detachment
        headBoneRef.current.quaternion.multiply(gazeQuat);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
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

      {/* --- PHYSICALLY ACCURATE SOFT SHADOW CAST DIRECTLY ONTO LOGIN FORM UI (DIRECT DOM REF - ZERO REACT RE-RENDERS) --- */}
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
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 80%)',
            transform: 'translateX(0px) scaleX(1) translateY(8px)',
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