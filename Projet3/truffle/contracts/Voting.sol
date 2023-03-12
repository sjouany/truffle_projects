// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/// @title A contract named Voting
/// @author Alyra
/// @notice Provide a voting contract
contract Voting is Ownable {

    /// @notice Id for winnning proposal
    uint winningProposalID;

    /// @notice Voter object definition
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /// @notice Proposal object definition
    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @notice Enumeration to manage different sates of voting
    enum  WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @notice Current Status for voting
    /// @dev public to be able to get the current status
    WorkflowStatus public workflowStatus;
    
    /// @notice Proposals array
    Proposal[] proposalsArray;

    /// @notice Mapping to link an address with a Voter
    mapping (address => Voter) voters;

    /// @notice Event emitted when a voter is registered
    /// @param voterAddress Address registered to the withelist
    event VoterRegistered(address voterAddress); 

    /// @notice Event emitted when the workflow status change
    /// @param previousStatus Previous status of the workflow
    /// @param newStatus New status of the workflow
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    /// @notice Event emitted when a new proposal is registered
    /// @param proposalId Proposal id for the new proposal registered 
    event ProposalRegistered(uint proposalId);

    /// @notice Event emitted when a voter do a vote
    /// @param voter Address for the voter
    /// @param proposalId Proposal id choosen by the voter  
    event Voted (address voter, uint proposalId);
    
    /// @notice Modifier to check that the user is whitelisted
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }
    
    /// @notice get a Voter details by adress. Only voter can do it.
    /// @param _addr Address for the voter
    /// @return a Voter
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }
    
    /// @notice get a proposal by id. Only voter can do it
    /// @param _id Proposal index in the array
    /// @return a proposal
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /// @notice Register a new address to the whitelist. Only owner can do it
    /// @param _addr Address to add to the whitelist
    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');
    
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }
 

    /// @notice Register a new proposal. Only voter can do it.
    /// @param _desc Proposal description
    function addProposal(string calldata _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer'); // facultatif
 
        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }


    /// @notice execute a vote. Only voter can do it
    /// @param _id Proposal id choosen by the voter
    /// @dev winning proposal id is computed after each vote
    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found'); 

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        if (proposalsArray[_id].voteCount > proposalsArray[winningProposalID].voteCount) {
            winningProposalID = _id;
        }

        emit Voted(msg.sender, _id);
    }

    /// @notice Set ProposalsRegistrationStarted status. A default GENESIS proposal is automatically created. Only contract owner can do it.
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        
        Proposal memory proposal;
        proposal.description = "GENESIS";
        proposalsArray.push(proposal);

        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @notice Set ProposalsRegistrationEnded status. Only contract owner can do it.
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @notice Set VotingSessionStarted status. Only contract owner can do it.
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @notice Set VotingSessionEnded status. Only contract owner can do it.
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /// @notice Count votes and find the winning proposal id. Only contract owner can do it.
    /// @dev Stored inside a contract variable to avoid to loop on the array many times during voters results consultation
   function tallyVotes() external onlyOwner {
       require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");    
       workflowStatus = WorkflowStatus.VotesTallied;
       emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    /// @notice Get winning proposal 
    /// @return winning proposal details
    function getWinningProposal()
        external
        view
        returns (Proposal memory)
    {
        require(owner() == msg.sender || voters[msg.sender].isRegistered, "you are neither the owner nor a voter");   
        require(workflowStatus == WorkflowStatus.VotesTallied, "Current status is not tallied vote");   
        return proposalsArray[winningProposalID];
    }
}