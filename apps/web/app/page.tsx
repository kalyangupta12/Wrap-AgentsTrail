import { Header } from "@/components/Header";
import { ApiCard } from "@/components/ApiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Zap,
  Wallet,
  Code2,
  Globe,
  Lock,
  TrendingUp,
  Users,
  Github,
  Twitter,
} from "lucide-react";
import Link from "next/link";

const DEMO_APIS = [
  {
    name: "BTC Price",
    slug: "btc-price",
    description: "Live Bitcoin price from CoinMarketCap",
    pricePerCall: 0.001,
    rateLimit: 60,
  },
  {
    name: "ETH Price",
    slug: "eth-price",
    description: "Live Ethereum price from CoinMarketCap",
    pricePerCall: 0.001,
    rateLimit: 60,
  },
  {
    name: "Weather",
    slug: "weather",
    description: "Current weather data from OpenWeatherMap",
    pricePerCall: 0.002,
    rateLimit: 30,
  },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "Wallet Authentication",
    description:
      "Seamless Web3 wallet integration for secure, passwordless authentication. Connect with Phantom, Backpack, and more.",
    className: "md:col-span-2",
  },
  {
    icon: Zap,
    title: "Pay Per Call",
    description:
      "Flexible micropayment system that charges users only for the API calls they make. No subscriptions, no commitments.",
    className: "md:col-span-1",
  },
  {
    icon: Shield,
    title: "x402 Protocol",
    description:
      "Built on the innovative x402 protocol standard for HTTP payment-required responses, enabling true pay-per-use APIs with automatic billing.",
    className: "md:col-span-3",
  },
];

const STEPS = [
  {
    step: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Solana wallet — Phantom, Backpack, or Solflare.",
  },
  {
    step: "02",
    icon: Code2,
    title: "Discover APIs",
    description: "Browse the marketplace and find the APIs you need.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Pay & Use",
    description: "Pay per call with USDC. Automatic x402 payment flow.",
  },
];

const footerSections = [
  {
    label: "Product",
    links: [
      { title: "Marketplace", href: "/" },
      { title: "Explorer", href: "/explorer" },
      { title: "Documentation", href: "/docs" },
    ],
  },
  {
    label: "Providers",
    links: [
      { title: "List an API", href: "/provider/products/new" },
      { title: "Provider Dashboard", href: "/provider" },
      { title: "Earnings", href: "/provider/earnings" },
    ],
  },
  {
    label: "Technology",
    links: [
      { title: "x402 Protocol", href: "#" },
      { title: "Solana Blockchain", href: "#" },
      { title: "USDC Payments", href: "#" },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* ═══════════════════════════════════════════
          HERO SECTION (21st.dev pattern)
          ═══════════════════════════════════════════ */}
      <main className="overflow-hidden bg-gradient-to-b from-blue-50/50 via-cyan-50/30 to-background">
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
          {/* Grid background */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          />

          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Powered by x402 Protocol on Solana
              </div>

              <h1 className="mx-auto max-w-5xl text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                API Monetization{" "}
                <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
                Pay-per-call API marketplace powered by Solana. Connect your
                wallet, discover APIs, and pay only for what you use.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-8 text-base group">
                  <Link href="/explorer">
                    Explore APIs
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base">
                  <Link href="/docs">Browse Docs</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6 max-w-4xl mx-auto">
                {[
                  { value: "12+", label: "Active APIs", icon: <Zap className="h-5 w-5" /> },
                  { value: "50K+", label: "Developers", icon: <Users className="h-5 w-5" /> },
                  { value: "99.9%", label: "Uptime", icon: <TrendingUp className="h-5 w-5" /> },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-primary">{stat.icon}</div>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {stat.value}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════
          FEATURES SECTION (21st.dev bento grid)
          ═══════════════════════════════════════════ */}
      <section className="w-full py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Platform Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build and scale your API business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className={`group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${feature.className}`}
              >
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl transition-colors duration-300 pointer-events-none" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-background via-blue-50/30 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              How It{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Three simple steps to start using pay-per-call APIs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-border" />

            {STEPS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-2xl border bg-background shadow-sm mb-6 relative">
                  <step.icon className="w-10 h-10 text-primary" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          API MARKETPLACE
          ═══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Available{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                APIs
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Browse and explore our growing API marketplace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {DEMO_APIS.map((api) => (
              <ApiCard key={api.slug} {...api} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link href="/explorer">
                View All APIs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-background via-blue-50/30 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="p-12 md:p-16">
            <Globe className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Start Building Today
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              List your own APIs or start consuming existing ones. No setup
              fees, no monthly commitments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 text-base">
                <Link href="/provider/products/new">
                  <Lock className="w-4 h-4 mr-2" />
                  List Your API
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base">
                <Link href="/explorer">
                  Explore APIs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER (21st.dev pattern)
          ═══════════════════════════════════════════ */}
      <footer className="w-full border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  Wrap
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                API monetization platform powered by x402 protocol and Solana.
              </p>
              <div className="mt-6 flex gap-4">
                {[
                  { icon: Twitter, label: "Twitter" },
                  { icon: Github, label: "GitHub" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 lg:col-span-3">
              {footerSections.map((section) => (
                <div key={section.label}>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    {section.label}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} AgentsTrail. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
