/**
 * Test script for x402 paid API calls
 *
 * Usage:
 *   1. Install deps: pnpm add -D @x402/fetch @x402/svm @solana/web3.js bs58
 *   2. Set your wallet private key: export SOLANA_PRIVATE_KEY="your_base58_private_key"
 *   3. Run: npx tsx scripts/test-x402.ts
 */

import { wrapFetchWithPayment } from "@x402/fetch";
import { toClientSvmSigner, DEVNET_RPC_URL } from "@x402/svm";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

async function main() {
  // Load wallet from environment
  const privateKeyBase58 = process.env.SOLANA_PRIVATE_KEY;

  if (!privateKeyBase58) {
    console.error("Error: Set SOLANA_PRIVATE_KEY environment variable");
    console.log("\nTo create a test wallet:");
    console.log("  const keypair = Keypair.generate();");
    console.log("  console.log(bs58.encode(keypair.secretKey));");
    process.exit(1);
  }

  // Create Solana keypair from private key
  const secretKey = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);

  console.log("Wallet address:", keypair.publicKey.toBase58());

  // Create x402 payment signer for Solana using the new API
  const paymentSigner = toClientSvmSigner(keypair, DEVNET_RPC_URL);

  // Wrap fetch with x402 payment handling
  const x402Fetch = wrapFetchWithPayment(fetch, paymentSigner);

  // Make a paid API request
  const apiUrl = process.env.API_URL || "https://api-wrap.agentstrail.ai";
  const endpoint = "/v1/bitcoin-price";

  console.log(`\nMaking request to ${apiUrl}${endpoint}...`);

  try {
    const response = await x402Fetch(`${apiUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Solana-Network": "devnet", // Use 'mainnet-beta' for production
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("\nSuccess! Response:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`\nRequest failed with status ${response.status}`);
      const text = await response.text();
      console.error(text);
    }
  } catch (error) {
    console.error("\nError:", error);
  }
}

main();
