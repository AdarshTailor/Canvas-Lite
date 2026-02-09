import React, { useState } from 'react';
import { validateToken, syncAssignments } from '../services/api';

const TokenModal = ({ isOpen, onClose, onTokenValidated, onDisconnect, darkMode }) => {
  const [canvasUrl, setCanvasUrl] = useState('https://canvas.instructure.com');
  const [canvasToken, setCanvasToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await validateToken(canvasUrl, canvasToken);
      await syncAssignments(canvasUrl, canvasToken);
      
      localStorage.setItem('canvas_url', canvasUrl);
      localStorage.setItem('canvas_token', canvasToken);
      
      onTokenValidated({ canvasUrl, canvasToken });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to validate token');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{...styles.overlay, backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'}} onClick={onClose}>
      <div style={{
        ...styles.modal,
        backgroundColor: darkMode ? '#1e1e2e' : 'white',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          ...styles.header,
          borderBottom: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
        }}>
          <h2 style={{...styles.title, color: darkMode ? '#e0e0e0' : '#333'}}>Connect to Canvas</h2>
          <button style={{...styles.closeButton, color: darkMode ? '#a0a0a0' : '#999'}} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={{...styles.label, color: darkMode ? '#e0e0e0' : '#333'}}>Canvas URL</label>
            <input
              type="url"
              value={canvasUrl}
              onChange={(e) => setCanvasUrl(e.target.value)}
              placeholder="https://canvas.instructure.com"
              style={{
                ...styles.input,
                backgroundColor: darkMode ? '#252540' : 'white',
                color: darkMode ? '#e0e0e0' : '#333',
                border: darkMode ? '1px solid #444' : '1px solid #ddd'
              }}
              required
            />
            <small style={{...styles.hint, color: darkMode ? '#777' : '#999'}}>Your institution's Canvas URL</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={{...styles.label, color: darkMode ? '#e0e0e0' : '#333'}}>Access Token</label>
            <input
              type="password"
              value={canvasToken}
              onChange={(e) => setCanvasToken(e.target.value)}
              placeholder="Enter your Canvas access token"
              style={{
                ...styles.input,
                backgroundColor: darkMode ? '#252540' : 'white',
                color: darkMode ? '#e0e0e0' : '#333',
                border: darkMode ? '1px solid #444' : '1px solid #ddd'
              }}
              required
            />
            <small style={{...styles.hint, color: darkMode ? '#777' : '#999'}}>
              Get your token from Canvas → Account → Settings → New Access Token
            </small>
          </div>

          {error && <div style={{
            ...styles.error,
            backgroundColor: darkMode ? '#3d1c1c' : '#fee',
            color: darkMode ? '#ff6b6b' : '#c33'
          }}>{error}</div>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={{
              ...styles.cancelButton,
              backgroundColor: darkMode ? '#333' : '#f5f5f5',
              color: darkMode ? '#a0a0a0' : '#666'
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              ...styles.submitButton,
              backgroundColor: darkMode ? '#3d3d5c' : '#007bff'
            }}>
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>

        {onDisconnect && (
          <div style={{
            ...styles.disconnectSection,
            borderTop: darkMode ? '1px solid #333' : '1px solid #e0e0e0',
          }}>
            <button
              onClick={() => { onDisconnect(); onClose(); }}
              style={{
                ...styles.disconnectButton,
                backgroundColor: darkMode ? '#3d1c1c' : '#fff0f0',
                color: '#dc3545',
                border: darkMode ? '1px solid #5c2020' : '1px solid #f5c6cb',
              }}
            >
              Disconnect from Canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    color: '#999',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  hint: {
    color: '#999',
    fontSize: '12px'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  disconnectSection: {
    padding: '16px 24px',
  },
  disconnectButton: {
    width: '100%',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  }
};

export default TokenModal;