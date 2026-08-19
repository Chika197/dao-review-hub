import { createClient } from "https://esm.sh/genlayer-js";
import { studionet } from "https://esm.sh/genlayer-js/chains";

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

  if (
    Array.isArray(window.ethereum.providers) &&
    window.ethereum.providers.length > 0
  ) {
    /*
     * Prefer MetaMask.
     */
    const metamask =
      window.ethereum.providers.find(
        (provider) => provider.isMetaMask
      );

    if (metamask) {
      return metamask;
    }

    /*
     * Prefer ChainBox.
     * rdns = com.dataqin.simple
     */
    const chainBox =
      window.ethereum.providers.find(
        (provider) =>
          provider.isChainBox ||
          provider.rdns === "com.dataqin.simple" ||
          provider.info?.rdns === "com.dataqin.simple"
      );

    if (chainBox) {
      return chainBox;
    }

    /*
     * Fallback.
     */
    return window.ethereum.providers[0];
  }

  return window.ethereum;
}


/* =========================
   SWITCH TO STUDIONET
   ========================= */

async function switchToStudionet(provider) {
  const currentChainId =
    await provider.request({
      method: "eth_chainId"
    });

  if (currentChainId === STUDIONET_CHAIN_ID) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: STUDIONET_CHAIN_ID
        }
      ]
    });
  } catch (error) {
    /*
     * Chain not added to wallet.
     */
    if (error?.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: STUDIONET_CHAIN_ID,
          chainName: "GenLayer Studionet",
          nativeCurrency: {
            name: "GEN",
            symbol: "GEN",
            decimals: 18
          },
          rpcUrls: [
            "https://studio.genlayer.com/api"
          ],
          blockExplorerUrls: [
            "https://explorer-studio.genlayer.com"
          ]
        }
      ]
    });
  }
}


/* =========================
   CONNECT WALLET
   ========================= */

connectButton.addEventListener(
  "click",
  async () => {
    try {
      statusElement.textContent =
        "Detecting wallet...";

      const provider =
        getEthereumProvider();

      if (!provider) {
        throw new Error(
          "EVM browser wallet tidak ditemukan."
        );
      }

      walletProvider = provider;

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

      console.log(
        "Wallet chain:",
        chainId
      );

      if (chainId === STUDIONET_CHAIN_ID) {
        statusElement.textContent =
          "Wallet connected to GenLayer Studionet.";
      } else {
        statusElement.textContent =
          "Wallet connected. Klik Review Proposal.";
      }

    } catch (error) {
      showError(error);
    }
  }
);


/* =========================
   REVIEW PROPOSAL
   ========================= */

reviewButton.addEventListener(
  "click",
  async () => {
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
        "Checking GenLayer Studionet...";

      resultElement.textContent = "";

      /*
       * IMPORTANT:
       * Jangan gunakan client.connect().
       * Kita switch network langsung melalui
       * EIP-1193 wallet provider.
       *
       * Ini menghindari wallet_getSnaps.
       */

      await switchToStudionet(
        walletProvider
      );

      const finalChainId =
        await walletProvider.request({
          method: "eth_chainId"
        });

      if (finalChainId !== STUDIONET_CHAIN_ID) {
        throw new Error(
          `Wallet belum berada di GenLayer Studionet. Chain: ${finalChainId}`
        );
      }

      statusElement.textContent =
        "Sending proposal to GenLayer...";

      const client =
        createClient({
          chain: studionet,
          account: walletAddress,
          provider: walletProvider
        });

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

        console.warn(
          "Receipt polling failed:",
          receiptError
        );

        statusElement.textContent =
          "Transaction submitted. Check GenLayer Studio.";

        resultElement.textContent =
          `Transaction:\n${formatValue(txHash)}`;
      }

    } catch (error) {
      showError(error);
    }
  }
);
