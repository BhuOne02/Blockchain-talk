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

    struct ImageMessage {
        address sender;
        uint256 timestamp;
        string ipfsHash;
    }

    struct Group {
        string   name;
        address  admin;            // creator
        address[] members;         // group members incl. admin
        mapping(address => bool) isMember;
    }

    struct GroupMessage {
        address  sender;
        uint256  timestamp;
        string   msg;
    }
    

    AllUserStruct[] private allUsers;

    mapping(address => User) private users;
    mapping(bytes32 => Message[]) private allMessages;
    mapping(address => mapping(address => bool)) private friendRequests; // sender -> receiver
    uint256 private nextGroupId;                         // auto-increment id
    mapping(uint256 => Group)          private groups;   // id ⇒ Group
    mapping(uint256 => GroupMessage[]) private gMessages;// id ⇒ msgs
    mapping(address => uint256[])      private myGroups; // user ⇒ ids
    mapping(bytes32 => ImageMessage[]) public imageMessages;


    event FriendRequestSent(address indexed from, address indexed to);
    event FriendRequestAccepted(address indexed from, address indexed to);
    event GroupCreated(uint256 indexed groupId, string name, address[] members);
    event GroupMessageSent(uint256 indexed groupId, address indexed sender, string msg);


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

 /* ────────────────  GROUP CHAT LOGIC  ──────────────── */

    /// create a group with given friends (must already be friends!)
    function createGroup(string calldata _name, address[] calldata _members) external {
        require(bytes(_name).length > 0, "Group name empty");
        require(_members.length > 0, "No members supplied");

        uint256 gid = nextGroupId++;
        Group storage g = groups[gid];
        g.name  = _name;
        g.admin = msg.sender;

        // add admin first
        g.members.push(msg.sender);
        g.isMember[msg.sender] = true;

        // add each supplied friend
        for (uint i; i < _members.length; i++) {
            address m = _members[i];
            require(users[msg.sender].isFriend[m], "All members must be friends");
            if (!g.isMember[m]) {
                g.members.push(m);
                g.isMember[m] = true;
            }
        }

        // book-keeping for quick lookup
        for (uint i; i < g.members.length; i++) {
            myGroups[g.members[i]].push(gid);
        }

        emit GroupCreated(gid, _name, g.members);
    }

    /// anyone in the group can send a message
    function sendGroupMessage(uint256 gid, string calldata _msg) external {
        require(groups[gid].isMember[msg.sender], "Not a member");
        require(bytes(_msg).length > 0, "Empty message");

        gMessages[gid].push(GroupMessage(msg.sender, block.timestamp, _msg));
        emit GroupMessageSent(gid, msg.sender, _msg);
    }

    /// read all msgs in a group (must be a member)
    function readGroupMessages(uint256 gid) external view returns (GroupMessage[] memory) {
        require(groups[gid].isMember[msg.sender], "Not a member");
        return gMessages[gid];
    }

    /// helper to list groups the caller belongs to
    function getMyGroups() external view returns (uint256[] memory) {
        return myGroups[msg.sender];
    }

    /// helper to view group meta (name & member list)
    function getGroupInfo(uint256 gid) external view returns (string memory, address[] memory) {
        require(groups[gid].isMember[msg.sender], "Not a member");
        Group storage g = groups[gid];
        return (g.name, g.members);
    }

    function sendImageMessage(address to, string calldata ipfsHash) external {
        require(checkUserExists(msg.sender), "Register first");
        require(users[msg.sender].isFriend[to], "Not friends");

        bytes32 chatCode = _getChatCode(msg.sender, to);
        imageMessages[chatCode].push(ImageMessage(msg.sender, block.timestamp, ipfsHash));
}




}
