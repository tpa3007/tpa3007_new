"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, Wallet, User } from "lucide-react";
import { translations } from "@/lib/translations";

export function SettingsView({ lang }: { lang: string }) {
  const t = translations[lang].settings;
  return (
    <div className="max-w-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-zinc-50">
          <CardTitle className="text-sm uppercase font-black flex items-center gap-2">
            <User size={16} /> {t.profile}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase">{t.brandName}</label>
            <Input className="rounded-none border-black focus-visible:ring-0" defaultValue="THYSS_BRAND_01" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-zinc-50">
          <CardTitle className="text-sm uppercase font-black flex items-center gap-2">
            <Key size={16} /> {t.api}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase">{t.apiKey}</label>
            <div className="flex gap-2">
              <Input className="rounded-none border-black font-mono text-xs" readOnly value="pk_live_thyss_8273...92" />
              <Button variant="outline" className="rounded-none border-black font-bold uppercase text-[10px]">Copy</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}