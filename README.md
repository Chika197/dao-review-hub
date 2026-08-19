# DAO Review Hub

DAO Review Hub is a decentralized governance review application powered by a GenLayer Intelligent Contract.

## Overview

Users can connect a browser wallet, submit a DAO proposal and governance criteria, and send the request to the deployed GenLayer `DAOProposalReview` Intelligent Contract.

The contract evaluates the proposal using leader and validator consensus and stores the latest review result.

## Workflow

1. Connect a browser wallet.
2. Enter a DAO proposal.
3. Enter governance criteria.
4. Submit the proposal to the GenLayer Intelligent Contract.
5. Wait for the accepted transaction.
6. Read the latest review state.
7. Display the consensus result.

## GenLayer Integration

The frontend uses `genlayer-js` to interact with the deployed Intelligent Contract.

Contract address:

`0x2C65A746cE6C33d959BEBA2ABcD4E7F7df5d8459`

The application calls:

- `review_proposal` for proposal evaluation
- `get_status` for reading the latest result

## Technology

- GenLayer Intelligent Contracts
- genlayer-js
- TypeScript
- Vite
- Browser wallet

## Setup

```bash
npm install
npm run dev
```

The application is configured for GenLayer StudioNet.

## License

MIT
