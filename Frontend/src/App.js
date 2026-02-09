import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import TaskPanel from './components/TaskPanel';
import SyncIndicator from './components/SyncIndicator';
import TokenModal from './components/TokenModal';
import { getAssignments, getCalendarEvents, getCourses, getSyncStatus, syncAssignments } from './services/api';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [taskPanelPosition, setTaskPanelPosition] = useState('right');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      localStorage.setItem('dark_mode', !prev);
      return !prev;
    });
  };

  useEffect(() => {
    const storedUrl = localStorage.getItem('canvas_url');
    const storedToken = localStorage.getItem('canvas_token');

    if (storedUrl && storedToken) {
      setCredentials({ canvasUrl: storedUrl, canvasToken: storedToken });
      setAuthenticated(true);
      loadAssignments(storedToken);
      loadCalendarEvents(storedToken);
      loadCourses(storedToken);
      loadSyncStatus(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!authenticated || !credentials) return;

    const interval = setInterval(() => {
      handleSync();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authenticated, credentials]);

  const loadAssignments = async (token) => {
    try {
      const data = await getAssignments(token);
      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const loadCalendarEvents = async (token) => {
    try {
      const data = await getCalendarEvents(token);
      setCalendarEvents(data);
    } catch (err) {
      console.error('Error loading calendar events:', err);
    }
  };

  const loadCourses = async (token) => {
    try {
      const data = await getCourses(token);
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const loadSyncStatus = async (token) => {
    try {
      const data = await getSyncStatus(token);
      setLastSync(data.last_sync);
    } catch (err) {
      console.error('Error loading sync status:', err);
    }
  };

  const handleSync = async () => {
    if (!credentials || syncing) return;

    setSyncing(true);
    try {
      const result = await syncAssignments(credentials.canvasUrl, credentials.canvasToken);
      setLastSync(result.last_sync);
      await loadAssignments(credentials.canvasToken);
      await loadCalendarEvents(credentials.canvasToken);
      await loadCourses(credentials.canvasToken);
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleTokenValidated = (creds) => {
    setCredentials(creds);
    setAuthenticated(true);
    loadAssignments(creds.canvasToken);
    loadCalendarEvents(creds.canvasToken);
    loadCourses(creds.canvasToken);
    loadSyncStatus(creds.canvasToken);
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect from Canvas?')) {
      localStorage.removeItem('canvas_url');
      localStorage.removeItem('canvas_token');
      setAuthenticated(false);
      setCredentials(null);
      setAssignments([]);
      setCalendarEvents([]);
      setCourses([]);
      setLastSync(null);
    }
  };

  return (
    <div style={{...styles.app, backgroundColor: darkMode ? '#121212' : '#fff'}}>
      <div style={{...styles.header, backgroundColor: darkMode ? '#1a1a2e' : '#007bff'}}>
        <h1 style={styles.title}>📚 Canvas Calendar</h1>
        
        <div style={styles.headerActions}>
          <button
            onClick={toggleDarkMode}
            style={styles.themeButton}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>

          {authenticated && (
            <>
              <button
                onClick={() => setTaskPanelPosition(taskPanelPosition === 'right' ? 'left' : 'right')}
                style={styles.toggleButton}
                title="Move task panel"
              >
                {taskPanelPosition === 'right' ? '⬅️' : '➡️'} Move Panel
              </button>
              
              <button 
                onClick={() => setShowTokenModal(true)} 
                style={styles.settingsButton}
                title="Canvas settings"
              >
                Settings
              </button>
              
              <button 
                onClick={handleDisconnect} 
                style={styles.disconnectButton}
                title="Disconnect from Canvas"
              >
                Disconnect
              </button>
            </>
          )}
          
          {!authenticated && (
            <button 
              onClick={() => setShowTokenModal(true)} 
              style={styles.connectButton}
              className="pulsate"
              title="Connect to Canvas"
            >
            Connect Your Canvas
            </button>
          )}
        </div>
      </div>

      {authenticated && (
        <SyncIndicator
          lastSync={lastSync}
          onSync={handleSync}
          syncing={syncing}
          darkMode={darkMode}
        />
      )}

      <div style={{
        ...styles.content,
        marginLeft: authenticated && taskPanelPosition === 'left' ? '380px' : '0',
        marginRight: authenticated && taskPanelPosition === 'right' ? '380px' : '0'
      }}>
        {!authenticated ? (
          <div style={{...styles.emptyState, backgroundColor: darkMode ? '#1e1e2e' : '#f8f9fa'}}>
            <div style={styles.emptyStateContent}>
              <h2 style={{...styles.emptyStateTitle, color: darkMode ? '#e0e0e0' : '#333'}}>Welcome to Canvas Lite! 👋</h2>
              <p style={{...styles.emptyStateText, color: darkMode ? '#a0a0a0' : '#666'}}>
                Click the pulsating "Connect Canvas" button above to get started.
              </p>
              <div style={styles.emptyStateIcon}>📅</div>
            </div>
          </div>
        ) : (
          <Calendar assignments={assignments} calendarEvents={calendarEvents} courses={courses} darkMode={darkMode} />
        )}
      </div>

      {authenticated && (
        <TaskPanel
          assignments={assignments}
          onTaskUpdate={() => loadAssignments(credentials.canvasToken)}
          position={taskPanelPosition}
          darkMode={darkMode}
        />
      )}

      <TokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onTokenValidated={handleTokenValidated}
        darkMode={darkMode}
      />
    </div>
  );
}

const styles = {
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 10
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold'
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  themeButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  toggleButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s'
  },
  settingsButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  disconnectButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  connectButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: '2px solid white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  },
  content: {
    flex: 1,
    transition: 'margin 0.3s ease',
    overflow: 'hidden'
  },
  emptyState: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: '40px'
  },
  emptyStateContent: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  emptyStateTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px'
  },
  emptyStateText: {
    fontSize: '18px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '30px'
  },
  emptyStateIcon: {
    fontSize: '80px',
    marginTop: '20px'
  }
};

export default App;