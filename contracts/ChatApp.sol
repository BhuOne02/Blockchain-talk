// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract ChatApp {

    struct Friend {
        address pubkey;
        string name;
    }

    struct User {
        string name;
        Friend[] friendList;
        mapping(address => bool) isFriend;
    }

    struct Message {
        address sender;
        uint256 timestamp;
        string msg;
    }

    struct AllUserStruct {
        string name;
        address accountAddress;
    }

    AllUserStruct[] private allUsers;

    mapping(address => User) private users;
    mapping(bytes32 => Message[]) private allMessages;

    // Check if a user is already registered
    function checkUserExists(address pubkey) public view returns (bool) {
        return bytes(users[pubkey].name).length > 0;
    }

    // Create a new user account
    function createAccount(string calldata name) external {
        require(!checkUserExists(msg.sender), "User already exists");
        require(bytes(name).length > 0, "Username cannot be empty");

        

        users[msg.sender].name = name;
        allUsers.push(AllUserStruct(name, msg.sender));
    }

    // Retrieve the username of a given address
    function getUsername(address pubkey) external view returns (string memory) {
        require(checkUserExists(pubkey), "User not registered");
        return users[pubkey].name;
    }

    // Add a friend to the user's friend list
    function addFriend(address friendKey, string calldata friendName) external {
        require(checkUserExists(msg.sender), "Create an account first");
        require(checkUserExists(friendKey), "User is not registered");
        require(msg.sender != friendKey, "You can't add yourself");
        require(!users[msg.sender].isFriend[friendKey], "Already friends");

        _addFriend(msg.sender, friendKey, friendName);
        _addFriend(friendKey, msg.sender, users[msg.sender].name);
    }

    function _addFriend(address userAddr, address friendKey, string memory name) internal {
        users[userAddr].friendList.push(Friend(friendKey, name));
        users[userAddr].isFriend[friendKey] = true;
    }

    // Get the friend list of the caller
    function getMyFriendList() external view returns (Friend[] memory) {
        return users[msg.sender].friendList;
    }

    // Internal helper to get chat code
    function _getChatCode(address addr1, address addr2) internal pure returns (bytes32) {
        return addr1 < addr2
            ? keccak256(abi.encodePacked(addr1, addr2))
            : keccak256(abi.encodePacked(addr2, addr1));
    }

    // Send a message to a friend
    function sendMessage(address friendKey, string calldata _msg) external {
        require(checkUserExists(msg.sender), "Create an account first");
        require(checkUserExists(friendKey), "User not registered");
        require(users[msg.sender].isFriend[friendKey], "You are not friends");
        require(bytes(_msg).length > 0, "Message cannot be empty");

        bytes32 chatCode = _getChatCode(msg.sender, friendKey);
        allMessages[chatCode].push(Message(msg.sender, block.timestamp, _msg));
    }

    // Read messages from a friend
    function readMessage(address friendKey) external view returns (Message[] memory) {
        require(users[msg.sender].isFriend[friendKey], "Not friends with this user");
        bytes32 chatCode = _getChatCode(msg.sender, friendKey);
        return allMessages[chatCode];
    }

    // Get all registered users
    function getAllUsers() external view returns (AllUserStruct[] memory) {
        return allUsers;
    }
}
