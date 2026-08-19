import {
  encodeFunctionData
} from "https://esm.sh/viem";

const CONTRACT_ADDRESS =
  "0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459";

const STUDIONET_CHAIN_ID = "0xf22f";
const STUDIONET_RPC = "https://studio.genlayer.com/api";

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
   ERROR
   ========================= */

function showError(error) {
  console.error(
    "DAO Review Error:",
    error
  );

  statusElement.textContent =
    formatValue(error) ||
    "Unknown error.";

  resultElement.textContent = "";
}


/* =========================
   CHECK TRANSACTION STATUS
   ========================= */

async function getTransactionStatus(txHash) {

  const response = await fetch(
    STUDIONET_RPC,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        jsonrpc: "2.0",

        method:
          "gen_getTransactionStatus",

        params: [
          {
            txId: txHash
          }
        ],

        id: Date.now()
      })
    }
  );


  if (!response.ok) {
    throw new Error(
      `GenLayer RPC error: HTTP ${response.status}`
    );
  }


  const data =
    await response.json();


  if (data.error) {
    throw new Error(
      data.error.message ||
      "Unable to read transaction status."
    );
  }


  if (!data.result) {
    throw new Error(
      "GenLayer RPC returned no transaction status."
    );
  }


  return data.result;
}


/* =========================
   WAIT FOR CONSENSUS
   ========================= */

async function waitForConsensus(txHash) {

  const maxAttempts = 200;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    let transaction;

    try {

      transaction =
        await getTransactionStatus(
          txHash
        );

    } catch (error) {

      console.error(
        "Failed to check GenLayer status:",
        error
      );

      statusElement.textContent =
        "Unable to read GenLayer status. Retrying...";

      await new Promise(
        resolve =>
          setTimeout(resolve, 3000)
      );

      continue;
    }


    const status =
      transaction?.status;


    const statusCode =
      transaction?.statusCode;


    console.log(
      "GenLayer transaction:",
      transaction
    );


    /* =====================
       FINALIZED
       ===================== */

    if (
      status === "FINALIZED" ||
      statusCode === 7
    ) {

      statusElement.textContent =
        "✅ Review finalized by GenLayer.";

      resultElement.textContent =
        `Transaction:\n${txHash}\n\n` +
        "Status: FINALIZED\n\n" +
        "The DAO proposal review was successfully completed.";

      return;
    }


    /* =====================
       ACCEPTED
       ===================== */

    if (
      status === "ACCEPTED" ||
      statusCode === 5
    ) {

      statusElement.textContent =
        "GenLayer: consensus accepted. Waiting for finalization...";

      resultElement.textContent =
        `Transaction:\n${txHash}\n\n` +
        "Status: ACCEPTED\n\n" +
        "Waiting for finalization...";

    }


    /* =====================
       PENDING
       ===================== */

    else if (
      status === "PENDING" ||
      statusCode === 1
    ) {

      statusElement.textContent =
        "GenLayer: transaction pending...";

    }


    /* =====================
       PROPOSING
       ===================== */

    else if (
      status === "PROPOSING" ||
      statusCode === 2
    ) {

      statusElement.textContent =
        "GenLayer: proposing...";

    }


    /* =====================
       COMMITTING
       ===================== */

    else if (
      status === "COMMITTING" ||
      statusCode === 3
    ) {

      statusElement.textContent =
        "GenLayer: validators committing...";

    }


    /* =====================
       REVEALING
       ===================== */

    else if (
      status === "REVEALING" ||
      statusCode === 4
    ) {

      statusElement.textContent =
        "GenLayer: validators revealing...";

    }


    /* =====================
       READY TO FINALIZE
       ===================== */

    else if (
      status === "READY_TO_FINALIZE" ||
      statusCode === 11
    ) {

      statusElement.textContent =
        "GenLayer: ready for finalization...";

    }


    /* =====================
       FAILED STATES
       ===================== */

    else if (
      status === "CANCELED" ||
      status === "LEADER_TIMEOUT" ||
      status === "VALIDATORS_TIMEOUT"
    ) {

      throw new Error(
        `Transaction ended with status: ${status}`
      );

    }


    /* =====================
       UNKNOWN
       ===================== */

    else {

      statusElement.textContent =
        `GenLayer status: ${
          status || "UNKNOWN"
        }`;

    }


    await new Promise(
      resolve =>
        setTimeout(resolve, 3000)
    );
  }


  throw new Error(
    "Consensus belum selesai setelah sekitar 10 menit. Cek transaksi di GenLayer Explorer."
  );
}


