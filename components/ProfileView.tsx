
import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, FileText, ArrowUpRight, ArrowDownLeft, Calendar, Shield, Bell, BellRing, MessageCircle, Trash2, AlertTriangle, Edit } from 'lucide-react';
import { Transaction, AppSettings } from '../types';
import { generateStatementPDF } from '../utils/pdfGenerator';
import TrustScoreBadge from './TrustScoreBadge';

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
  onGive: () => void; // "You Gave" (New Loan)
  onReceive: (txId: string) => void; // "You Got" (Repayment)
  onDeleteTransaction: (txId: string) => void;
  onDeleteRepayment: (txId: string, repId: string) => void;
  onDeleteProfile: () => void;
  onUpdateDueDate: (txId: string) => void;
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
  onUpdateDueDate
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'PROFILE' | 'TRANSACTION' | 'REPAYMENT';
    txId?: string;
    repId?: string;
  } | null>(null);

  // State to track which transaction card is expanded to show actions
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);

  // 1. Flatten History: Combine Loans (Starts) and Repayments into one timeline
  const historyItems = account.transactions.flatMap(tx => {
    const items = [];
    
    // The Loan Event
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

    // The Repayment Events
    tx.repayments.forEach(rep => {
      items.push({
        id: tx.id, // Parent Transaction ID needed for reference
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
  }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first

  // 2. Find Next Collection Date (Earliest return date of incomplete loans)
  const activeLoans = account.transactions.filter(t => !t.isCompleted);
  const nextDueTx = activeLoans.length > 0 
    ? activeLoans.sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime())[0]
    : null;

  const handleShareMessage = async (platform: 'sms' | 'whatsapp') => {
    const phoneNumber = account.transactions.find(t => t.friendPhone)?.friendPhone;
    const amountStr = `${settings.currency}${Math.round(account.totalExposure)}`;
    
    let message = `Hi ${account.name}, please pay your due of ${amountStr}.`;

    if (nextDueTx) {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const due = new Date(nextDueTx.returnDate);
        due.setHours(0,0,0,0);
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dateStr = new Date(nextDueTx.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        if (diffDays < 0) {
            const overdueDays = Math.abs(diffDays);
            message = `URGENT: Hi ${account.name}, your payment is overdue by ${overdueDays} days! Please clear your outstanding balance of ${amountStr} immediately. It was due on ${dateStr}.`;
        } else if (diffDays === 0) {
            message = `Hi ${account.name}, friendly reminder that your payment of ${amountStr} is due TODAY (${dateStr}). Please clear it.`;
        } else {
            message = `Hi ${account.name}, just a friendly reminder. You have ${diffDays} days left to pay your balance of ${amountStr}. Due Date: ${dateStr}.`;
        }
    }

    // Try Web Share API (Text Only)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Reminder - ${account.name}`,
          text: message
        });
        return;
      } catch (error) {
        console.log("Share failed or cancelled, falling back to link", error);
      }
    }

    // Fallback: Default Link Behavior
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

  const handleSetReminder = () => {
    if (!nextDueTx) return;

    // Create Google Calendar Link
    const dateObj = new Date(nextDueTx.returnDate);
    // Format YYYYMMDD
    const isoDate = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 8);
    
    const title = `Collect ${settings.currency}${Math.round(account.totalExposure)} from ${account.name}`;
    const details = `Ledger Reminder: Collection due for transaction. \nNotes: ${nextDueTx.notes}\n\nOpen Ledger: https://ledger69.vercel.app/`;
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${isoDate}/${isoDate}&ctz=Asia/Kolkata`;
    
    window.open(calendarUrl, '_blank');
  };

  const handleMainReceive = () => {
    const activeTx = account.transactions.find(t => !t.isCompleted);
    if (activeTx) {
      onReceive(activeTx.id);
    } else {
      if (account.transactions.length > 0) {
        onReceive(account.transactions[0].id);
      }
    }
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

  // Determine date display color
  const getDueDateColor = () => {
    if (!nextDueTx) return 'text-slate-500';
    const today = new Date();
    const due = new Date(nextDueTx.returnDate);
    if (today > due) return 'text-rose-400 animate-pulse'; // Overdue
    const diffTime = Math.abs(due.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'text-amber-400'; // Close
    return 'text-blue-400';
  };

  const getAvatarClasses = (score: number) => {
    if (score >= 75) return 'bg-emerald-500 shadow-emerald-500/20';
    if (score >= 50) return 'bg-amber-500 shadow-amber-500/20';
    return 'bg-rose-500 shadow-rose-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-right-8 duration-300">
      
      {/* Background Texture for Detail View */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20"></div>

      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto relative h-full">
        
        {/* Header - Sticky with Blur */}
        <div className="flex items-start justify-between px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 shrink-0 z-20">
          <button onClick={onBack} className="p-2 -ml-2 mt-1 hover:bg-white/10 rounded-full transition-colors active:scale-90">
            <ArrowLeft className="w-6 h-6 text-slate-300" />
          </button>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setDeleteConfirm({ type: 'PROFILE' })}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform mr-2"
            >
               <div className="p-3 bg-slate-800 text-rose-500 rounded-xl group-hover:bg-rose-950/30 transition-colors shadow-lg border border-slate-700/50 group-hover:border-rose-500/50">
                  <Trash2 className="w-5 h-5" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-400 transition-colors">Delete</span>
            </button>

            <button onClick={() => handleShareMessage('sms')} className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform">
               <div className="p-3 bg-slate-800 text-blue-400 rounded-xl group-hover:bg-slate-700 transition-colors shadow-lg border border-slate-700/50">
                  <MessageSquare className="w-5 h-5" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">SMS</span>
            </button>

            <button onClick={() => handleShareMessage('whatsapp')} className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform">
               <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl group-hover:bg-slate-700 transition-colors shadow-lg border border-slate-700/50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">WhatsApp</span>
            </button>

            <button 
              onClick={() => generateStatementPDF(account.id, account.name, account.transactions, settings)}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
               <div className="p-3 bg-slate-800 text-slate-300 rounded-xl group-hover:bg-slate-700 transition-colors shadow-lg border border-slate-700/50">
                  <FileText className="w-5 h-5" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Report</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-32 scrollbar-hide px-6">
          
          {/* Identity & Balance Card */}
          <div className="text-center space-y-2 mb-8 shrink-0">
             <div className={`w-20 h-20 mx-auto rounded-full ${getAvatarClasses(account.trustScore)} flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl`}>
                {account.name.charAt(0).toUpperCase()}
             </div>
             
             <div className="space-y-0.5">
                <h2 className="text-2xl font-bold text-white tracking-tight">{account.name}</h2>
                <div className="text-[10px] text-slate-500 font-mono font-bold bg-slate-900/50 px-2 py-1 rounded inline-block border border-slate-800">
                    ID: {account.id}
                </div>
             </div>
             
             <div className="flex justify-center mt-2">
                <TrustScoreBadge 
                    score={account.trustScore}
                    friendName={account.name}
                    profileId={account.id}
                    allTransactions={account.transactions}
                    currency={settings.currency}
                />
             </div>
             
             <div className="mt-6 flex flex-col items-center gap-3">
                 <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 inline-block min-w-[200px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">To Collect</p>
                    <p className={`text-3xl font-mono font-black ${account.totalExposure > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                       {settings.currency}{Math.round(account.totalExposure).toLocaleString('en-IN')}
                    </p>
                 </div>

                 {/* Collection Date Indicator (Reverted to read-only reminder) */}
                 {nextDueTx && (
                   <button 
                     onClick={handleSetReminder}
                     className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all group"
                   >
                     <div className="text-right">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Next Collection</p>
                       <p className={`text-xs font-bold font-mono ${getDueDateColor()}`}>
                         {new Date(nextDueTx.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </p>
                     </div>
                     <div className="w-px h-6 bg-slate-700"></div>
                     <div className={`p-1.5 rounded-full bg-slate-900 ${activeTheme.text} group-hover:scale-110 transition-transform`}>
                        <BellRing className="w-4 h-4" />
                     </div>
                   </button>
                 )}
             </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
               <div className="h-px bg-slate-800 flex-1"></div>
               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">History</span>
               <div className="h-px bg-slate-800 flex-1"></div>
          </div>

           {historyItems.map((item, idx) => {
             const itemKey = `${item.id}-${item.repId || 'main'}`;
             const isActive = activeItemKey === itemKey;

             return (
              <div 
                key={itemKey}
                onClick={() => setActiveItemKey(isActive ? null : itemKey)}
                className={`glass p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer group active:scale-[0.98] ${isActive ? 'border-white/10 bg-slate-900/60' : 'border-transparent hover:border-white/5'}`}
              >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${item.type === 'LOAN' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {item.type === 'LOAN' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">
                          {item.type === 'LOAN' ? 'You gave' : 'You got'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          {item.type === 'LOAN' && item.rawTx.hasTime && (
                            <span className="text-slate-400 ml-1">
                                {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          )}
                          {item.type === 'LOAN' && item.rawTx.isCompleted && (
                            <span className="bg-slate-800 px-1 rounded text-slate-400">SETTLED</span>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                      <div className="text-right mr-3">
                        <div className={`font-mono font-bold text-lg ${item.type === 'LOAN' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {settings.currency}{item.amount.toLocaleString('en-IN')}
                        </div>
                        {item.type === 'LOAN' && (
                          <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5 truncate max-w-[100px]">
                            {item.note}
                          </div>
                        )}
                      </div>
                      
                      {/* ACTION BUTTONS WITH ANIMATION */}
                      <div className={`flex items-center gap-2 transition-all duration-300 ease-out overflow-hidden ${isActive ? 'max-w-[120px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 translate-x-8'}`}>
                          {/* EDIT DATE BUTTON - Only for Loans */}
                          {item.type === 'LOAN' && (
                              <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateDueDate(item.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                  title="Edit Due Date"
                              >
                                  <Edit className="w-4 h-4" />
                              </button>
                          )}

                          {/* DELETE BUTTON */}
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.type === 'LOAN') {
                                      setDeleteConfirm({ type: 'TRANSACTION', txId: item.id });
                                  } else {
                                      setDeleteConfirm({ type: 'REPAYMENT', txId: item.id, repId: item.repId! });
                                  }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              </div>
             );
           })}
           
           {historyItems.length === 0 && (
              <div className="text-center py-12 text-slate-600 text-sm font-mono opacity-50">
                 NO RECORDS FOUND
              </div>
           )}
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8 grid grid-cols-2 gap-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-30 backdrop-blur-[2px]">
           <button 
             onClick={onGive}
             className="bg-rose-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-rose-500"
           >
             <ArrowUpRight className="w-5 h-5" /> Give Money
           </button>
           <button 
             onClick={handleMainReceive}
             disabled={account.totalExposure <= 0}
             className={`p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${account.totalExposure <= 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500 active:scale-[0.98]'}`}
           >
             <ArrowDownLeft className="w-5 h-5" /> Got Money
           </button>
        </div>
      </div>

      {/* Confirmation Modal */}
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
