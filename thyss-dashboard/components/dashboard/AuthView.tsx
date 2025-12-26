"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function AuthView({ onLoginSuccess }: { onLoginSuccess: (brand: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleTelegramAuth = async () => {
    setLoading(true);
    // Имитация данных от Telegram (позже заменим на реальный Widget)
    const mockUser = { id: "777", first_name: "Demo Merchant" };

    try {
      const { data: brand, error } = await supabase
        .from('brands')
        .select('*')
        .eq('tg_id', mockUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Регистрация нового бренда
        const { data: newBrand, error: createError } = await supabase
          .from('brands')
          .insert({
            name: `${mockUser.first_name}'s Brand`,
            tg_id: mockUser.id,
            api_key: `thyss_${Math.random().toString(36).substring(2, 11)}`,
            merchant_wallet: '', // Заполнится позже
            status: 'active'
          })
          .select().single();

        if (createError) throw createError;
        toast.success("Account created via Telegram");
        onLoginSuccess(newBrand);
      } else {
        toast.success("Welcome back!");
        onLoginSuccess(brand);
      }
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] p-4 font-mono">
      <Card className="w-full max-w-[400px] border-2 border-black rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="text-center border-b-2 border-black pb-8">
          <div className="flex justify-center mb-4">
             <div className="bg-black text-white p-3">
                <Zap size={32} fill="currentColor" />
             </div>
          </div>
          <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">THYSS_CORE</CardTitle>
          <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-zinc-500">Merchant Access Terminal</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8">
          <Button 
            onClick={handleTelegramAuth}
            disabled={loading}
            className="w-full h-16 bg-black text-white rounded-none hover:bg-zinc-800 uppercase font-black text-sm tracking-widest border-2 border-black transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2" size={18} />}
            Login with Telegram
          </Button>
          <p className="text-center text-[9px] text-zinc-400 uppercase mt-4 font-bold">
            No password required. Secure TON-native auth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}