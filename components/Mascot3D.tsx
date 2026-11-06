import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trick & Interaction States
  const [currentTrick, setCurrentTrick] = useState<MascotTrick>('idle');
  const [trickSpeech, setTrickSpeech] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleThoughtIndex, setIdleThoughtIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Normalized mouse/touch target coordinates (-1 to 1)
  const targetPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

    const filtered = availableTricks.filter((t) => t !== currentTrick);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)];

    if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
    setCurrentTrick(chosen);

    switch (chosen) {
      case 'flip': {
        haptic('medium');
        const flipQuotes = [
          'Woohoo! Check out this real 3D zero-gravity flip! 🤸‍♂️🚀',
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
    }, 3400);
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

  // Periodic idle thought rotation
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
    targetPointerRef.current = {
      x: Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2))),
    };
  };

  const handlePointerLeave = () => {
    targetPointerRef.current = { x: 0, y: 0 };
  };

  // Tap handler (Random trick every time user touches the mascot)
  const handleMascotTap = () => {
    triggerRandomTrick();
    if (onTap) onTap();
  };

  // =========================================================================
  // INTELLIGENT DIALOGUE ENGINE
  // =========================================================================
  const getSpeechText = () => {
    if (isDragging) {
      return 'Wheeeee! Where are we flying to? 🎈';
    }
    if (trickSpeech) {
      return trickSpeech;
    }
    if (isRestoring) {
      return 'Unpacking your encrypted vault with AES-256 care... 📦🔐';
    }
    if (mood === 'celebrate') {
      const clean = userName && userName.trim() ? userName.trim().split(' ')[0] : 'friend';
      return `Awesome, ${clean}! Name saved. Press Open Dashboard whenever you're ready! ⭐`;
    }

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

    if (isFocused) {
      return 'Type your name or jump straight in — totally up to you! 💫';
    }

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

    const timeGreetingsMap: Record<string, string[]> = {
      morning: [
        `Good morning! Ready to start a fresh financial day? ${timeGreeting.icon}`,
        'Rise and shine! Your private vault is unlocked and safe. ☕',
        "Hi! I'm Ledgie, your Pixar-trained vault buddy. No cloud, 100% private! 🛡️",
      ],
      afternoon: [
        `Good afternoon! Your financial records are in tip-top shape. ${timeGreeting.icon}`,
        'Midday check-in! Everything is stored right on your phone. ✨',
        'Hi! Feel free to write your name, or jump right into your dashboard! 🚀',
      ],
      evening: [
        `Good evening! Ready to balance today's ledger? ${timeGreeting.icon}`,
        'Evening! All your transactions are resting safely. 🌙',
        'Hi! Tap on me if you want to see some fun tricks! 🎩',
      ],
      night: [
        `Burning the midnight oil? Your private vault never sleeps. ${timeGreeting.icon}`,
        'Late night accounting? Your data stays 100% offline. 🌌',
        "Hi! I'm Ledgie. No logins needed, just pure private security! 🤖",
      ],
    };

    const currentList = timeGreetingsMap[timeGreeting.time] || timeGreetingsMap.morning;
    return currentList[idleThoughtIndex % currentList.length];
  };

  // =========================================================================
  // REAL THREE.JS 3D SCENE & RIGGING ENGINE
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dimensions
    const width = 290;
    const height = 290;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 2. Offscreen Canvas for Pixar Dynamic Visor Expressions
    const visorCanvas = document.createElement('canvas');
    visorCanvas.width = 512;
    visorCanvas.height = 256;
    const vCtx = visorCanvas.getContext('2d');
    const visorTexture = new THREE.CanvasTexture(visorCanvas);
    visorTexture.colorSpace = THREE.SRGBColorSpace;

    // Helper to draw eyes on the 3D visor texture
    const updateVisorCanvas = (
      trick: MascotTrick,
      moodState: MascotMood,
      blinking: boolean,
      colorHex: string,
      pX: number,
      pY: number
    ) => {
      if (!vCtx) return;
      vCtx.clearRect(0, 0, 512, 256);

      // Visor background: deep glossy glass OLED
      vCtx.fillStyle = '#06080e';
      vCtx.fillRect(0, 0, 512, 256);

      // Micro cyber scanlines
      vCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < 256; y += 4) {
        vCtx.fillRect(0, y, 512, 2);
      }

      const eyeBaseY = isFocusedRef.current ? 145 : 130 + pY * 18;
      const leftEyeX = 175 + pX * 24;
      const rightEyeX = 337 + pX * 24;

      // 1. Blinking
      if (blinking && trick !== 'dizzy' && trick !== 'hearts') {
        vCtx.strokeStyle = colorHex;
        vCtx.lineWidth = 6;
        vCtx.lineCap = 'round';
        vCtx.beginPath();
        vCtx.moveTo(leftEyeX - 35, eyeBaseY);
        vCtx.lineTo(leftEyeX + 35, eyeBaseY);
        vCtx.moveTo(rightEyeX - 35, eyeBaseY);
        vCtx.lineTo(rightEyeX + 35, eyeBaseY);
        vCtx.stroke();
        visorTexture.needsUpdate = true;
        return;
      }

      // 2. Heart Eyes
      if (trick === 'hearts') {
        const drawHeart = (cx: number, cy: number) => {
          vCtx.fillStyle = '#f43f5e';
          vCtx.shadowColor = '#f43f5e';
          vCtx.shadowBlur = 18;
          vCtx.beginPath();
          vCtx.moveTo(cx, cy + 18);
          vCtx.bezierCurveTo(cx - 38, cy - 25, cx - 38, cy - 50, cx, cy - 25);
          vCtx.bezierCurveTo(cx + 38, cy - 50, cx + 38, cy - 25, cx, cy + 18);
          vCtx.fill();
          vCtx.shadowBlur = 0;
        };
        drawHeart(leftEyeX, eyeBaseY);
        drawHeart(rightEyeX, eyeBaseY);

        // Pink glowing blush
        vCtx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        vCtx.beginPath();
        vCtx.ellipse(120, 185, 30, 15, 0, 0, Math.PI * 2);
        vCtx.ellipse(392, 185, 30, 15, 0, 0, Math.PI * 2);
        vCtx.fill();

        visorTexture.needsUpdate = true;
        return;
      }

      // 3. Dizzy Spiral Eyes
      if (trick === 'dizzy') {
        const timeNow = performance.now() * 0.006;
        const drawSpiral = (cx: number, cy: number, reverse: boolean) => {
          vCtx.strokeStyle = colorHex;
          vCtx.lineWidth = 6;
          vCtx.beginPath();
          for (let i = 0; i < 40; i++) {
            const angle = (reverse ? -1 : 1) * 0.35 * i + timeNow;
            const dist = (i / 40) * 36;
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;
            if (i === 0) vCtx.moveTo(x, y);
            else vCtx.lineTo(x, y);
          }
          vCtx.stroke();
        };
        drawSpiral(leftEyeX, eyeBaseY, false);
        drawSpiral(rightEyeX, eyeBaseY, true);
        visorTexture.needsUpdate = true;
        return;
      }

      // 4. Star Eyes
      if (trick === 'flip' || trick === 'party' || moodState === 'celebrate') {
        const drawStar = (cx: number, cy: number) => {
          vCtx.fillStyle = colorHex;
          vCtx.shadowColor = colorHex;
          vCtx.shadowBlur = 16;
          vCtx.beginPath();
          const spikes = 5;
          const outerR = 38;
          const innerR = 18;
          let rot = (Math.PI / 2) * 3;
          const step = Math.PI / spikes;
          vCtx.moveTo(cx, cy - outerR);
          for (let i = 0; i < spikes; i++) {
            vCtx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            vCtx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
          }
          vCtx.closePath();
          vCtx.fill();
          vCtx.shadowBlur = 0;
        };
        drawStar(leftEyeX, eyeBaseY);
        drawStar(rightEyeX, eyeBaseY);
        visorTexture.needsUpdate = true;
        return;
      }

      // 5. Arched Joyful Eyes (^)
      if (moodState === 'welcome' || trick === 'tickle') {
        vCtx.strokeStyle = colorHex;
        vCtx.lineWidth = 10;
        vCtx.lineCap = 'round';
        vCtx.shadowColor = colorHex;
        vCtx.shadowBlur = 14;

        vCtx.beginPath();
        vCtx.arc(leftEyeX, eyeBaseY + 12, 34, Math.PI * 1.15, Math.PI * 1.85, false);
        vCtx.stroke();

        vCtx.beginPath();
        vCtx.arc(rightEyeX, eyeBaseY + 12, 34, Math.PI * 1.15, Math.PI * 1.85, false);
        vCtx.stroke();

        vCtx.shadowBlur = 0;
        visorTexture.needsUpdate = true;
        return;
      }

      // 6. Cool Wink
      if (trick === 'wink') {
        // Left Eye: Wink
        vCtx.strokeStyle = '#ffffff';
        vCtx.lineWidth = 8;
        vCtx.lineCap = 'round';
        vCtx.beginPath();
        vCtx.moveTo(leftEyeX - 35, eyeBaseY);
        vCtx.lineTo(leftEyeX + 35, eyeBaseY);
        vCtx.stroke();

        // Right Eye: Wide cool oval
        vCtx.fillStyle = colorHex;
        vCtx.beginPath();
        vCtx.ellipse(rightEyeX, eyeBaseY, 32, 44, 0, 0, Math.PI * 2);
        vCtx.fill();

        // Catchlight
        vCtx.fillStyle = '#ffffff';
        vCtx.beginPath();
        vCtx.arc(rightEyeX - 10, eyeBaseY - 14, 12, 0, Math.PI * 2);
        vCtx.fill();

        visorTexture.needsUpdate = true;
        return;
      }

      // 7. Pixar Classic Expressive Eyes with Dual Catchlights
      const drawPixarEye = (cx: number, cy: number) => {
        // Eye capsule/oval
        vCtx.fillStyle = colorHex;
        vCtx.shadowColor = colorHex;
        vCtx.shadowBlur = 18;
        vCtx.beginPath();
        vCtx.ellipse(cx, cy, 32, 46, 0, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.shadowBlur = 0;

        // Primary Pixar Catchlight (Top-Left)
        vCtx.fillStyle = '#ffffff';
        vCtx.beginPath();
        vCtx.arc(cx - 10, cy - 14, 11, 0, Math.PI * 2);
        vCtx.fill();

        // Secondary Soft Catchlight (Bottom-Right)
        vCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        vCtx.beginPath();
        vCtx.arc(cx + 11, cy + 16, 6, 0, Math.PI * 2);
        vCtx.fill();
      };

      drawPixarEye(leftEyeX, eyeBaseY);
      drawPixarEye(rightEyeX, eyeBaseY);

      // Cute Pixar Smile Mouth
      vCtx.strokeStyle = colorHex;
      vCtx.lineWidth = 6;
      vCtx.lineCap = 'round';
      vCtx.beginPath();
      vCtx.arc(256, 195, 24, Math.PI * 0.15, Math.PI * 0.85, false);
      vCtx.stroke();

      visorTexture.needsUpdate = true;
    };

    // 3. Pixar Studio Multi-Point Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.8);
    keyLight.position.set(3.5, 4.5, 3.5);
    scene.add(keyLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.4);
    fillLight.position.set(-3.5, -1.0, 2.5);
    scene.add(fillLight);

    // Vibrant Pixar Rim Light (Colored by user's active theme!)
    const rimLight = new THREE.PointLight(new THREE.Color(accentColor), 5.0, 9);
    rimLight.position.set(0, 1.0, -2.8);
    scene.add(rimLight);

    // Front Accent Fill
    const frontAccentLight = new THREE.PointLight(new THREE.Color(accentColor), 1.8, 6);
    frontAccentLight.position.set(0, -1.5, 2.5);
    scene.add(frontAccentLight);

    // 4. Eve/Wall-E Pixar PBR Materials with Subsurface Scattering Emulation
    const ceramicMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.16,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      sheen: 1.0,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color(accentColor).multiplyScalar(0.4),
      transmission: 0.03, // Soft Pixar subsurface translucency
      thickness: 0.8,
    });

    const darkAlloyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      roughness: 0.3,
      metalness: 0.85,
    });

    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x07090e,
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      map: visorTexture,
      emissive: new THREE.Color(accentColor),
      emissiveMap: visorTexture,
      emissiveIntensity: 1.3,
    });

    const emissiveCoreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    // 5. Rigged Hierarchical 3D Pixar Scene Graph
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Body Group (torso, core, arms, halo)
    const bodyGroup = new THREE.Group();
    rootGroup.add(bodyGroup);

    // Torso Geometry (Eve-style aerodynamic egg/capsule chassis)
    const bodyGeo = new THREE.SphereGeometry(0.85, 36, 28);
    bodyGeo.scale(0.9, 1.25, 0.82);
    const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMaterial);
    bodyMesh.position.set(0, -0.65, 0);
    bodyGroup.add(bodyMesh);

    // Belly Core Emblem (Pulsing glowing battery/heart indicator)
    const coreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24);
    coreGeo.rotateX(Math.PI / 2);
    const coreMesh = new THREE.Mesh(coreGeo, emissiveCoreMaterial);
    coreMesh.position.set(0, -0.58, 0.7);
    bodyGroup.add(coreMesh);

    // 3D Orbiting Halo Ring
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = Math.PI * 0.38;
    orbitGroup.rotation.y = Math.PI * 0.08;
    orbitGroup.position.set(0, -0.65, 0);
    bodyGroup.add(orbitGroup);

    const ringGeo = new THREE.TorusGeometry(1.5, 0.028, 16, 64);
    const ringMesh = new THREE.Mesh(ringGeo, darkAlloyMaterial);
    orbitGroup.add(ringMesh);

    const sparkGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const sparkMesh = new THREE.Mesh(sparkGeo, emissiveCoreMaterial);
    orbitGroup.add(sparkMesh);

    // Left Articulated Hand Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.95, -0.35, 0);
    bodyGroup.add(leftArmGroup);

    const handGeo = new THREE.CapsuleGeometry(0.14, 0.42, 16, 16);
    const leftHandMesh = new THREE.Mesh(handGeo, ceramicMaterial);
    leftHandMesh.position.set(0, -0.22, 0);
    leftArmGroup.add(leftHandMesh);

    const palmGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const leftPalmMesh = new THREE.Mesh(palmGeo, emissiveCoreMaterial);
    leftPalmMesh.position.set(0, -0.38, 0.08);
    leftArmGroup.add(leftPalmMesh);

    // Right Articulated Hand Group (Waving, High-Five, Clap)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.95, -0.35, 0);
    bodyGroup.add(rightArmGroup);

    const rightHandMesh = new THREE.Mesh(handGeo, ceramicMaterial);
    rightHandMesh.position.set(0, -0.22, 0);
    rightArmGroup.add(rightHandMesh);

    const rightPalmMesh = new THREE.Mesh(palmGeo, emissiveCoreMaterial);
    rightPalmMesh.position.set(0, -0.38, 0.08);
    rightArmGroup.add(rightPalmMesh);

    // Head Group (Neck pivot -> follows pointer / touch tracking)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.45, 0);
    rootGroup.add(headGroup);

    // Head Mesh (Eve-style pearlescent egg helmet)
    const headGeo = new THREE.SphereGeometry(1.15, 48, 36);
    headGeo.scale(1.0, 1.18, 0.96);
    const headMesh = new THREE.Mesh(headGeo, ceramicMaterial);
    headGroup.add(headMesh);

    // Inset Curved OLED Visor Screen
    const visorGeo = new THREE.SphereGeometry(0.88, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.55);
    visorGeo.scale(0.94, 0.9, 0.82);
    visorGeo.rotateX(Math.PI * 0.48);
    const visorMesh = new THREE.Mesh(visorGeo, visorMaterial);
    visorMesh.position.set(0, 0.04, 0.32);
    headGroup.add(visorMesh);

    // Magnetic Left Ear Pod
    const leftEarGroup = new THREE.Group();
    leftEarGroup.position.set(-1.18, 0.15, 0);
    headGroup.add(leftEarGroup);

    const earGeo = new THREE.CapsuleGeometry(0.15, 0.35, 16, 16);
    const leftEarMesh = new THREE.Mesh(earGeo, darkAlloyMaterial);
    leftEarGroup.add(leftEarMesh);

    const earCoreGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    earCoreGeo.rotateZ(Math.PI / 2);
    const leftEarCore = new THREE.Mesh(earCoreGeo, emissiveCoreMaterial);
    leftEarGroup.add(leftEarCore);

    // Magnetic Right Ear Pod
    const rightEarGroup = new THREE.Group();
    rightEarGroup.position.set(1.18, 0.15, 0);
    headGroup.add(rightEarGroup);

    const rightEarMesh = new THREE.Mesh(earGeo, darkAlloyMaterial);
    rightEarGroup.add(rightEarMesh);

    const rightEarCore = new THREE.Mesh(earCoreGeo, emissiveCoreMaterial);
    rightEarGroup.add(rightEarCore);

    // Top Antenna & Pulsing Gem
    const antennaGroup = new THREE.Group();
    antennaGroup.position.set(0, 1.35, 0);
    headGroup.add(antennaGroup);

    const stemGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 16);
    const stemMesh = new THREE.Mesh(stemGeo, darkAlloyMaterial);
    stemMesh.position.set(0, -0.1, 0);
    antennaGroup.add(stemMesh);

    const gemGeo = new THREE.IcosahedronGeometry(0.14, 2);
    const gemMesh = new THREE.Mesh(gemGeo, emissiveCoreMaterial);
    gemMesh.position.set(0, 0.08, 0);
    antennaGroup.add(gemMesh);

    // Realistic Pixar Ground Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.95, 0);
    scene.add(shadowMesh);

    // 6. Animation Loop with Procedural Rigging & Physics
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let flipStartTime = -1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer interpolation
      currentPointerRef.current.x +=
        (targetPointerRef.current.x - currentPointerRef.current.x) * 0.08;
      currentPointerRef.current.y +=
        (targetPointerRef.current.y - currentPointerRef.current.y) * 0.08;

      const pX = currentPointerRef.current.x;
      const pY = currentPointerRef.current.y;

      const trick = currentTrickRef.current;
      const moodState = moodRef.current;
      const colorHex = accentColorRef.current;

      // Update dynamic colors if theme changes
      const activeThreeColor = new THREE.Color(colorHex);
      emissiveCoreMaterial.color.copy(activeThreeColor);
      emissiveCoreMaterial.emissive.copy(activeThreeColor);
      visorMaterial.emissive.copy(activeThreeColor);
      rimLight.color.copy(activeThreeColor);
      frontAccentLight.color.copy(activeThreeColor);

      // Rotate orbiting ring spark
      const sparkAngle = elapsedTime * 2.5;
      sparkMesh.position.set(Math.cos(sparkAngle) * 1.5, Math.sin(sparkAngle) * 1.5, 0);

      // Update 2D Canvas Eyes on Visor
      updateVisorCanvas(trick, moodState, isBlinking, colorHex, pX, pY);

      // --- PROCEDURAL ANIMATIONS ACCORDING TO TRICK & MOOD ---
      if (trick === 'flip') {
        if (flipStartTime < 0) flipStartTime = elapsedTime;
        const progress = Math.min(1, (elapsedTime - flipStartTime) / 1.15);

        // 360° Somersault Flip Jump with Squash & Stretch
        const jumpY = Math.sin(progress * Math.PI) * 1.6;
        rootGroup.position.y = jumpY;
        rootGroup.rotation.x = progress * Math.PI * 2;

        const squash = progress < 0.15 ? 0.8 : progress < 0.85 ? 1.25 : 0.85;
        rootGroup.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));

        shadowMesh.scale.setScalar(1 - jumpY * 0.35);
        shadowMat.opacity = Math.max(0.15, 0.65 - jumpY * 0.3);
      } else {
        flipStartTime = -1;
        rootGroup.scale.set(1, 1, 1);

        if (trick === 'dizzy') {
          // Rapid horizontal spin with wobbling tilt
          rootGroup.rotation.y = elapsedTime * 8;
          rootGroup.rotation.z = Math.sin(elapsedTime * 6) * 0.18;
          rootGroup.position.y = Math.sin(elapsedTime * 4) * 0.06;

          leftEarGroup.rotation.z = 0.4;
          rightEarGroup.rotation.z = -0.4;
        } else if (trick === 'tickle') {
          // Playful rapid giggle wiggles
          rootGroup.rotation.y = Math.sin(elapsedTime * 22) * 0.18;
          rootGroup.position.x = Math.sin(elapsedTime * 26) * 0.1;
          rootGroup.position.y = Math.sin(elapsedTime * 8) * 0.06;

          // Hands cover mouth/cheeks
          leftArmGroup.rotation.z = 1.05;
          rightArmGroup.rotation.z = -1.05;
        } else if (trick === 'highfive') {
          // Right hand reaches out forward for high-five
          rootGroup.position.y = Math.sin(elapsedTime * 3) * 0.06;
          rightArmGroup.rotation.x = -1.25;
          rightArmGroup.position.z = 0.45;
          rightArmGroup.rotation.z = 0.3;
        } else if (trick === 'party') {
          // Clapping hands & bouncing to rhythm
          rootGroup.position.y = Math.abs(Math.sin(elapsedTime * 7)) * 0.25;
          leftArmGroup.rotation.z = 0.4 + Math.sin(elapsedTime * 14) * 0.35;
          rightArmGroup.rotation.z = -0.4 - Math.sin(elapsedTime * 14) * 0.35;
        } else if (trick === 'hearts') {
          // Hands cup cheeks, gentle swaying
          rootGroup.position.y = Math.sin(elapsedTime * 2) * 0.08;
          rootGroup.rotation.z = Math.sin(elapsedTime * 2.5) * 0.08;
          leftArmGroup.rotation.z = 0.95;
          rightArmGroup.rotation.z = -0.95;
        } else if (trick === 'wink') {
          // Cool swagger tilt & thumbs up
          headGroup.rotation.z = 0.2;
          rightArmGroup.rotation.x = -0.6;
          rightArmGroup.rotation.z = 0.5;
        } else if (trick === 'curious') {
          // Inquisitive head tilt like cute puppy robot
          headGroup.rotation.z = 0.36;
          leftEarGroup.rotation.z = -0.3;
          rightEarGroup.rotation.z = 0.35;
        } else {
          // Normal Idle / Welcome / Asking: Organic Breathing Cycle
          const breath = Math.sin(elapsedTime * 2.2) * 0.08;
          rootGroup.position.y = breath;
          rootGroup.position.x = 0;
          rootGroup.rotation.set(0, 0, 0);

          // Head tracks pointer with natural 3D spring limits
          headGroup.rotation.y = pX * 0.45;
          headGroup.rotation.x = pY * 0.35;
          headGroup.rotation.z = pX * -0.08;

          // Floating arms gentle sway
          if (moodState === 'welcome') {
            // Waving right hand
            rightArmGroup.rotation.z = 1.2 + Math.sin(elapsedTime * 6) * 0.4;
            rightArmGroup.position.y = -0.2 + Math.sin(elapsedTime * 6) * 0.05;
            leftArmGroup.rotation.z = Math.sin(elapsedTime * 2) * 0.08;
          } else {
            leftArmGroup.rotation.z = Math.sin(elapsedTime * 2) * 0.08;
            rightArmGroup.rotation.z = -Math.sin(elapsedTime * 2) * 0.08;
            rightArmGroup.position.set(0.95, -0.35, 0);
          }

          // Reset ear angles
          leftEarGroup.rotation.z = 0;
          rightEarGroup.rotation.z = 0;
        }

        // Shadow breathing sync
        shadowMesh.scale.setScalar(1 + rootGroup.position.y * 0.15);
        shadowMat.opacity = 0.65 - rootGroup.position.y * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      visorTexture.dispose();
      ceramicMaterial.dispose();
      darkAlloyMaterial.dispose();
      visorMaterial.dispose();
      emissiveCoreMaterial.dispose();
      shadowMat.dispose();
    };
  }, []);

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
        className="relative z-30 mb-2 max-w-[310px]"
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

      {/* --- REAL THREE.JS 3D CANVAS (TOUCH & DRAG INTERACTION) --- */}
      <motion.div
        drag
        dragConstraints={{ left: -30, right: 30, top: -20, bottom: 20 }}
        dragElastic={0.35}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMascotTap}
        className="relative flex items-center justify-center cursor-pointer select-none"
        style={{ width: 290, height: 290 }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: 290,
            height: 290,
            display: 'block',
            outline: 'none',
          }}
        />
      </motion.div>
    </div>
  );
};

export default Mascot3D;
