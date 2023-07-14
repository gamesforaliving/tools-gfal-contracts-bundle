# Games for a Living (GFAL) Web3 Contract Bundle

Welcome to the Games for a Living (GFAL) Web3 Contract Bundle repository! This repository contains all the tests, deployment scripts and Solidity smart contracts implemented in the GFAL ecosystem.

## Overview

The GFAL ecosystem is built upon a suite of smart contracts that facilitate the creation, management, and exchange of gaming assets and resources. These contracts handle various aspects of the ecosystem, such as token management, marketplace transactions, and platform governance.

Our smart contracts are designed to be secure, efficient, and interoperable, ensuring seamless integration with other components of the GFAL ecosystem and the wider Ethereum network.

## Repository Structure

This repository is organized as follows:

/contracts: Contains the core Solidity smart contracts for the GFAL ecosystem.
/test: Contains unit tests for the smart contracts.
/scripts: Contains scripts to run deploys or submit transactions by command line

### Hardhat Project

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy-{scriptName}.js

//e.g
npx hardhat run .\scripts\utils\set-vesting-schedule-developers.js --network bsc
```
