import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

  // Loading & Readiness state
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Three.js & Animation References
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const eyeMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const headBoneRef = useRef<THREE.Object3D | null>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const shadowMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

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

  // External celebration trigger (e.g. when user saves name or completes action)
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
    if (currentTrick !== 'idle') return; // Don't interrupt an active user trick

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

  // Pointer tracking
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (isDraggingRef.current) {
      dragPosRef.current = {
        x: Math.max(-0.6, Math.min(0.6, (e.clientX - centerX) * 0.005)),
        y: Math.max(-0.4, Math.min(0.4, -(e.clientY - centerY) * 0.005)),
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
        'Tap on me to see some flight maneuvers and fun tricks! 🎩',
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
  // REAL THREE.JS 3D SCENE LOADING EVE.GLB WITH PIXAR LIGHTING & SPRING PHYSICS
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 290;
    const height = 290;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    // Positioned for optimal portrait framing of EVE
    camera.position.set(0, 0.15, 3.25);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.0);
    keyLight.position.set(3.0, 4.0, 3.5);
    scene.add(keyLight);

    // Cool Sky Fill Light
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.6);
    fillLight.position.set(-3.0, -0.8, 2.5);
    scene.add(fillLight);

    // Electric Pixar Rim Backlight (Tinted by active theme)
    const rimLight = new THREE.PointLight(new THREE.Color(accentColor), 5.5, 9);
    rimLight.position.set(0, 1.2, -2.5);
    scene.add(rimLight);

    // Front Chest Fill Light (Tinted by active theme)
    const frontAccentLight = new THREE.PointLight(new THREE.Color(accentColor), 2.2, 5);
    frontAccentLight.position.set(0, -0.8, 2.4);
    scene.add(frontAccentLight);

    // 3. Realistic Pixar Soft Ground Contact Shadow
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
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.18, 0);
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;
    shadowMatRef.current = shadowMat;

    // 4. Model Root Group
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);
    modelRootRef.current = modelRoot;

    // 5. Load official Pixar EVE GLB Model
    const loader = new GLTFLoader();
    loader.load(
      '/models/EVE.glb',
      (gltf) => {
        const model = gltf.scene;

        // Scale & position EVE for ideal portrait balance
        // Height of model is ~1.34; scale 1.48 makes height ~1.98
        model.scale.setScalar(1.48);
        model.position.set(0, -0.98, 0);
        modelRoot.add(model);

        // Enhance materials with Pixar enamel finish & radiant eye glow
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.SkinnedMesh;
            mesh.frustumCulled = false; // Prevents clipping during acrobatic animations

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                if (mat.name === 'mat_0' || mat.name === 'mat_1' || mat.name === 'mat_6') {
                  // Smooth pearlescent white ceramic chassis
                  mat.color.setHex(0xfafafa);
                  mat.roughness = 0.16;
                  mat.metalness = 0.05;
                } else if (mat.name === 'EVE_Head_COMN') {
                  // High-gloss dark face visor
                  mat.roughness = 0.1;
                  mat.metalness = 0.15;
                } else if (mat.name === 'EVE_Eye_COMN') {
                  // Bioluminescent OLED eye display
                  mat.toneMapped = false; // Vivid glowing eyes
                  mat.emissive = new THREE.Color(accentColorRef.current);
                  mat.emissiveIntensity = 2.8;
                  eyeMatRef.current = mat;
                }
              }
            });
          }
        });

        // Store bones
        const headBone = model.getObjectByName('bone_002');
        headBoneRef.current = headBone || null;

        // Setup AnimationMixer
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;

        const actionsMap: Record<string, THREE.AnimationAction> = {};
        gltf.animations.forEach((clip) => {
          actionsMap[clip.name] = mixer.clipAction(clip);
        });
        actionsRef.current = actionsMap;

        // Start with default idle animation
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

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      // Color synchronization with user theme
      const activeColor = new THREE.Color(accentColorRef.current);
      if (eyeMatRef.current) {
        eyeMatRef.current.emissive.copy(activeColor);
        // Subtle bioluminescent breathing pulse on eyes
        eyeMatRef.current.emissiveIntensity = 2.8 + Math.sin(elapsedTime * 3.0) * 0.4;
      }
      rimLight.color.copy(activeColor);
      frontAccentLight.color.copy(activeColor);

      // Update skeletal animation mixer
      if (mixerRef.current) {
        mixerRef.current.update(dt);
      }

      // 1. Damped Spring Pointer Tracking for Head
      const targetX = targetPointerRef.current.x * 0.45;
      const targetY = targetPointerRef.current.y * 0.35;

      const k_spring = 26;
      const damping = 7.5;
      headVelX += ((targetX - headRotY) * k_spring - headVelX * damping) * dt;
      headVelY += ((-targetY - headRotX) * k_spring - headVelY * damping) * dt;
      headRotY += headVelX * dt;
      headRotX += headVelY * dt;

      // Layer procedural spring look-at ON TOP of skeletal animations!
      if (headBoneRef.current) {
        headBoneRef.current.rotation.y += headRotY * 0.7; // Yaw
        headBoneRef.current.rotation.x += headRotX * 0.45; // Pitch
        headBoneRef.current.rotation.z += headRotY * -0.15; // Inquisitive tilt
      }

      // 2. Physics Drag & Spring-Damper Recovery
      if (!isDraggingRef.current) {
        const kDrag = 32;
        const dDrag = 7.5;
        dragVelRef.current.x += (-dragPosRef.current.x * kDrag - dragVelRef.current.x * dDrag) * dt;
        dragVelRef.current.y += (-dragPosRef.current.y * kDrag - dragVelRef.current.y * dDrag) * dt;
        dragPosRef.current.x += dragVelRef.current.x * dt;
        dragPosRef.current.y += dragVelRef.current.y * dt;
      }

      // 3. Gentle Zero-G Floating Hover & Bank Roll
      const hover = Math.sin(elapsedTime * 2.2) * 0.045;
      if (modelRootRef.current) {
        modelRootRef.current.position.y = hover + dragPosRef.current.y;
        modelRootRef.current.position.x = dragPosRef.current.x;
        // Natural aerodynamic banking when moved sideways
        modelRootRef.current.rotation.z = -dragPosRef.current.x * 0.4;
      }

      // 4. Contact Shadow Sync
      if (shadowMeshRef.current && shadowMatRef.current) {
        const elev = hover + dragPosRef.current.y;
        shadowMeshRef.current.scale.setScalar(1 + elev * 0.25);
        shadowMatRef.current.opacity = Math.max(0.12, 0.6 - elev * 0.25);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
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
        {/* Subtle glowing loading placeholder while GLB model loads */}
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