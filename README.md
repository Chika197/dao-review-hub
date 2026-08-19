# DAO Review Hub

A static GitHub Pages frontend for a GenLayer-powered DAO proposal review workflow.

## Contract

DAOProposalReview:
`0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459`

## Frontend

The frontend connects to a browser wallet and uses `genlayer-js` from an ESM CDN.

Features:
- Wallet connection
- DAO proposal input
- Governance criteria input
- `review_proposal` contract interaction
- `get_status` result reading

## GitHub Pages

This version is designed to be served directly from the repository root using GitHub Pages `Deploy from a branch`.

No npm build step is required.
