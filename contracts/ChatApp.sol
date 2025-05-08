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

    struct FriendRequestStruct {
        string name;
        address accountAddress;
    }

    AllUserStruct[] private allUsers;

    mapping(address => User) private users;
    mapping(bytes32 => Message[]) private allMessages;
    mapping(address => mapping(address => bool)) private friendRequests; // sender -> receiver

    event FriendRequestSent(address indexed from, address indexed to);
    event FriendRequestAccepted(address indexed from, address indexed to);


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

    function sendFriendRequest(address to, string calldata name) external {
        require(msg.sender != to, "Can't send request to yourself");
        require(checkUserExists(msg.sender), "You must create an account first");
        require(checkUserExists(to), "User does not exist");
        require(!friendRequests[msg.sender][to], "Request already sent");
        require(!users[msg.sender].isFriend[to], "Already friends");

        friendRequests[msg.sender][to] = true;

        // Optional: update name if not already set
        if (bytes(users[msg.sender].name).length == 0) {
            users[msg.sender].name = name;
        }

        emit FriendRequestSent(msg.sender, to);
    }


    function acceptFriendRequest(address from) external {
        require(friendRequests[from][msg.sender], "No request from this user");

        delete friendRequests[from][msg.sender];

        

        _addFriend(msg.sender, from, users[from].name);
        _addFriend(from, msg.sender, users[msg.sender].name);

        emit FriendRequestAccepted(from, msg.sender);
    }

function getPendingRequests() external view returns (FriendRequestStruct[] memory) {
    uint count;
    for (uint i = 0; i < allUsers.length; i++) {
        if (friendRequests[allUsers[i].accountAddress][msg.sender]) {
            count++;
        }
    }

    FriendRequestStruct[] memory pending = new FriendRequestStruct[](count);
    uint index = 0;

    for (uint i = 0; i < allUsers.length; i++) {
        address from = allUsers[i].accountAddress;
        if (friendRequests[from][msg.sender]) {
            pending[index] = FriendRequestStruct({
                name: users[from].name,
                accountAddress: from
            });
            index++;
        }
    }

    return pending;
}






}
