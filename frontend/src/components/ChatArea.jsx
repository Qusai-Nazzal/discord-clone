import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageAPI } from '../services/api';

const ChatArea = ({ channel }) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch channel message history
  useEffect(() => {
    if (!channel) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await messageAPI.getByChannel(channel._id);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load messages:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [channel]);

  
  useEffect(() => {
    if (!socket || !channel) return;

    
    socket.emit('join-channel', channel._id);

    
    const handleReceiveMessage = (message) => {
      if (message.channel === channel._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    
    const handleUserTyping = (data) => {
      if (data.channelId === channel._id && data.username !== user.username) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          if (data.isTyping) {
            updated[data.username] = true;
          } else {
            delete updated[data.username];
          }
          return updated;
        });
      }
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);

    
    setTimeout(scrollToBottom, 200);

    return () => {
      socket.emit('leave-channel', channel._id);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      setTypingUsers({});
    };
  }, [channel, socket, user.username]);

  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket || !channel) return;

    
    socket.emit('typing', {
      channelId: channel._id,
      username: user.username,
      isTyping: true
    });

   
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        channelId: channel._id,
        username: user.username,
        isTyping: false
      });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !channel) return;

    
    socket.emit('send-message', {
      channelId: channel._id,
      senderId: user.id,
      content: text
    });

   
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', {
      channelId: channel._id,
      username: user.username,
      isTyping: false
    });

    setText('');
  };

 
  const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return `${date.toLocaleDateString()} ${timeStr}`;
  };

 
  const getTypingText = () => {
    const activeTypers = Object.keys(typingUsers);
    if (activeTypers.length === 0) return '';
    if (activeTypers.length === 1) return `${activeTypers[0]} is typing...`;
    if (activeTypers.length === 2) return `${activeTypers[0]} and ${activeTypers[1]} are typing...`;
    return 'Several people are typing...';
  };

  if (!channel) {
    return (
      <div className="chat-panel" style={{ justifyContent: 'center' }}>
        <div className="welcome-container">
          <div className="welcome-icon-box">💬</div>
          <h2>Welcome to Discord Clone!</h2>
          <p>Select a channel from the left sidebar to start chatting, or create a new channel to begin a new discussion topic.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel" style={{ flexDirection: 'row' }}>
      {/* Central Chat Stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <span className="channel-hash" style={{ fontSize: '20px' }}>#</span>
            <span>{channel.name}</span>
            {channel.description && <span className="chat-header-desc">{channel.description}</span>}
          </div>
        </div>

        {/* Message Log */}
        <div className="chat-messages-container">
          {loading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              Loading message history...
            </div>
          ) : messages.length === 0 ? (
            <div className="welcome-container" style={{ margin: 'auto 0' }}>
              <div className="welcome-icon-box" style={{ width: '60px', height: '60px', fontSize: '24px' }}>#</div>
              <h2>Welcome to #{channel.name}!</h2>
              <p>This is the start of the #{channel.name} channel. {channel.description || 'No description set.'}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="message-item">
                <img
                  className="message-avatar"
                  src={msg.sender?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.sender?.username}`}
                  alt={msg.sender?.username || 'User'}
                />
                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <span className="message-author">{msg.sender?.username || 'Unknown User'}</span>
                    <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                  <div className="message-body">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="chat-input-wrapper">
          <form onSubmit={handleSend}>
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                value={text}
                onChange={handleInputChange}
                placeholder={`Message #${channel.name}`}
              />
            </div>
          </form>
          <div className="typing-indicator">{getTypingText()}</div>
        </div>
      </div>

      {/* Right Sidebar: Active Members */}
      <div className="members-sidebar">
        <div className="members-section-header">Online — {onlineUsers.length}</div>
        {onlineUsers.map((member) => (
          <div key={member.id} className="member-item">
            <div className="avatar-wrapper" style={{ width: '28px', height: '28px' }}>
              <img className="user-avatar" src={member.avatar} alt={member.username} />
              <div className={`status-dot ${member.status || 'online'}`} style={{ border: '2px solid var(--bg-secondary)', width: '10px', height: '10px', bottom: '-1px', right: '-1px' }}></div>
            </div>
            <span className="member-name">{member.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatArea;
