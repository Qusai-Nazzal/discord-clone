import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import CreateChannelModal from './components/CreateChannelModal';
import { channelAPI } from './services/api';

function MainLayout() {
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load channel roster once authenticated
  useEffect(() => {
    if (!user) return;

    const fetchChannels = async () => {
      try {
        const res = await channelAPI.getAll();
        setChannels(res.data);
        if (res.data.length > 0) {
          // Select #general by default if it exists, otherwise the first channel
          const general = res.data.find((c) => c.name === 'general') || res.data[0];
          setActiveChannel(general);
        }
      } catch (err) {
        console.error('Failed to load channels:', err.message);
      }
    };

    fetchChannels();
  }, [user]);

  // Synchronize new channel creations via Socket broadcast
  useEffect(() => {
    if (!socket) return;

    const handleNewChannel = (newChannel) => {
      setChannels((prev) => {
        if (prev.some((c) => c._id === newChannel._id)) return prev;
        return [...prev, newChannel];
      });
    };

    socket.on('new-channel', handleNewChannel);

    return () => {
      socket.off('new-channel', handleNewChannel);
    };
  }, [socket]);

  const handleCreateChannel = async (name, description) => {
    const res = await channelAPI.create(name, description);
    const newChannel = res.data;
    
    // Automatically join the newly created channel
    setActiveChannel(newChannel);

    // Broadcast new channel to other online clients
    if (socket) {
      socket.emit('channel-created', newChannel);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        color: 'var(--text-white)',
        fontSize: '18px',
        fontWeight: 600,
        backgroundColor: 'var(--bg-tertiary)'
      }}>
        Starting Discord Clone...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <Sidebar
        channels={channels}
        activeChannel={activeChannel}
        onSelectChannel={setActiveChannel}
        onCreateChannelClick={() => setIsModalOpen(true)}
      />
      <ChatArea channel={activeChannel} />

      <CreateChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChannel}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
