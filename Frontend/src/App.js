import React, { useState, useEffect, useMemo } from 'react';
import Calendar from './components/Calendar';
import TaskPanel from './components/TaskPanel';
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
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [panelSide, setPanelSide] = useState(() => {
    return localStorage.getItem('taskPanelSide') || 'right';
  });
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

  // Only show assignments from currently active courses
  const activeAssignments = useMemo(() => {
    if (courses.length === 0) return assignments;
    const activeCourseIds = new Set(courses.map(c => String(c.id)));
    return assignments.filter(a => activeCourseIds.has(String(a.course_id)));
  }, [assignments, courses]);

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
        <h1 style={styles.title}>Canvas-Lite</h1>
        
        <div style={styles.headerActions}>
          <div
            onClick={toggleDarkMode}
            style={styles.toggleContainer}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span style={styles.toggleLabel}>{darkMode ? '🌙' : '☀️'}</span>
            <div style={{
              ...styles.toggleTrack,
              backgroundColor: darkMode ? '#64b5f6' : 'rgba(255,255,255,0.35)',
            }}>
              <div style={{
                ...styles.toggleThumb,
                transform: darkMode ? 'translateX(20px)' : 'translateX(0)',
              }} />
            </div>
          </div>

          {authenticated && (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                style={styles.syncButton}
                title={lastSync ? `Last synced ${new Date(lastSync).toLocaleTimeString()}` : 'Never synced'}
              >
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
              <button
                onClick={() => setShowTokenModal(true)}
                style={styles.settingsButton}
                title="Canvas settings"
              >
                Settings
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

      <div style={{
        ...styles.content,
        marginLeft: authenticated && panelSide === 'left' ? '380px' : '0',
        marginRight: authenticated && panelSide === 'right' ? '380px' : '0'
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
          <Calendar assignments={activeAssignments} calendarEvents={calendarEvents} courses={courses} darkMode={darkMode} />
        )}
      </div>

      {authenticated && (
        <TaskPanel
          assignments={activeAssignments}
          onTaskUpdate={() => loadAssignments(credentials.canvasToken)}
          darkMode={darkMode}
          side={panelSide}
          onSideChange={(newSide) => {
            setPanelSide(newSide);
            localStorage.setItem('taskPanelSide', newSide);
          }}
        />
      )}

      <TokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onTokenValidated={handleTokenValidated}
        onDisconnect={authenticated ? handleDisconnect : null}
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
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    userSelect: 'none',
  },
  toggleLabel: {
    fontSize: '16px',
  },
  toggleTrack: {
    width: '40px',
    height: '20px',
    borderRadius: '10px',
    position: 'relative',
    transition: 'background-color 0.3s',
  },
  toggleThumb: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: 'white',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'transform 0.3s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  syncButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
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