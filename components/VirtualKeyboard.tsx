
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';
import { Delete, Check, ArrowUp, SlidersHorizontal, MoveVertical, X, RotateCcw, Smile, Maximize2, Moon, Sun, Cloud } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface Props {
  activeTheme: any;
}

type ShiftState = 'OFF' | 'ONCE' | 'LOCKED';
type ViewMode = 'ALPHA' | 'SYMBOLS' | 'EMOJI';
type KeyboardTheme = 'dark' | 'grey' | 'light';

// --- HAPTIC ENGINE ---
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(25); 
    } catch (e) {}
  }
};

// --- LAYOUTS ---
const NUM_PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'BACKSPACE', 'DONE']
];

const QWERTY = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BACKSPACE'],
  ['?123', ',', '☺', 'SPACE', '.', 'DONE']
];

const SYMBOLS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
  ['\\', '=', '*', '"', "'", ':', ';', '!', '?', 'BACKSPACE'],
  ['ABC', ',', 'SPACE', '.', 'DONE']
];

const EMOJIS = [
  ['👍', '👎', '❤️', '😂', '😭', '🔥', '🎉', '🙏', '🤝', '💸'],
  ['💰', '💳', '🧾', '✅', '❌', '💀', '🤡', '👀', '✨', '👋'],
  ['🤔', '🫡', '😡', '😱', '💩', '🇮🇳', '🇺🇸', '💪', '🧠', 'BACKSPACE'],
  ['ABC', 'SPACE', 'DONE']
];

// --- ISOLATED KEY COMPONENT ---
interface KeyProps {
  char: string;
  row: number;
  layout: string;
  viewMode: ViewMode;
  height: number;
  onPress: (char: string, id: string) => void;
  onRelease: () => void;
  registerRef: (id: string, el: HTMLButtonElement | null) => void;
}

const Key = React.memo<KeyProps>(({ 
  char, row, layout, viewMode, height, onPress, onRelease, registerRef 
}) => {
    let content: React.ReactNode = char;
    let widthClass = "flex-1"; 
    
    // Determine key type for CSS class mapping
    let keyType = 'std';
    if (char === 'BACKSPACE') keyType = 'back';
    else if (char === 'SHIFT') keyType = 'shift';
    else if (char === 'SPACE') keyType = 'space';
    else if (char === 'DONE') keyType = 'action';
    else if (['?123', 'ABC', '☺'].includes(char)) keyType = 'special';
    else if (char === ',' || char === '.') keyType = 'std'; 
    
    // Width Logic
    if (char === 'BACKSPACE') widthClass = layout === 'number' ? "flex-1" : "flex-[1.5]";
    else if (char === 'SHIFT' || char === '?123' || char === 'ABC') widthClass = "flex-[1.5]";
    else if (char === 'SPACE') widthClass = (viewMode === 'ALPHA' || viewMode === 'SYMBOLS') && layout !== 'number' ? "flex-[3]" : "flex-[4]";
    else if (char === 'DONE') widthClass = layout === 'number' ? "flex-1" : "flex-[2]";

    // Content Logic
    switch (char) {
        case 'BACKSPACE':
            content = <Delete className="w-6 h-6 stroke-[2.5]" />;
            break;
        case 'SHIFT':
            content = <ArrowUp className="w-6 h-6 stroke-[2.5] transition-all" />;
            break;
        case 'SPACE':
            content = <div className="w-16 h-1.5 opacity-30 bg-current rounded-full pointer-events-none" />;
            break;
        case 'DONE':
            content = <Check className="w-7 h-7 stroke-[3] pointer-events-none" />;
            break;
        case '☺':
            content = <Smile className="w-6 h-6 pointer-events-none" />;
            break;
        case ',':
        case '.':
            content = <span className="font-bold text-xl pb-2 pointer-events-none">{char}</span>;
            break;
        default:
            // Standard characters are rendered as-is.
            break;
    }

    const isBackspace = char === 'BACKSPACE';
    const uniqueKeyId = isBackspace ? `special-${char}` : `${row}-${char}`;

    return (
        <button
            ref={(el) => registerRef(uniqueKeyId, el)}
            onPointerDown={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                onPress(char, uniqueKeyId);
            }}
            onPointerUp={isBackspace ? onRelease : undefined}
            onPointerLeave={isBackspace ? onRelease : undefined}
            onContextMenu={(e) => e.preventDefault()}
            style={{ height }}
            className={`${widthClass} key-button`}
        >
            <div className={`v-key v-key-${keyType}`}>
                {/* Gloss Highlight */}
                <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                {content}
            </div>
        </button>
    );
}, (prev, next) => {
    // Custom Memoization Check to prevent unnecessary renders
    return (
        prev.char === next.char &&
        prev.row === next.row &&
        prev.layout === next.layout &&
        prev.viewMode === next.viewMode &&
        prev.height === next.height
    );
});

