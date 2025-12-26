"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CreditCard, Activity, User, Key, Wallet, Search, ExternalLink } from "lucide-react";
import { translations } from "@/lib/translations";

// --- OVERVIEW VIEW --- [cite: 227-260]
export function DashboardView({ lang }: { lang: string }) {
  const t = translations[lang].dashboard;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t.totalRevenue} value="$45,231.89" sub={`+20.1% ${t.fromLastMonth}`} icon={<span className="font-bold">$</span>} />
        <StatCard title={t.totalOrders} value="+2,350" sub={`+180.1% ${t.fromLastMonth}`} icon={<Package className="h-4 w-4" />} />
        <StatCard title={t.salesToday} value="+122" sub="+19% from yesterday" icon={<CreditCard className="h-4 w-4" />} />
        <StatCard title={t.activeNow} value="+573" sub={t.sinceLastHour} icon={<Activity className="h-4 w-4" />} />
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
          <CardContent><div className="h-[250px] flex items-end gap-2 px-2 pb-2">
            {[40, 70, 45, 90, 65, 80, 50, 85, 40, 60, 75, 95].map((h, i) => <div key={i} className="flex-1 bg-black" style={{ height: `${h}%` }} />)}
          </div></CardContent>
        </Card>
        <Card className="col-span-3 bg-black text-white rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader>
            <CardTitle className="text-white">{t.cryptoBalance}</CardTitle>
            <CardDescription className="text-zinc-500 font-mono">UQD7...8XJ92</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-8">1,240.50 <span className="text-lg text-zinc-500">TON</span></div>
            <div className="flex gap-3">
              <Button variant="secondary" className="w-full rounded-none font-black uppercase text-xs">{t.withdraw}</Button>
              <Button variant="outline" className="w-full rounded-none bg-transparent text-white border-zinc-700 uppercase text-xs hover:bg-zinc-900">{t.addFunds}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- TRANSACTIONS VIEW --- [cite: 261-278]
export function TransactionsView({ lang }: { lang: string }) {
  const t = translations[lang].transactions;
  const data = [
    { id: "TX-9981", status: t.paid, amount: "250.00 USDT", date: "24.05.2024" },
    { id: "TX-9982", status: t.pending, amount: "120.00 TON", date: "23.05.2024" },
    { id: "TX-9983", status: t.failed, amount: "15.00 USDT", date: "22.05.2024" }
  ];
  return (
    <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-50 border-b-2 border-black">
          <TableRow>
            <TableHead className="font-black text-black uppercase text-[10px]">{t.id}</TableHead>
            <TableHead className="font-black text-black uppercase text-[10px]">{t.status}</TableHead>
            <TableHead className="font-black text-black uppercase text-[10px] text-right">{t.amount}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tx) => (
            <TableRow key={tx.id} className="border-b border-zinc-100">
              <TableCell className="font-mono font-bold text-xs">{tx.id}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-none border-black font-black text-[9px] uppercase ${tx.status === t.paid ? 'bg-green-400' : tx.status === t.pending ? 'bg-yellow-300' : 'bg-red-400'}`}>
                  {tx.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-black text-xs">{tx.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// --- CUSTOMERS VIEW --- [cite: 279-292]
export function CustomersView({ lang }: { lang: string }) {
  const t = translations[lang].customers;
  const customers = [
    { name: "0x71C...9A2", email: "Whale Wallet", purchases: 12, spent: 55000, age: 2, bal: 100000 },
    { name: "studio_yeezy", email: "ye@yeezy.com", purchases: 150, spent: 250000, age: 4, bal: 5000000 }
  ];
  return (
    <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-50 border-b-2 border-black">
          <TableRow>
            <TableHead className="font-black text-black uppercase text-[10px]">{t.customer}</TableHead>
            <TableHead className="font-black text-black uppercase text-[10px] text-center">Badges</TableHead>
            <TableHead className="font-black text-black uppercase text-[10px] text-right">{t.totalSpent}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c, i) => (
            <TableRow key={i} className="border-b border-zinc-100">
              <TableCell>
                <div className="flex flex-col"><span className="font-bold text-xs">{c.name}</span><span className="text-[10px] text-zinc-500 lowercase">{c.email}</span></div>
              </TableCell>
              <TableCell className="text-center">
                 <div className="flex justify-center gap-1">
                    {c.bal > 50000 && <span title="Whale">🐳</span>}
                    {c.purchases > 50 && <span title="Power User">🚀</span>}
                    {c.age >= 3 && <span title="OG">🛡️</span>}
                 </div>
              </TableCell>
              <TableCell className="text-right font-black text-xs">${c.spent.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// --- SETTINGS VIEW --- [cite: 188-226]
export function SettingsView({ lang }: { lang: string }) {
  const t = translations[lang].settings;
  return (
    <div className="max-w-2xl space-y-6">
      <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-zinc-50"><CardTitle className="text-sm font-black uppercase">{t.api}</CardTitle></CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase">{t.apiKey}</label>
            <div className="flex gap-2">
              <Input className="rounded-none border-black font-mono text-xs" readOnly value="pk_live_thyss_8273...92" />
              <Button variant="outline" className="rounded-none border-black uppercase text-[10px] font-bold">Copy</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
  return (
    <Card className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</CardTitle>
        <div className="h-8 w-8 bg-zinc-100 flex items-center justify-center border border-black">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
        <p className="text-[9px] uppercase font-bold text-zinc-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}