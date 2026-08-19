import { createClient } from "https://esm.sh/genlayer-js";

const CONTRACT_ADDRESS =
  "0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459";

const connectButton = document.getElementById("connect");
const reviewButton = document.getElementById("review");
const walletElement = document.getElementById("wallet");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");

let walletAddress = null;

function showError(error) {
  console.error("Error:", error);

  let message = "Unknown error.";

  try {
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else {
      message = JSON.stringify(
        error,
        (_, value) =>
          typeof value === "bigint"
            ? value.toString()
            : value,
        2
      );
    }
  } catch {
    message = String(error);
  }

  statusElement.textContent = message;
}

connectButton.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      throw new Error(
        "Browser wallet tidak ditemukan."
      );
    }

    statusElement.textContent =
      "Connecting wallet...";

    const accounts =
      await window.ethereum.request({
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
  } catch (error) {
    showError(error);
  }
});

reviewButton.addEventListener("click", async () => {
  try {
    if (!walletAddress) {
      throw new Error(
        "Connect your wallet first."
      );
    }

    const proposal =
      document
        .getElementById("proposal")
        .value
        .trim();

    const criteria =
      document
        .getElementById("criteria")
        .value
        .trim();

    if (!proposal || !criteria) {
      throw new Error(
        "Proposal and criteria are required."
      );
    }

    statusElement.textContent =
      "Submitting proposal to GenLayer...";

    resultElement.textContent = "";

    const client = createClient({
      chain: "studionet",
      account: walletAddress,
      provider: window.ethereum
    });

    statusElement.textContent =
      "Sending transaction to GenLayer...";

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
      `Transaction:\n${String(txHash)}`;

  } catch (error) {
    showError(error);
  }
});
