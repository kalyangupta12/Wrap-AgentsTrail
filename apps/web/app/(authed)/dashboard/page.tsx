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
import { Activity, DollarSign, Zap, Wallet } from "lucide-react";

const STAT_CARDS = [
  {
    title: "Credit Balance",
    value: "$0.00",
    subtitle: "USDC",
    icon: DollarSign,
    accentColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Total API Calls",
    value: "0",
    subtitle: "all time",
    icon: Zap,
    accentColor: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    title: "Total Spent",
    value: "$0.00",
    subtitle: "USDC",
    icon: Activity,
    accentColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-6">
              Connect your Solana wallet to view your dashboard
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background">
      <Header />
      <main className="container mx-auto pt-28 pb-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back,{" "}
            <span className="font-mono text-foreground/80">
              {publicKey?.toBase58().slice(0, 8)}...
            </span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent API Calls</CardTitle>
            <CardDescription>Your most recent API usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No API calls yet. Try the API explorer to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
