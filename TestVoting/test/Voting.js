const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Voting', accounts => {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const voter3 = accounts[3];
    const voter_not_registered = accounts[4];

    let VotingInstance;

    describe("test state ProposalsRegistrationStarted", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
        });

        it("should set ProposalsRegistrationStarted state", async () => {
            await VotingInstance.startProposalsRegistering({from: owner})
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(1));
        });

        it("should not set ProposalsRegistrationStarted state (not Owner)", async () => {
            await expectRevert(VotingInstance.startProposalsRegistering({from: voter1}), 'Ownable: caller is not the owner');
        });

        it("should not set ProposalsRegistrationStarted state (no compliant previous state)", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            // try to start Proposal registering period already launched
            await expectRevert(VotingInstance.startProposalsRegistering({from: owner}), 'Registering proposals cant be started now');
        });

        it("should emit event WorkflowStatusChange", async () => {
            expectEvent(await VotingInstance.startProposalsRegistering({from: owner}), "WorkflowStatusChange", {previousStatus: new BN(0), newStatus: new BN(1)});
        });

        it("should initialize a proposal Genesis", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            const proposal = await VotingInstance.getOneProposal(0, {from: voter1});
            expect(proposal.description).to.equal("GENESIS");
        });
 
    });

    describe("test state ProposalsRegistrationEnded", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
            await VotingInstance.startProposalsRegistering({from: owner});
        });

        it("should set ProposalsRegistrationEnded state", async () => {
            await VotingInstance.endProposalsRegistering({from: owner})
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(2));
        });
    
        it("should not set ProposalsRegistrationEnded state (not Owner)", async () => {
             await expectRevert(VotingInstance.endProposalsRegistering({from: voter1}), 'Ownable: caller is not the owner');
        });
    
        it("should not set ProposalsRegistrationEnded state (no compliant previous state)", async () => {
             await VotingInstance.endProposalsRegistering({from: owner});
             //try to Close Proposal registering period already closed
             await expectRevert(VotingInstance.endProposalsRegistering({from: owner}), 'Registering proposals havent started yet');
        });
    
        it("should emit event WorkflowStatusChange", async () => {
             expectEvent(await VotingInstance.endProposalsRegistering({from: owner}), "WorkflowStatusChange", {previousStatus: new BN(1), newStatus: new BN(2)});
        });

    });

    describe("test state startVotingSession", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
        });

        it("should set VotingSessionStarted state", async () => {
            await VotingInstance.startVotingSession({from: owner})
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(3));
        });
    
        it("should not set VotingSessionStarted state (not Owner)", async () => {
             await expectRevert(VotingInstance.startVotingSession({from: voter1}), 'Ownable: caller is not the owner');
        });
    
        it("should not set VotingSessionStarted state (no compliant previous state)", async () => {
             await VotingInstance.startVotingSession({from: owner});
             //try to start a Voting session already started
             await expectRevert(VotingInstance.startVotingSession({from: owner}), 'Registering proposals phase is not finished');
        });
    
        it("should emit event WorkflowStatusChange", async () => {
             expectEvent(await VotingInstance.startVotingSession({from: owner}), "WorkflowStatusChange", {previousStatus: new BN(2), newStatus: new BN(3)});
        });

    });  

    describe("test state endVotingSession", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner})
        });

        it("should set endVotingSession state", async () => {
            await VotingInstance.endVotingSession({from: owner})
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(4));
        });
    
        it("should not set endVotingSession state (not Owner)", async () => {
             await expectRevert(VotingInstance.endVotingSession({from: voter1}), 'Ownable: caller is not the owner');
        });
    
        it("should not set endVotingSession state (no compliant previous state)", async () => {
             await VotingInstance.endVotingSession({from: owner});
             //try to close a Voting session already closed
             await expectRevert(VotingInstance.endVotingSession({from: owner}), 'Voting session havent started yet');
        });
    
        it("should emit event WorkflowStatusChange", async () => {
             expectEvent(await VotingInstance.endVotingSession({from: owner}), "WorkflowStatusChange", {previousStatus: new BN(3), newStatus: new BN(4)});
        });

    });  

    describe("test state VotesTallied", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner})
            await VotingInstance.endVotingSession({from: owner})
        });

        it("should set endVotingSession state", async () => {
            await VotingInstance.tallyVotes({from: owner})
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(5));
        });
    
        it("should not set endVotingSession state (not Owner)", async () => {
             await expectRevert(VotingInstance.tallyVotes({from: voter1}), 'Ownable: caller is not the owner');
        });
    
        it("should not set endVotingSession state (no compliant previous state)", async () => {
             await VotingInstance.tallyVotes({from: owner});
             //try to tally Votes already tallied
             await expectRevert(VotingInstance.tallyVotes({from: owner}), 'Current status is not voting session ended');
        });
    
        it("should emit event WorkflowStatusChange", async () => {
             expectEvent(await VotingInstance.tallyVotes({from: owner}), "WorkflowStatusChange", {previousStatus: new BN(4), newStatus: new BN(5)});
        });

    });  

    describe("test registration", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should add and get a voter", async () => {
            await VotingInstance.addVoter(voter1, {from: owner});
            const _voter = await VotingInstance.getVoter(voter1, {from: voter1});
            expect(_voter.isRegistered).to.be.true;
            expect(_voter.hasVoted).to.be.false;
            expect(_voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });

        it("should get a voter not whitelisted", async () => {
            await VotingInstance.addVoter(voter1, {from: owner});
            const _voter = await VotingInstance.getVoter(voter_not_registered, {from: voter1});
            expect(_voter.isRegistered).to.be.false;
            expect(_voter.hasVoted).to.be.false;
            expect(_voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });
    
        it("should not add a voter (not Owner)", async () => {
            await expectRevert (VotingInstance.addVoter(voter1, {from: voter2}), 'Ownable: caller is not the owner');
        });

        it("should not get a voter (not Voter)", async () => {
            await expectRevert (VotingInstance.getVoter(voter1, {from: voter_not_registered}), "You're not a voter");
        });    
        
        it("should not add a voter (already registered)", async () => {
            await VotingInstance.addVoter(voter1, {from: owner});
            await expectRevert (VotingInstance.addVoter(voter1, {from: owner}), 'Already registered');
        });

        it("should not add a voter (state not compliant)", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert (VotingInstance.addVoter(voter1, {from: owner}), 'Voters registration is not open yet');
        });

        it("should emit event VoterRegistered", async () => {
            expectEvent(await VotingInstance.addVoter(voter1, {from: owner}), "VoterRegistered", {voterAddress:voter1});
       });
     });  

    describe("test proposal", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
        });

        it("should add and get proposal", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Proposal for test", {from: voter1});
            const _proposal = await VotingInstance.getOneProposal(1, {from: voter1});
            expect(_proposal.description).to.equal("Proposal for test");
            expect(_proposal.voteCount).to.be.bignumber.equal(new BN(0));
        });

        it("should not add proposal (state not compliant)", async () => {
            await expectRevert (VotingInstance.addProposal("Proposal for test", {from: voter1}), "Proposals are not allowed yet");
        });

        it("should not add proposal (empty)", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert (VotingInstance.addProposal("", {from: voter1}), "Vous ne pouvez pas ne rien proposer");
        });

        it("should not add proposal (not Voter)", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert (VotingInstance.addProposal("", {from: voter_not_registered}), "You're not a voter");
        });     
        
        it("should emit event ProposalRegistered", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            expectEvent(await VotingInstance.addProposal("Proposal for test", {from: voter1}), "ProposalRegistered", {proposalId: new BN(1)});
       });
    });  

    describe("test vote", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1);
            await VotingInstance.addVoter(voter2);
            await VotingInstance.addVoter(voter3);
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Proposal1 for test", {from: voter1});
            await VotingInstance.addProposal("Proposal2 for test", {from: voter2});
            await VotingInstance.endProposalsRegistering({from: owner});
        });

        it("should add a vote", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(2, {from: voter1});
            const _proposal = await VotingInstance.getOneProposal(2, {from: voter1});
            expect(_proposal.description).to.equal("Proposal2 for test");
            expect(_proposal.voteCount).to.be.bignumber.equal(new BN(1));
        });

        it("should not add a vote (state not compliant)", async () => {
            await expectRevert (VotingInstance.setVote(2, {from: voter1}), "Voting session havent started yet");
        });

        it("should not add a vote (already voted)", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(2, {from: voter1});
            await expectRevert (VotingInstance.setVote(1, {from: voter1}), "You have already voted");
        });

        it("should not add a vote (not Voter)", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert (VotingInstance.setVote(1, {from: voter_not_registered}), "You're not a voter");
        });

        it("should not add a vote (proposal choosen not valid)", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert (VotingInstance.setVote(6, {from: voter1}), "Proposal not found");
        });

        it("should emit event Voted", async () => {
            await VotingInstance.startVotingSession({from: owner});
            expectEvent(await VotingInstance.setVote(1, {from: voter1}), "Voted", {voter: voter1, proposalId: new BN(1)});
        });

        it("should update voter informations after vote", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(2, {from: voter1});
            const _voter = await VotingInstance.getVoter(voter1, {from: voter1});
            expect(_voter.isRegistered).to.be.true;
            expect(_voter.hasVoted).to.be.true;
            expect(_voter.votedProposalId).to.be.bignumber.equal(new BN(2));
        });

        it("should set the winning proposal", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(2, {from: voter1});
            await VotingInstance.setVote(2, {from: voter2});
            await VotingInstance.endVotingSession({from: owner});
            await VotingInstance.tallyVotes({from: owner});
            expect(await VotingInstance.winningProposalID.call()).to.be.bignumber.equal(new BN(2));
        });
    });

});