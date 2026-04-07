"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import useSWR from "swr";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProviderEarningsPage() {
  const { connected, publicKey } = useWallet();

  const { data } = useSWR(
    connected && publicKey
      ? `/api/provider/earnings?wallet=${publicKey.toBase58()}`
      : null,
    fetcher
  );

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Earnings</h1>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to view earnings
            </p>
            <WalletMultiButton />
          </Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalEarnings: 0,
    pendingPayout: 0,
    thisMonth: 0,
    lastMonth: 0,
  };

  const recentEarnings = data?.recentEarnings || [];

  const STAT_CARDS = [
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      subtitle: "USDC all time",
      icon: DollarSign,
      bgColor: "bg-emerald-50",
      accentColor: "text-emerald-600",
    },
    {
      title: "Pending Payout",
      value: `$${stats.pendingPayout.toFixed(2)}`,
      subtitle: "USDC",
      icon: TrendingUp,
      bgColor: "bg-blue-50",
      accentColor: "text-blue-600",
    },
    {
      title: "This Month",
      value: `$${stats.thisMonth.toFixed(2)}`,
      subtitle: "USDC",
      icon: Calendar,
      bgColor: "bg-violet-50",
      accentColor: "text-violet-600",
    },
    {
      title: "Last Month",
      value: `$${stats.lastMonth.toFixed(2)}`,
      subtitle: "USDC",
      icon: Calendar,
      bgColor: "bg-cyan-50",
      accentColor: "text-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background">
      <Header />
      <main className="container mx-auto pt-28 pb-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground mt-1">Track your API revenue</p>
        </div>

        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {STAT_CARDS.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.accentColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Earnings by Product</CardTitle>
            <CardDescription>Monthly breakdown per API</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEarnings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No earnings recorded yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEarnings.map((earning: any) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 rounded-xl border hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{earning.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {earning.period} — {earning.callCount} calls
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        ${earning.amount.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">USDC</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
