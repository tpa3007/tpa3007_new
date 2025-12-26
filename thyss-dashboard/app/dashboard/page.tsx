"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, Bell, Download, Wallet, Zap, 
  CreditCard, ArrowUpRight, Package, Activity, Key, Copy, Eye, EyeOff, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from 'sonner';

// --- ДАННЫЕ ПЕРЕВОДОВ [cite: 104-121] ---
const translations: any = {
  EN: {
    dashboard: { title: "Overview", totalRevenue: "Total Revenue", totalOrders: "Total Orders", cryptoBalance: "Crypto Balance", withdraw: "Withdraw", recentSales: "Recent Sales" },
    RU: {
      dashboard: { title: "Обзор", totalRevenue: "Общий доход", totalOrders: "Всего заказов", cryptoBalance: "Крипто-баланс", withdraw: "Вывести", recentSales: "Последние продажи" },
      transactions: { title: "Транзакции", id: "ID", status: "Статус", amount: "Сумма", paid: "Оплачено", pending: "В ожидании" },
      customers: { title: "Клиенты", customer: "Клиент", badges: "Метки", totalSpent: "Потрачено" },
      settings: { title: "Настройки", profile: "Профиль", api: "API и Интеграция", apiKey: "API Ключ" }
    }
  }
};

export default function MegaDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('EN');
  const [brand, setBrand] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. РЕАЛЬНАЯ ЛОГИКА: Загрузка данных из Supabase
  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      setLoading(true);
      
      // Получаем данные бренда
      const { data: brandData } = await supabase.from('brands').select('*').single();
      setBrand(brandData);

      // Получаем транзакции 
      const { data: txData } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      setTransactions(txData || []);
      
      setLoading(false);
    }
    fetchData();
  }, [isAuthenticated]);

  // --- ЭКРАН ВХОДА [cite: 152-163] ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-mono">
        <Card className="w-full max-w-[380px] border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="text-center border-b-2 border-black">
            <Zap size={32} className="mx-auto mb-2 fill-black" />
            <CardTitle className="text-2xl font-black uppercase italic italic">THYSS_CORE</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Button className="w-full h-14 bg-black text-white rounded-none font-black uppercase tracking-widest" 
                    onClick={() => setIsAuthenticated(true)}>
              Login with Telegram
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const t = translations[lang];

  return (
    <div className="flex min-h-screen bg-[#F3F3F3] font-mono">
      <Toaster position="bottom-right" richColors />
      
      {/* SIDEBAR [cite: 164-177] */}
      <aside className="w-64 border-r-2 border-black bg-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b-2 border-black font-black text-2xl italic tracking-tighter">THYSS</div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'transactions', label: 'Transactions', icon: ArrowUpRight },
            { id: 'customers', label: 'Intelligence', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-2 transition-all font-bold uppercase text-[10px] tracking-widest ${
                activeTab === item.id ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-transparent hover:border-black"
              }`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t-2 border-black">
          <Button variant="ghost" className="w-full justify-start gap-2 font-bold uppercase text-[10px]" onClick={() => setIsAuthenticated(false)}>
            <LogOut size={16} /> Disconnect
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 min-h-screen">
        <header className="h-16 border-b-2 border-black bg-white px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 font-black uppercase text-[10px] italic tracking-widest">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Status: Online / {activeTab}
          </div>
          <Button variant="outline" className="border-2 border-black rounded-none text-[10px] font-black" onClick={() => setLang(lang === 'EN' ? 'RU' : 'EN')}>
            {lang}
          </Button>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto w-full">
          {/* VIEW: DASHBOARD [cite: 227-260] */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title={t.dashboard.totalRevenue} value="$45,231" icon={<span className="font-bold">$</span>} />
                <StatCard title={t.dashboard.totalOrders} value="+2,350" icon={<Package size={16} />} />
                <StatCard title="Sales Today" value="+122" icon={<CreditCard size={16} />} />
                <StatCard title="Active Now" value="573" icon={<Activity size={16} />} />
              </div>
              <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-4 border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader><CardTitle className="uppercase font-black text-sm tracking-widest">Revenue Flow</CardTitle></CardHeader>
                  <CardContent><div className="h-[200px] flex items-end gap-1 px-2">
                    {[40, 70, 45, 90, 65, 80, 50, 30, 95].map((h, i) => <div key={i} className="flex-1 bg-black" style={{ height: `${h}%` }} />)}
                  </div></CardContent>
                </Card>
                <Card className="col-span-3 bg-black text-white rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                  <CardHeader><CardTitle className="text-white uppercase font-black text-sm italic">{t.dashboard.cryptoBalance}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-6">1,240.50 <span className="text-lg text-zinc-500">TON</span></div>
                    <Button variant="secondary" className="w-full rounded-none font-black uppercase text-xs">{t.dashboard.withdraw}</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* VIEW: TRANSACTIONS [cite: 261-278] */}
          {activeTab === 'transactions' && (
            <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-zinc-50 border-b-2 border-black">
                  <TableRow>
                    <TableHead className="font-black text-black uppercase text-[10px]">ID</TableHead>
                    <TableHead className="font-black text-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="font-black text-black uppercase text-[10px] text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10 uppercase text-[10px] font-bold text-zinc-400 italic">No data synced from Supabase</TableCell></TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-b border-zinc-100">
                        <TableCell className="font-mono font-bold text-xs">{tx.id.slice(0, 8)}</TableCell>
                        <TableCell><Badge className={`rounded-none border-black font-black text-[9px] uppercase ${tx.status === 'paid' ? 'bg-green-400' : 'bg-yellow-300'}`}>{tx.status}</Badge></TableCell>
                        <TableCell className="text-right font-black text-xs">{tx.amount} {tx.currency}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* VIEW: INTELLIGENCE [cite: 279-292] */}
          {activeTab === 'customers' && (
            <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-zinc-50 border-b-2 border-black">
                  <TableRow>
                    <TableHead className="font-black text-black uppercase text-[10px]">Wallet</TableHead>
                    <TableHead className="font-black text-black uppercase text-[10px] text-center">Badges</TableHead>
                    <TableHead className="font-black text-black uppercase text-[10px] text-right">Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "0x71C...9A2", spent: 55000, balance: 100000, years: 2 },
                    { name: "studio_yeezy", spent: 250000, balance: 5000000, years: 4 }
                  ].map((c, i) => (
                    <TableRow key={i} className="border-b border-zinc-100">
                      <TableCell className="font-bold text-xs">{c.name}</TableCell>
                      <TableCell className="text-center text-lg">
                        {c.balance > 50000 && <span title="Whale">🐳</span>}
                        {c.spent > 10000 && <span title="Power User">🚀</span>}
                        {c.years >= 3 && <span title="OG">🛡️</span>}
                      </TableCell>
                      <TableCell className="text-right font-black text-xs">${c.spent.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* VIEW: SETTINGS [cite: 188-226] */}
          {activeTab === 'settings' && brand && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-bottom-4">
              <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 border-black bg-zinc-50">
                  <CardTitle className="text-sm font-black uppercase italic">API_INTEGRATION</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Public API Key</label>
                    <div className="flex gap-2">
                      <Input className="rounded-none border-black font-mono text-xs" readOnly value={brand.api_key} />
                      <Button variant="outline" className="rounded-none border-black font-black uppercase text-[10px]" onClick={() => {
                        navigator.clipboard.writeText(brand.api_key);
                        toast.success("Copied to clipboard");
                      }}>Copy</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{title}</CardTitle>
        <div className="h-8 w-8 bg-zinc-100 border border-black flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
      </CardContent>
    </Card>
  );
}