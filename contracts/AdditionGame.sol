pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;
contract AdditionGame {
    address public owner;
    uint32 lengths = 128;
    
    bytes[]vote;
    mapping (uint32 => bytes) vote_map;
    event show_event(uint index,bytes sign_data);
    event show_all(bytes[]);
    constructor() public {
        owner = msg.sender;
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function deposit() public payable {  
        require(msg.sender == owner);
    }   
    function upload(string sign) public returns (bytes){
        vote.push(bytes(sign));
        emit show_event(vote.length-1,vote[vote.length-1]);
        return vote[vote.length-1];
    }
    function download_all() public returns(bytes[])
    {
        emit show_all(vote);
        return vote;
    }
    function download() public view returns(bytes[])
    {
        return vote;
    }
    function transfer(uint _value) public returns (bool) {
        require(getBalance() >= _value);
        msg.sender.transfer(_value);
        return true;
    }
}