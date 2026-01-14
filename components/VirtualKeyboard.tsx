
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';
import { Delete, Check, ArrowUp, SlidersHorizontal, MoveVertical, X, RotateCcw, Smile } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface Props {
  activeTheme: any;
}

type ShiftState = 'OFF' | 'ONCE' | 'LOCKED';
type ViewMode = 'ALPHA' | 'SYMBOLS' | 'EMOJI';

// --- HAPTIC ENGINE ---
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(50); 
    } catch (e) {}
  }
};

const VirtualKeyboard = React.memo<Props>(({ activeTheme }) => {
  const { isVisible, activeInput, closeKeyboard, layout } = useKeyboard();
  const [shiftState, setShiftState] = useState<ShiftState>('OFF');
  const [viewMode, setViewMode] = useState<ViewMode>('ALPHA');
  
  // Device Detection State
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // --- PERFORMANCE REF MAP ---
  const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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
    const saved = localStorage.getItem('keyboard_scale');
    if (saved) {
        const val = parseFloat(saved);
        setScale(val);
        setTempScale(val);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      setViewMode('ALPHA');
      setShiftState('OFF');
      setIsResizeMode(false);
      setTempScale(scale);
    }
  }, [isVisible, scale]);

  // --- DIRECT DOM VISUAL FEEDBACK (0-LAG) ---
  const animateKeyPress = (keyId: string) => {
    const btn = keyRefs.current.get(keyId);
    if (btn) {
        btn.classList.add('v-key-pressed');
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (btn) btn.classList.remove('v-key-pressed');
            }, 100);
        });
    }
  };

  // --- INPUT LOGIC ---
  const insertCharacter = useCallback((char: string) => {
    if (!activeInput) return;
    
    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const currentVal = activeInput.value;

    const newValue = currentVal.substring(0, start) + char + currentVal.substring(end);
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(activeInput, newValue);
    } else {
        activeInput.value = newValue;
    }
    
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));

    const newCursorPos = start + char.length;
    activeInput.setSelectionRange(newCursorPos, newCursorPos);
  }, [activeInput]);

  const deleteCharacter = useCallback(() => {
    if (!activeInput) return;

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

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(activeInput, newValue);
    } else {
        activeInput.value = newValue;
    }

    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.setSelectionRange(newCursorPos, newCursorPos);
  }, [activeInput]);

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
      if (btn) btn.classList.add('v-key-pressed');

      stopDeleting(); 
      deleteTimerRef.current = setTimeout(() => {
          deleteIntervalRef.current = setInterval(() => {
              triggerHaptic();
              deleteCharacter();
              if (btn) {
                  btn.classList.remove('v-key-pressed');
                  void btn.offsetWidth; // reflow
                  btn.classList.add('v-key-pressed');
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

  const handleKeyAction = (key: string) => {
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
      if (shiftState !== 'OFF') {
        charToInsert = key.toUpperCase();
        if (shiftState === 'ONCE') {
          setShiftState('OFF');
        }
      }
    }
    
    insertCharacter(charToInsert);
  };

  const handleShiftToggle = () => {
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
  };

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
    triggerHaptic();
  };

  const resetResize = () => {
      setTempScale(1);
      triggerHaptic();
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

  // --- KEY RENDERER ---
  const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
    let content: React.ReactNode = key;
    let widthClass = "flex-1"; 
    
    // Determine key type for CSS class mapping
    let keyType = 'std';
    if (key === 'BACKSPACE') keyType = 'back';
    else if (key === 'SHIFT') keyType = 'shift';
    else if (key === 'SPACE') keyType = 'space';
    else if (key === 'DONE') keyType = 'action';
    else if (['?123', 'ABC', '☺'].includes(key)) keyType = 'special';
    else if (key === ',' || key === '.') keyType = 'std'; // Explicitly standard
    
    // Width Logic
    if (key === 'BACKSPACE') widthClass = layout === 'number' ? "flex-1" : "flex-[1.5]";
    else if (key === 'SHIFT' || key === '?123' || key === 'ABC') widthClass = "flex-[1.5]";
    else if (key === 'SPACE') widthClass = (viewMode === 'ALPHA' || viewMode === 'SYMBOLS') && layout !== 'number' ? "flex-[3]" : "flex-[4]";
    else if (key === 'DONE') widthClass = layout === 'number' ? "flex-1" : "flex-[2]";

    // Content Logic
    switch (key) {
        case 'BACKSPACE':
            content = <Delete className="w-6 h-6 stroke-[2.5]" />;
            break;
        case 'SHIFT':
            content = <ArrowUp className="w-6 h-6 stroke-[2.5] transition-all" />;
            break;
        case 'SPACE':
            content = <div className="w-16 h-1.5 bg-slate-400/30 rounded-full pointer-events-none" />;
            break;
        case 'DONE':
            content = <Check className="w-7 h-7 stroke-[3] pointer-events-none" />;
            break;
        case '☺':
            content = <Smile className="w-6 h-6 pointer-events-none" />;
            break;
        case ',':
        case '.':
            content = <span className="font-bold text-xl pb-2 pointer-events-none">{key}</span>;
            break;
        default:
            if (viewMode === 'ALPHA' && shiftState !== 'OFF' && key.length === 1) {
                content = key.toUpperCase();
            }
            break;
    }

    const isBackspace = key === 'BACKSPACE';
    const uniqueKeyId = isBackspace ? `special-${key}` : `${rowIndex}-${key}`;

    return (
        <button
            key={uniqueKeyId}
            ref={(el) => {
                if (el) keyRefs.current.set(uniqueKeyId, el);
                else keyRefs.current.delete(uniqueKeyId);
            }}
            data-shift={key === 'SHIFT' ? shiftState : undefined}
            onPointerDown={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                
                if (!isBackspace) {
                    animateKeyPress(uniqueKeyId);
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
            }}
            onPointerUp={isBackspace ? stopDeletingWrapper : undefined}
            onPointerLeave={isBackspace ? stopDeletingWrapper : undefined}
            onContextMenu={(e) => e.preventDefault()}
            style={{ height: keyHeight }}
            className={`
                ${widthClass} v-key v-key-${keyType}
            `}
        >
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            {content}
        </button>
    );
  };

  // If not a touch device (or likely to have a physical keyboard), do not render
  if (!isTouchDevice) return null;

  return (
    <>
    <style>{`
        .v-key {
            /* Hardware Accelerated Base Styles */
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 600;
            user-select: none;
            touch-action: none;
            border-radius: 0.75rem;
            border-width: 1px;
            border-style: solid;
            transition: transform 0.1s ease, filter 0.1s ease;
            transform: translateZ(0);
        }

        .v-key-std {
            background-color: rgba(15, 23, 42, 0.8);
            border-color: rgba(51, 65, 85, 0.5);
            color: #f1f5f9;
            box-shadow: 0 4px 0 rgba(0,0,0,0.4);
        }

        .v-key-special {
            background-color: rgba(30, 41, 59, 0.8);
            border-color: rgba(71, 85, 105, 0.5);
            color: #cbd5e1;
            box-shadow: 0 4px 0 rgba(0,0,0,0.4);
        }

        .v-key-back {
            background-color: rgba(15, 23, 42, 0.8);
            border-color: rgba(136, 19, 55, 0.3);
            color: #fb7185;
            box-shadow: 0 4px 0 rgba(0,0,0,0.4);
        }

        .v-key-space {
            background-color: rgba(15, 23, 42, 0.8);
            border-color: rgba(51, 65, 85, 0.5);
            box-shadow: 0 4px 0 rgba(0,0,0,0.4);
        }

        .v-key-action {
            background-color: var(--theme-color);
            border-color: transparent;
            color: #020617;
            box-shadow: 0 4px 0 rgba(0,0,0,0.2);
        }

        .v-key-shift {
            background-color: rgba(30, 41, 59, 0.8);
            border-color: rgba(71, 85, 105, 0.5);
            color: #cbd5e1;
            box-shadow: 0 4px 0 rgba(0,0,0,0.4);
        }

        .v-key-shift[data-shift="ONCE"] {
            background-color: #334155;
            border-color: rgba(255,255,255,0.3);
            color: white;
        }

        .v-key-shift[data-shift="ONCE"] svg, .v-key-shift[data-shift="LOCKED"] svg {
            fill: white;
            stroke: white;
        }

        .v-key-shift[data-shift="LOCKED"] {
            background-color: #475569;
            border-color: rgba(255,255,255,0.5);
            color: white;
            box-shadow: 0 4px 0 rgba(0,0,0,0.4), 0 0 0 2px rgba(16, 185, 129, 0.5);
        }

        /* Shift Lock Indicator Dot */
        .v-key-shift[data-shift="LOCKED"]::after {
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

        .v-key-pressed {
            transform: scale(0.92) translateZ(0) !important;
            filter: brightness(1.3) !important;
            transition: none !important;
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
      >
        {/* Transparent Background */}
        <div className="absolute inset-x-0 bottom-0 top-12 bg-slate-950 pointer-events-none -z-10 border-t border-white/5 shadow-2xl" />

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
            ) : (
                <button
                    onPointerDown={(e) => {
                        e.preventDefault();
                        setIsResizeMode(true);
                        triggerHaptic();
                    }}
                    className="p-2 rounded-lg bg-slate-900/60 border border-transparent hover:border-white/5 text-slate-500 hover:text-white transition-colors active:scale-90"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* --- KEYBOARD GRID --- */}
        <div className="relative z-10 px-1 pb-2 md:pb-4 pointer-events-auto max-w-3xl mx-auto transition-all duration-75 ease-out origin-bottom">
            <div className="flex flex-col gap-1 pt-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex gap-1 w-full">
                        {row.map((k, j) => renderKey(k, i, j))}
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
