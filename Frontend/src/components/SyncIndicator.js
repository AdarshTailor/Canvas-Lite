import React from 'react';
import moment from 'moment';

const SyncIndicator = ({ lastSync, onSync, syncing, darkMode }) => {
  const formatLastSync = () => {
    if (!lastSync) return 'Never synced';
    return `Last synced ${moment(lastSync).fromNow()}`;
  };

  return (
    <div style={{
      ...styles.container,
      backgroundColor: darkMode ? '#1e1e2e' : 'white',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
    }}>
      <div style={styles.status}>
        <span style={styles.dot}></span>
        <span style={{...styles.text, color: darkMode ? '#a0a0a0' : '#666'}}>{formatLastSync()}</span>
      </div>
      <button onClick={onSync} disabled={syncing} style={{
        ...styles.button,
        backgroundColor: darkMode ? '#3d3d5c' : '#007bff'
      }}>
        {syncing ? 'Syncing...' : '🔄 Sync Now'}
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    animation: 'pulse 2s infinite'
  },
  text: {
    color: '#666',
    fontSize: '14px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default SyncIndicator;
