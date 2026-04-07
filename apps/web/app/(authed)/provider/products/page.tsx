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
import useSWR from "swr";
import {
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
  Wallet,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProviderProductsPage() {
  const { connected, publicKey } = useWallet();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const { data, mutate } = useSWR(
    connected && publicKey
      ? `/api/provider/products?wallet=${publicKey.toBase58()}`
      : null,
    fetcher
  );

  const toggleProduct = async (productId: string, isActive: boolean) => {
    await fetch(`/api/provider/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    mutate();
  };

  const copyEndpoint = (slug: string, suffix: string) => {
    const endpoint = `/v1/${slug}${suffix}`;
    navigator.clipboard.writeText(endpoint);
    setCopiedSlug(`${slug}${suffix}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">My APIs</h1>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to manage your APIs
            </p>
            <WalletMultiButton />
          </Card>
        </div>
      </div>
    );
  }

  const products = data?.products || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background">
      <Header />
      <main className="container mx-auto pt-28 pb-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My APIs</h1>
            <p className="text-muted-foreground mt-1">
              Manage your API products
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/provider/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add API
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-5">
                You haven&apos;t created any APIs yet
              </p>
              <Button asChild className="rounded-full">
                <Link href="/provider/products/new">Create Your First API</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {products.map((product: any) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2.5">
                        {product.name}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {product.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          toggleProduct(product.id, product.isActive)
                        }
                      >
                        {product.isActive ? (
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Link href={`/provider/products/${product.id}/edit`}>
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs">Endpoints</span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <button
                          onClick={() => copyEndpoint(product.slug, "-m")}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="font-mono text-xs">/v1/{product.slug}-m</span>
                          {copiedSlug === `${product.slug}-m` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                        <button
                          onClick={() => copyEndpoint(product.slug, "-d")}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="font-mono text-xs">/v1/{product.slug}-d</span>
                          {copiedSlug === `${product.slug}-d` ? (
                            <Check className="h-3 w-3 text-amber-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Price</span>
                      <p className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-0.5">
                        ${product.pricePerCall} USDC
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Rate Limit</span>
                      <p className="mt-0.5">{product.rateLimit} req/min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
