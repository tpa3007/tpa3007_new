"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Activity, CreditCard, Package } from "lucide-react";
import { translations } from "@/lib/translations";

export function OverviewView({ lang }: { lang: string }) {
  const t = translations[lang].dashboard;
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t.totalRevenue} value="$45,231.89" sub={`+20.1% ${t.fromLastMonth}`} icon={<span className="font-bold">$</span>} />
        <StatCard title={t.totalOrders} value="+2,350" sub={`+180.1% ${t.fromLastMonth}`} icon={<Package className="h-4 w-4" />} />
        <StatCard title={t.salesToday} value="+122" sub="+19% from yesterday" icon={<CreditCard className="h-4 w-4" />} />
        <StatCard title={t.activeNow} value="+573" sub={t.sinceLastHour} icon={<Activity className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
          <CardContent><div className="h-[200px] flex items-end gap-2 px-2">
            {[40, 70, 45, 90, 65, 80].map((h, i) => <div key={i} className="flex-1 bg-black" style={{ height: `${h}%` }} />)}
          </div></CardContent>
        </Card>

        <Card className="col-span-3 bg-black text-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader>
            <CardTitle className="text-white">{t.cryptoBalance}</CardTitle>
            <CardDescription className="text-zinc-500">UQD7...8XJ92</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6">1,240.50 <span className="text-lg text-zinc-500">TON</span></div>
            <div className="flex gap-2">
              <Button variant="secondary" className="w-full rounded-none font-bold uppercase text-xs">{t.withdraw}</Button>
              <Button variant="outline" className="w-full rounded-none bg-transparent text-white border-zinc-700 uppercase text-xs">{t.addFunds}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
  return (
    <Card className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-bold uppercase tracking-tighter">{title}</CardTitle>
        <div className="h-8 w-8 bg-zinc-100 flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
        <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}