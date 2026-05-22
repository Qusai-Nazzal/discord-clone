import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ channels, activeChannel, onSelectChannel, onCreateChannelClick }) => {
  const { user, logout, updateLocalUserStatus } = useAuth();
  const { socket } = useSocket();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (newStatus) => {
    if (socket) {
      socket.emit('status-change', newStatus);
    }
    updateLocalUserStatus(newStatus);
    setShowStatusDropdown(false);
  };

  return (
    <>
      {/* Far-left Server Icons Bar */}
      <div className="servers-bar">
        <div className="server-icon active">
          <img
            src="https://api.dicebear.com/7.x/identicon/svg?seed=discord"
            alt="Discord Home"
            style={{ width: '28px', height: '28px' }}
          />
        </div>
        <div className="server-separator"></div>
        <div className="server-icon" title="Main Server">
          AG
        </div>
        <div className="server-icon" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Add a Server">
          +
        </div>
      </div>

      {/* Channels Sidebar Container */}
      <div className="channels-sidebar">
        <div className="channels-header">
          <span>oppotrain Space</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </div>

        <div className="channels-list-container">
          <div className="channels-section-header">
            <span>Text Channels</span>
            <button className="add-channel-btn" onClick={onCreateChannelClick} title="Create Channel">
              +
            </button>
          </div>

          {channels.map((channel) => (
            <div
              key={channel._id}
              className={`channel-item ${activeChannel?._id === channel._id ? 'active' : ''}`}
              onClick={() => onSelectChannel(channel)}
            >
              <span className="channel-hash">#</span>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {channel.name}
              </span>
            </div>
          ))}
        </div>

        {/* User Footer Panel */}
        <div className="user-footer">
          <div className="user-footer-info" style={{ position: 'relative' }}>
            <div className="status-select-container" ref={dropdownRef}>
              <div 
                className="avatar-wrapper" 
                onClick={() => setShowStatusDropdown(!showStatusDropdown)} 
                style={{ cursor: 'pointer' }}
                title="Change status"
              >
                <img className="user-avatar" src={user?.avatar} alt={user?.username} />
                <div className={`status-dot ${user?.status || 'online'}`}></div>
              </div>

              {showStatusDropdown && (
                <div className="status-dropdown">
                  <div className="status-option" onClick={() => handleStatusChange('online')}>
                    <div className="status-indicator-dot" style={{ backgroundColor: 'var(--status-online)' }}></div>
                    <span>Online</span>
                  </div>
                  <div className="status-option" onClick={() => handleStatusChange('idle')}>
                    <div className="status-indicator-dot" style={{ backgroundColor: 'var(--status-idle)' }}></div>
                    <span>Idle</span>
                  </div>
                  <div className="status-option" onClick={() => handleStatusChange('dnd')}>
                    <div className="status-indicator-dot" style={{ backgroundColor: 'var(--status-dnd)' }}></div>
                    <span>Do Not Disturb</span>
                  </div>
                  <div className="status-option" onClick={() => handleStatusChange('offline')}>
                    <div className="status-indicator-dot" style={{ backgroundColor: 'var(--status-offline)' }}></div>
                    <span>Invisible</span>
                  </div>
                </div>
              )}
            </div>

            <div className="user-footer-text">
              <span className="user-footer-name">{user?.username}</span>
              <span className="user-footer-status" style={{ textTransform: 'capitalize' }}>
                {user?.status || 'online'}
              </span>
            </div>
          </div>

          <div className="user-footer-actions">
            <button className="footer-btn" onClick={logout} title="Log Out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
