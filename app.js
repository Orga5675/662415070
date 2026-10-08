let provider;
let signer;
let contract;

const CONTRACT_ADDRESS = "0x8525A3DCa9334fEB6A7A454044d9F1B573517476";

const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false, "internalType": "string", "name": "batchId", "type": "string"},
            {"indexed": false, "internalType": "address", "name": "createdBy", "type": "address"}
        ],
        "name": "BatchCreated",
        "type": "event"
    },
    {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}],
        "name": "batches",
        "outputs": [
            {"internalType": "string", "name": "batchId", "type": "string"},
            {"internalType": "string", "name": "coffeeSource", "type": "string"},
            {"internalType": "string", "name": "matchaSource", "type": "string"},
            {"internalType": "string", "name": "productionDate", "type": "string"},
            {"internalType": "string", "name": "qcStatus", "type": "string"},
            {"internalType": "address", "name": "createdBy", "type": "address"},
            {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_batchId", "type": "string"},
            {"internalType": "string", "name": "_coffeeSource", "type": "string"},
            {"internalType": "string", "name": "_matchaSource", "type": "string"},
            {"internalType": "string", "name": "_productionDate", "type": "string"},
            {"internalType": "string", "name": "_qcStatus", "type": "string"}
        ],
        "name": "createBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "_batchId", "type": "string"}],
        "name": "getBatch",
        "outputs": [
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "address", "name": "", "type": "address"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

async function connectWallet() {
    if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
    }

    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();

        const address = await signer.getAddress();
        const network = await provider.getNetwork();

        document.getElementById("walletInfo").innerText =
            "Wallet: " + address;

        document.getElementById("networkInfo").innerText =
            "Network: " + network.name + " (Chain ID: " + network.chainId + ")";

        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );
    } catch (error) {
        console.error(error);
        alert("Failed to connect MetaMask.");
    }
}

async function createBatch() {
    if (!contract) {
        alert("Please connect MetaMask first.");
        return;
    }

    const batchId = document.getElementById("batchId").value.trim();
    const coffeeSource = document.getElementById("coffeeSource").value.trim();
    const matchaSource = document.getElementById("matchaSource").value.trim();
    const productionDate = document.getElementById("productionDate").value;
    const qcStatus = document.getElementById("qcStatus").value;
    const status = document.getElementById("transactionStatus");
    const button = document.getElementById("createBtn");

    if (!batchId || !coffeeSource || !matchaSource || !productionDate) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        button.disabled = true;
        status.innerText = "Waiting for MetaMask...";

        const tx = await contract.createBatch(
            batchId,
            coffeeSource,
            matchaSource,
            productionDate,
            qcStatus
        );

        status.innerText = "Transaction submitted. Waiting for confirmation...";
        await tx.wait();

        status.innerHTML =
            "✅ Transaction Confirmed!<br>" +
            "Transaction Hash:<br>" +
            "<code>" + tx.hash + "</code>";

    } catch (error) {
        console.error(error);
        status.innerText =
            error?.reason || error?.shortMessage || "❌ Transaction failed.";
    } finally {
        button.disabled = false;
    }
}

async function verifyBatch() {
    if (!contract) {
        alert("Please connect MetaMask first.");
        return;
    }

    const batchId = document.getElementById("searchBatchId").value.trim();

    if (!batchId) {
        alert("Please enter Batch ID.");
        return;
    }

    try {
        const result = await contract.getBatch(batchId);

        if (!result[0]) {
            document.getElementById("batchResult").innerText =
                "❌ Batch not found.";
            return;
        }

        document.getElementById("batchResult").innerHTML =
            "<strong>Batch ID:</strong> " + escapeHtml(result[0]) + "<br>" +
            "<strong>Coffee Source:</strong> " + escapeHtml(result[1]) + "<br>" +
            "<strong>Matcha Source:</strong> " + escapeHtml(result[2]) + "<br>" +
            "<strong>Production Date:</strong> " + escapeHtml(result[3]) + "<br>" +
            "<strong>QC Status:</strong> " + escapeHtml(result[4]) + "<br>" +
            "<strong>Created By:</strong> " + escapeHtml(result[5]) + "<br>" +
            "<strong>Created At:</strong> " +
            new Date(Number(result[6]) * 1000).toLocaleString();
    } catch (error) {
        console.error(error);
        document.getElementById("batchResult").innerText =
            error?.reason || error?.shortMessage || "❌ Batch not found.";
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return map[char];
    });
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("connectBtn")
        .addEventListener("click", connectWallet);

    document.getElementById("createBtn")
        .addEventListener("click", createBatch);

    document.getElementById("verifyBtn")
        .addEventListener("click", verifyBatch);
});
