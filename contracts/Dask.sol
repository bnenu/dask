//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Dask is ReentrancyGuard, Pausable {
  address public admin;

  using Counters for Counters.Counter;
  Counters.Counter private _taskIds;
  Counters.Counter private _claimIds;

  uint256 public feePercent;
  uint256 public feeBase;
  uint256 public fees;

  enum Status {
    NEW,
    ASSIGNED,
    STARTED,
    CANCELLED,
    SUSPENDED,
    COMPLETED
  }

  enum ClaimResolution {
    OPEN,
    APPROVED,
    DENIED,
    DISPUTE
  }

  struct Task {
    uint256 id;
    string name;
    string description;
    uint256 reward;
    Status status;
    address payable owner;
    address payable assignee;
    uint256 completeUntil;
    uint256 createdAt;
    uint256 completedAt;
    bool paid;
  }

  struct Claim {
    uint256 id;
    uint256 taskId;
    uint256 amount;
    bool resolved;
    ClaimResolution resolution;
  }

  mapping(uint256 => Task) private idToTask;
  mapping(string => uint256) private hashToTask;
  mapping(uint256 => mapping(address => bool)) public completed;
  mapping(uint256 => Claim) private idToClaim;
  mapping(uint256 => mapping(address => uint256[])) public claims;

  mapping(address => uint[]) public tasksByMember;
  mapping(address => uint[]) public claimsByMember;

  event TaskCreated(
    uint id,
    string name,
    string description,
    uint256 reward,
    address owner,
    uint256 createdAt
  );

  event TaskAssigned(
    uint id,
    address owner,
    address assignee
  );

  event TaskCancelled(
    uint id
  );

  event TaskCompleted(
    uint id
  );

  constructor(uint256 _feePercent, uint256 _feeBase) {
    require(_feePercent > 0, "fee percent invalid");
    require(_feeBase > 0, "fee base invalid");
    admin = msg.sender;
    feePercent = _feePercent;
    feeBase = _feeBase;
  }

  // Modifiers and helpers
  modifier _onlyAdmin() {
    require(msg.sender == admin, "only admin allowed");
    _;
  }

  modifier _onlyTaskOwner(uint256 _taskId) {
    require(idToTask[_taskId].owner == msg.sender, "only task owner");
    _;
  }

  modifier _onlyAssignee(uint256 _taskId) {
    require(idToTask[_taskId].assignee == msg.sender, "only task assignee");
    _;
  }

  modifier _onlyMembers(uint256 _taskId) {
    Task storage task = idToTask[_taskId];
    require(
      msg.sender == task.owner || msg.sender == task.assignee,
      "only task members"
    );
    _;
  }

  modifier _onlyNew(uint256 _taskId) {
    require(idToTask[_taskId].status == Status.NEW, "only new tasks");
    _;
  }

  function calculateFee(uint256 amount) public view returns (uint256) {
    return (amount * feePercent) / feeBase;
  }

  // Admin functions
  function transferOwnership(address _newAdmin) external _onlyAdmin {
    admin = _newAdmin;
  }

  function updateFees(uint256 _feePercent, uint256 _feeBase)
    external
    _onlyAdmin
    whenNotPaused
  {
    require(_feePercent > 0, "fee percent invalid");
    require(_feeBase > 0, "fee base invalid");
    feePercent = _feePercent;
    feeBase = _feeBase;
  }

  function takeFees(uint256 amount)
    external
    _onlyAdmin
    nonReentrant
    whenNotPaused
  {
    require(amount > 0, "must give an amount");
    require(fees >= amount, "amount too large");

    fees -= amount;
    (bool sent, ) = msg.sender.call{ value: amount }("");
    require(sent, "Transfer failed!");
  }

  function refund(
    uint256 amount,
    uint256 _taskId,
    address member
  ) public _onlyAdmin nonReentrant {
    Task storage task = idToTask[_taskId];
    require(task.paid == false, "task already paid");
    require(task.reward >= amount, "refund is too large");
    require(
      task.owner == member || task.assignee == member,
      "only task members"
    );

    task.reward -= amount;
    (bool sent, ) = payable(member).call{ value: amount }("");
    require(sent, "Transfer failed!");
  }

  function pauseContract() external _onlyAdmin {
    _pause();
  }

  function unpauseContract() external _onlyAdmin {
    _unpause();
  }

  // Getters
  function fetchTaskByHash(string memory _hash)
    external
    view
    returns (Task memory)
  {
    return idToTask[hashToTask[_hash]];
  }

  function fetchTaskById(uint256 _taskId) external view returns (Task memory) {
    return idToTask[_taskId];
  }

  function fetchTasksByMember(address _member) external view returns(Task[] memory) {
    Task[] memory _tasks = new Task[](tasksByMember[_member].length);
    for (uint256 i = 0; i < tasksByMember[_member].length; i++) {
      uint id = tasksByMember[_member][i];
      _tasks[i] = Task(
        id,
        idToTask[id].name,
        idToTask[id].description,
        idToTask[id].reward,
        idToTask[id].status,
        idToTask[id].owner,
        idToTask[id].assignee,
        idToTask[id].completeUntil,
        idToTask[id].createdAt,
        idToTask[id].completedAt,
        idToTask[id].paid
      );
    }
     return _tasks;
  }

  function fetchClaimById(uint _claimId) external view returns (Claim memory) {
    return idToClaim[_claimId];
  }

  // Setters
  function createTask(
    string memory _name,
    string memory _hash,
    uint256 _completeUntil
  ) public payable whenNotPaused {
    require(msg.value > 0, "reward can't be zero");
    
    _taskIds.increment();
    uint256 taskId = _taskIds.current();
    Task storage task = idToTask[taskId];
    task.id = taskId;
    task.name = _name;
    task.description = _hash;
    task.reward = msg.value;
    task.status = Status.NEW;
    task.owner = payable(msg.sender);
    task.completeUntil = _completeUntil;
    task.createdAt = block.timestamp;
    hashToTask[_hash] = taskId;
    tasksByMember[msg.sender].push(taskId);
    // emit TaskCreated

    emit TaskCreated(
      taskId,
      _name,
      _hash,
      msg.value,
      msg.sender,
      block.timestamp
    );
  }

  function assignTask(uint256 _taskId, address _assignee)
    public
    _onlyTaskOwner(_taskId)
    _onlyNew(_taskId)
    whenNotPaused
  {
    Task storage task = idToTask[_taskId];

    task.assignee = payable(_assignee);
    task.status = Status.ASSIGNED;
    tasksByMember[_assignee].push(task.id);
    // emit TaskAssigned;

    emit TaskAssigned(
      task.id,
      task.owner,
      _assignee
    );
  }

  function cancelTask(uint256 _taskId)
    public
    _onlyTaskOwner(_taskId)
    _onlyNew(_taskId)
    whenNotPaused
  {
    Task storage task = idToTask[_taskId];

    task.status = Status.CANCELLED;

    // emit TaskCancelled;
  }

  function completeTask(uint256 _taskId)
    public
    _onlyMembers(_taskId)
    whenNotPaused
  {
    Task storage task = idToTask[_taskId];
    require(
      task.status == Status.STARTED || task.status == Status.ASSIGNED,
      "task must be in progress"
    );
    require(
      completed[_taskId][msg.sender] == false,
      "completion already requested"
    );

    completed[_taskId][msg.sender] = true;
    if (completed[_taskId][task.owner] && completed[_taskId][task.assignee]) {
      task.completedAt = block.timestamp;
      task.status = Status.COMPLETED;

      // emit TaskCompleted
    }
  }

  function takeReward(uint256 _taskId)
    public
    _onlyAssignee(_taskId)
    nonReentrant
    whenNotPaused
  {
    Task storage task = idToTask[_taskId];
    require(task.status == Status.COMPLETED, "task must be completed");
    require(task.paid == false, "task already paid");

    uint256 fee = calculateFee(task.reward);
    uint256 amount = task.reward - fee;

    fees += fee;
    task.paid = true;
    task.reward = 0;
    (bool sent, ) = msg.sender.call{ value: amount }("");
    require(sent, "Transfer failed!");
  }

  function recallReward(uint256 _taskId)
    public
    _onlyTaskOwner(_taskId)
    nonReentrant
    whenNotPaused
  {
    Task storage task = idToTask[_taskId];
    require(task.status == Status.CANCELLED, "task must be cancelled");
    require(task.paid == false, "task already paid");

    uint256 amount = task.reward;
    task.paid = true;
    task.reward = 0;
    (bool sent, ) = msg.sender.call{ value: amount }("");
    require(sent, "Transfer failed!");
  }

  function raiseClaim(uint256 _taskId, uint256 _amount)
    external
    _onlyMembers(_taskId)
  {
    Task storage task = idToTask[_taskId];
    require(task.paid == false, "task already paid");
    require(task.reward >= _amount, "claim to high");

    uint256 alreadyClaimed = 0;

    for (uint256 i = 0; i < claims[_taskId][msg.sender].length; i++) {
      uint id = claims[_taskId][msg.sender][i];
      alreadyClaimed += idToClaim[id].amount;
    }

    require((task.reward - alreadyClaimed) >= _amount, "claim to high");

    _claimIds.increment();
    uint256 claimId = _claimIds.current();

    Claim storage claim = idToClaim[claimId];
    claim.id = claimId;
    claim.taskId = _taskId;
    claim.amount = _amount;
    claim.resolved = false;
    claim.resolution = ClaimResolution.OPEN;

    claims[_taskId][msg.sender].push(claimId);
  }

  function settleClaim(
    uint256 _taskId,
    address _member,
    uint256 _claimId,
    ClaimResolution _resolution
  ) external _onlyAdmin nonReentrant whenNotPaused {
    Task storage task = idToTask[_taskId];
    require(
      task.owner == _member || task.assignee == _member,
      "resolve for only task members"
    );

    Claim storage claim = idToClaim[_claimId];
    require(claim.resolved == false, "already resolved");
    require(claim.resolution == ClaimResolution.OPEN, "only open claims");

    if (_resolution == ClaimResolution.APPROVED) {
      uint256 fee = calculateFee(claim.amount);
      uint256 amount = claim.amount - fee;
      fees += fee;
      task.reward -= claim.amount;
      claim.resolved = true;
      claim.resolution = ClaimResolution.APPROVED;

      (bool sent, ) = payable(_member).call{ value: amount }("");
      require(sent, "Transfer failed!");
    }

    if (_resolution == ClaimResolution.DENIED) {
      claim.resolved = true;
      claim.resolution = ClaimResolution.DENIED;
    }

    if (_resolution == ClaimResolution.DISPUTE) {
      claim.resolution = ClaimResolution.DISPUTE;
    }
  }
}
