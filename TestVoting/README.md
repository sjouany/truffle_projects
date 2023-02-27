# Voting Contract Tests

This repository contains tests for the Voting contract using Truffle (Mocha testing framework and Chai) and OpenZeppelin Test Helpers.

## Prerequisites

Before running the tests, you need to have Truffle and Ganache installed. 

## Installation

You can clone this repository and install the dependencies:


    git clone https://github.com/sjouany/truffle_projects.git
    cd TestVoting
    npm install

## Usage
In a terminal launch ganache to start a local blockchain

    ganache

In another terminal launch tests execution

    truffle test

## Tests

Different tests are implemented to check implementation of Voting contract:
- Tests about different States and transitions:
    - ProposalsRegistrationStarted
    - ProposalsRegistrationEnded
    - VotingSessionStarted
    - VotingSessionEnded
    - VotesTallied
- Tests about different Actions allowed by the contract
    - Registration
    - Proposal
    - Vote

