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
  const [idleThoughtIndex, setIdleThoughtIndex] = useState(0);

  // Drag physics states
  const isDraggingRef = useRef(false);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const dragVelRef = useRef({ x: 0, y: 0 });

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
          'Wheee! Real Pixar physics in action! 🌟',
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
    }, 3500);
  };

  // External celebration trigger
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

    if (isDraggingRef.current) {
      dragPosRef.current = {
        x: (e.clientX - centerX) * 0.015,
        y: -(e.clientY - centerY) * 0.015,
      };
    }

    targetPointerRef.current = {
      x: Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2))),
    };
  };

  const handlePointerLeave = () => {
    targetPointerRef.current = { x: 0, y: 0 };
    isDraggingRef.current = false;
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
  // REAL THREE.JS 3D SCENE & RIGGING WITH 3D MESH PIXAR EYES & PHYSICAL SPRING PHYSICS
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 290;
    const height = 290;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 5.4);

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

    // 2. Pixar Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.2);
    keyLight.position.set(3.5, 4.5, 3.8);
    scene.add(keyLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.6);
    fillLight.position.set(-3.5, -1.0, 2.5);
    scene.add(fillLight);

    // Electric Pixar Rim Light (Colored by user's active theme)
    const rimLight = new THREE.PointLight(new THREE.Color(accentColor), 5.5, 9);
    rimLight.position.set(0, 1.0, -2.8);
    scene.add(rimLight);

    // Front Chest Fill Light
    const frontAccentLight = new THREE.PointLight(new THREE.Color(accentColor), 2.2, 6);
    frontAccentLight.position.set(0, -1.2, 2.6);
    scene.add(frontAccentLight);

    // 3. Pixar PBR Materials with Subsurface Scattering Emulation
    const ceramicMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      sheen: 1.0,
      sheenRoughness: 0.2,
      sheenColor: new THREE.Color(accentColor).multiplyScalar(0.4),
      transmission: 0.03, // Soft Pixar subsurface translucency
      thickness: 0.8,
    });

    const darkAlloyMaterial = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      roughness: 0.28,
      metalness: 0.88,
    });

    const visorGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x05070d,
      roughness: 0.06,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
    });

    // Super Bright OLED Eye Material (Guaranteed 100% visible and glowing!)
    const eyeGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColor),
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColor).multiplyScalar(0.7),
    });

    const catchlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const softCatchlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
    });

    const pinkBlushMaterial = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0,
    });

    const emissiveCoreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: 2.8,
      roughness: 0.2,
    });

    // 4. Rigged 3D Hierarchy
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

    const ringGeo = new THREE.TorusGeometry(1.52, 0.028, 16, 64);
    const ringMesh = new THREE.Mesh(ringGeo, darkAlloyMaterial);
    orbitGroup.add(ringMesh);

    const sparkGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const sparkMesh = new THREE.Mesh(sparkGeo, emissiveCoreMaterial);
    orbitGroup.add(sparkMesh);

    // Left Hand Group
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

    // Right Hand Group (Waving, High-Five, Clap)
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

    // Inset Curved OLED Visor Screen (Positioned ahead of head sphere front apex)
    const visorGeo = new THREE.SphereGeometry(0.98, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.52);
    visorGeo.scale(0.96, 0.9, 0.86);
    visorGeo.rotateX(Math.PI * 0.5);
    const visorMesh = new THREE.Mesh(visorGeo, visorGlassMaterial);
    visorMesh.position.set(0, 0.05, 0.38);
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

    // =========================================================================
    // 3D REAL POLYGONAL FACE RIG (PROUD IN FRONT OF VISOR - CANNOT CLIP OR HIDE)
    // =========================================================================
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.06, 1.18); // Positioned directly in front of visor!
    headGroup.add(faceGroup);

    // 1. Normal Eyes Group
    const normalEyesGroup = new THREE.Group();
    faceGroup.add(normalEyesGroup);

    // Left Eye Assembly
    const leftEyeContainer = new THREE.Group();
    leftEyeContainer.position.set(-0.35, 0.06, 0);
    normalEyesGroup.add(leftEyeContainer);

    const eyeGeo = new THREE.CapsuleGeometry(0.15, 0.24, 16, 16);
    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeGlowMaterial);
    leftEyeContainer.add(leftEyeMesh);

    // Pupil
    const pupilGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    leftPupil.position.set(0, 0, 0.07);
    leftEyeContainer.add(leftPupil);

    // Dual Pixar Catchlights
    const catchlightGeo = new THREE.SphereGeometry(0.046, 12, 12);
    const leftCatchlight1 = new THREE.Mesh(catchlightGeo, catchlightMaterial);
    leftCatchlight1.position.set(-0.04, 0.08, 0.12);
    leftEyeContainer.add(leftCatchlight1);

    const softCatchlightGeo = new THREE.SphereGeometry(0.026, 12, 12);
    const leftCatchlight2 = new THREE.Mesh(softCatchlightGeo, softCatchlightMaterial);
    leftCatchlight2.position.set(0.04, -0.06, 0.12);
    leftEyeContainer.add(leftCatchlight2);

    // Right Eye Assembly
    const rightEyeContainer = new THREE.Group();
    rightEyeContainer.position.set(0.35, 0.06, 0);
    normalEyesGroup.add(rightEyeContainer);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeGlowMaterial);
    rightEyeContainer.add(rightEyeMesh);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    rightPupil.position.set(0, 0, 0.07);
    rightEyeContainer.add(rightPupil);

    const rightCatchlight1 = new THREE.Mesh(catchlightGeo, catchlightMaterial);
    rightCatchlight1.position.set(-0.04, 0.08, 0.12);
    rightEyeContainer.add(rightCatchlight1);

    const rightCatchlight2 = new THREE.Mesh(softCatchlightGeo, softCatchlightMaterial);
    rightCatchlight2.position.set(0.04, -0.06, 0.12);
    rightEyeContainer.add(rightCatchlight2);

    // 2. 3D Eyebrows
    const leftBrowGroup = new THREE.Group();
    leftBrowGroup.position.set(-0.35, 0.32, 0);
    faceGroup.add(leftBrowGroup);

    const browGeo = new THREE.CapsuleGeometry(0.032, 0.18, 12, 12);
    browGeo.rotateZ(Math.PI / 2);
    const leftBrowMesh = new THREE.Mesh(browGeo, eyeGlowMaterial);
    leftBrowGroup.add(leftBrowMesh);

    const rightBrowGroup = new THREE.Group();
    rightBrowGroup.position.set(0.35, 0.32, 0);
    faceGroup.add(rightBrowGroup);

    const rightBrowMesh = new THREE.Mesh(browGeo, eyeGlowMaterial);
    rightBrowGroup.add(rightBrowMesh);

    // 3. 3D Glowing Rosy Cheeks (Blush)
    const blushGeo = new THREE.CircleGeometry(0.12, 24);
    const leftBlush = new THREE.Mesh(blushGeo, pinkBlushMaterial);
    leftBlush.position.set(-0.54, -0.14, 0);
    faceGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, pinkBlushMaterial);
    rightBlush.position.set(0.54, -0.14, 0);
    faceGroup.add(rightBlush);

    // 4. 3D Curved Smile Mouth
    const mouthGeo = new THREE.TorusGeometry(0.14, 0.024, 12, 24, Math.PI * 0.7);
    mouthGeo.rotateZ(Math.PI * 1.15);
    const mouthMesh = new THREE.Mesh(mouthGeo, eyeGlowMaterial);
    mouthMesh.position.set(0, -0.22, 0);
    faceGroup.add(mouthMesh);

    // 5. 3D Heart Eyes (For Love Mode)
    const heartEyesGroup = new THREE.Group();
    heartEyesGroup.scale.setScalar(0.0001); // Hidden initially
    faceGroup.add(heartEyesGroup);

    const createHeartMesh = () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.05);
      shape.bezierCurveTo(-0.16, -0.12, -0.16, -0.24, 0, -0.12);
      shape.bezierCurveTo(0.16, -0.24, 0.16, -0.12, 0, 0.05);
      const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.rotateZ(Math.PI);
      const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      return new THREE.Mesh(geo, mat);
    };

    const leftHeart = createHeartMesh();
    leftHeart.position.set(-0.35, 0.08, 0.02);
    heartEyesGroup.add(leftHeart);

    const rightHeart = createHeartMesh();
    rightHeart.position.set(0.35, 0.08, 0.02);
    heartEyesGroup.add(rightHeart);

    // 6. 3D Star Eyes (For Flip & Party Mode)
    const starEyesGroup = new THREE.Group();
    starEyesGroup.scale.setScalar(0.0001); // Hidden initially
    faceGroup.add(starEyesGroup);

    const createStarMesh = () => {
      const shape = new THREE.Shape();
      const points = 5;
      const outerRadius = 0.18;
      const innerRadius = 0.085;
      let angle = Math.PI / 2;
      shape.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      for (let i = 0; i < points; i++) {
        angle += Math.PI / points;
        shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
        angle += Math.PI / points;
        shape.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      }
      const extrudeSettings = { depth: 0.03, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor) });
      return new THREE.Mesh(geo, mat);
    };

    const leftStar = createStarMesh();
    leftStar.position.set(-0.35, 0.06, 0.02);
    starEyesGroup.add(leftStar);

    const rightStar = createStarMesh();
    rightStar.position.set(0.35, 0.06, 0.02);
    starEyesGroup.add(rightStar);

    // 7. 3D Spiral Dizzy Eyes
    const spiralEyesGroup = new THREE.Group();
    spiralEyesGroup.scale.setScalar(0.0001); // Hidden initially
    faceGroup.add(spiralEyesGroup);

    const createSpiralMesh = () => {
      const curvePoints = [];
      for (let i = 0; i < 40; i++) {
        const a = i * 0.35;
        const r = (i / 40) * 0.17;
        curvePoints.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (i / 40) * 0.04));
      }
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const geo = new THREE.TubeGeometry(curve, 32, 0.022, 8, false);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor) });
      return new THREE.Mesh(geo, mat);
    };

    const leftSpiral = createSpiralMesh();
    leftSpiral.position.set(-0.35, 0.06, 0.02);
    spiralEyesGroup.add(leftSpiral);

    const rightSpiral = createSpiralMesh();
    rightSpiral.position.set(0.35, 0.06, 0.02);
    spiralEyesGroup.add(rightSpiral);

    // Realistic Pixar Ground Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.88)');
      grad.addColorStop(0.35, 'rgba(0,0,0,0.35)');
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

    // =========================================================================
    // PHYSICAL SPRING-DAMPER DYNAMICS SIMULATION & ANIMATION LOOP
    // =========================================================================
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let flipStartTime = -1;

    // Physics state vectors
    let headRotX = 0;
    let headRotY = 0;
    let headVelX = 0;
    let headVelY = 0;

    let antennaRotZ = 0;
    let antennaVelZ = 0;

    let blinkScale = 1;
    let nextBlinkTime = 2.0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      // Color synchronization
      const activeColor = new THREE.Color(accentColorRef.current);
      eyeGlowMaterial.color.copy(activeColor);
      pupilMaterial.color.copy(activeColor).multiplyScalar(0.7);
      emissiveCoreMaterial.color.copy(activeColor);
      emissiveCoreMaterial.emissive.copy(activeColor);
      rimLight.color.copy(activeColor);
      frontAccentLight.color.copy(activeColor);

      const trick = currentTrickRef.current;
      const moodState = moodRef.current;

      // 1. Damped Spring Pointer Tracking
      const targetX = targetPointerRef.current.x * 0.45;
      const targetY = targetPointerRef.current.y * 0.35;

      const k_spring = 28;
      const damping = 8;
      headVelX += ((targetX - headRotY) * k_spring - headVelX * damping) * dt;
      headVelY += ((-targetY - headRotX) * k_spring - headVelY * damping) * dt;
      headRotY += headVelX * dt;
      headRotX += headVelY * dt;

      // 2. Antenna Flexible Inverted-Pendulum Physics
      const antennaForce = -headVelX * 0.25;
      antennaVelZ += ((antennaForce - antennaRotZ) * 35 - antennaVelZ * 6) * dt;
      antennaRotZ += antennaVelZ * dt;
      antennaGroup.rotation.z = antennaRotZ + Math.sin(elapsedTime * 4) * 0.05;

      // 3. Eye Blink Logic (Organic periodic eyelid sweep)
      if (elapsedTime > nextBlinkTime) {
        blinkScale = Math.max(0.08, blinkScale - dt * 14);
        if (blinkScale <= 0.08) {
          nextBlinkTime = elapsedTime + 2.5 + Math.random() * 2.8;
        }
      } else {
        blinkScale = Math.min(1.0, blinkScale + dt * 12);
      }

      // 4. Pupil Gaze Physics (Pupils glance towards target)
      const pupilTargetX = targetPointerRef.current.x * 0.04;
      const pupilTargetY = (isFocusedRef.current ? -0.05 : -targetPointerRef.current.y * 0.04);
      leftPupil.position.x = pupilTargetX;
      leftPupil.position.y = pupilTargetY;
      rightPupil.position.x = pupilTargetX;
      rightPupil.position.y = pupilTargetY;

      // 5. Rotate Spark around 3D Halo
      const sparkAngle = elapsedTime * 2.8;
      sparkMesh.position.set(Math.cos(sparkAngle) * 1.52, Math.sin(sparkAngle) * 1.52, 0);

      // 6. Dynamic Facial Expression Mode Switching (Punchy scale animations)
      const lerpScale = (group: THREE.Group, target: number) => {
        const cur = group.scale.x;
        const next = cur + (target - cur) * 0.2;
        group.scale.set(next, next, next);
      };

      if (trick === 'hearts') {
        lerpScale(normalEyesGroup, 0.0001);
        lerpScale(heartEyesGroup, 1.0 + Math.sin(elapsedTime * 6) * 0.15);
        lerpScale(starEyesGroup, 0.0001);
        lerpScale(spiralEyesGroup, 0.0001);
        pinkBlushMaterial.opacity = Math.min(0.9, pinkBlushMaterial.opacity + dt * 3);
      } else if (trick === 'dizzy') {
        lerpScale(normalEyesGroup, 0.0001);
        lerpScale(heartEyesGroup, 0.0001);
        lerpScale(starEyesGroup, 0.0001);
        lerpScale(spiralEyesGroup, 1.0);
        leftSpiral.rotation.z = elapsedTime * 8;
        rightSpiral.rotation.z = -elapsedTime * 8;
        pinkBlushMaterial.opacity = Math.max(0, pinkBlushMaterial.opacity - dt * 2);
      } else if (trick === 'flip' || trick === 'party' || moodState === 'celebrate') {
        lerpScale(normalEyesGroup, 0.0001);
        lerpScale(heartEyesGroup, 0.0001);
        lerpScale(starEyesGroup, 1.0);
        lerpScale(spiralEyesGroup, 0.0001);
        leftStar.rotation.z = elapsedTime * 4;
        rightStar.rotation.z = -elapsedTime * 4;
        pinkBlushMaterial.opacity = Math.max(0, pinkBlushMaterial.opacity - dt * 2);
      } else {
        lerpScale(normalEyesGroup, 1.0);
        lerpScale(heartEyesGroup, 0.0001);
        lerpScale(starEyesGroup, 0.0001);
        lerpScale(spiralEyesGroup, 0.0001);
        pinkBlushMaterial.opacity = Math.max(0, pinkBlushMaterial.opacity - dt * 2);

        // Apply blinking to normal eyes
        leftEyeContainer.scale.y = blinkScale;
        rightEyeContainer.scale.y = trick === 'wink' ? 0.08 : blinkScale;
      }

      // 7. Eyebrow Expressions
      if (trick === 'curious') {
        leftBrowGroup.position.y = 0.38;
        leftBrowGroup.rotation.z = 0.35;
        rightBrowGroup.position.y = 0.28;
        rightBrowGroup.rotation.z = -0.15;
      } else if (isFocusedRef.current) {
        leftBrowGroup.position.y = 0.29;
        leftBrowGroup.rotation.z = -0.15;
        rightBrowGroup.position.y = 0.29;
        rightBrowGroup.rotation.z = 0.15;
      } else {
        leftBrowGroup.position.y = 0.32;
        leftBrowGroup.rotation.z = 0.08;
        rightBrowGroup.position.y = 0.32;
        rightBrowGroup.rotation.z = -0.08;
      }

      // 8. Procedural Movement & Tricks with Disney Squash & Stretch Physics
      if (trick === 'flip') {
        if (flipStartTime < 0) flipStartTime = elapsedTime;
        const progress = Math.min(1, (elapsedTime - flipStartTime) / 1.15);

        // 360° Zero-G Backflip with Mass Conservation Squash & Stretch
        const jumpY = Math.sin(progress * Math.PI) * 1.6;
        rootGroup.position.y = jumpY;
        rootGroup.rotation.x = progress * Math.PI * 2;

        const squash = progress < 0.15 ? 0.78 : progress < 0.85 ? 1.28 : 0.82;
        rootGroup.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));

        shadowMesh.scale.setScalar(1 - jumpY * 0.35);
        shadowMat.opacity = Math.max(0.15, 0.65 - jumpY * 0.3);
      } else {
        flipStartTime = -1;

        if (trick === 'dizzy') {
          rootGroup.rotation.y = elapsedTime * 8;
          rootGroup.rotation.z = Math.sin(elapsedTime * 6) * 0.18;
          rootGroup.position.y = Math.sin(elapsedTime * 4) * 0.06;
          leftEarGroup.rotation.z = 0.4;
          rightEarGroup.rotation.z = -0.4;
        } else if (trick === 'tickle') {
          rootGroup.rotation.y = Math.sin(elapsedTime * 24) * 0.18;
          rootGroup.position.x = Math.sin(elapsedTime * 28) * 0.1;
          rootGroup.position.y = Math.sin(elapsedTime * 8) * 0.06;
          leftArmGroup.rotation.z = 1.05;
          rightArmGroup.rotation.z = -1.05;
        } else if (trick === 'highfive') {
          rootGroup.position.y = Math.sin(elapsedTime * 3) * 0.06;
          rightArmGroup.rotation.x = -1.25;
          rightArmGroup.position.z = 0.45;
          rightArmGroup.rotation.z = 0.3;
        } else if (trick === 'party') {
          rootGroup.position.y = Math.abs(Math.sin(elapsedTime * 7)) * 0.25;
          leftArmGroup.rotation.z = 0.4 + Math.sin(elapsedTime * 14) * 0.35;
          rightArmGroup.rotation.z = -0.4 - Math.sin(elapsedTime * 14) * 0.35;
        } else if (trick === 'hearts') {
          rootGroup.position.y = Math.sin(elapsedTime * 2) * 0.08;
          rootGroup.rotation.z = Math.sin(elapsedTime * 2.5) * 0.08;
          leftArmGroup.rotation.z = 0.95;
          rightArmGroup.rotation.z = -0.95;
        } else if (trick === 'wink') {
          headGroup.rotation.z = 0.2;
          rightArmGroup.rotation.x = -0.6;
          rightArmGroup.rotation.z = 0.5;
        } else if (trick === 'curious') {
          headGroup.rotation.z = 0.36;
          leftEarGroup.rotation.z = -0.3;
          rightEarGroup.rotation.z = 0.35;
        } else {
          // Organic Breathing Cycle & Real-time head tracking
          const breath = Math.sin(elapsedTime * 2.2) * 0.08;
          rootGroup.position.y = breath;
          rootGroup.position.x = 0;
          rootGroup.rotation.set(0, 0, 0);

          headGroup.rotation.y = headRotY;
          headGroup.rotation.x = headRotX;
          headGroup.rotation.z = headRotY * -0.15;

          if (moodState === 'welcome') {
            rightArmGroup.rotation.z = 1.2 + Math.sin(elapsedTime * 6) * 0.4;
            rightArmGroup.position.y = -0.2 + Math.sin(elapsedTime * 6) * 0.05;
            leftArmGroup.rotation.z = Math.sin(elapsedTime * 2) * 0.08;
          } else {
            leftArmGroup.rotation.z = Math.sin(elapsedTime * 2) * 0.08;
            rightArmGroup.rotation.z = -Math.sin(elapsedTime * 2) * 0.08;
            rightArmGroup.position.set(0.95, -0.35, 0);
          }

          leftEarGroup.rotation.z = 0;
          rightEarGroup.rotation.z = 0;
        }

        shadowMesh.scale.setScalar(1 + rootGroup.position.y * 0.15);
        shadowMat.opacity = 0.65 - rootGroup.position.y * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      ceramicMaterial.dispose();
      darkAlloyMaterial.dispose();
      visorGlassMaterial.dispose();
      eyeGlowMaterial.dispose();
      pupilMaterial.dispose();
      catchlightMaterial.dispose();
      softCatchlightMaterial.dispose();
      pinkBlushMaterial.dispose();
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
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          isDraggingRef.current = false;
        }}
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
