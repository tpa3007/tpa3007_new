"use client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { translations } from "@/lib/translations";

export function TransactionsView({ lang }: { lang: string }) {
  const t = translations[lang].transactions;
  const data = [
    { id: "TX-9981", status: t.paid, amount: "250.00 USDT", date: "24.05.2024" },
    { id: "TX-9982", status: t.pending, amount: "120.00 TON", date: "23.05.2024" }
  ];

  return (
    <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
      <Table>
        <TableHeader className="bg-zinc-50">
          <TableRow className="border-b-2 border-black">
            <TableHead className="font-bold text-black uppercase text-[10px]">{t.id}</TableHead>
            <TableHead className="font-bold text-black uppercase text-[10px]">{t.status}</TableHead>
            <TableHead className="font-bold text-black uppercase text-[10px] text-right">{t.amount}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tx) => (
            <TableRow key={tx.id} className="border-b border-zinc-100">
              <TableCell className="font-mono font-bold text-xs">{tx.id}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-none border-black font-black text-[9px] uppercase ${tx.status === t.paid ? 'bg-green-400' : 'bg-yellow-300'}`}>
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