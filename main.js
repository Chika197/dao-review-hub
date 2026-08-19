import { createClient } from "https://esm.sh/genlayer-js";
import { studionet } from "https://esm.sh/genlayer-js/chains";
import { TransactionStatus } from "https://esm.sh/genlayer-js/types";

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
          typeof item === "bigint" ? item.toString() : item,
        2
      );
    }

    return String(value);
  } catch (error) {
    return String(value);
  }
}

function showError(error) {
  console.error(error);

  statusElement.textContent =
    formatValue(error) || "Unknown error.";

  resultElement.textContent = "";
}

connectButton.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Browser wallet not detected.");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No wallet account was returned.");
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
      throw new Error("Connect your wallet first.");
    }

    const proposalElement =
      document.getElementById("proposal");

    const criteriaElement =
      document.getElementById("criteria");

    const proposal =
      proposalElement.value.trim();

    const criteria =
      criteriaElement.value.trim();

    if (!proposal || !criteria) {
      throw new Error(
        "Proposal and criteria are required."
      );
    }

    statusElement.textContent =
      "Submitting proposal to GenLayer consensus...";

    resultElement.textContent = "";

    const client = createClient({
      chain: studionet,
      account: walletAddress,
      provider: window.ethereum
    });

    statusElement.textContent =
      "Sending transaction to GenLayer...";

    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "review_proposal",
      args: [proposal, criteria],
      value: BigInt(0)
    });

    statusElement.textContent =
      `Transaction submitted: ${formatValue(txHash)}`;

    resultElement.textContent =
      "Waiting for GenLayer consensus result...";

    const receipt =
      await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED
      });

    resultElement.textContent =
      formatValue(receipt);

    statusElement.textContent =
      "Proposal review completed.";
  } catch (error) {
    showError(error);
  }
});
