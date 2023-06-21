//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

contract SmartBankAccount {
    address owner;
    uint256 public balance = owner.balance;
    uint256 public transactionValue;
    address public receiver;
    uint256 public balanceRecieved;

    constructor() {
        owner = msg.sender;
    }

    function withdrawToOwner(uint256 _transactionValue) public payable {
        payable(owner).transfer(_transactionValue);
    }

    function deposit() public payable {
        balanceRecieved += msg.value;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawAllToOwner() public {
        payable(owner).transfer(getContractBalance());
    }

    receive() external payable {}

    function withdrawToOther(uint256 _transactionValue, address _other)
        public
        payable
    {
        require(
            msg.sender == owner,
            "You are not the owner of this wallet you can't Withdraw money from here"
        );
        require(msg.sender.balance >= _transactionValue, "Insufficent funds!");
        payable(_other).transfer(_transactionValue);
    }


}