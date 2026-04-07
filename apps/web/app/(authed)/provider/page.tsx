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
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import {
  Plus,
  DollarSign,
  Zap,
  TrendingUp,
  Settings,
  ArrowRight,
  Wallet,
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const QUICK_LINKS = [
  {
    href: "/provider/products",
    icon: Zap,
    title: "My APIs",
    description: "Manage your API products",
    bgColor: "bg-blue-50",
    accentColor: "text-blue-600",
  },
  {
    href: "/provider/earnings",
    icon: DollarSign,
    title: "Earnings",
    description: "View revenue and payouts",
    bgColor: "bg-emerald-50",
    accentColor: "text-emerald-600",
  },
  {
    href: "/provider/settings",
    icon: Settings,
    title: "Settings",
    description: "Configure payout wallet",
    bgColor: "bg-violet-50",
    accentColor: "text-violet-600",
  },
];

export default function ProviderDashboard() {
  const { connected, publicKey } = useWallet();

  const { data: providerData } = useSWR(
    connected && publicKey
      ? `/api/provider/stats?wallet=${publicKey.toBase58()}`
      : null,
    fetcher
  );

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Provider Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to manage your APIs
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const stats = providerData?.stats || {
    totalProducts: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    totalCalls: 0,
  };

  const STAT_CARDS = [
    {
      title: "Active APIs",
      value: stats.totalProducts,
      icon: Zap,
      bgColor: "bg-blue-50",
      accentColor: "text-blue-600",
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      subtitle: "USDC",
      icon: DollarSign,
      bgColor: "bg-emerald-50",
      accentColor: "text-emerald-600",
    },
    {
      title: "Pending Payout",
      value: `$${stats.pendingPayout.toFixed(2)}`,
      subtitle: "USDC",
      icon: TrendingUp,
      bgColor: "bg-violet-50",
      accentColor: "text-violet-600",
    },
    {
      title: "Total API Calls",
      value: stats.totalCalls,
      icon: Zap,
      bgColor: "bg-cyan-50",
      accentColor: "text-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background">
      <Header />
      <main className="container mx-auto pt-28 pb-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Provider Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your APIs and track earnings
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/provider/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add API
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
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
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-5">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${link.bgColor} flex items-center justify-center`}>
                        <link.icon className={`h-5 w-5 ${link.accentColor}`} />
                      </div>
                      {link.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </CardTitle>
                  <CardDescription className="ml-[52px]">
                    {link.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
