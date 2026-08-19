import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT_ADDRESS =
  "0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459";

const connectButton = document.getElementById("connect")!;
const reviewButton = document.getElementById("review")!;
const walletElement = document.getElementById("wallet")!;
const statusElement = document.getElementById("status")!;
const resultElement = document.getElementById("result")!;

let walletAddress: `0x${string}` | null = null;

const readClient = createClient({
  chain: studionet
});

connectButton.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Browser wallet not detected.");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    }) as string[];

    if (!accounts.length) {
      throw new Error("No wallet account was returned.");
    }

    walletAddress = accounts[0] as `0x${string}`;

    walletElement.textContent =
      `Wallet: ${walletAddress}`;

    statusElement.textContent =
      "Wallet connected.";
  } catch (error) {
    statusElement.textContent =
      error instanceof Error ? error.message : String(error);
  }
});

reviewButton.addEventListener("click", async () => {
  try {
    if (!walletAddress) {
      throw new Error("Connect your wallet first.");
    }

    const proposal =
      (document.getElementById("proposal") as HTMLTextAreaElement).value;

    const criteria =
      (document.getElementById("criteria") as HTMLTextAreaElement).value;

    if (!proposal.trim() || !criteria.trim()) {
      throw new Error("Proposal and criteria are required.");
    }

    statusElement.textContent =
      "Submitting proposal to GenLayer consensus...";

    const writeClient = createClient({
      chain: studionet,
      account: walletAddress,
      provider: window.ethereum
    });

    await writeClient.connect("studionet");

    const txHash = await writeClient.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "review_proposal",
      args: [proposal, criteria],
      value: BigInt(0)
    });

    statusElement.textContent =
      `Transaction submitted: ${txHash}`;

    const receipt =
      await readClient.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED
      });

    if (
      receipt.txExecutionResultName !==
      "FINISHED_WITH_RETURN"
    ) {
      throw new Error(
        `Contract execution failed: ${receipt.txExecutionResultName}`
      );
    }

    const result = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_status",
      args: [],
      stateStatus: "accepted"
    });

    resultElement.textContent =
      JSON.stringify(result, null, 2);

    statusElement.textContent =
      "Proposal reviewed successfully by GenLayer.";
  } catch (error) {
    statusElement.textContent =
      error instanceof Error ? error.message : String(error);
  }
});
