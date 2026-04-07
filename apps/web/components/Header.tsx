"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { cn } from "@/lib/utils";
import { Menu, X, Zap } from "lucide-react";

const menuItems = [
  { href: "/", label: "Marketplace" },
  { href: "/docs", label: "Docs" },
];

const authedItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explorer", label: "Explorer" },
  { href: "/provider", label: "Provider" },
];

export function Header() {
  const { connected, publicKey } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const allLinks = [...menuItems, ...(connected ? authedItems : [])];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <nav className="px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "mx-auto mt-3 max-w-7xl transition-all duration-300",
            isScrolled
              ? "bg-background/95 backdrop-blur-md border rounded-2xl shadow-lg px-4 py-2"
              : "bg-transparent px-4 py-3"
          )}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-foreground">Wrap</span>
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center">
              <ul className="flex items-center gap-1">
                {allLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Side - Wallet Controls */}
            <div className="flex items-center gap-2">
              {/* Network Switcher */}
              <div className="hidden sm:block">
                <NetworkSwitcher />
              </div>

              {/* Wallet Address (Desktop only, when not scrolled) */}
              {connected && publicKey && !isScrolled && (
                <div className="hidden lg:flex items-center px-3 py-1.5 bg-secondary/50 border rounded-lg">
                  <span className="text-xs font-mono text-muted-foreground">
                    {publicKey.toBase58().slice(0, 4)}...
                    {publicKey.toBase58().slice(-4)}
                  </span>
                </div>
              )}

              {/* Wallet Button */}
              <div className="hidden sm:block">
                <WalletMultiButton className="!h-9" />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
                className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t mt-3 pt-3 pb-2 space-y-1">
              {/* Mobile Navigation Links */}
              {allLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Network Switcher */}
              <div className="sm:hidden px-2 py-2">
                <NetworkSwitcher />
              </div>

              {/* Mobile Wallet Address */}
              {connected && publicKey && (
                <div className="sm:hidden px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary/50 border rounded-lg px-3 py-2">
                    <span>Wallet:</span>
                    <span>
                      {publicKey.toBase58().slice(0, 4)}...
                      {publicKey.toBase58().slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Wallet Button */}
              <div className="sm:hidden px-2 py-2">
                <WalletMultiButton className="w-full !h-10" />
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
