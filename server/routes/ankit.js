const express = require('express');
const { Web3 } = require('web3');
const dotenv = require('dotenv');
const router = express.Router();
dotenv.config();

const INFURA_URL = process.env.INFURA_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
const fromAddress = account.address;

web3.eth.accounts.wallet.add(account);

const contractABI = [
    {
        "constant": false,
        "inputs": [
            { "internalType": "uint256", "name": "itemId", "type": "uint256" },
            { "internalType": "uint256", "name": "rating", "type": "uint256" },
            { "internalType": "string", "name": "comment", "type": "string" }
        ],
        "name": "addReview",
        "outputs": [],
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }
        ],
        "name": "AntiqueDeleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
        ],
        "name": "AntiqueListedForSale",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "oldOwner", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
        ],
        "name": "AntiqueSold",
        "type": "event"
    },
    {
        "constant": false,
        "inputs": [
            { "internalType": "uint256", "name": "itemId", "type": "uint256" }
        ],
        "name": "buyAntique",
        "outputs": [],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "internalType": "uint256", "name": "itemId", "type": "uint256" }
        ],
        "name": "deleteAntique",
        "outputs": [],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "uint256", "name": "price", "type": "uint256" },
            { "internalType": "string", "name": "itemTitle", "type": "string" },
            { "internalType": "string", "name": "category", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "yearOfOrigin", "type": "uint256" },
            { "internalType": "string", "name": "condition", "type": "string" },
            { "internalType": "string", "name": "origin", "type": "string" },
            { "internalType": "bool", "name": "isAuthenticated", "type": "bool" }
        ],
        "name": "listAntique",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "antiqueIndex",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getAllAntiques",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "itemId", "type": "uint256" },
                    { "internalType": "string[]", "name": "reviews", "type": "string[]" },
                    { "internalType": "address[]", "name": "reviewers", "type": "address[]" },
                    { "internalType": "string", "name": "description", "type": "string" },
                    { "internalType": "string", "name": "category", "type": "string" },
                    { "internalType": "uint256", "name": "price", "type": "uint256" },
                    { "internalType": "address", "name": "owner", "type": "address" },
                    { "internalType": "string", "name": "itemTitle", "type": "string" },
                    { "internalType": "uint256", "name": "yearOfOrigin", "type": "uint256" },
                    { "internalType": "string", "name": "condition", "type": "string" },
                    { "internalType": "bool", "name": "isAuthenticated", "type": "bool" },
                    { "internalType": "bool", "name": "isDeleted", "type": "bool" },
                    { "internalType": "string", "name": "origin", "type": "string" }
                ],
                "internalType": "struct AntiqueMarketplace.Antique[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "type": "function"
    }
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

router.get('/antiques', async (req, res) => {
    try {
        const antiques = await contract.methods.getAllAntiques().call();
        
        const convertBigIntToString = (data) => {
            if (Array.isArray(data)) {
                return data.map(item => convertBigIntToString(item));
            } else if (typeof data === 'object' && data !== null) {
                return Object.fromEntries(
                    Object.entries(data).map(([key, value]) => [key, convertBigIntToString(value)])
                );
            } else if (typeof data === 'bigint') {
                return data.toString(); // Changed 'value' to 'data'
            }
            return data;
        };
        
        const formattedAntiques = convertBigIntToString(antiques);
        res.json(formattedAntiques);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Add a new antique
router.post('/antiques', async (req, res) => {
    try {
        const {
            owner,
            price,
            itemTitle,
            category,
            description,
            yearOfOrigin,
            condition,
            origin,
            isAuthenticated
        } = req.body;

        const gas = await contract.methods.listAntique(
            owner,
            price,
            itemTitle,
            category,
            description,
            yearOfOrigin,
            condition,
            origin,
            isAuthenticated
        ).estimateGas({ from: fromAddress });

        const result = await contract.methods.listAntique(
            owner,
            price,
            itemTitle,
            category,
            description,
            yearOfOrigin,
            condition,
            origin,
            isAuthenticated
        ).send({ from: fromAddress, gas });

        res.json({ success: true, transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buy an antique
router.post('/antiques/:id/buy', async (req, res) => {
    try {
        const { id } = req.params;
        const gas = await contract.methods.buyAntique(id).estimateGas({ from: fromAddress });
        const result = await contract.methods.buyAntique(id).send({ from: fromAddress, gas });
        res.json({ success: true, transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete an antique
router.delete('/antiques/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const gas = await contract.methods.deleteAntique(id).estimateGas({ from: fromAddress });
        const result = await contract.methods.deleteAntique(id).send({ from: fromAddress, gas });
        res.json({ success: true, transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a review
router.post('/antiques/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const gas = await contract.methods.addReview(id, rating, comment).estimateGas({ from: fromAddress });
        const result = await contract.methods.addReview(id, rating, comment).send({ from: fromAddress, gas });
        res.json({ success: true, transactionHash: result.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current antique index
router.get('/antique-index', async (req, res) => {
    try {
        const index = await contract.methods.antiqueIndex().call();
        res.json({ index });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;