/* =========================
   CONNECT WALLET
   ========================= */

connectButton.addEventListener(
  "click",
  async () => {

    try {

      statusElement.textContent =
        "Connecting wallet...";


      if (!window.ethereum) {

        throw new Error(
          "Browser wallet tidak ditemukan."
        );

      }


      /*
       * Gunakan provider wallet yang aktif.
       * Tidak menggunakan wallet_getSnaps.
       */

      walletProvider =
        window.ethereum;


      const accounts =
        await walletProvider.request({
          method:
            "eth_requestAccounts"
        });


      if (
        !accounts ||
        accounts.length === 0
      ) {

        throw new Error(
          "Wallet account tidak ditemukan."
        );

      }


      walletAddress =
        accounts[0];


      walletElement.textContent =
        `Wallet: ${walletAddress}`;


      const chainId =
        await walletProvider.request({
          method:
            "eth_chainId"
        });


      if (
        chainId ===
        STUDIONET_CHAIN_ID
      ) {

        statusElement.textContent =
          "Wallet connected to GenLayer Studionet.";

      }

      else {

        statusElement.textContent =
          `Wallet connected. Chain: ${chainId}`;

      }

    }

    catch (error) {

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

      if (
        !walletAddress ||
        !walletProvider
      ) {

        throw new Error(
          "Connect your wallet first."
        );

      }


      const proposalElement =
        document.getElementById(
          "proposal"
        );


      const criteriaElement =
        document.getElementById(
          "criteria"
        );


      if (
        !proposalElement ||
        !criteriaElement
      ) {

        throw new Error(
          "Proposal atau criteria tidak ditemukan."
        );

      }


      const proposal =
        proposalElement.value.trim();


      const criteria =
        criteriaElement.value.trim();


      if (
        !proposal ||
        !criteria
      ) {

        throw new Error(
          "Proposal and criteria are required."
        );

      }


      const chainId =
        await walletProvider.request({
          method:
            "eth_chainId"
        });


      if (
        chainId !==
        STUDIONET_CHAIN_ID
      ) {

        throw new Error(
          `Wallet belum di GenLayer Studionet. Chain sekarang: ${chainId}`
        );

      }


      statusElement.textContent =
        "Preparing transaction...";


      resultElement.textContent =
        "";


      const abi = [

        {
          type:
            "function",

          name:
            "review_proposal",

          stateMutability:
            "nonpayable",

          inputs: [

            {
              name:
                "proposal",

              type:
                "string"
            },

            {
              name:
                "criteria",

              type:
                "string"
            }

          ],

          outputs: []

        }

      ];


      const data =
        encodeFunctionData({

          abi,

          functionName:
            "review_proposal",

          args: [
            proposal,
            criteria
          ]

        });


      statusElement.textContent =
        "Waiting for wallet confirmation...";


      const txHash =
        await walletProvider.request({

          method:
            "eth_sendTransaction",

          params: [

            {

              from:
                walletAddress,

              to:
                CONTRACT_ADDRESS,

              data:
                data,

              value:
                "0x0"

            }

          ]

        });


      statusElement.textContent =
        "Transaction submitted.";

      resultElement.textContent =
        `Transaction:\n${txHash}\n\n` +
        "Checking GenLayer consensus...";


      await waitForConsensus(
        txHash
      );

    }

    catch (error) {

      showError(error);

    }

  }
);
