
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { Transaction, AppSettings } from '../types';
import { generateStatementPDF } from '../utils/pdfGenerator';
import { generateShareCard, generateReceiptCard, generateLoanCard } from '../utils/imageGenerator';
import { motion, AnimatePresence } from 'framer-motion';

// Subcomponents
import ProfileHeader from './profile/ProfileHeader';
import ProfileStats from './profile/ProfileStats';
import HistoryItem from './profile/HistoryItem';

interface Props {
  account: {
    id: string; // Ledger ID
    name: string;
    transactions: Transaction[];
    totalExposure: number;
    trustScore: number;
  };
  settings: AppSettings;
  activeTheme: any;
  onBack: () => void;
  onGive: () => void; 
  onReceive: (txId: string | null) => void;
  onDeleteTransaction: (txId: string) => void;
  onDeleteRepayment: (txId: string, repId: string) => void;
  onDeleteProfile: () => void;
  onUpdateDueDate: (txId: string) => void;
  onEditRepayment: (txId: string, repId: string) => void;
}

const ProfileView: React.FC<Props> = ({ 
  account, 
  settings, 
  activeTheme, 
  onBack, 
  onGive, 
  onReceive,
  onDeleteTransaction,
  onDeleteRepayment,
  onDeleteProfile,
  onUpdateDueDate,
  onEditRepayment
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'PROFILE' | 'TRANSACTION' | 'REPAYMENT';
    txId?: string;
    repId?: string;
  } | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);

  // 1. Flatten History: Combine Loans (Starts) and Repayments into one timeline
  const historyItems = account.transactions.flatMap(tx => {
    const items = [];
    items.push({
      id: tx.id,
      date: new Date(tx.startDate),
      type: 'LOAN',
      amount: tx.principalAmount,
      note: tx.notes || 'Loan Given',
      isCompleted: tx.isCompleted,
      rawTx: tx,
      repId: null
    });
    tx.repayments.forEach(rep => {
      items.push({
        id: tx.id, 
        date: new Date(rep.date),
        type: 'PAYMENT',
        amount: rep.amount,
        note: 'Payment Received',
        isCompleted: true,
        rawTx: tx,
        repId: rep.id
      });
    });
    return items;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  // 2. Find Next Collection Date
  const activeLoans = account.transactions.filter(t => !t.isCompleted);
  const nextDueTx = activeLoans.length > 0 
    ? activeLoans.sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime())[0]
    : null;

  // --- ACTIONS ---

  const handleShareMessage = async (platform: 'sms' | 'whatsapp') => {
    setIsSharing(true);
    const phoneNumber = account.transactions.find(t => t.friendPhone)?.friendPhone;
    const amountStr = `${settings.currency}${Math.round(account.totalExposure)}`;
    
    let message = `Hi ${account.name}, please pay your due of ${amountStr}.`;
    let isOverdue = false;
    let diffDays = 0;
    let dueDate: Date | null = null;

    if (nextDueTx) {
        dueDate = new Date(nextDueTx.returnDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueCmp = new Date(nextDueTx.returnDate);
        dueCmp.setHours(0,0,0,0);
        const diffTime = dueCmp.getTime() - today.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        if (diffDays < 0) {
            isOverdue = true;
            diffDays = Math.abs(diffDays);
            message = `URGENT: Hi ${account.name}, your payment is overdue by ${diffDays} days! Please clear your outstanding balance of ${amountStr}. It was due on ${dateStr}.`;
        } else if (diffDays === 0) {
            message = `Hi ${account.name}, friendly reminder that your payment of ${amountStr} is due TODAY (${dateStr}).`;
        } else {
            message = `Hi ${account.name}, just a friendly reminder. You have ${diffDays} days left to pay your balance of ${amountStr}. Due Date: ${dateStr}.`;
        }
    }

    try {
        if (navigator.share) {
            const imageFile = await generateShareCard(
                settings.userName,
                account.name,
                account.id,
                account.totalExposure,
                settings.currency,
                dueDate,
                isOverdue,
                diffDays,
                message
            );

            const shareData: any = {
                title: `Payment Request`,
                files: imageFile ? [imageFile] : []
            };

            try {
                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    setIsSharing(false);
                    return; 
                }
            } catch (shareError) {
                console.log("Native share failed", shareError);
            }
        }
    } catch (e) {
        console.error("Image generation failed", e);
    }
    
    setIsSharing(false);

    if (platform === 'whatsapp') {
      let link = '';
      if (phoneNumber) {
        const cleanNum = phoneNumber.replace(/[^\d]/g, '');
        link = `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
      } else {
        link = `https://wa.me/?text=${encodeURIComponent(message)}`;
      }
      window.open(link, '_blank');
    } else {
      const link = phoneNumber 
        ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
        : `sms:?body=${encodeURIComponent(message)}`;
      window.open(link, '_self');
    }
  };

  const handleShareReceipt = async (item: any) => {
      if (!navigator.share) {
          alert("Sharing not supported on this browser.");
          return;
      }
      setSharingId(item.repId);
      
      try {
        const tx = item.rawTx;
        const paymentDate = new Date(item.date);
        const dueDate = new Date(tx.returnDate);
        
        const p = new Date(paymentDate); p.setHours(0,0,0,0);
        const d = new Date(dueDate); d.setHours(0,0,0,0);
        
        let timeliness: 'early' | 'ontime' | 'late' = 'ontime';
        let message = "Thanks for the payment!";
        
        if (p < d) {
            timeliness = 'early';
            message = "Thanks for the early payment! You're amazing. 🌟";
        } else if (p > d) {
            timeliness = 'late';
            const sarcasms = [
                "Finally! I was about to file a missing person report. Thanks.",
                "Look at you, eventually paying up! I'm weeping with joy. 👏",
                "My wallet missed you. Better late than never, I suppose? 💅",
                "I was just about to send the goons. Thanks for saving me the trouble.",
                "Wow, distinct lack of speed. Thanks for finally paying.",
                "It's been 84 years... but thanks."
            ];
            message = sarcasms[Math.floor(Math.random() * sarcasms.length)];
        } else {
            timeliness = 'ontime';
            message = "Received right on time. Thanks! 👍";
        }

        const remaining = Number(account.totalExposure) || 0;
        
        const imageFile = await generateReceiptCard(
            settings.userName,
            account.name,
            account.id,
            item.amount,
            settings.currency,
            timeliness,
            remaining,
            message
        );
        
        if (imageFile) {
            await navigator.share({
                title: 'Payment Receipt',
                files: [imageFile]
            });
        }
      } catch (e) {
          console.error("Receipt generation failed", e);
      } finally {
          setSharingId(null);
      }
  };

  const handleShareLoan = async (item: any) => {
    if (!navigator.share) {
        alert("Sharing not supported on this browser.");
        return;
    }
    setSharingId(item.id);

    try {
        const tx = item.rawTx;
        const imageFile = await generateLoanCard(
            settings.userName,
            account.name,
            account.id,
            tx.principalAmount,
            settings.currency,
            tx.startDate,
            tx.returnDate,
            tx.interestRate,
            tx.interestType,
            tx.interestFreeIfPaidByDueDate || false,
            tx.notes || ""
        );

        if (imageFile) {
            await navigator.share({
                title: 'Loan Agreement',
                files: [imageFile]
            });
        }
    } catch(e) {
        console.error("Loan card generation failed", e);
    } finally {
        setSharingId(null);
    }
  };

  const handleSetReminder = () => {
    if (!nextDueTx) return;
    const dateObj = new Date(nextDueTx.returnDate);
    const isoDate = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 8);
    const title = `Collect ${settings.currency}${Math.round(account.totalExposure)} from ${account.name}`;
    const details = `Ledger Reminder: Collection due for transaction. \nNotes: ${nextDueTx.notes}\n\nOpen Ledger: https://ledger69.vercel.app/`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${isoDate}/${isoDate}&ctz=Asia/Kolkata`;
    window.open(calendarUrl, '_blank');
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'PROFILE') {
        onDeleteProfile();
    } else if (deleteConfirm.type === 'TRANSACTION' && deleteConfirm.txId) {
        onDeleteTransaction(deleteConfirm.txId);
    } else if (deleteConfirm.type === 'REPAYMENT' && deleteConfirm.txId && deleteConfirm.repId) {
        onDeleteRepayment(deleteConfirm.txId, deleteConfirm.repId);
    }
    setDeleteConfirm(null);
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20"></div>

      <motion.div 
         className="flex-1 flex flex-col w-full max-w-4xl mx-auto relative h-full"
         variants={containerVariants}
         initial="hidden"
         animate="show"
      >
        
        {/* HEADER */}
        <motion.div variants={itemVariants}>
            <ProfileHeader 
            onBack={onBack}
            onDelete={() => setDeleteConfirm({ type: 'PROFILE' })}
            onShareSMS={() => handleShareMessage('sms')}
            onShareWA={() => handleShareMessage('whatsapp')}
            onGeneratePDF={() => generateStatementPDF(account.id, account.name, account.transactions, settings)}
            isSharing={isSharing}
            activeTheme={activeTheme}
            />
        </motion.div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-32 scrollbar-hide px-6">
          
          {/* STATS */}
          <motion.div variants={itemVariants}>
            <ProfileStats 
                account={account} 
                settings={settings} 
                activeTheme={activeTheme} 
                nextDueTx={nextDueTx} 
                onSetReminder={handleSetReminder}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4">
               <div className="h-px bg-slate-800 flex-1"></div>
               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">History</span>
               <div className="h-px bg-slate-800 flex-1"></div>
          </motion.div>

           {/* HISTORY LIST */}
           <motion.div variants={containerVariants} className="space-y-3">
               <AnimatePresence mode="popLayout">
               {historyItems.map((item) => {
                 const itemKey = `${item.id}-${item.repId || 'main'}`;
                 return (
                   <motion.div key={itemKey} variants={itemVariants}>
                       <HistoryItem 
                         item={item}
                         isActive={activeItemKey === itemKey}
                         onToggle={() => setActiveItemKey(activeItemKey === itemKey ? null : itemKey)}
                         settings={settings}
                         sharingId={sharingId}
                         onShareReceipt={handleShareReceipt}
                         onShareLoan={handleShareLoan}
                         onUpdateDueDate={onUpdateDueDate}
                         onEditRepayment={onEditRepayment}
                         onDelete={(type, id, repId) => setDeleteConfirm({ type, txId: id, repId })}
                       />
                   </motion.div>
                 );
               })}
               </AnimatePresence>
           </motion.div>
           
           {historyItems.length === 0 && (
              <motion.div variants={itemVariants} className="text-center py-12 text-slate-600 text-sm font-mono opacity-50">
                 NO RECORDS FOUND
              </motion.div>
           )}
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8 grid grid-cols-2 gap-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-30 backdrop-blur-[2px]">
           <motion.button 
             variants={itemVariants}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={onGive}
             className="bg-rose-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2 hover:bg-rose-500"
           >
             <ArrowUpRight className="w-5 h-5" /> Give Money
           </motion.button>
           <motion.button 
             variants={itemVariants}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => onReceive(null)}
             disabled={account.totalExposure <= 0}
             className={`p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${account.totalExposure <= 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500'}`}
           >
             <ArrowDownLeft className="w-5 h-5" /> Got Money
           </motion.button>
        </div>
      </motion.div>

      {/* DELETE CONFIRMATION OVERLAY */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm glass p-6 rounded-[2rem] border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 mb-2">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Delete?</h3>
                        <p className="text-slate-400 text-sm mt-2">
                            {deleteConfirm.type === 'PROFILE' 
                                ? "This will delete this profile and all payment history forever." 
                                : "This will remove this payment record from the list."
                            }
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full pt-4">
                        <button 
                            onClick={() => setDeleteConfirm(null)}
                            className="p-4 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmDelete}
                            className="p-4 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/20 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProfileView;
