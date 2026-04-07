"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
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
import {
  ArrowLeft,
  Save,
  Trash2,
  Key,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { API_CATEGORIES } from "@/lib/api-templates";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  upstreamUrl: string;
  httpMethod: string;
  pricePerCall: number;
  rateLimit: number;
  isPublic: boolean;
  isActive: boolean;
  authType: string;
  authHeader: string | null;
  authQueryParam: string | null;
  apiKey: {
    id: string;
    name: string;
    keyName: string;
    provider: string;
  } | null;
}

interface ExistingApiKey {
  id: string;
  name: string;
  keyName: string;
  provider: string;
}

export default function EditProductPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [existingKeys, setExistingKeys] = useState<ExistingApiKey[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [changeApiKey, setChangeApiKey] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "general",
    upstreamUrl: "",
    httpMethod: "GET",
    pricePerCall: "0.001",
    rateLimit: "60",
    isPublic: true,
    isActive: true,
    authType: "header" as "header" | "query" | "bearer",
    authHeader: "",
    authQueryParam: "",
    apiKeyId: "",
    newApiKeyValue: "",
    newApiKeyName: "",
    newApiKeyProvider: "",
  });

  // Fetch product data
  useEffect(() => {
    if (connected && publicKey && productId) {
      Promise.all([
        fetch(`/api/provider/products/${productId}?wallet=${publicKey.toBase58()}`).then(
          (res) => res.json()
        ),
        fetch(`/api/provider/keys?wallet=${publicKey.toBase58()}`).then((res) =>
          res.json()
        ),
      ])
        .then(([productData, keysData]) => {
          if (productData.error) {
            setError(productData.error);
          } else {
            setProduct(productData.product);
            setExistingKeys(keysData.keys || []);
            // Populate form
            const p = productData.product;
            setForm({
              name: p.name,
              slug: p.slug,
              description: p.description || "",
              category: p.category || "general",
              upstreamUrl: p.upstreamUrl || "",
              httpMethod: p.httpMethod || "GET",
              pricePerCall: p.pricePerCall.toString(),
              rateLimit: p.rateLimit.toString(),
              isPublic: p.isPublic,
              isActive: p.isActive,
              authType: (p.authType || "header") as "header" | "query" | "bearer",
              authHeader: p.authHeader || "",
              authQueryParam: p.authQueryParam || "",
              apiKeyId: p.apiKey?.id || "",
              newApiKeyValue: "",
              newApiKeyName: "",
              newApiKeyProvider: "",
            });
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [connected, publicKey, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        category: form.category,
        upstreamUrl: form.upstreamUrl,
        httpMethod: form.httpMethod,
        pricePerCall: parseFloat(form.pricePerCall),
        rateLimit: parseInt(form.rateLimit),
        isPublic: form.isPublic,
        isActive: form.isActive,
        authType: form.authType,
        authHeader: form.authHeader || null,
        authQueryParam: form.authQueryParam || null,
        walletAddress: publicKey?.toBase58(),
      };

      // Handle API key changes
      if (changeApiKey) {
        if (form.apiKeyId) {
          payload.apiKeyId = form.apiKeyId;
        } else if (form.newApiKeyValue) {
          payload.apiKeyValue = form.newApiKeyValue;
          payload.apiKeyName = form.newApiKeyName;
          payload.apiKeyProvider = form.newApiKeyProvider || "custom";
        }
      }

      const res = await fetch(`/api/provider/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update API");
      }

      setSuccess("API updated successfully!");
      setChangeApiKey(false);

      // Refresh product data
      const updatedProduct = await res.json();
      setProduct(updatedProduct.product);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/provider/products/${productId}?wallet=${publicKey?.toBase58()}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete API");
      }

      router.push("/provider/products");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Edit API</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to edit this API
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading API details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background">
        <Header />
        <div className="container mx-auto pt-32 text-center">
          <Card className="max-w-md mx-auto p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">API Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "This API doesn't exist or you don't have access to it."}
            </p>
            <Button asChild className="rounded-full">
              <Link href="/provider/products">Back to My APIs</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background">
      <Header />
      <main className="container mx-auto pt-28 pb-8 px-4 max-w-3xl">
        <Link
          href="/provider/products"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          Back to My APIs
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Edit API</CardTitle>
                <CardDescription>
                  Update your API configuration and pricing
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    product.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">URL Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    className={`${inputClass} bg-muted cursor-not-allowed`}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    /v1/{form.slug}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={`${inputClass} min-h-[80px] resize-none`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    {API_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">HTTP Method</label>
                  <select
                    value={form.httpMethod}
                    onChange={(e) =>
                      setForm({ ...form, httpMethod: e.target.value })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upstream URL</label>
                <input
                  type="url"
                  value={form.upstreamUrl}
                  onChange={(e) =>
                    setForm({ ...form, upstreamUrl: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auth Type</label>
                  <select
                    value={form.authType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        authType: e.target.value as "header" | "query" | "bearer",
                      })
                    }
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="header">Header</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>

                {form.authType === "header" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Header Name</label>
                    <input
                      type="text"
                      value={form.authHeader}
                      onChange={(e) =>
                        setForm({ ...form, authHeader: e.target.value })
                      }
                      className={inputClass}
                      placeholder="X-API-Key"
                    />
                  </div>
                )}

                {form.authType === "query" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Query Param</label>
                    <input
                      type="text"
                      value={form.authQueryParam}
                      onChange={(e) =>
                        setForm({ ...form, authQueryParam: e.target.value })
                      }
                      className={inputClass}
                      placeholder="api_key"
                    />
                  </div>
                )}
              </div>

              {/* API Key Section */}
              <div className="p-5 border rounded-xl bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    API Key
                  </label>
                  {!changeApiKey && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChangeApiKey(true)}
                      className="rounded-full"
                    >
                      Change Key
                    </Button>
                  )}
                </div>

                {!changeApiKey ? (
                  product.apiKey ? (
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{product.apiKey.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.apiKey.provider} &bull; {product.apiKey.keyName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No API key configured. This API returns mock data.
                    </p>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={!form.apiKeyId && !form.newApiKeyValue ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setForm({ ...form, apiKeyId: "", newApiKeyValue: "" });
                        }}
                        className="rounded-full"
                      >
                        No Key (Mock)
                      </Button>
                      {existingKeys.length > 0 && (
                        <Button
                          type="button"
                          variant={form.apiKeyId ? "default" : "outline"}
                          size="sm"
                          onClick={() => setForm({ ...form, newApiKeyValue: "" })}
                          className="rounded-full"
                        >
                          Existing Key
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant={form.newApiKeyValue ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm({ ...form, apiKeyId: "" })}
                        className="rounded-full"
                      >
                        New Key
                      </Button>
                    </div>

                    {form.apiKeyId !== "" && !form.newApiKeyValue && (
                      <select
                        value={form.apiKeyId}
                        onChange={(e) =>
                          setForm({ ...form, apiKeyId: e.target.value })
                        }
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Select an API key...</option>
                        {existingKeys.map((key) => (
                          <option key={key.id} value={key.id}>
                            {key.name} ({key.provider})
                          </option>
                        ))}
                      </select>
                    )}

                    {form.newApiKeyValue !== undefined && form.apiKeyId === "" && form.newApiKeyValue !== "" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={form.newApiKeyName}
                            onChange={(e) =>
                              setForm({ ...form, newApiKeyName: e.target.value })
                            }
                            className={inputClass}
                            placeholder="Key name (e.g. MY_API_KEY)"
                          />
                          <input
                            type="text"
                            value={form.newApiKeyProvider}
                            onChange={(e) =>
                              setForm({ ...form, newApiKeyProvider: e.target.value })
                            }
                            className={inputClass}
                            placeholder="Provider (e.g. openai)"
                          />
                        </div>
                        <input
                          type="password"
                          value={form.newApiKeyValue}
                          onChange={(e) =>
                            setForm({ ...form, newApiKeyValue: e.target.value })
                          }
                          className={`${inputClass} font-mono`}
                          placeholder="Enter API key value"
                        />
                      </div>
                    )}

                    {form.apiKeyId === "" && form.newApiKeyValue === "" && (
                      <input
                        type="password"
                        value={form.newApiKeyValue}
                        onChange={(e) =>
                          setForm({ ...form, newApiKeyValue: e.target.value })
                        }
                        className={`${inputClass} font-mono`}
                        placeholder="Enter new API key to add one..."
                      />
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setChangeApiKey(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Price per Call (USDC)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={form.pricePerCall}
                    onChange={(e) =>
                      setForm({ ...form, pricePerCall: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Rate Limit (req/min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.rateLimit}
                    onChange={(e) =>
                      setForm({ ...form, rateLimit: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-1">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm({ ...form, isPublic: e.target.checked })
                    }
                    className="rounded border-input accent-primary cursor-pointer"
                  />
                  <label htmlFor="isPublic" className="text-sm cursor-pointer">
                    List in marketplace
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="rounded border-input accent-primary cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm cursor-pointer">
                    Active (accepting calls)
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete API
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-red-600">Delete API</CardTitle>
                <CardDescription>
                  Are you sure you want to delete &quot;{product.name}&quot;? This action
                  cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
