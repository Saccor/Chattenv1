// components/Chat.js
import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import {
  fetchConversations,
  createConversation,
  sendMessage,
  fetchUsers,
  fetchCurrentUser,
  fetchMessages,
  deleteConversation,
  blockUser,
  unblockUser,
} from '../services/api';
import './Chat.css';

const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://saccoschatt.onrender.com';
const socket = io(serverUrl, { withCredentials: true });

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllConversations = useCallback(() => {
    fetchConversations(searchTerm).then(response => {
      const updatedConversations = response.data.map(conv => ({
        ...conv,
        isActive: false,
        flash: false,
      }));
      setConversations(updatedConversations);
    }).catch(error => console.error('Error fetching conversations:', error));
  }, [searchTerm]);

  useEffect(() => {
    fetchCurrentUser().then(response => {
      if (response.isAuthenticated) {
        setCurrentUserId(response.user._id);
        setCurrentUserName(response.user.name);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login';
      }
      setIsLoadingCurrentUser(false);
    }).catch(error => {
      console.error('Error fetching current user:', error);
      setIsLoadingCurrentUser(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoadingCurrentUser) {
      fetchAllConversations();
      fetchUsers().then(response => {
        setUsers(response.data);
      }).catch(error => console.error('Error fetching users:', error));
    }
  }, [fetchAllConversations, isLoadingCurrentUser]);

  useEffect(() => {
    const handleMessageReceived = message => {
      setConversations(prevConversations => {
        let updatedConversations = prevConversations.map(conv => {
          if (conv._id === message.conversationId) {
            return { ...conv, isActive: true, lastMessage: message, flash: true };
          }
          return conv;
        });

        // If the conversation does not exist in the list, fetch and add it
        if (!updatedConversations.some(conv => conv._id === message.conversationId)) {
          fetchAllConversations();
        }

        // Ensure the conversation with the new message appears at the top
        updatedConversations = updatedConversations.map(conv => {
          if (conv._id === message.conversationId) {
            return { ...conv, lastMessage: message };
          }
          return conv;
        });

        return updatedConversations.sort((a, b) => new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp));
      });

      if (message.conversationId === activeConversation?._id) {
        setMessages(prevMessages => [...prevMessages, {
          ...message,
          senderName: message.senderId === currentUserId ? 'You' : message.senderId.name,
        }]);
      }
    };

    socket.on('messageReceived', handleMessageReceived);

    return () => {
      socket.off('messageReceived', handleMessageReceived);
      if (activeConversation) {
        socket.emit('leaveConversation', activeConversation._id);
      }
    };
  }, [activeConversation, fetchAllConversations, currentUserId]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id).then(response => {
        const messagesWithSenderNames = response.data.map(message => ({
          ...message,
          senderName: message.senderId === currentUserId ? 'You' : message.senderId.name,
        }));
        setMessages(messagesWithSenderNames);
      }).catch(error => console.error('Error fetching messages:', error));

      socket.emit('joinConversation', activeConversation._id);
    }
  }, [activeConversation, currentUserId]);

  const handleSelectUser = userId => {
    setSelectedUserId(userId);
    if (!currentUserId || isLoadingCurrentUser) {
      return;
    }

    const existingConversation = conversations.find(c =>
      c.participants.sort().join(',') === [currentUserId, userId].sort().join(',') &&
      c.participants.length === 2
    );

    if (existingConversation) {
      setActiveConversation(existingConversation);
    } else if (userId !== currentUserId) {
      createConversation([currentUserId, userId]).then(response => {
        setActiveConversation(response.data);
        setConversations(prevConversations => [...prevConversations, response.data]);
        setMessages([]);
      }).catch(error => {
        console.error('Error starting new conversation:', error);
      });
    } else {
      alert("Cannot create a conversation with yourself. Please select a different user.");
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && activeConversation) {
      const messageToSend = {
        senderId: currentUserId,
        text: newMessage,
        conversationId: activeConversation._id,
        timestamp: new Date().toISOString(),
      };
      sendMessage(activeConversation._id, newMessage).then(() => {
        socket.emit('newMessage', messageToSend);
        setMessages(prevMessages => [...prevMessages, {
          ...messageToSend,
          senderName: 'You',
        }]);
        setNewMessage('');
        setConversations(prevConversations => {
          let updatedConversations = prevConversations.map(conv => {
            if (conv._id === activeConversation._id) {
              return { ...conv, lastMessage: messageToSend, flash: true };
            }
            return conv;
          });

          // Ensure the conversation with the new message appears at the top
          updatedConversations = updatedConversations.map(conv => {
            if (conv._id === activeConversation._id) {
              return { ...conv, lastMessage: messageToSend };
            }
            return conv;
          });

          return updatedConversations.sort((a, b) => new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp));
        });
      }).catch(error => {
        console.error('Error sending message:', error);
      });
    }
  };

  const handleSearchChange = event => {
    setSearchTerm(event.target.value.toLowerCase());
    fetchAllConversations();
  };

  const handleDeleteConversation = (conversationId) => {
    deleteConversation(conversationId)
      .then(() => {
        setConversations(conversations.filter(conv => conv._id !== conversationId));
        setActiveConversation(null);
        setMessages([]);
      })
      .catch(error => {
        console.error('Error deleting conversation:', error);
        alert('An error occurred while trying to delete the conversation.');
      });
  };

  const handleBlockUser = (userId) => {
    blockUser(userId)
      .then(() => {
        alert('User blocked successfully');
        // Optionally, you can also update the UI to reflect the blocked status
      })
      .catch(error => {
        console.error('Error blocking user:', error);
        alert('An error occurred while trying to block the user.');
      });
  };

  const handleUnblockUser = (userId) => {
    unblockUser(userId)
      .then(() => {
        alert('User unblocked successfully');
        // Optionally, you can also update the UI to reflect the unblocked status
      })
      .catch(error => {
        console.error('Error unblocking user:', error);
        alert('An error occurred while trying to unblock the user.');
      });
  };

  const getConversationDisplayName = (conv) => {
    const otherParticipants = conv.participantNames.filter(name => name !== currentUserName);
    return `Conversation with ${otherParticipants.join(', ')}`;
  };

  const isUserBlocked = (userId) => {
    const user = users.find(user => user._id === userId);
    return user ? user.blockedUsers.includes(currentUserId) : false;
  };

  return (
    <div className="chat-container">
      {isLoadingCurrentUser ? (
        <p>Loading user information...</p>
      ) : (
        <div className="chat-inner">
          <div className="sidebar">
            <input
              type="text"
              placeholder="Search Conversations..."
              onChange={handleSearchChange}
              className="search-input"
            />
            <div className="conversation-list">
              {conversations.map(conv => (
                <div
                  key={conv._id}
                  className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''} ${conv.isActive ? 'conversation-active' : ''} ${conv.flash ? 'flash' : ''}`}
                  onAnimationEnd={() => {
                    setConversations(prevConversations => prevConversations.map(c => c._id === conv._id ? { ...c, flash: false } : c));
                  }}
                >
                  <div onClick={() => setActiveConversation(conv)}>
                    {getConversationDisplayName(conv)}
                    <div className="timestamp">
                      {conv.lastMessage ? new Date(conv.lastMessage.timestamp).toLocaleString() : 'No Messages'}
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button onClick={() => handleDeleteConversation(conv._id)} className="delete-button">Delete</button>
                    {!isUserBlocked(conv.participants.find(id => id !== currentUserId)) ? (
                      <button onClick={() => handleBlockUser(conv.participants.find(id => id !== currentUserId))} className="block-button">Block</button>
                    ) : (
                      <button onClick={() => handleUnblockUser(conv.participants.find(id => id !== currentUserId))} className="unblock-button">Unblock</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="main-content">
            <select value={selectedUserId} onChange={e => handleSelectUser(e.target.value)} className="user-select">
              <option value="">Select a user to chat</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
            {activeConversation && (
              <>
                <div className="message-area">
                  {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.senderId._id === currentUserId ? 'message-sender' : 'message-recipient'}`}>
                      {msg.senderId._id === currentUserId ? 'You' : msg.senderName}: {msg.text}
                    </div>
                  ))}
                </div>
                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                    className="message-input"
                  />
                  <button onClick={handleSendMessage} className="send-button">Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
