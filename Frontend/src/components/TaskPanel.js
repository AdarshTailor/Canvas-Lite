import React from 'react';
import moment from 'moment';
import { toggleAssignmentCompletion } from '../services/api';

const TaskPanel = ({ assignments, onTaskUpdate, position = 'right', darkMode }) => {
  const handleToggleComplete = async (assignmentId, currentStatus) => {
    try {
      await toggleAssignmentCompletion(assignmentId, !currentStatus);
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

    if (daysUntilDue < 0) return '#d32f2f'; // Overdue - red
    if (daysUntilDue <= 2) return '#f57c00'; // Due soon - orange
    if (daysUntilDue <= 7) return '#fbc02d'; // Due this week - yellow
    return '#388e3c'; // Future - green
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

  return (
    <div style={{
      ...styles.panel,
      [position]: 0,
      backgroundColor: darkMode ? '#1e1e2e' : 'white',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.15)'
    }}>
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
            <div key={assignment.id} style={{
              ...styles.taskCard,
              backgroundColor: darkMode ? '#252540' : '#f8f9fa',
              border: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
            }}>
              <div style={styles.taskHeader}>
                <input
                  type="checkbox"
                  checked={assignment.is_completed}
                  onChange={() => handleToggleComplete(assignment.id, assignment.is_completed)}
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
              <div key={assignment.id} style={{
                ...styles.taskCard,
                ...styles.completedCard,
                backgroundColor: darkMode ? '#252540' : '#f8f9fa',
                border: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
              }}>
                <div style={styles.taskHeader}>
                  <input
                    type="checkbox"
                    checked={assignment.is_completed}
                    onChange={() => handleToggleComplete(assignment.id, assignment.is_completed)}
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
  );
};

const styles = {
  panel: {
    position: 'fixed',
    top: '75px',
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
    overflow: 'auto'
  },
  header: {
    padding: '20px',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f8f9fa'
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
