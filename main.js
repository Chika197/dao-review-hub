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

function showError(error) {
  console.error("DAO Review error:", error);

  statusElement.textContent =
    formatValue(error) || "Unknown error.";

  resultElement.textContent = "";
}


/* =========================
   CONNECT WALLET
   ========================= */

connectButton.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      throw new Error(
        "Browser wallet not detected."
      );
    }

    statusElement.textContent =
      "Connecting wallet...";

    const accounts =
      await window.ethereum.request({
        method: "eth_requestAccounts"
      });

    if (
      !accounts ||
      accounts.length === 0
    ) {
      throw new Error(
        "No wallet account was returned."
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


/* =========================
   REVIEW DAO PROPOSAL
   ========================= */

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
      "Preparing GenLayer transaction...";

    resultElement.textContent = "";

    const client = createClient({
      chain: studionet,
      account: walletAddress,
      provider: window.ethereum
    });

    statusElement.textContent =
      "Sending proposal to GenLayer...";

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
      `Transaction:\n${formatValue(txHash)}\n\nWaiting for GenLayer consensus...`;

    /*
     * Wait for the transaction using the
     * generic receipt method. We deliberately
     * do not import TransactionStatus so that
     * the browser module remains compatible.
     */

    let receipt;

    try {
      receipt =
        await client.waitForTransactionReceipt({
          hash: txHash
        });
    } catch (receiptError) {
      console.warn(
        "Receipt wait error:",
        receiptError
      );

      resultElement.textContent =
        `Transaction submitted:\n${formatValue(txHash)}\n\n` +
        `The transaction was submitted, but the receipt could not be read yet.`;
    }

    if (receipt) {
      resultElement.textContent =
        `Transaction:\n${formatValue(txHash)}\n\n` +
        `Receipt:\n${formatValue(receipt)}`;
    }

    statusElement.textContent =
      "Proposal review transaction completed.";
  } catch (error) {
    showError(error);
  }
});
