import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import {
  fetchConversations,
  createConversation,
  sendMessage,
  fetchUsers,
  fetchCurrentUser,
  fetchMessages
} from '../services/api';
import './Chat.css';

const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://saccoschatt.onrender.com';

const socket = io(serverUrl, { withCredentials: true });

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCurrentUser().then(response => {
      if (response.isAuthenticated) {
        setCurrentUserId(response.user._id);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login';
      }
      setIsLoadingCurrentUser(false);
    }).catch(error => {
      console.error('Error fetching current user:', error);
      setIsLoadingCurrentUser(false);
    });

    fetchConversations(searchTerm).then(response => {
      const updatedConversations = response.data.map(conv => ({
        ...conv,
        isActive: false
      }));
      setConversations(updatedConversations);
    }).catch(error => console.error('Error fetching conversations:', error));

    fetchUsers().then(response => {
      setUsers(response.data);
    }).catch(error => console.error('Error fetching users:', error));
  }, [searchTerm]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id).then(response => {
        const messagesWithSenderNames = response.data.map(message => ({
          ...message,
          senderName: message.senderId.name
        }));
        setMessages(messagesWithSenderNames);
      }).catch(error => console.error('Error fetching messages:', error));

      socket.emit('joinConversation', activeConversation._id);
    }

    const handleMessageReceived = message => {
      if (message.conversationId === activeConversation?._id) {
        setMessages(prevMessages => [...prevMessages, message]);
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv._id === message.conversationId) {
              return { ...conv, isActive: true };
            }
            return conv;
          }).sort((a, b) => b.isActive - a.isActive);
        });
      }
    };

    socket.on('messageReceived', handleMessageReceived);

    return () => {
      socket.off('messageReceived', handleMessageReceived);
      if (activeConversation) {
        socket.emit('leaveConversation', activeConversation._id);
      }
    };
  }, [activeConversation]);

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
        timestamp: new Date().toISOString()
      };
      sendMessage(activeConversation._id, newMessage).then(() => {
        socket.emit('newMessage', messageToSend);
        setMessages(prevMessages => [...prevMessages, messageToSend]);
        setNewMessage('');
      }).catch(error => {
        console.error('Error sending message:', error);
      });
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
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
                <div key={conv._id} onClick={() => setActiveConversation(conv)}
                  className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''} ${conv.isActive ? 'conversation-active' : ''}`}>
                  Conversation with {conv.participantNames.join(', ')}
                  <div className="timestamp">
                    {conv.lastMessage ? new Date(conv.lastMessage.timestamp).toLocaleString() : 'No Messages'}
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
                    <div key={index} className={msg.senderId === currentUserId ? 'message-sender' : 'message-recipient'}>
                      {msg.senderId === currentUserId ? 'You' : msg.senderName}: {msg.text}
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
