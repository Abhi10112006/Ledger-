
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useKeyboard } from '../contexts/KeyboardContext';
import { Delete, Check, ArrowUp, SlidersHorizontal, MoveVertical, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface Props {
  activeTheme: any;
}

type ShiftState = 'OFF' | 'ONCE' | 'LOCKED';

// --- HAPTIC ENGINE (MAXIMUM UNIFORM) ---
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      // Single, strong mechanical tick for everything
      navigator.vibrate(50); 
    } catch (e) {}
  }
};

const VirtualKeyboard = React.memo<Props>(({ activeTheme }) => {
  const { isVisible, activeInput, closeKeyboard, layout } = useKeyboard();
  const [shiftState, setShiftState] = useState<ShiftState>('OFF');
  const [viewMode, setViewMode] = useState<'ALPHA' | 'SYMBOLS'>('ALPHA');
  
  // Device Detection State
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device supports touch AND has coarse pointer (finger)
    // This effectively filters out desktops and laptops (even with touchscreens, usually pointer:fine)
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
      // Always reset resize mode when reopening
      setIsResizeMode(false);
      setTempScale(scale);
    }
  }, [isVisible, scale]);

  // --- INPUT LOGIC ---
  const insertCharacter = useCallback((char: string) => {
    if (!activeInput) return;
    
    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const currentVal = activeInput.value;

    const newValue = currentVal.substring(0, start) + char + currentVal.substring(end);
    
    // React 16+ hack to trigger native onChange
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

  const handleKeyAction = (key: string) => {
    if (!activeInput) return;

    if (key === 'BACKSPACE') {
      deleteCharacter();
      return;
    } 
    
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

  // --- RESIZE HANDLERS ---
  const handleResizeDrag = (_: any, info: PanInfo) => {
    // Moving UP (negative Y) should increase size
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

  // --- LAYOUT DEFINITIONS ---
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
    ['?123', 'SPACE', 'DONE']
  ];

  const SYMBOLS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
    ['\\', '=', '*', '"', "'", ':', ';', '!', '?', 'BACKSPACE'],
    ['ABC', 'SPACE', 'DONE']
  ];

  const getCurrentLayout = () => {
    if (layout === 'number') return NUM_PAD;
    return viewMode === 'SYMBOLS' ? SYMBOLS : QWERTY;
  };

  const rows = getCurrentLayout();
  // Calculate heights dynamically
  const activeScale = isResizeMode ? tempScale : scale;
  const baseHeight = 54; // Optimized for ~56dp native feel
  const keyHeight = baseHeight * activeScale;

  // --- KEY RENDERER ---
  const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
    let content: React.ReactNode = key;
    let widthClass = "flex-1"; 
    let variant: 'standard' | 'action' | 'special' | 'space' = 'standard';
    
    switch (key) {
        case 'BACKSPACE':
            content = <Delete className="w-6 h-6 stroke-[2.5]" />;
            variant = 'special';
            widthClass = layout === 'number' ? "flex-1" : "flex-[1.5]";
            break;
        case 'SHIFT':
            content = (
              <div className="relative">
                <ArrowUp className={`w-6 h-6 stroke-[2.5] transition-all ${shiftState !== 'OFF' ? 'fill-white stroke-white' : ''}`} />
                {shiftState === 'LOCKED' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                )}
              </div>
            );
            variant = 'special';
            widthClass = "flex-[1.5]";
            break;
        case 'SPACE':
            content = <div className="w-16 h-1.5 bg-slate-400/30 rounded-full" />;
            variant = 'space';
            widthClass = "flex-[4]";
            break;
        case 'DONE':
            content = <Check className="w-7 h-7 stroke-[3]" />;
            variant = 'action';
            widthClass = layout === 'number' ? "flex-1" : "flex-[2]";
            break;
        case '?123':
            content = '?123';
            variant = 'special';
            widthClass = "flex-[1.5]";
            break;
        case 'ABC':
            content = 'ABC';
            variant = 'special';
            widthClass = "flex-[1.5]";
            break;
        default:
            if (viewMode === 'ALPHA' && shiftState !== 'OFF') {
                content = key.toUpperCase();
            }
            break;
    }

    let baseStyle = "backdrop-blur-xl shadow-lg relative overflow-hidden transition-all active:scale-95 active:brightness-125";
    let colorStyle = "";

    if (variant === 'standard') {
        colorStyle = "bg-slate-900/80 border border-slate-700/50 text-slate-100 shadow-[0_4px_0_rgba(0,0,0,0.4)]";
    } else if (variant === 'special') {
        colorStyle = "bg-slate-800/80 border border-slate-600/50 text-slate-300 shadow-[0_4px_0_rgba(0,0,0,0.4)]";
        if (key === 'BACKSPACE') colorStyle = "bg-slate-900/80 border border-rose-900/30 text-rose-400 shadow-[0_4px_0_rgba(0,0,0,0.4)]";
        if (key === 'SHIFT' && shiftState !== 'OFF') colorStyle = "bg-slate-700 border border-white/30 text-white shadow-[0_4px_0_rgba(0,0,0,0.4)]";
        if (key === 'SHIFT' && shiftState === 'LOCKED') colorStyle = "bg-slate-600 border border-white/50 text-white shadow-[0_4px_0_rgba(0,0,0,0.4)] ring-1 ring-emerald-500/50";
    } else if (variant === 'space') {
        colorStyle = "bg-slate-900/80 border border-slate-700/50 shadow-[0_4px_0_rgba(0,0,0,0.4)]";
    } else if (variant === 'action') {
        colorStyle = `${activeTheme.bg} border border-transparent text-slate-950 shadow-[0_4px_0_rgba(0,0,0,0.2)]`;
    }

    return (
        <motion.button
            key={`${rowIndex}-${key}`}
            onPointerDown={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                
                triggerHaptic();

                if (key === 'SHIFT') {
                    handleShiftToggle();
                } else if (key === '?123') {
                    setViewMode('SYMBOLS');
                } else if (key === 'ABC') {
                    setViewMode('ALPHA');
                    setShiftState('OFF');
                } else {
                    handleKeyAction(key);
                }
            }}
            style={{ height: keyHeight }}
            className={`
                ${widthClass} ${baseStyle} ${colorStyle}
                rounded-xl flex items-center justify-center
                text-2xl font-semibold select-none touch-none
            `}
        >
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            {content}
        </motion.button>
    );
  };

  // If not a touch device (or likely to have a physical keyboard), do not render
  if (!isTouchDevice) return null;

  return (
    <AnimatePresence>
      {isVisible && (
      <motion.div
        ref={containerRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-[4000] pb-safe pointer-events-none"
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
                            className={`p-1.5 rounded-lg ${activeTheme.bg} text-slate-950 shadow-lg`}
                         >
                            <Check className="w-4 h-4 stroke-[3]" />
                         </button>
                    </div>
                 </motion.div>
            ) : (
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        setIsResizeMode(true);
                        triggerHaptic();
                    }}
                    className="p-2 rounded-lg bg-slate-900/60 border border-transparent hover:border-white/5 text-slate-500 hover:text-white transition-colors"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                </motion.button>
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
                           <div className={`h-12 px-6 rounded-full ${activeTheme.bg} text-slate-950 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3`}>
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
  );
});

export default VirtualKeyboard;
