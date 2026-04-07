"use client";

import { useState } from "react";
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
import { Play, Copy, Check, Terminal, Wallet } from "lucide-react";

const ENDPOINTS = [
  {
    name: "BTC Price",
    slug: "btc-price",
    method: "GET",
    price: 0.001,
    description: "Get current Bitcoin price in USD",
  },
  {
    name: "ETH Price",
    slug: "eth-price",
    method: "GET",
    price: 0.001,
    description: "Get current Ethereum price in USD",
  },
  {
    name: "Weather",
    slug: "weather",
    method: "GET",
    price: 0.002,
    description: "Get weather for a location (query: ?city=London)",
  },
];

export default function ExplorerPage() {
  const { connected } = useWallet();
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTry = async () => {
    setLoading(true);
    setTimeout(() => {
      setResponse(
        JSON.stringify(
          {
            success: true,
            data: {
              symbol: selectedEndpoint.slug.includes("btc") ? "BTC" : "ETH",
              price: selectedEndpoint.slug.includes("btc") ? 67234.56 : 3456.78,
              currency: "USD",
              timestamp: new Date().toISOString(),
            },
          },
          null,
          2
        )
      );
      setLoading(false);
    }, 1000);
  };

  const copyEndpoint = () => {
    navigator.clipboard.writeText(
      `https://api.wrap.dev/v1/${selectedEndpoint.slug}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Connect your Solana wallet to use the API explorer
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
          <h1 className="text-3xl font-bold tracking-tight">API Explorer</h1>
          <p className="text-muted-foreground mt-1">
            Test API endpoints directly in your browser
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Endpoint List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ENDPOINTS.map((endpoint) => (
                  <button
                    key={endpoint.slug}
                    onClick={() => {
                      setSelectedEndpoint(endpoint);
                      setResponse(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      selectedEndpoint.slug === endpoint.slug
                        ? "border-blue-300 bg-blue-50 shadow-sm"
                        : "border-border hover:border-border/80 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{endpoint.name}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                        {endpoint.method}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      <span className="font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        ${endpoint.price}
                      </span>{" "}
                      USDC per call
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Request/Response */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedEndpoint.name}
                </CardTitle>
                <CardDescription>
                  {selectedEndpoint.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                    {selectedEndpoint.method}
                  </span>
                  <code className="flex-1 bg-secondary border px-3.5 py-2.5 rounded-lg text-sm font-mono">
                    /v1/{selectedEndpoint.slug}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={copyEndpoint}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cost:{" "}
                    <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      ${selectedEndpoint.price} USDC
                    </span>
                  </span>
                  <Button onClick={handleTry} disabled={loading} className="rounded-full">
                    <Play className="h-4 w-4 mr-2" />
                    {loading ? "Running..." : "Try It"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {response && (
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 text-emerald-400 p-5 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
                    {response}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
