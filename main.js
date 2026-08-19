import { createClient } from "https://esm.sh/genlayer-js";
import { studionet } from "https://esm.sh/genlayer-js/chains";

const CONTRACT_ADDRESS =
  "0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459";

const connectButton = document.getElementById("connect");
const reviewButton = document.getElementById("review");
const walletElement = document.getElementById("wallet");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");

let walletAddress = null;
let walletProvider = null;


/* =========================
   FORMAT VALUE
   ========================= */

function formatValue(value) {
  try {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "bigint") {
      return value.toString();
    }

    if (value instanceof Error) {
      return value.message || String(value);
    }

    if (typeof value === "object") {
      return JSON.stringify(
        value,
        (_, item) =>
          typeof item === "bigint"
            ? item.toString()
            : item,
        2
      );
    }

    return String(value);
  } catch {
    return String(value);
  }
}


/* =========================
   ERROR DISPLAY
   ========================= */

function showError(error) {
  console.error("DAO Review Error:", error);

  statusElement.textContent =
    formatValue(error) || "Unknown error.";

  resultElement.textContent = "";
}


/* =========================
   FIND EVM WALLET
   ========================= */

function getEthereumProvider() {
  if (!window.ethereum) {
    return null;
  }

  /*
   * Some browsers expose multiple wallets
   * through window.ethereum.providers.
   */

  if (
    Array.isArray(window.ethereum.providers) &&
    window.ethereum.providers.length > 0
  ) {
    /*
     * Prefer MetaMask if available.
     */

    const metamask =
      window.ethereum.providers.find(
        (provider) => provider.isMetaMask
      );

    if (metamask) {
      return metamask;
    }

    /*
     * Otherwise use the first EVM provider.
     */

    return window.ethereum.providers[0];
  }

  return window.ethereum;
}


/* =========================
   CONNECT WALLET
   ========================= */

connectButton.addEventListener("click", async () => {
  try {
    statusElement.textContent =
      "Detecting wallet...";

    const provider =
      getEthereumProvider();

    if (!provider) {
      throw new Error(
        "EVM browser wallet tidak ditemukan. Silakan buka DAO Review dengan wallet EVM yang mendukung Studionet."
      );
    }

    walletProvider = provider;

    /*
     * Request wallet account.
     */

    const accounts =
      await walletProvider.request({
        method: "eth_requestAccounts"
      });

    if (!accounts || accounts.length === 0) {
      throw new Error(
        "Wallet account tidak ditemukan."
      );
    }

    walletAddress = accounts[0];

    walletElement.textContent =
      `Wallet: ${walletAddress}`;

    statusElement.textContent =
      "Wallet connected.";

    /*
     * Check current chain.
     */

    try {
      const chainId =
        await walletProvider.request({
          method: "eth_chainId"
        });

      console.log(
        "Current wallet chain:",
        chainId
      );
    } catch (chainError) {
      console.warn(
        "Could not read chain ID:",
        chainError
      );
    }

  } catch (error) {
    showError(error);
  }
});


/* =========================
   REVIEW PROPOSAL
   ========================= */

reviewButton.addEventListener("click", async () => {
  try {
    if (!walletAddress) {
      throw new Error(
        "Connect your wallet first."
      );
    }

    if (!walletProvider) {
      throw new Error(
        "Wallet provider tidak tersedia. Connect wallet terlebih dahulu."
      );
    }

    const proposalElement =
      document.getElementById("proposal");

    const criteriaElement =
      document.getElementById("criteria");

    if (!proposalElement || !criteriaElement) {
      throw new Error(
        "Proposal atau criteria input tidak ditemukan."
      );
    }

    const proposal =
      proposalElement.value.trim();

    const criteria =
      criteriaElement.value.trim();

    if (!proposal) {
      throw new Error(
        "Proposal cannot be empty."
      );
    }

    if (!criteria) {
      throw new Error(
        "Criteria cannot be empty."
      );
    }

    statusElement.textContent =
      "Connecting to GenLayer Studionet...";

    resultElement.textContent = "";

    /*
     * Create GenLayer client.
     */

    const client = createClient({
      chain: studionet,
      account: walletAddress,
      provider: walletProvider
    });

    /*
     * Switch / connect wallet to Studionet.
     */

    await client.connect("studionet");

    statusElement.textContent =
      "Sending proposal to GenLayer...";

    /*
     * Send review transaction.
     */

    const txHash =
      await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "review_proposal",
        args: [
          proposal,
          criteria
        ],
        value: BigInt(0)
      });

    statusElement.textContent =
      "Transaction submitted.";

    resultElement.textContent =
      `Transaction:\n${formatValue(txHash)}\n\n` +
      "Waiting for GenLayer consensus...";

    /*
     * Wait for accepted transaction.
     */

    try {
      const receipt =
        await client.waitForTransactionReceipt({
          hash: txHash,
          status: "ACCEPTED"
        });

      statusElement.textContent =
        "Review accepted by GenLayer.";

      resultElement.textContent =
        `Transaction:\n${formatValue(txHash)}\n\n` +
        `Result:\n${formatValue(receipt)}`;

    } catch (receiptError) {
      /*
       * Transaction may already have been
       * submitted even if receipt polling fails.
       */

      console.warn(
        "Receipt polling failed:",
        receiptError
      );

      statusElement.textContent =
        "Transaction submitted. Check GenLayer Studio for the result.";

      resultElement.textContent =
        `Transaction:\n${formatValue(txHash)}`;
    }

  } catch (error) {
    showError(error);
  }
});
