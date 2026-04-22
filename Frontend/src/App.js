import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import ScheduleEditor from './components/ScheduleEditor';
import TaskPanel from './components/TaskPanel';
import TokenModal from './components/TokenModal';
import { getAssignments, getCalendarEvents, getCourses, getClassSchedule, getSyncStatus, syncAssignments } from './services/api';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [classSchedule, setClassSchedule] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });
  const [panelSide, setPanelSide] = useState(() => {
    return localStorage.getItem('taskPanelSide') || 'right';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dark_mode') === 'true';
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

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
      setIsLoading(true);
      Promise.all([
        loadAssignments(storedToken),
        loadCourses(storedToken),
        loadClassSchedule(storedToken),
        loadCalendarEvents(storedToken),
        loadSyncStatus(storedToken),
      ]).finally(() => setIsLoading(false));
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

  const loadCourses = async (token) => {
    try {
      const data = await getCourses(token);
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
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

  const loadClassSchedule = async (token) => {
    try {
      const data = await getClassSchedule(token);
      setClassSchedule(data);
    } catch (err) {
      console.error('Error loading class schedule:', err);
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
      await Promise.all([
        loadAssignments(credentials.canvasToken),
        loadCourses(credentials.canvasToken),
        loadClassSchedule(credentials.canvasToken),
        loadCalendarEvents(credentials.canvasToken),
      ]);
      setSyncSuccess(true);
      showToast('Synced successfully');
      setTimeout(() => setSyncSuccess(false), 2000);
    } catch (err) {
      console.error('Error syncing:', err);
      showToast('Sync failed — check your connection', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleTokenValidated = (creds) => {
    setCredentials(creds);
    setAuthenticated(true);
    setIsLoading(true);
    Promise.all([
      loadAssignments(creds.canvasToken),
      loadCourses(creds.canvasToken),
      loadClassSchedule(creds.canvasToken),
      loadCalendarEvents(creds.canvasToken),
      loadSyncStatus(creds.canvasToken),
    ]).finally(() => setIsLoading(false));
  };

  // getCourses already filters to current semester, so all synced assignments are current
  const activeAssignments = assignments;


  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect from Canvas?')) {
      localStorage.removeItem('canvas_url');
      localStorage.removeItem('canvas_token');
      setAuthenticated(false);
      setCredentials(null);
      setAssignments([]);
      setCourses([]);
      setLastSync(null);
    }
  };

  return (
    <div style={{...styles.app, backgroundColor: darkMode ? '#121212' : '#fff'}}>
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white',
          padding: '10px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '500',
          pointerEvents: 'none',
        }}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.message}
        </div>
      )}

      <div style={{...styles.header, backgroundColor: darkMode ? '#1a1a2e' : '#007bff'}}>
        {authenticated && <h1 style={styles.title}>📅 Canvas-Lite</h1>}

        <div style={styles.headerActions}>
          {authenticated && (
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
          )}

          {authenticated && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    ...styles.syncButton,
                    backgroundColor: syncSuccess ? 'rgba(40,167,69,0.35)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {syncing ? 'Syncing...' : syncSuccess ? '✓ Synced' : 'Sync'}
                </button>
                {lastSync && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.2px' }}>
                    {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowScheduleEditor(true)}
                style={styles.syncButton}
                title="Edit class schedule"
              >
                Edit Schedule
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
              title="Connect to Canvas"
            >
              Connect Canvas
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
          <div style={{
            ...styles.emptyState,
            background: darkMode ? '#1e1e2e' : 'linear-gradient(145deg, #eef3ff 0%, #f9fafb 60%)',
          }}>
            <div style={styles.emptyStateContent}>

              {/* Logo row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: '#007bff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📅</div>
                <span style={{ fontSize: '26px', fontWeight: '700', color: darkMode ? '#e0e0e0' : '#1a1a2e', letterSpacing: '-0.5px' }}>Canvas-Lite</span>
              </div>

              {/* Headline */}
              <h1 style={{ fontSize: '44px', fontWeight: '800', lineHeight: 1.15, letterSpacing: '-1.5px', margin: '0 0 18px 0', color: darkMode ? '#e0e0e0' : '#111' }}>
                Your semester,<br />
                <span style={{ color: '#007bff' }}>under control.</span>
              </h1>

              <p style={{ fontSize: '16px', color: darkMode ? '#a0a0a0' : '#555', marginBottom: '32px', lineHeight: 1.65, maxWidth: '360px', margin: '0 auto 32px' }}>
                Sync your Canvas assignments, track deadlines on a visual calendar, and never miss a due date.
              </p>

              {/* Feature pills */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
                {['📆 Calendar view', '✅ Task tracking', '🔄 Auto-sync'].map(label => (
                  <span key={label} style={{
                    padding: '6px 14px',
                    backgroundColor: darkMode ? '#252540' : 'white',
                    border: darkMode ? '1px solid #333' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: darkMode ? '#c0c0c0' : '#444',
                  }}>{label}</span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowTokenModal(true)}
                style={{
                  padding: '13px 32px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,123,255,0.3)',
                  display: 'block',
                  margin: '0 auto',
                }}
              >
                Connect Canvas →
              </button>
              <p style={{ fontSize: '12px', color: darkMode ? '#555' : '#aaa', marginTop: '14px' }}>
                Uses your existing Canvas account — no sign-up needed
              </p>

            </div>
          </div>
        ) : (
          <Calendar assignments={activeAssignments} calendarEvents={calendarEvents} courses={courses} classSchedule={classSchedule} darkMode={darkMode} />
        )}
      </div>

      {authenticated && (
        <TaskPanel
          assignments={activeAssignments}
          onTaskUpdate={() => loadAssignments(credentials.canvasToken)}
          onError={showToast}
          darkMode={darkMode}
          isLoading={isLoading}
          side={panelSide}
          onSideChange={(newSide) => {
            setPanelSide(newSide);
            localStorage.setItem('taskPanelSide', newSide);
          }}
        />
      )}

      <ScheduleEditor
        isOpen={showScheduleEditor}
        onClose={() => setShowScheduleEditor(false)}
        courses={courses}
        existingSchedule={classSchedule}
        onSave={() => loadClassSchedule(credentials.canvasToken)}
        onError={showToast}
        darkMode={darkMode}
      />

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