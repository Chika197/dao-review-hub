
import { encodeFunctionData } from "https://esm.sh/viem";

const CONTRACT_ADDRESS =
  "0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459";

const STUDIONET_CHAIN_ID = "0xf1ef";

const connectButton = document.getElementById("connect");
const reviewButton = document.getElementById("review");
const walletElement = document.getElementById("wallet");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");

let walletAddress = null;
let walletProvider = null;

function formatValue(value) {
  try {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Error) return value.message || String(value);

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

function showError(error) {
  console.error("DAO Review Error:", error);

  statusElement.textContent =
    formatValue(error) || "Unknown error.";

  resultElement.textContent = "";
}


/* =========================
   CONNECT WALLET
   ========================= */

connectButton.addEventListener("click", async () => {
  try {
    statusElement.textContent =
      "Connecting wallet...";

    if (!window.ethereum) {
      throw new Error(
        "Browser wallet tidak ditemukan."
      );
    }

    walletProvider = window.ethereum;

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

    const chainId =
      await walletProvider.request({
        method: "eth_chainId"
      });

    if (chainId === STUDIONET_CHAIN_ID) {
      statusElement.textContent =
        "Wallet connected to GenLayer Studionet.";
    } else {
      statusElement.textContent =
        `Wallet connected. Chain: ${chainId}`;
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
    if (!walletAddress || !walletProvider) {
      throw new Error(
        "Connect your wallet first."
      );
    }

    const proposalElement =
      document.getElementById("proposal");

    const criteriaElement =
      document.getElementById("criteria");

    if (!proposalElement || !criteriaElement) {
      throw new Error(
        "Proposal atau criteria tidak ditemukan."
      );
    }

    const proposal =
      proposalElement.value.trim();

    const criteria =
      criteriaElement.value.trim();

    if (!proposal || !criteria) {
      throw new Error(
        "Proposal and criteria are required."
      );
    }

    const chainId =
      await walletProvider.request({
        method: "eth_chainId"
      });

    if (chainId !== STUDIONET_CHAIN_ID) {
      throw new Error(
        `Wallet belum di GenLayer Studionet. Chain sekarang: ${chainId}`
      );
    }

    statusElement.textContent =
      "Preparing transaction...";

    resultElement.textContent = "";

    const abi = [
      {
        type: "function",
        name: "review_proposal",
        stateMutability: "nonpayable",
        inputs: [
          {
            name: "proposal",
            type: "string"
          },
          {
            name: "criteria",
            type: "string"
          }
        ],
        outputs: []
      }
    ];

    const data =
      encodeFunctionData({
        abi,
        functionName: "review_proposal",
        args: [
          proposal,
          criteria
        ]
      });

    statusElement.textContent =
      "Waiting for wallet confirmation...";

    /*
     * LANGSUNG KIRIM TRANSAKSI
     * Tidak menggunakan genlayer-js.
     * Tidak menggunakan client.connect().
     * Tidak menggunakan client.writeContract().
     */

    const txHash =
      await walletProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: CONTRACT_ADDRESS,
            data: data,
            value: "0x0"
          }
        ]
      });

    statusElement.textContent =
      "Transaction submitted.";

    resultElement.textContent =
      `Transaction:\n${txHash}\n\n` +
      "Waiting for GenLayer consensus...";

  } catch (error) {
    showError(error);
  }
});
