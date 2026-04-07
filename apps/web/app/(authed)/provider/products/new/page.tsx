"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
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
  ArrowRight,
  Check,
  Zap,
  ExternalLink,
  Wallet,
  AlertCircle,
  Key,
} from "lucide-react";
import Link from "next/link";
import {
  API_TEMPLATES,
  API_CATEGORIES,
  type ApiTemplate,
  type ApiEndpointTemplate,
} from "@/lib/api-templates";

type Step = "template" | "endpoint" | "configure" | "apikey";

interface ExistingApiKey {
  id: string;
  name: string;
  keyName: string;
  provider: string;
}

export default function NewProductPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<ApiTemplate | null>(
    null
  );
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<ApiEndpointTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingKeys, setExistingKeys] = useState<ExistingApiKey[]>([]);
  const [useExistingKey, setUseExistingKey] = useState(false);

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
    authType: "header" as "header" | "query" | "bearer",
    authHeader: "",
    authQueryParam: "",
    // New API key fields
    apiKeyId: "",
    apiKeyValue: "",
    apiKeyName: "",
    apiKeyProvider: "",
  });

  // Fetch existing API keys
  useEffect(() => {
    if (connected && publicKey) {
      fetch(`/api/provider/keys?wallet=${publicKey.toBase58()}`)
        .then((res) => res.json())
        .then((data) => setExistingKeys(data.keys || []))
        .catch(console.error);
    }
  }, [connected, publicKey]);

  const handleSelectTemplate = (template: ApiTemplate) => {
    setSelectedTemplate(template);
    setForm((f) => ({
      ...f,
      apiKeyProvider: template.id,
      apiKeyName: `${template.id.toUpperCase().replace(/-/g, "_")}_API_KEY`,
    }));
    if (template.id === "custom") {
      setStep("configure");
    } else {
      setStep("endpoint");
    }
  };

  const handleSelectEndpoint = (endpoint: ApiEndpointTemplate) => {
    setSelectedEndpoint(endpoint);
    setForm({
      ...form,
      name: endpoint.name,
      slug: endpoint.slug,
      description: endpoint.description,
      category: endpoint.category,
      upstreamUrl: `${selectedTemplate!.baseUrl}${endpoint.path}`,
      httpMethod: endpoint.method,
      pricePerCall: endpoint.suggestedPrice.toString(),
      rateLimit: endpoint.suggestedRateLimit.toString(),
      authType: selectedTemplate!.authType,
      authHeader: selectedTemplate!.authHeader || "",
      authQueryParam: selectedTemplate!.authQueryParam || "",
      apiKeyProvider: selectedTemplate!.id,
      apiKeyName: `${selectedTemplate!.id.toUpperCase().replace(/-/g, "_")}_API_KEY`,
    });
    setStep("apikey");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        ...form,
        pricePerCall: parseFloat(form.pricePerCall),
        rateLimit: parseInt(form.rateLimit),
        walletAddress: publicKey?.toBase58(),
      };

      // Handle API key - either existing or new
      if (useExistingKey && form.apiKeyId) {
        payload.apiKeyId = form.apiKeyId;
      } else if (form.apiKeyValue) {
        payload.apiKeyValue = form.apiKeyValue;
        payload.apiKeyName = form.apiKeyName;
        payload.apiKeyProvider = form.apiKeyProvider || "custom";
      }

      const res = await fetch("/api/provider/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create API");
      }

      router.push("/provider/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold mb-3">Create New API</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to create an API
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
      <main className="container mx-auto pt-28 pb-8 px-4 max-w-4xl">
        <Link
          href="/provider/products"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
          Back to My APIs
        </Link>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {(selectedTemplate?.id === "custom"
            ? ["template", "configure"]
            : ["template", "endpoint", "apikey"]
          ).map((s, i, arr) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : arr.indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {arr.indexOf(step) > i ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`w-20 h-1 rounded ${
                    arr.indexOf(step) > i ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Template */}
        {step === "template" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Choose an API Provider</h1>
              <p className="text-muted-foreground">
                Select a pre-configured template or create a custom API
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {API_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : ""
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {template.name}
                      {template.id === "custom" && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          Advanced
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.provider}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    {template.endpoints.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary font-medium">
                          {template.endpoints.length} endpoints
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Endpoint */}
        {step === "endpoint" && selectedTemplate && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">
                Select {selectedTemplate.name} Endpoint
              </h1>
              <p className="text-muted-foreground">
                Choose which endpoint to monetize with your API key
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setStep("template");
                setSelectedTemplate(null);
              }}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Provider
            </Button>

            <div className="grid gap-3">
              {selectedTemplate.endpoints.map((endpoint) => (
                <Card
                  key={endpoint.slug}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
                  onClick={() => handleSelectEndpoint(endpoint)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              endpoint.method === "GET"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                          <span className="font-medium">{endpoint.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {endpoint.description}
                        </p>
                        <code className="text-xs text-muted-foreground font-mono">
                          {endpoint.path}
                        </code>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-semibold text-primary">
                          ${endpoint.suggestedPrice}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {endpoint.suggestedRateLimit}/min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: API Key Configuration */}
        {step === "apikey" && selectedTemplate && selectedEndpoint && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Configure Your API</CardTitle>
              <CardDescription>
                Add your {selectedTemplate.name} API key and customize pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Selected Endpoint Info */}
                <div className="p-4 bg-muted/50 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Selected Endpoint
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            selectedEndpoint.method === "GET"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {selectedEndpoint.method}
                        </span>
                        <span className="font-medium">
                          {selectedEndpoint.name}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("endpoint")}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s/g, "-")
                            .replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                      className={inputClass}
                      required
                    />
                    <p className="text-xs text-muted-foreground font-mono">
                      /v1/{form.slug || "your-slug"}
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
                    className={`${inputClass} min-h-[70px] resize-none`}
                    required
                  />
                </div>

                {/* API Key Section */}
                <div className="p-5 border-2 border-primary/20 bg-primary/5 rounded-xl space-y-4">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    Your {selectedTemplate.name} API Key
                  </label>

                  {/* Toggle between existing and new key */}
                  {existingKeys.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={!useExistingKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseExistingKey(false)}
                        className="rounded-full"
                      >
                        Add New Key
                      </Button>
                      <Button
                        type="button"
                        variant={useExistingKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseExistingKey(true)}
                        className="rounded-full"
                      >
                        Use Existing Key
                      </Button>
                    </div>
                  )}

                  {useExistingKey ? (
                    <select
                      value={form.apiKeyId}
                      onChange={(e) =>
                        setForm({ ...form, apiKeyId: e.target.value })
                      }
                      className={`${inputClass} cursor-pointer`}
                      required
                    >
                      <option value="">Select an API key...</option>
                      {existingKeys.map((key) => (
                        <option key={key.id} value={key.id}>
                          {key.name} ({key.provider})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type="password"
                        value={form.apiKeyValue}
                        onChange={(e) =>
                          setForm({ ...form, apiKeyValue: e.target.value })
                        }
                        className={`${inputClass} font-mono`}
                        placeholder="Enter your API key"
                        required={!useExistingKey}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your API key is encrypted and stored securely. It&apos;s never exposed to users.
                      </p>
                    </>
                  )}

                  {selectedTemplate.docsUrl && (
                    <a
                      href={selectedTemplate.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Get your {selectedTemplate.name} API key{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>
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

                <div className="flex items-center gap-2.5 py-1">
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
                    List in public marketplace
                  </label>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("endpoint")}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-full"
                  >
                    {loading ? "Creating..." : "Create API"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Custom API Configuration */}
        {step === "configure" && selectedTemplate?.id === "custom" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Configure Custom API</CardTitle>
              <CardDescription>
                Set up any REST API with custom authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={inputClass}
                      placeholder="My API"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s/g, "-")
                            .replace(/[^a-z0-9-]/g, ""),
                        })
                      }
                      className={inputClass}
                      placeholder="my-api"
                      required
                    />
                    <p className="text-xs text-muted-foreground font-mono">
                      /v1/{form.slug || "your-slug"}
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
                    placeholder="What does your API do?"
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
                    placeholder="https://api.example.com/v1/data"
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
                          authType: e.target.value as
                            | "header"
                            | "query"
                            | "bearer",
                        })
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="header">Header (X-API-Key)</option>
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
                      <label className="text-sm font-medium">
                        Query Param Name
                      </label>
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

                {/* API Key Section for Custom */}
                <div className="p-5 border-2 border-primary/20 bg-primary/5 rounded-xl space-y-4">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    Your API Key
                  </label>

                  {existingKeys.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={!useExistingKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseExistingKey(false)}
                        className="rounded-full"
                      >
                        Add New Key
                      </Button>
                      <Button
                        type="button"
                        variant={useExistingKey ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseExistingKey(true)}
                        className="rounded-full"
                      >
                        Use Existing Key
                      </Button>
                    </div>
                  )}

                  {useExistingKey ? (
                    <select
                      value={form.apiKeyId}
                      onChange={(e) =>
                        setForm({ ...form, apiKeyId: e.target.value })
                      }
                      className={`${inputClass} cursor-pointer`}
                      required
                    >
                      <option value="">Select an API key...</option>
                      {existingKeys.map((key) => (
                        <option key={key.id} value={key.id}>
                          {key.name} ({key.provider})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Key Name</label>
                          <input
                            type="text"
                            value={form.apiKeyName}
                            onChange={(e) =>
                              setForm({ ...form, apiKeyName: e.target.value })
                            }
                            className={`${inputClass} font-mono`}
                            placeholder="MY_API_KEY"
                            required={!useExistingKey}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Provider</label>
                          <input
                            type="text"
                            value={form.apiKeyProvider}
                            onChange={(e) =>
                              setForm({ ...form, apiKeyProvider: e.target.value })
                            }
                            className={inputClass}
                            placeholder="custom"
                          />
                        </div>
                      </div>
                      <input
                        type="password"
                        value={form.apiKeyValue}
                        onChange={(e) =>
                          setForm({ ...form, apiKeyValue: e.target.value })
                        }
                        className={`${inputClass} font-mono`}
                        placeholder="Enter your API key"
                        required={!useExistingKey}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your API key is encrypted and stored securely.
                      </p>
                    </>
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

                <div className="flex items-center gap-2.5 py-1">
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
                    List in public marketplace
                  </label>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("template");
                      setSelectedTemplate(null);
                    }}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-full"
                  >
                    {loading ? "Creating..." : "Create API"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
