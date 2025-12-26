"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Check, Zap, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';

export default function PaymentWidget({ amount, currency = "USDT", apiKey, theme = 'dark' }: any) {
  const [status, setStatus] = useState('idle');
  const [address, setAddress] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isCopied, setIsCopied] = useState(false);

  // Стили на основе твоих макетов [cite: 7-14]
  const colors = theme === 'light' ? {
    bg: "bg-white border-zinc-200 text-zinc-900",
    header: "bg-zinc-50 border-zinc-100",
    btn: "bg-black text-white hover:bg-zinc-800",
    input: "bg-zinc-50 border-zinc-200"
  } : {
    bg: "bg-zinc-950 border-zinc-800 text-zinc-100",
    header: "bg-transparent border-zinc-900",
    btn: "bg-white text-black hover:bg-zinc-100",
    input: "bg-zinc-900 border-zinc-800"
  };

  const initPayment = async () => {
    setStatus('initializing');
    try {
      // Реальный вызов твоего API [cite: 20-21]
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ amount, currency })
      });
      const data = await res.json();
      if (data.success) {
        setAddress(data.address);
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data.address}`);
        setStatus('payment');
      }
    } catch (e) { setStatus('error'); }
  };

  if (status === 'idle') return (
    <button onClick={initPayment} className={`w-full h-14 rounded-xl border flex items-center justify-between px-5 font-mono shadow-lg transition-transform active:scale-95 ${colors.bg}`}>
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
        <div className="text-left"><p className="text-[9px] font-black uppercase opacity-40">Pay with Crypto</p><p className="font-bold">{amount} {currency}</p></div>
      </div>
      <Zap size={14} className="opacity-40" />
    </button>
  );

  return (
    <div className={`w-full border rounded-2xl overflow-hidden font-mono shadow-2xl animate-in zoom-in-95 duration-300 ${colors.bg}`}>
      <div className={`p-5 flex justify-between items-start border-b ${colors.header}`}>
        <div><p className="text-[9px] font-black uppercase opacity-40">Waiting for payment</p><h3 className="text-sm font-bold">TON Network</h3></div>
        <div className="text-right">
          <p className="font-bold text-lg leading-none">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</p>
          <p className="text-[9px] font-black uppercase opacity-40">Expires in</p>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center">
        {status === 'initializing' ? (
          <div className="h-48 flex flex-col items-center justify-center gap-4">
             <Loader2 className="animate-spin opacity-20" size={32} />
             <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Generating Address...</p>
          </div>
        ) : (
          <>
            <div className="relative p-2 border-2 border-black rounded-xl mb-8 bg-white group">
              <div className="scan-laser animate-scan"></div> {/* Твоя анимация [cite: 33-38] */}
              <img src={qrCode} className="w-40 h-40 mix-blend-multiply" alt="QR" />
            </div>
            
            <div className="w-full mb-6">
               <p className="text-[9px] font-black uppercase opacity-40 mb-2">Wallet Address</p>
               <button onClick={() => {navigator.clipboard.writeText(address); setIsCopied(true); setTimeout(()=>setIsCopied(false), 2000)}}
                 className={`w-full p-4 rounded-xl border text-[10px] font-bold truncate flex justify-between items-center ${colors.input}`}>
                 {address} {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
               </button>
            </div>

            <a href={`ton://transfer/${address}`} className={`w-full py-4 rounded-xl text-center font-black uppercase text-xs tracking-widest mb-4 shadow-xl ${colors.btn}`}>
              Open Wallet
            </a>
          </>
        )}
      </div>
      
      <div className={`py-3 border-t text-center ${colors.header}`}>
         <p className="text-[8px] font-black opacity-30 tracking-[0.3em]">POWERED BY THYSS</p>
      </div>
    </div>
  );
}