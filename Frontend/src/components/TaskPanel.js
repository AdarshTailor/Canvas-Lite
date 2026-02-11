import React, { useState, useRef, useEffect, useCallback } from 'react';
import moment from 'moment';
import { toggleAssignmentCompletion } from '../services/api';

const TaskPanel = ({ assignments, onTaskUpdate, darkMode, side, onSideChange }) => {
  const panelRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragPositionRef = useRef(null);

  const [dragPosition, setDragPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;

    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      const initialPos = { x: rect.left, y: rect.top };
      dragPositionRef.current = initialPos;
      setDragPosition(initialPos);
      setIsDragging(true);
    }
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 280));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100));
      const newPos = { x: newX, y: newY };
      dragPositionRef.current = newPos;
      setDragPosition(newPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const pos = dragPositionRef.current;
      if (pos) {
        const panelCenter = pos.x + 175;
        const screenCenter = window.innerWidth / 2;
        const newSide = panelCenter < screenCenter ? 'left' : 'right';
        onSideChange(newSide);
      }
      setDragPosition(null);
      dragPositionRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onSideChange]);

  const handleToggleComplete = async (canvasId, currentStatus) => {
    try {
      // 1. Get the token from storage
      const token = localStorage.getItem('canvas_token'); 

      if (!token) {
        console.error("No token found. Please log in.");
        return;
      }

      // 2. Pass the canvasId and token to the API
      await toggleAssignmentCompletion(canvasId, !currentStatus, token);
      
      // 3. Trigger parent refresh
      onTaskUpdate(); 
    } catch (err) {
      console.error('Error toggling completion:', err);
    }
  };

  const upcomingAssignments = assignments
    .filter(a => a.due_at && !a.is_completed)
    .sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

  const completedAssignments = assignments.filter(a => a.is_completed);

  const getDueDateColor = (dueDate) => {
    const now = moment();
    const due = moment(dueDate);
    const daysUntilDue = due.diff(now, 'days');

    if (daysUntilDue < 0) return '#d32f2f';
    if (daysUntilDue <= 2) return '#f57c00';
    if (daysUntilDue <= 7) return '#fbc02d';
    return '#388e3c';
  };

  const formatDueDate = (dueDate) => {
    const due = moment(dueDate);
    const now = moment();
    const daysUntilDue = due.diff(now, 'days');

    if (daysUntilDue < 0) return `Overdue by ${Math.abs(daysUntilDue)} days`;
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return due.format('MMM D, YYYY');
  };

  const panelPositionStyle = dragPosition
    ? { left: dragPosition.x, top: dragPosition.y, right: 'auto', transition: 'none' }
    : { [side]: 0, top: 85, transition: 'box-shadow 0.3s' };

  const hoverSide = dragPosition
    ? (dragPosition.x + 175 < window.innerWidth / 2 ? 'left' : 'right')
    : null;

  const dropZoneBase = {
    position: 'fixed',
    top: 85,
    width: '350px',
    height: 'calc(100vh - 95px)',
    borderRadius: '16px',
    margin: '10px',
    pointerEvents: 'none',
    zIndex: 99,
    transition: 'opacity 0.2s, border-color 0.2s, background-color 0.2s',
  };

  return (
    <>
      {isDragging && (
        <>
          <div style={{
            ...dropZoneBase,
            left: 0,
            border: `2px dashed ${hoverSide === 'left' ? (darkMode ? '#64b5f6' : '#007bff') : (darkMode ? '#444' : '#ccc')}`,
            backgroundColor: hoverSide === 'left'
              ? (darkMode ? 'rgba(100,181,246,0.08)' : 'rgba(0,123,255,0.06)')
              : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
            opacity: 1,
          }} />
          <div style={{
            ...dropZoneBase,
            right: 0,
            border: `2px dashed ${hoverSide === 'right' ? (darkMode ? '#64b5f6' : '#007bff') : (darkMode ? '#444' : '#ccc')}`,
            backgroundColor: hoverSide === 'right'
              ? (darkMode ? 'rgba(100,181,246,0.08)' : 'rgba(0,123,255,0.06)')
              : (darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
            opacity: 1,
          }} />
        </>
      )}
      <div
        ref={panelRef}
        style={{
          ...styles.panel,
          ...panelPositionStyle,
          backgroundColor: darkMode ? '#1e1e2e' : 'white',
          boxShadow: isDragging
            ? '0 8px 32px rgba(0,0,0,0.3)'
            : darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.15)',
          userSelect: isDragging ? 'none' : undefined,
        }}
      >
      <div
        onMouseDown={handleDragStart}
        style={{
          ...styles.dragHandle,
          backgroundColor: darkMode ? '#252540' : '#f0f0f0',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{
          ...styles.dragBar,
          backgroundColor: darkMode ? '#555' : '#bbb',
        }} />
      </div>

      <div style={{
        ...styles.header,
        backgroundColor: darkMode ? '#252540' : '#f8f9fa',
        borderBottom: darkMode ? '2px solid #333' : '2px solid #e0e0e0'
      }}>
        <h2 style={{...styles.title, color: darkMode ? '#e0e0e0' : '#333'}}>Assignments</h2>
        <div style={{...styles.stats, color: darkMode ? '#a0a0a0' : '#666'}}>
          <span style={styles.statItem}>
            📋 {upcomingAssignments.length} upcoming
          </span>
          <span style={styles.statItem}>
            ✅ {completedAssignments.length} completed
          </span>
        </div>
      </div>

      <div style={styles.content}>
        <h3 style={{...styles.sectionTitle, color: darkMode ? '#a0a0a0' : '#666'}}>Upcoming</h3>
        {upcomingAssignments.length === 0 ? (
          <p style={styles.emptyState}>No upcoming assignments! 🎉</p>
        ) : (
          upcomingAssignments.map(assignment => (
            <div key={assignment.canvas_id} style={{
              ...styles.taskCard,
              backgroundColor: darkMode ? '#252540' : '#f8f9fa',
              border: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
            }}>
              <div style={styles.taskHeader}>
                <input
                  type="checkbox"
                  checked={assignment.is_completed}
                  onChange={() => handleToggleComplete(assignment.canvas_id, assignment.is_completed)}
                  style={styles.checkbox}
                />
                <div style={styles.taskInfo}>
                  <h4 style={{...styles.taskTitle, color: darkMode ? '#e0e0e0' : '#333'}}>{assignment.title}</h4>
                  <p style={{...styles.courseName, color: darkMode ? '#a0a0a0' : '#666'}}>{assignment.course_name}</p>
                </div>
              </div>

              {assignment.due_at && (
                <div
                  style={{
                    ...styles.dueDate,
                    color: getDueDateColor(assignment.due_at)
                  }}
                >
                  🕐 {formatDueDate(assignment.due_at)}
                </div>
              )}

              {assignment.points_possible && (
                <div style={{...styles.points, color: darkMode ? '#a0a0a0' : '#666'}}>
                  📊 {assignment.points_possible} points
                </div>
              )}

              {assignment.html_url && (
                <a
                  href={assignment.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...styles.link, color: darkMode ? '#64b5f6' : '#007bff'}}
                >
                  View in Canvas →
                </a>
              )}
            </div>
          ))
        )}

        {completedAssignments.length > 0 && (
          <>
            <h3 style={{...styles.sectionTitle, color: darkMode ? '#a0a0a0' : '#666'}}>Completed</h3>
            {completedAssignments.map(assignment => (
              <div key={assignment.canvas_id} style={{
                ...styles.taskCard,
                ...styles.completedCard,
                backgroundColor: darkMode ? '#252540' : '#f8f9fa',
                border: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
              }}>
                <div style={styles.taskHeader}>
                  <input
                    type="checkbox"
                    checked={assignment.is_completed}
                    onChange={() => handleToggleComplete(assignment.canvas_id, assignment.is_completed)}
                    style={styles.checkbox}
                  />
                  <div style={styles.taskInfo}>
                    <h4 style={{...styles.taskTitle, textDecoration: 'line-through', color: darkMode ? '#a0a0a0' : '#333'}}>
                      {assignment.title}
                    </h4>
                    <p style={{...styles.courseName, color: darkMode ? '#777' : '#666'}}>{assignment.course_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    </>
  );
};

const styles = {
  panel: {
    position: 'fixed',
    width: '350px',
    height: 'calc(100vh - 95px)',
    minWidth: '280px',
    maxWidth: '600px',
    minHeight: '300px',
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    borderRadius: '16px',
    margin: '10px',
    resize: 'both',
    overflow: 'hidden'
  },
  dragHandle: {
    padding: '6px 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '16px 16px 0 0',
    flexShrink: 0,
  },
  dragBar: {
    width: '40px',
    height: '5px',
    borderRadius: '3px',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    flexShrink: 0,
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  stats: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    color: '#666'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: '15px',
    marginTop: '20px'
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontSize: '14px'
  },
  taskCard: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #e0e0e0',
    transition: 'transform 0.2s'
  },
  completedCard: {
    opacity: 0.6
  },
  taskHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '10px'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    marginTop: '2px'
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    margin: '0 0 5px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  courseName: {
    margin: 0,
    fontSize: '13px',
    color: '#666'
  },
  dueDate: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '5px'
  },
  points: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px'
  },
  link: {
    fontSize: '12px',
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

export default TaskPanel;