// --- MAIN COMPONENT ---
const VirtualKeyboard = React.memo<Props>(({ activeTheme }) => {
  const { isVisible, activeInput, closeKeyboard, layout, inputCallback } = useKeyboard();
  const [shiftState, setShiftState] = useState<ShiftState>('OFF');
  const [viewMode, setViewMode] = useState<ViewMode>('ALPHA');
  const [showTools, setShowTools] = useState(false);
  const [kbTheme, setKbTheme] = useState<KeyboardTheme>('dark');
  
  // Ref to hold shift state for non-reactive access in callbacks
  const shiftStateRef = useRef<ShiftState>('OFF');

  // Device Detection State
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // --- PERFORMANCE REFS ---
  const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  // Store timeouts for each key to handle rapid tapping correctly
  const animationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    shiftStateRef.current = shiftState;
  }, [shiftState]);

  useEffect(() => {
    const checkDevice = () => {
       const isCoarse = window.matchMedia('(pointer: coarse)').matches;
       const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
       setIsTouchDevice(isCoarse && hasTouch);
    };
    checkDevice();
  }, []);
  
  // Shift Double Tap Logic
  const lastShiftTapRef = useRef<number>(0);
  
  // Resize State
  const [scale, setScale] = useState(1);
  const [tempScale, setTempScale] = useState(1);
  const [isResizeMode, setIsResizeMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Backspace Long Press Logic
  const deleteTimerRef = useRef<any>(null);
  const deleteIntervalRef = useRef<any>(null);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    const savedScale = localStorage.getItem('keyboard_scale');
    if (savedScale) {
        setScale(parseFloat(savedScale));
        setTempScale(parseFloat(savedScale));
    }
    
    const savedTheme = localStorage.getItem('keyboard_theme_pref');
    if (savedTheme) {
        setKbTheme(savedTheme as KeyboardTheme);
    }
  }, []);

  const changeKbTheme = (theme: KeyboardTheme) => {
      setKbTheme(theme);
      localStorage.setItem('keyboard_theme_pref', theme);
      triggerHaptic();
  };

  useEffect(() => {
    if (isVisible) {
      setViewMode('ALPHA');
      setShiftState('OFF');
      setIsResizeMode(false);
      setShowTools(false);
      setTempScale(scale);
    }
  }, [isVisible, scale]);

  // --- ANIMATION ENGINE ---
  const animateKeyPress = useCallback((keyId: string) => {
    const btn = keyRefs.current.get(keyId);
    if (btn) {
        // 1. Clear any pending removal for this specific key (Fixes rapid tap cutoff)
        if (animationTimers.current.has(keyId)) {
            clearTimeout(animationTimers.current.get(keyId));
        }

        // 2. Visual Feedback Strategy
        // If key is already pressed, we momentarily remove the class to trigger the "release" transition (smooth),
        // then re-add it in the next frame to trigger "press" (instant).
        if (btn.classList.contains('v-key-pressed')) {
            btn.classList.remove('v-key-pressed');
            requestAnimationFrame(() => {
                btn.classList.add('v-key-pressed');
            });
        } else {
            // First press is instant
            btn.classList.add('v-key-pressed');
        }

        // 3. Set new cleanup timer
        const timer = setTimeout(() => {
            if (btn) btn.classList.remove('v-key-pressed');
            animationTimers.current.delete(keyId);
        }, 120);

        animationTimers.current.set(keyId, timer);
    }
  }, []);

  // --- INPUT LOGIC ---
  const insertCharacter = useCallback((char: string) => {
    if (!activeInput || !inputCallback) return;
    
    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const currentVal = activeInput.value;

    const newValue = currentVal.substring(0, start) + char + currentVal.substring(end);
    
    // 1. Update DOM immediately (Latency Killer)
    activeInput.value = newValue;

    // 2. Update React State Synchronously 
    // (Prevents conflict where React pushes old state back to DOM)
    inputCallback(newValue);

    // 3. Restore/Advance Cursor
    const newCursorPos = start + char.length;
    activeInput.setSelectionRange(newCursorPos, newCursorPos);

  }, [activeInput, inputCallback]);

  const deleteCharacter = useCallback(() => {
    if (!activeInput || !inputCallback) return;

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const currentVal = activeInput.value;

    let newValue;
    let newCursorPos;

    if (start !== end) {
      newValue = currentVal.substring(0, start) + currentVal.substring(end);
      newCursorPos = start;
    } else {
      if (start === 0) return;
      newValue = currentVal.substring(0, start - 1) + currentVal.substring(start);
      newCursorPos = start - 1;
    }

    // 1. Update DOM immediately
    activeInput.value = newValue;

    // 2. Update React State Synchronously
    inputCallback(newValue);
    
    // 3. Restore Cursor
    activeInput.setSelectionRange(newCursorPos, newCursorPos);

  }, [activeInput, inputCallback]);

  // Backspace Handling
  const stopDeleting = useCallback(() => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
      deleteTimerRef.current = null;
      deleteIntervalRef.current = null;
  }, []);

  const startDeleting = useCallback(() => {
      triggerHaptic();
      deleteCharacter();
      
      const btn = keyRefs.current.get('special-BACKSPACE');
      // Visual feedback for backspace press
      if (btn) {
          if (btn.classList.contains('v-key-pressed')) {
              btn.classList.remove('v-key-pressed');
              requestAnimationFrame(() => btn.classList.add('v-key-pressed'));
          } else {
              btn.classList.add('v-key-pressed');
          }
      }

      stopDeleting(); 
      deleteTimerRef.current = setTimeout(() => {
          deleteIntervalRef.current = setInterval(() => {
              triggerHaptic();
              deleteCharacter();
              // Pulse animation during long press
              if (btn) {
                  btn.classList.remove('v-key-pressed');
                  requestAnimationFrame(() => btn.classList.add('v-key-pressed'));
              }
          }, 100);
      }, 500); 
  }, [deleteCharacter, stopDeleting]);

  const stopDeletingWrapper = useCallback(() => {
      stopDeleting();
      const btn = keyRefs.current.get('special-BACKSPACE');
      if (btn) btn.classList.remove('v-key-pressed');
  }, [stopDeleting]);

  useEffect(() => {
      return () => stopDeleting();
  }, [stopDeleting, activeInput]);

  const handleShiftToggle = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastShiftTapRef.current;
    lastShiftTapRef.current = now;

    setShiftState(prev => {
      if (prev === 'OFF') return 'ONCE';
      if (prev === 'ONCE') {
        if (timeDiff < 300) return 'LOCKED';
        return 'OFF';
      }
      return 'OFF'; 
    });
  }, []);

  const handleKeyAction = useCallback((key: string) => {
    if (!activeInput) return;
    if (key === 'BACKSPACE') return; 
    
    if (key === 'SPACE') {
      insertCharacter(' ');
      return;
    } 
    
    if (key === 'DONE') {
      triggerHaptic();
      closeKeyboard(true);
      return;
    }

    let charToInsert = key;
    
    if (viewMode === 'ALPHA') {
      // Use Ref to access shift state without re-creating callback
      if (shiftStateRef.current !== 'OFF') {
        charToInsert = key.toUpperCase();
        if (shiftStateRef.current === 'ONCE') {
          setShiftState('OFF');
        }
      }
    }
    
    insertCharacter(charToInsert);
  }, [activeInput, viewMode, insertCharacter, closeKeyboard]);

  // Main interaction handler passed to Key component
  const handleKeyPointerDown = useCallback((key: string, uniqueId: string) => {
    const isBackspace = key === 'BACKSPACE';
    
    if (!isBackspace) {
        animateKeyPress(uniqueId);
    }

    if (isBackspace) {
        startDeleting();
        return;
    }
    
    triggerHaptic();

    if (key === 'SHIFT') {
        handleShiftToggle();
    } else if (key === '?123') {
        setViewMode('SYMBOLS');
    } else if (key === 'ABC') {
        setViewMode('ALPHA');
        setShiftState('OFF');
    } else if (key === '☺') {
        setViewMode('EMOJI');
    } else {
        handleKeyAction(key);
    }
  }, [animateKeyPress, startDeleting, handleShiftToggle, handleKeyAction]);

  const handleResizeDrag = (_: any, info: PanInfo) => {
    const sensitivity = 0.003; 
    setTempScale(prev => {
        const next = prev - (info.delta.y * sensitivity);
        return Math.max(0.65, Math.min(1.4, next));
    });
  };

  const saveResize = () => {
    setScale(tempScale);
    localStorage.setItem('keyboard_scale', tempScale.toString());
    setIsResizeMode(false);
    setShowTools(false);
    triggerHaptic();
  };

  const resetResize = () => {
      setTempScale(1);
      triggerHaptic();
  };

  const getCurrentLayout = () => {
    if (layout === 'number') return NUM_PAD;
    if (viewMode === 'SYMBOLS') return SYMBOLS;
    if (viewMode === 'EMOJI') return EMOJIS;
    return QWERTY;
  };

  const rows = getCurrentLayout();
  const activeScale = isResizeMode ? tempScale : scale;
  const baseHeight = 54; 
  const keyHeight = baseHeight * activeScale;

  // --- DYNAMIC STYLES ---
  const getThemeVars = () => {
      if (kbTheme === 'light') {
          return `
            --kb-bg: #e2e8f0;
            --kb-key-std-bg: #ffffff;
            --kb-key-special-bg: #cbd5e1;
            --kb-text-std: #0f172a;
            --kb-text-special: #334155;
            --kb-border: #94a3b8;
            --kb-shadow: rgba(0,0,0,0.1);
          `;
      }
      if (kbTheme === 'grey') {
          return `
            --kb-bg: #1e293b;
            --kb-key-std-bg: #334155;
            --kb-key-special-bg: #0f172a;
            --kb-text-std: #f8fafc;
            --kb-text-special: #cbd5e1;
            --kb-border: #475569;
            --kb-shadow: rgba(0,0,0,0.3);
          `;
      }
      // Dark Default
      return `
        --kb-bg: #020617;
        --kb-key-std-bg: rgba(15, 23, 42, 0.9);
        --kb-key-special-bg: rgba(30, 41, 59, 0.9);
        --kb-text-std: #f1f5f9;
        --kb-text-special: #cbd5e1;
        --kb-border: rgba(51, 65, 85, 0.5);
        --kb-shadow: rgba(0,0,0,0.4);
      `;
  };

  // If not a touch device (or likely to have a physical keyboard), do not render
  if (!isTouchDevice) return null;

  return (
    <>
    <style>{`
        ${isVisible ? `:root { ${getThemeVars()} }` : ''}

        /* --- HITBOX WRAPPER --- */
        .key-button {
            position: relative;
            padding: 0;
            border: none;
            background: transparent;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            outline: none;
            cursor: pointer;
        }

        /* EXPANDED HITBOX using pseudo-element */
        /* Extends 3px into the gap (gap-1 is 4px, so full coverage) */
        .key-button::before {
            content: '';
            position: absolute;
            top: -3px; 
            bottom: -3px; 
            left: -2px; 
            right: -2px;
            z-index: 0;
        }

        /* --- VISUAL KEY STYLING --- */
        .v-key {
            /* Hardware Accelerated Base Styles */
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 600;
            border-radius: 0.75rem;
            border-width: 1px;
            border-style: solid;
            
            /* Smooth release transition */
            transition: transform 0.1s ease, filter 0.1s ease;
            transform: translateZ(0);
        }

        /* --- STATE ANIMATIONS --- */
        /* When wrapper (.key-button) has pressed class, affect inner (.v-key) */
        .key-button.v-key-pressed .v-key {
            transform: scale(0.92) translateZ(0) !important;
            filter: brightness(1.3) !important;
            transition: none !important;
        }

        /* --- THEME COLORS --- */
        .v-key-std {
            background-color: var(--kb-key-std-bg);
            border-color: var(--kb-border);
            color: var(--kb-text-std);
            box-shadow: 0 4px 0 var(--kb-shadow);
        }

        /* Shift Case Handling */
        [data-shift-state="ONCE"] .v-key-std,
        [data-shift-state="LOCKED"] .v-key-std {
            text-transform: uppercase;
        }

        .v-key-special {
            background-color: var(--kb-key-special-bg);
            border-color: var(--kb-border);
            color: var(--kb-text-special);
            box-shadow: 0 4px 0 var(--kb-shadow);
        }

        .v-key-back {
            background-color: var(--kb-key-std-bg);
            border-color: rgba(136, 19, 55, 0.3);
            color: #fb7185;
            box-shadow: 0 4px 0 var(--kb-shadow);
        }

        .v-key-space {
            background-color: var(--kb-key-std-bg);
            border-color: var(--kb-border);
            color: var(--kb-text-std);
            box-shadow: 0 4px 0 var(--kb-shadow);
        }

        .v-key-action {
            background-color: var(--theme-color);
            border-color: transparent;
            color: #020617;
            box-shadow: 0 4px 0 rgba(0,0,0,0.2);
        }

        .v-key-shift {
            background-color: var(--kb-key-special-bg);
            border-color: var(--kb-border);
            color: var(--kb-text-special);
            box-shadow: 0 4px 0 var(--kb-shadow);
        }

        /* Shift Active States via Container Attribute */
        [data-shift-state="ONCE"] .v-key-shift {
            background-color: #334155;
            border-color: rgba(255,255,255,0.3);
            color: white;
        }

        [data-shift-state="ONCE"] .v-key-shift svg, 
        [data-shift-state="LOCKED"] .v-key-shift svg {
            fill: white;
            stroke: white;
        }

        [data-shift-state="LOCKED"] .v-key-shift {
            background-color: #475569;
            border-color: rgba(255,255,255,0.5);
            color: white;
            box-shadow: 0 4px 0 var(--kb-shadow), 0 0 0 2px rgba(16, 185, 129, 0.5);
        }

        /* Shift Lock Indicator Dot */
        [data-shift-state="LOCKED"] .v-key-shift::after {
            content: '';
            position: absolute;
            bottom: 6px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background-color: #34d399;
            border-radius: 50%;
            box-shadow: 0 0 5px rgba(52,211,153,0.8);
        }
    `}</style>
    <AnimatePresence>
      {isVisible && (
      <motion.div
        ref={containerRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-[4000] pb-safe pointer-events-none"
        style={{ '--theme-color': activeTheme.hex } as React.CSSProperties}
        data-shift-state={shiftState}
      >
        {/* Transparent Background */}
        <div className="absolute inset-x-0 bottom-0 top-12 bg-[var(--kb-bg)] pointer-events-none -z-10 border-t border-white/5 shadow-2xl" />

        {/* --- TOP BAR (Tools) --- */}
        <div 
          onPointerDown={(e) => e.preventDefault()}
          className="relative z-10 w-full flex justify-end items-center px-4 h-12 pointer-events-auto bg-transparent"
        >
            {isResizeMode ? (
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex w-full justify-between items-center pl-2"
                 >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Drag to Resize
                    </span>
                    <div className="flex gap-2">
                         <button 
                            onClick={resetResize}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                         >
                            <RotateCcw className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={saveResize}
                            style={{ backgroundColor: 'var(--theme-color)' }}
                            className="p-1.5 rounded-lg text-slate-950 shadow-lg"
                         >
                            <Check className="w-4 h-4 stroke-[3]" />
                         </button>
                    </div>
                 </motion.div>
            ) : showTools ? (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-3 p-1 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-2xl"
                 >
                     {/* Resize Option */}
                     <button 
                       onClick={() => setIsResizeMode(true)}
                       className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                       title="Resize Keyboard"
                     >
                       <Maximize2 className="w-4 h-4" />
                     </button>
                     
                     <div className="w-px h-4 bg-white/10"></div>

                     {/* Keyboard Theme Toggles */}
                     <div className="flex items-center gap-1 px-1">
                        <button
                             onClick={() => changeKbTheme('dark')}
                             className={`p-1.5 rounded-lg transition-all ${kbTheme === 'dark' ? 'bg-white text-slate-950 shadow-lg scale-110' : 'text-slate-400 hover:text-white'}`}
                             title="Dark Mode"
                        >
                            <Moon className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                             onClick={() => changeKbTheme('grey')}
                             className={`p-1.5 rounded-lg transition-all ${kbTheme === 'grey' ? 'bg-white text-slate-950 shadow-lg scale-110' : 'text-slate-400 hover:text-white'}`}
                             title="Grey Mode"
                        >
                            <Cloud className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                             onClick={() => changeKbTheme('light')}
                             className={`p-1.5 rounded-lg transition-all ${kbTheme === 'light' ? 'bg-white text-slate-950 shadow-lg scale-110' : 'text-slate-400 hover:text-white'}`}
                             title="Light Mode"
                        >
                            <Sun className="w-3.5 h-3.5 fill-current" />
                        </button>
                     </div>

                     <div className="w-px h-4 bg-white/10"></div>

                     {/* Close Tools */}
                     <button 
                       onClick={() => setShowTools(false)}
                       className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                 </motion.div>
            ) : (
                <button
                    onPointerDown={(e) => {
                        e.preventDefault();
                        setShowTools(true);
                        triggerHaptic();
                    }}
                    className="p-2 rounded-lg bg-slate-900/60 border border-transparent hover:border-white/5 text-slate-500 hover:text-white transition-colors active:scale-90"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* --- KEYBOARD GRID --- */}
        <div 
            onPointerDown={(e) => e.preventDefault()}
            className="relative z-10 px-1 pb-2 md:pb-4 pointer-events-auto max-w-3xl mx-auto transition-all duration-75 ease-out origin-bottom"
        >
            <div className="flex flex-col gap-1 pt-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex gap-1 w-full">
                        {row.map((k, j) => (
                            <Key 
                                key={`${i}-${k}`}
                                char={k}
                                row={i}
                                layout={layout}
                                viewMode={viewMode}
                                height={keyHeight}
                                onPress={handleKeyPointerDown}
                                onRelease={stopDeletingWrapper}
                                registerRef={(id, el) => {
                                    if (el) keyRefs.current.set(id, el);
                                    else keyRefs.current.delete(id);
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Resize Overlay */}
            {isResizeMode && (
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                    onPointerDown={(e) => e.preventDefault()}
                 >
                      {/* Invisible Drag Surface */}
                      <motion.div 
                         className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] cursor-ns-resize touch-none"
                         onPan={handleResizeDrag}
                      />
                      
                      {/* Visual Indicator */}
                      <div className="pointer-events-none relative z-50 flex flex-col items-center gap-3 animate-in zoom-in fade-in duration-300">
                           <div className="h-12 px-6 rounded-full text-slate-950 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3" style={{ backgroundColor: 'var(--theme-color)' }}>
                               <MoveVertical className="w-5 h-5" />
                               <span className="text-lg font-black font-mono">{Math.round(activeScale * 100)}%</span>
                           </div>
                      </div>
                 </motion.div>
            )}
        </div>

      </motion.div>
      )}
    </AnimatePresence>
    </>
  );
});

export default VirtualKeyboard;
