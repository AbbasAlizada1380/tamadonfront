import React, { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import axios from "axios";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import { BiMessageAdd } from "react-icons/bi";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { TbArrowBackUp } from "react-icons/tb";
import { IoArrowBackCircle } from "react-icons/io5";
import { IoMdArrowRoundBack } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import moment from "moment-jalaali";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const MessagingComponent = ({ setIsMessagingOpen }) => {
  const secretKey = "TET4-1"; // Use a strong secret key
  const decryptData = (hashedData) => {
    if (!hashedData) {
      console.error("No data to decrypt");
      return null;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

  const [userId, setUserId] = useState(decryptData(localStorage.getItem("id")));
  const [conversation, setconversation] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msg, setmsg] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [lastMessage, setLastMessage] = useState([]);
  const [lastMsgConver, setLastMsgConver] = useState({});
  const [Msg, setMsg] = useState([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [newMessageMode, setNewMessageMode] = useState(false); // Toggle new message form
  const [recipientId, setRecipientId] = useState(""); // For selecting recipient
  const [newMessageContent, setNewMessageContent] = useState(""); // New message content
  const [conversationMode, setConversationMode] = useState(false); // Conversation
  const [users, setUsers] = useState([]);
  const [lastSenderMessages, setLastSenderMessages] = useState([]);
  const [finalMessages, setFinalMessages] = useState([]);
  const [senderId, setSenderId] = useState();
  const [unreadMsg, setUnreadMsg] = useState([]);
  const [sortedUnreadMsg, setSortedUnreadMsg] = useState([]);

  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);

  //last messages from me to any account
  const fetchLastSenderMessages = async () => {
    const senderId = decryptData(localStorage.getItem("id")); // Retrieve the id from localStorage

    if (!senderId) {
      setError("Sender ID not found in localStorage.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/users/message/sender/${senderId}/`
      );

      setLastSenderMessages(response.data); // Save the fetched data to state
    } catch (error) {
      setError("Error fetching messages: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const SortMessages = (messages) => {
    if (messages && messages.length > 0) {
      const senderCounts = messages.reduce((acc, msg) => {
        acc[msg.sender] = (acc[msg.sender] || 0) + 1;
        return acc;
      }, {});
      setSortedUnreadMsg(senderCounts);
    } else {
      setSortedUnreadMsg([]);
    }
  };

  const fetchUnreadMsg = async () => {
    try {
      const authToken = decryptData(localStorage.getItem("auth_token"));
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(
        `${BASE_URL}/users/unread/?receiver_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUnreadMsg(response.data.unread_messages);
      SortMessages(response.data.unread_messages);
    } catch (error) {
      if (error.status == 404) {
        setUnreadMsg([]);
        SortMessages(unreadMsg);
      }
      console.error("Failed to fetch unread users:", error);
      return null;
    }
  };

  const getMessageCount = (key) => {
    return sortedUnreadMsg[key] || null;
  };

  useEffect(() => {
    fetchUnreadMsg();
    // const interval = setInterval(() => {
    //   fetchUnreadMsg();
    // }, 3000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLastSenderMessages();
  }, []); // Empty dependency array ensures it runs only once

  const getLastMessage = async (senderId, receiverId) => {
    try {
      const apiUrl = `${BASE_URL}/users/get-message/${senderId}/${receiverId}/`;
      const response = await axios.get(apiUrl);

      // Assuming the response is an array of messages
      if (response.data && response.data.length > 0) {
        return response.data[response.data.length - 1].message; // Return the last message
      }
      return "No messages found."; // Fallback if no messages exist
    } catch (error) {
      console.error("Error fetching the last message:", error.message);
      return "Error fetching the last message.";
    }
  };
  const handleReply = async (message) => {
    if (!replyMessage.trim()) return;
    const token = decryptData(localStorage.getItem("auth_token"));

    const originalMessage = message;
    if (!originalMessage) {
      console.error("Original message not found");
      return;
    }
    try {
      const response = await axios.post(
        `${BASE_URL}/users/send-message/`,
        {
          sender:
            originalMessage.sender === userId
              ? originalMessage.sender
              : originalMessage.receiver,
          receiver:
            originalMessage.receiver === userId
              ? originalMessage.sender
              : originalMessage.receiver,
          message: replyMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Reply sent successfully", response.data);
      getMessages(response.data.receiver);
      setReplyMessage("");
      setReplyTo(null);
      fetchMessages();
      fetchLastSenderMessages();
    } catch (error) {
      console.error("Error sending reply", error);
    }
  };
  const lastMessageRef = useRef(null); // Ref for the last message
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView();
    }
  }, [conversation]);
  //get the last message of each conversation
  const getLastReceivedMessage = (conversation, userId) => {
    setLastMsgConver(
      [...conversation].find((message) => message.receiver === userId) || null
    );
  };

  //update isread properties of messages
  const updateMessageReadStatus = async (lastMsgConver) => {
    try {
      let sender_id = lastMsgConver.sender;
      let receiver_id = lastMsgConver.receiver;
      let message_id = lastMsgConver.id;

      const authToken = decryptData(localStorage.getItem("auth_token")); // Get token from localStorage

      if (!authToken) {
        console.error("Authentication token is missing.");
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/users/update-message-read-status/`,
        { sender_id, receiver_id, message_id },
        {
          headers: {
            Authorization: `Bearer ${authToken}`, // Send token in Authorization header
            "Content-Type": "application/json",
          },
        }
      );
      fetchUnreadMsg();
      return response.data;
    } catch (error) {
      console.error(
        "Error updating message read status:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    if (conversationMode) {
      getLastReceivedMessage(conversation, userId);
      updateMessageReadStatus(lastMsgConver);
    }
  }, [conversation]);

  const handleSendNewMessage = async () => {
    if (!newMessageContent.trim() || !recipientId) return;

    const token = decryptData(localStorage.getItem("auth_token"));
    try {
      const response = await axios.post(
        `${BASE_URL}/users/send-message/`,
        {
          sender: userId,
          receiver: recipientId,
          message: newMessageContent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewMessageMode(false);
      setNewMessageContent("");
      setFinalMessages((prevMessages) => [...prevMessages, response.data]);

      setRecipientId("");
    } catch (error) {
      console.error("Error sending new message", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const token = decryptData(localStorage.getItem("auth_token"));

    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/users/api/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data.filter((user) => user.id !== userId));

      setLoading(false);
      setError("");
    } catch (err) {
      setError("Error fetching users.");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // taking incoming messages for a special receiver
  const fetchMessages = async () => {
    const token = decryptData(localStorage.getItem("auth_token"));

    if (!token) {
      console.error("Token is expired or not available.");
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/users/message/${userId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages", error);
      setError("خطا در دریافت پیام‌ها");
    }
  };
  useEffect(() => {
    fetchMessages();
    // const intervalId = setInterval(fetchMessages, 2000);

    // return () => clearInterval(intervalId);
  }, []);

  // getting messages for conversation mode
  const getMessages = async (senderId) => {
    setSenderId(senderId);
    try {
      // Read receiver_id from local storage
      const receiverId = decryptData(localStorage.getItem("id"));

      // Validate that receiver_id exists
      if (!receiverId) {
        throw new Error("Receiver ID not found in local storage.");
      }
      // Construct the API URL
      const apiUrl = `${BASE_URL}/users/get-message/${senderId}/${receiverId}/`;
      // Fetch data from the API
      const response = await axios.get(apiUrl);

      // Parse the response JSON
      setconversation(response.data);
    } catch (error) {
      console.error("Error in getMessages:", error.message);
      throw error;
    }
  };
  // useEffect(() => {
  //   if (senderId !== null) {
  //     // Fetch messages immediately
  //     getMessages(senderId);
  //     // Set up the interval
  //     const intervalId = setInterval(() => {
  //       getMessages(senderId);
  //     }, 2000);

  //     // Cleanup interval on component unmount or senderId change
  //     return () => clearInterval(intervalId);
  //   }
  // }, [senderId]);

  // useEffect(()=>{

  // },[])

  // getting messages for exractin last message
  const fetchLastMessage = async () => {
    if (!msg || !msg.sender) return; // Return early if msg or msg.sender is empty
    const message = await getLastMessage(msg.sender, userId);
    setLastMessage(message);
  };
  useEffect(() => {
    fetchLastMessage();
  }, [msg, userId]); // Ensure dependencies are complete

  useEffect(() => {
    if (messages.length > 0) {
      setmsg(messages[0]); // Example logic to set initial state once
    }
  }, [messages]);
  const mixMessages = () => {
    // Combine both states
    const allMessages = [...messages, ...lastSenderMessages];
    // Remove duplicates and keep the latest message
    const uniqueMessages = allMessages.reduce((acc, curr) => {
      // Check if there's already a message with the same sender/receiver pair
      const existingIndex = acc.findIndex(
        (msg) =>
          (msg.sender === curr.sender && msg.receiver === curr.receiver) ||
          (msg.sender === curr.receiver && msg.receiver === curr.sender)
      );

      if (existingIndex !== -1) {
        // Compare dates to keep the latest message
        if (new Date(curr.date) > new Date(acc[existingIndex].date)) {
          acc[existingIndex] = curr;
        }
      } else {
        // Add the message if no duplicate exists
        acc.push(curr);
      }

      return acc;
    }, []);

    // Sort the messages by date in descending order
    uniqueMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFinalMessages(uniqueMessages);
  };
  useEffect(() => {
    mixMessages();
    // const interval = setInterval(() => {
    //   mixMessages();
    //   fetchMessages();
    //   fetchLastMessage();
    //   fetchLastSenderMessages();
    // }, 2000); // Run every 2 seconds

    // Clear the interval when the component unmounts
    // return () => clearInterval(interval);
  }, [messages, lastSenderMessages]); // Re-run whenever messages or lastSenderMessages change

  const getUserData = async (userId, setSelectedUserInfo) => {
    try {
      const response = await fetch(`${BASE_URL}/users/api/users/${userId}/`);
      const data = await response.json();

      setSelectedUserInfo(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Function to open the user info popup
  const openUserInfoPopup = async (user) => {
    await getUserData(user.id, setSelectedUserInfo);

    setSelectedUserInfo((prev) => ({
      ...prev,
      profile_pic: user.profile_pic,
    }));
    setShowUserInfoPopup(true);
  };

  // Function to close the user info popup
  const closeUserInfoPopup = () => {
    setShowUserInfoPopup(false);
    setSelectedUserInfo(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      {!conversationMode ? (
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6 relative">
          <button
            onClick={() => setIsMessagingOpen(false)}
            className="absolute top-2 right-2 rounded-md text-gray-200 bg-gray-700 hover:text-white hover:bg-gray-900 text-xl"
          >
            <FaTimes />
          </button>

          <h2 className="text-2xl font-bold text-center mb-4">پیام‌رسانی</h2>

          {loading && <p className="text-center">در حال بارگذاری پیام‌ها...</p>}
          {!newMessageMode && (
            <>
              <div className="mb-4 max-h-[430px] overflow-y-auto border p-3 rounded-lg">
                {finalMessages.length > 0 ? (
                  finalMessages.map((msg) => (
                    <div
                      onClick={() => {
                        setConversationMode(true);
                        getMessages(
                          msg.sender !== userId ? msg.sender : msg.receiver
                        );
                      }}
                      key={msg.id}
                      className="p-2 bg-gray-100 rounded mb-2 relative"
                    >
                      {/* Date */}
                      <span className="absolute top-2 left-2 text-xs text-gray-500">
                        {moment(msg.date).format("jYYYY/jMM/jDD")}
                      </span>

                      {/* Sender Info */}
                      <div
                        className="flex items-center mb-1 cursor-pointer" // Added cursor-pointer
                        onClick={() => {
                          // Determine which user's info to show
                          const userToShow =
                            msg.sender === userId
                              ? msg.receiver_profile
                              : msg.sender_profile;
                          openUserInfoPopup(userToShow);
                        }}
                      >
                        <img
                          src={
                            msg.sender === userId
                              ? msg.receiver_profile.profile_pic
                              : msg.sender_profile.profile_pic
                          }
                          alt={<CgProfile />}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <span className="font-bold text-gray-700">
                          {msg.sender === userId
                            ? msg.receiver_profile.full_name
                            : msg.sender_profile.full_name}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="text-xs text-gray-500 mb-2 ml-10 w-full flex justify-between items-center">
                        <span>
                          {" "}
                          {new Date(msg.date).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className=" text-[#007e31] rounded-full text-center font-bold">
                          {getMessageCount(
                            msg.sender === userId
                              ? msg.receiver_profile.id
                              : msg.sender_profile.id
                          )}
                          {getMessageCount(
                            msg.sender === userId
                              ? msg.receiver_profile.id
                              : msg.sender_profile.id
                          ) > 0 && "پیام جدید  "}
                        </span>
                      </div>

                      {/* Message Content */}

                      <p className="text-gray-800">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    هیچ پیامی موجود نیست
                  </p>
                )}
              </div>
              <button
                onClick={() => setNewMessageMode(true)}
                className="absolute left-2 top-5 bg-green text-white p-2 rounded-full hover:bg-green-600 transition shadow-lg"
              >
                <BiMessageAdd size={18} className="text-xl" />
              </button>
            </>
          )}

          {newMessageMode && (
            <div className="mt-4 space-y-3 ">
              <div className="flex justify-end">
                <button
                  className="flex items-center gap-x-2 hover:bg-blue-700 bg-blue-500 px-3 py-1 rounded-lg"
                  onClick={() => setNewMessageMode((prev) => !prev)}
                >
                  <span className="font-semibold text-white">back</span>
                  <span className="text-white">
                    <IoMdArrowRoundBack size={22} />
                  </span>
                </button>
              </div>
              <select
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
              >
                <option value="" disabled>
                  انتخاب گیرنده
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name + " " + user.last_name}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full p-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="2"
                placeholder="پیام خود را اینجا بنویسید..."
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
              ></textarea>
              <button
                onClick={handleSendNewMessage}
                className="mt-2 w-full text-white py-1 rounded-lg hover:bg-blue-700 bg-blue-500 transition"
              >
                ارسال پیام
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-1 bg-white max-h-[430px] overflow-y-auto rounded-lg shadow-lg w-11/12 max-w-md relative">
          {/* Header */}
          <div className="bg-blue-600 rounded p-2 gap-2 flex items-center mb-4 sticky top-0 z-10">
            {conversation.length > 0 ? (
              <>
                {/* WRAP IMAGE AND NAME IN A DIV WITH ONCLICK */}
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => {
                    // Determine which user's info to show
                    const userToShow =
                      conversation[0]?.sender === userId
                        ? conversation[0].receiver_profile
                        : conversation[0].sender_profile;
                    openUserInfoPopup(userToShow);
                  }}
                >
                  <img
                    src={
                      conversation[0]?.sender === userId
                        ? conversation[0].receiver_profile.profile_pic
                        : conversation[0].sender_profile.profile_pic
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <span className="text-lg font-semibold">
                    {conversation[0]?.sender === userId
                      ? conversation[0].receiver_profile.full_name
                      : conversation[0].sender_profile.full_name}
                  </span>
                </div>
              </>
            ) : (
              <p>مشخصات ارسال کننده در دسترس نیست</p>
            )}
            <button
              onClick={() => {
                setConversationMode(false);
                setSenderId(null);
              }}
              className="absolute top-3 z-20 left-2 content-center text-xl"
            >
              <IoArrowBackCircle size={28} />
            </button>
          </div>
          {/* {getLastReceivedMessage(conversation, userId)} */}
          {/* Messages (Reversed Order) */}
          {[...conversation].reverse().map((message, index) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender === userId ? "justify-end" : "justify-start"
              }`}
            >
              {/* {console.log(message)} */}
              <div
                ref={index === conversation.length - 1 ? lastMessageRef : null} // Add the ref to the first message in the reversed order (i.e., the most recent)
                className={`p-3 rounded-lg ${
                  message.sender === userId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                } max-w-sm`}
              >
                {/* Sender's Profile */}
                {message.sender !== userId && (
                  <div className="flex items-center mb-2">
                    <img
                      src={message.sender_profile.profile_pic}
                      alt={`${message.sender_profile.full_name}'s profile`}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-sm font-semibold">
                      {message.sender_profile.full_name}
                    </span>
                  </div>
                )}
                {/* Message Content */}
                {/* Receiver's Profile */}
                {message.sender === userId && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm font-semibold">
                      {conversation[0]?.sender_profile?.full_name}
                    </span>
                    <img
                      src={conversation[0]?.sender_profile?.profile_pic}
                      alt={`${conversation[0]?.receiver_profile?.full_name}'s profile`}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs mt-1 text-right">
                  {new Date(message.date).toLocaleString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <p>{message.message}</p>
              </div>
            </div>
          ))}
          {/* write Messages*/}

          <div className="bg-blue-600 rounded p-2 gap-2 flex items-center mb-4 sticky top-0 z-10">
            <textarea
              className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="1"
              placeholder="پیام خود را بنویسید..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
            ></textarea>
            <button
              onClick={() => handleReply(conversation[0])}
              className="ml-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition"
            >
              <FaPaperPlane size={16} />
            </button>
          </div>
        </div>
      )}

      {/* User Info Popup */}
      {showUserInfoPopup && selectedUserInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-center mb-4">
              <img
                src={selectedUserInfo.profile_pic}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
              />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-center">
              اطلاعات کاربر
            </h2>
            <div className="mb-4">
              <strong>ایمیل:</strong> {selectedUserInfo.email}
            </div>
            <div className="mb-4">
              <strong>نام:</strong> {selectedUserInfo.first_name}{" "}
              {selectedUserInfo.last_name}
            </div>{" "}
            <div className="mb-4">
              <strong>رول:</strong> {selectedUserInfo.role_display}
            </div>
            <div className="flex justify-center">
              <button
                onClick={closeUserInfoPopup}
                className="bg-green hover:bg-blue-green text-white font-bold py-2 px-4 rounded"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingComponent;
