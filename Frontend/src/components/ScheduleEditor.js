import React, { useState, useEffect } from 'react';
import { saveClassSchedule } from '../services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#6d4c41', '#546e7a'];

const ScheduleEditor = ({ isOpen, onClose, courses, existingSchedule, onSave, darkMode }) => {
  const [courseEntries, setCourseEntries] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (existingSchedule && existingSchedule.length > 0) {
      // Group existing entries by course_id, rebuild the editing state
      const grouped = {};
      existingSchedule.forEach(entry => {
        if (!grouped[entry.course_id]) {
          grouped[entry.course_id] = {
            course_id: String(entry.course_id),
            course_name: entry.course_name,
            days: [],
            start_time: entry.start_time,
            end_time: entry.end_time,
            location: entry.location || '',
            color: entry.color
          };
        }
        grouped[entry.course_id].days.push(entry.day_of_week);
      });
      setCourseEntries(Object.values(grouped));
    } else {
      // Initialize from courses list
      setCourseEntries(
        courses.map((course, i) => ({
          course_id: String(course.id),
          course_name: course.name || 'Unknown Course',
          days: [],
          start_time: '09:00',
          end_time: '09:50',
          location: '',
          color: COLORS[i % COLORS.length]
        }))
      );
    }
  }, [isOpen, courses, existingSchedule]);

  const toggleDay = (courseIndex, dayIndex) => {
    setCourseEntries(prev => {
      const updated = [...prev];
      const entry = { ...updated[courseIndex] };
      entry.days = entry.days.includes(dayIndex)
        ? entry.days.filter(d => d !== dayIndex)
        : [...entry.days, dayIndex].sort();
      updated[courseIndex] = entry;
      return updated;
    });
  };

  const updateField = (courseIndex, field, value) => {
    setCourseEntries(prev => {
      const updated = [...prev];
      updated[courseIndex] = { ...updated[courseIndex], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('canvas_token');
      // Expand each course's days into individual entries
      const entries = courseEntries.flatMap(course =>
        course.days.map(day => ({
          course_id: course.course_id,
          course_name: course.course_name,
          day_of_week: day,
          start_time: course.start_time,
          end_time: course.end_time,
          location: course.location,
          color: course.color
        }))
      );
      await saveClassSchedule(token, entries);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving schedule:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const bg = darkMode ? '#1e1e2e' : 'white';
  const cardBg = darkMode ? '#252540' : '#f8f9fa';
  const border = darkMode ? '#333' : '#e0e0e0';
  const text = darkMode ? '#e0e0e0' : '#333';
  const subtext = darkMode ? '#a0a0a0' : '#666';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, backgroundColor: bg, border: `1px solid ${border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ ...styles.header, borderBottom: `2px solid ${border}` }}>
          <h2 style={{ ...styles.title, color: text }}>Edit Class Schedule</h2>
          <button onClick={onClose} style={{ ...styles.closeBtn, color: subtext }}>X</button>
        </div>

        <div style={styles.body}>
          {courseEntries.map((course, ci) => (
            <div key={course.course_id} style={{ ...styles.courseCard, backgroundColor: cardBg, borderLeft: `4px solid ${course.color}` }}>
              <div style={{ ...styles.courseName, color: text }}>{course.course_name}</div>

              <div style={styles.daysRow}>
                {DAYS.map((day, di) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(ci, di)}
                    style={{
                      ...styles.dayBtn,
                      backgroundColor: course.days.includes(di) ? course.color : (darkMode ? '#333' : '#e0e0e0'),
                      color: course.days.includes(di) ? 'white' : subtext
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div style={styles.timeRow}>
                <label style={{ color: subtext, fontSize: '12px' }}>
                  Start
                  <input
                    type="time"
                    value={course.start_time}
                    onChange={e => updateField(ci, 'start_time', e.target.value)}
                    style={{ ...styles.timeInput, backgroundColor: darkMode ? '#333' : '#fff', color: text, border: `1px solid ${border}` }}
                  />
                </label>
                <label style={{ color: subtext, fontSize: '12px' }}>
                  End
                  <input
                    type="time"
                    value={course.end_time}
                    onChange={e => updateField(ci, 'end_time', e.target.value)}
                    style={{ ...styles.timeInput, backgroundColor: darkMode ? '#333' : '#fff', color: text, border: `1px solid ${border}` }}
                  />
                </label>
                <label style={{ color: subtext, fontSize: '12px' }}>
                  Room
                  <input
                    type="text"
                    value={course.location}
                    onChange={e => updateField(ci, 'location', e.target.value)}
                    placeholder="e.g. ERB 129"
                    style={{ ...styles.locationInput, backgroundColor: darkMode ? '#333' : '#fff', color: text, border: `1px solid ${border}` }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...styles.footer, borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} style={{ ...styles.cancelBtn, color: subtext }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '600px',
    maxHeight: '85vh',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 24px'
  },
  courseCard: {
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  courseName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  daysRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px'
  },
  dayBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.15s'
  },
  timeRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },
  timeInput: {
    display: 'block',
    marginTop: '4px',
    padding: '6px 8px',
    borderRadius: '6px',
    fontSize: '14px',
    width: '110px'
  },
  locationInput: {
    display: 'block',
    marginTop: '4px',
    padding: '6px 8px',
    borderRadius: '6px',
    fontSize: '14px',
    width: '120px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px'
  },
  cancelBtn: {
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  saveBtn: {
    padding: '8px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default ScheduleEditor;
