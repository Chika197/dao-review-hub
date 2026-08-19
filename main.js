import { createClient } from "https://esm.sh/genlayer-js";

const CONTRACT_ADDRESS = "0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459";
const connectButton = document.getElementById("connect");
const reviewButton = document.getElementById("review");
const walletElement = document.getElementById("wallet");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");
let walletAddress = null;

connectButton.addEventListener("click", async () => {
  try {
    if (!window.ethereum) throw new Error("Browser wallet not detected.");
    const accounts = await window.ethereum.request({method:"eth_requestAccounts"});
    if (!accounts.length) throw new Error("No wallet account was returned.");
    walletAddress = accounts[0];
    walletElement.textContent = `Wallet: ${walletAddress}`;
    statusElement.textContent = "Wallet connected.";
  } catch (error) {
    statusElement.textContent = error instanceof Error ? error.message : String(error);
  }
});

reviewButton.addEventListener("click", async () => {
  try {
    if (!walletAddress) throw new Error("Connect your wallet first.");
    const proposal = document.getElementById("proposal").value.trim();
    const criteria = document.getElementById("criteria").value.trim();
    if (!proposal || !criteria) throw new Error("Proposal and criteria are required.");

    statusElement.textContent = "Submitting proposal to GenLayer consensus...";

    const client = createClient({
      chain: "studionet",
      account: walletAddress,
      provider: window.ethereum
    });

    await client.connect("studionet");

    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "review_proposal",
      args: [proposal, criteria],
      value: BigInt(0)
    });

    statusElement.textContent = `Transaction submitted: ${txHash}`;

    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_status",
      args: [],
      stateStatus: "accepted"
    });

    resultElement.textContent =
  typeof result === "string" ? result : JSON.stringify(result, null, 2);
    statusElement.textContent = "Proposal review request completed.";
  } catch (error) {
    statusElement.textContent = error instanceof Error ? error.message : String(error);
  }
});
