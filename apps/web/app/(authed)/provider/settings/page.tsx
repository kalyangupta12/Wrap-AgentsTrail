"use client";

import { useState, useEffect } from "react";
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
import useSWR from "swr";
import { Save, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProviderSettingsPage() {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { data, mutate } = useSWR(
    connected && publicKey
      ? `/api/provider/settings?wallet=${publicKey.toBase58()}`
      : null,
    fetcher
  );

  const [form, setForm] = useState({
    payoutWallet: "",
    providerName: "",
    providerBio: "",
  });

  useEffect(() => {
    if (data?.provider) {
      setForm({
        payoutWallet: data.provider.payoutWallet || publicKey?.toBase58() || "",
        providerName: data.provider.providerName || "",
        providerBio: data.provider.providerBio || "",
      });
    } else if (publicKey) {
      setForm((prev) => ({
        ...prev,
        payoutWallet: prev.payoutWallet || publicKey.toBase58(),
      }));
    }
  }, [data, publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/provider/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          walletAddress: publicKey?.toBase58(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground/50 transition-all duration-150";

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Provider Settings</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to manage settings
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
      <main className="container mx-auto pt-28 pb-8 px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Provider Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your payout wallet and profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Settings saved successfully!
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Payout Wallet
              </CardTitle>
              <CardDescription>
                The Solana wallet where you&apos;ll receive payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Payout Wallet Address
                </label>
                <input
                  type="text"
                  value={form.payoutWallet}
                  onChange={(e) =>
                    setForm({ ...form, payoutWallet: e.target.value })
                  }
                  className={`${inputClass} font-mono text-sm`}
                  placeholder="Your Solana wallet address"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Payments will be sent to this address.
                </p>
              </div>

              <div className="p-3.5 bg-secondary rounded-xl border">
                <p className="text-sm">
                  <span className="text-muted-foreground">Login wallet:</span>{" "}
                  <span className="font-mono">
                    {publicKey?.toBase58().slice(0, 8)}...
                    {publicKey?.toBase58().slice(-8)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provider Profile</CardTitle>
              <CardDescription>Information displayed to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <input
                  type="text"
                  value={form.providerName}
                  onChange={(e) =>
                    setForm({ ...form, providerName: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Your name or organization"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={form.providerBio}
                  onChange={(e) =>
                    setForm({ ...form, providerBio: e.target.value })
                  }
                  className={`${inputClass} min-h-[100px] resize-none`}
                  placeholder="Tell users about your APIs..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="rounded-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
