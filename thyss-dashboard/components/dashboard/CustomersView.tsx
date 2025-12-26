"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, ExternalLink } from "lucide-react";
import { translations } from "@/lib/translations";

export function CustomersView({ lang }: { lang: string }) {
  const t = translations[lang].customers;

  // Данные из твоего макета [cite: 280]
  const customers = [
    { name: "0x71C...9A2", email: "Whale Wallet", purchases: 12, totalSpent: 55000, registeredYears: 2, balance: 100000 },
    { name: "alex_wang", email: "alex@wang.com", purchases: 64, totalSpent: 4200, registeredYears: 1, balance: 500 },
    { name: "satoshi_fan", email: "anon@mail.com", purchases: 5, totalSpent: 120, registeredYears: 6, balance: 50 },
    { name: "studio_yeezy", email: "ye@yeezy.com", purchases: 150, totalSpent: 250000, registeredYears: 4, balance: 5000000 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER С ПОИСКОМ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">{t.title}</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase">{t.desc}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center border-2 border-black bg-white px-2">
            <Search size={14} className="text-zinc-400 mr-2" />
            <input type="text" placeholder="WALLET_ID..." className="outline-none text-[10px] font-bold uppercase py-2 w-32 md:w-48" />
          </div>
          <button className="bg-black text-white px-4 py-2 text-[10px] font-bold uppercase hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
             {t.add}
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА КЛИЕНТОВ */}
      <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow className="border-b-2 border-black">
              <TableHead className="font-black text-black uppercase text-[10px] py-4">{t.customer}</TableHead>
              <TableHead className="font-black text-black uppercase text-[10px] text-center">Badges</TableHead>
              <TableHead className="font-black text-black uppercase text-[10px] text-right">{t.totalOrders}</TableHead>
              <TableHead className="font-black text-black uppercase text-[10px] text-right">{t.totalSpent}</TableHead>
              <TableHead className="font-black text-black uppercase text-[10px] text-right">{t.walletAge}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c, i) => (
              <TableRow key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                      {c.name} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium lowercase">{c.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    {/* Логика меток [cite: 288-289] */}
                    {c.balance > 50000 && (
                      <span className="text-lg cursor-help transition-transform hover:scale-125" title="Whale (Balance > 50k USDT)">🐳</span>
                    )}
                    {c.purchases > 50 && (
                      <span className="text-lg cursor-help transition-transform hover:scale-125" title="Power User (> 50 purchases)">🚀</span>
                    )}
                    {c.registeredYears >= 5 && (
                      <span className="text-lg cursor-help transition-transform hover:scale-125" title="OG (Wallet > 5 years)">🛡️</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-xs">{c.purchases}</TableCell>
                <TableCell className="text-right font-black text-xs">
                  ${c.totalSpent.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">
                    {c.registeredYears > 0 ? `${c.registeredYears} years` : "< 1 year"} [cite: 290-291]
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {/* ИНФОРМАЦИОННАЯ ПАНЕЛЬ */}
      <div className="p-4 bg-zinc-100 border-2 border-black flex items-center gap-3">
         <Users size={20} className="text-zinc-400" />
         <p className="text-[9px] font-bold uppercase text-zinc-500 leading-tight">
           Аналитика кошельков обновляется в реальном времени через TON API. <br />
           Метки помогают сегментировать аудиторию для лояльности.
         </p>
      </div>
    </div>
  );
}