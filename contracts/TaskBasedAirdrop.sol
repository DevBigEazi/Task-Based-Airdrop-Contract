// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.27;

import "./IToken.sol";

contract TaskBasedAirdrop {
    IERC20 public RQContract;

    address public admin;

    uint256 public immutable claimableReward = 20_000 * (10 ** 18);

    struct User {
        uint256 accumulatedPoints;
        uint16 numberOfTaskCompleted;
        uint256 tokenBalance;
    }

    struct Task {
        string description;
        uint256 points;
        uint256 expiredAt;
    }

    Task[] public tasks;

    mapping(address => User) users;

    mapping(address => mapping(uint16 => bool)) hasCompleted;

    constructor(address _rqContract) {
        require(msg.sender != address(0), "Zero address is not allowed");

        RQContract = IERC20(_rqContract);
        admin = msg.sender;
    }

    modifier OnlyAdmin() {
        require(msg.sender == admin, "Unauthorized");
        _;
    }

    //events
    event TaskAdded(string indexed _description, uint256 indexed _points);
    event TaskCompleted(
        uint256 indexed _accumulatedPoints,
        uint16 indexed _numberOfTaskCompleted
    );
    event PointsRedeemed(address indexed _claimer, uint256 _amountClaimed);

    function addTask(
        string memory _description,
        uint256 _points,
        uint256 _expiringAt
    ) external OnlyAdmin {
        require(msg.sender != address(0), "Zero address is not allowed");
        require(_expiringAt > 0, "Duration is too short");

        Task memory newTask;
        newTask.description = _description;
        newTask.points = _points;
        newTask.expiredAt = block.timestamp + _expiringAt;

        tasks.push(newTask);

        emit TaskAdded(newTask.description, newTask.points);
    }

    function completeTask(uint16 _index) external returns (bool) {
        require(msg.sender != address(0), "Zero address not allowed");
        require(_index < tasks.length, "Out of bound!");
        require(
            !hasCompleted[msg.sender][_index],
            "Oops! Task already completed by this user."
        );
        require(
            users[msg.sender].accumulatedPoints < 50,
            "You already have redeemable 50 or more points. you can claim again after redeeming your curent points."
        );

        Task storage currentTask = tasks[_index];

        require(block.timestamp < currentTask.expiredAt, "Inactive task");

        hasCompleted[msg.sender][_index] = true;

        users[msg.sender].accumulatedPoints += currentTask.points;
        users[msg.sender].numberOfTaskCompleted += 1;

        emit TaskCompleted(
            users[msg.sender].accumulatedPoints,
            users[msg.sender].numberOfTaskCompleted
        );

        return true;
    }

    function getTask(uint256 _index) external view returns (Task memory) {
        require(msg.sender != address(0), "Zero address not allowed!");

        require(_index < tasks.length, "Out of bound!");

        Task memory task = tasks[_index];

        return task;
    }

    function getAllTasks() external view returns (Task[] memory) {
        return tasks;
    }

    function getUserDetails()
        external
        view
        returns (
            uint256 accumulatedPoints_,
            uint16 numberOfTaskCompleted_,
            uint256 tokenBalance_
        )
    {
        require(msg.sender != address(0), "Zero address not allowed");

        accumulatedPoints_ = users[msg.sender].accumulatedPoints;
        numberOfTaskCompleted_ = users[msg.sender].numberOfTaskCompleted;
        tokenBalance_ = users[msg.sender].tokenBalance;
    }

    function redeemPointToClaimReward() external returns (bool) {
        require(msg.sender != address(0), "Zero address not allowed");
        require(
            users[msg.sender].accumulatedPoints >= 50,
            "Your points is not yet redeemable"
        );

        users[msg.sender].accumulatedPoints = users[msg.sender]
            .accumulatedPoints -= 50;

        RQContract.transfer(msg.sender, claimableReward);

        users[msg.sender].tokenBalance += claimableReward;

        emit PointsRedeemed(msg.sender, claimableReward);

        return true;
    }

    function getContractRQTokenBalance() external view returns (uint256) {
        return RQContract.balanceOf(address(this));
    }
}
