import React, { useState } from 'react';

const CreateChannelModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    
    const val = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
    setName(val);
    if (val) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Channel name is required.');
      return;
    }

    setLoading(true);
    try {
      await onCreate(name, description);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create channel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Channel</h2>
          <p>Channels are where your members communicate. They’re best when organized around a topic.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="auth-error" style={{ marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="channel-name">Channel Name</label>
              <div className="input-wrapper">
                <input
                  id="channel-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="new-channel"
                  maxLength="80"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="channel-description">Description</label>
              <div className="input-wrapper">
                <input
                  id="channel-description"
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  maxLength="120"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="modal-btn confirm" disabled={loading}>
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
