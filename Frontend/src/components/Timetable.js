import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 60; // px per hour
const HEADER_HEIGHT = 40;

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

const Timetable = ({ schedule, onEditSchedule, darkMode }) => {
  const totalHours = END_HOUR - START_HOUR;
  const gridHeight = totalHours * HOUR_HEIGHT;

  const bg = darkMode ? '#1e1e2e' : '#f5f5f5';
  const headerBg = darkMode ? '#252540' : '#e8e8e8';
  const lineBorder = darkMode ? '#333' : '#ddd';
  const text = darkMode ? '#e0e0e0' : '#333';
  const subtext = darkMode ? '#888' : '#999';

  // Generate hour labels
  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    hours.push({ hour: h, label: `${displayH} ${period}` });
  }

  return (
    <div style={{
      ...styles.container,
      backgroundColor: bg,
      border: `1px solid ${lineBorder}`
    }}>
      {/* Header row */}
      <div style={{ ...styles.headerRow, backgroundColor: headerBg }}>
        <div style={{ ...styles.timeColumn, borderRight: `1px solid ${lineBorder}` }} />
        {DAYS.map(day => (
          <div key={day} style={{ ...styles.dayHeader, color: text, borderRight: `1px solid ${lineBorder}` }}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div style={styles.gridBody}>
        {/* Time labels column */}
        <div style={{ ...styles.timeColumn, borderRight: `1px solid ${lineBorder}` }}>
          {hours.map(({ hour, label }) => (
            <div
              key={hour}
              style={{
                ...styles.timeLabel,
                top: (hour - START_HOUR) * HOUR_HEIGHT,
                color: subtext
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div style={styles.daysContainer}>
          {/* Hour grid lines */}
          {hours.map(({ hour }) => (
            <div
              key={hour}
              style={{
                ...styles.hourLine,
                top: (hour - START_HOUR) * HOUR_HEIGHT,
                borderBottom: `1px solid ${lineBorder}`
              }}
            />
          ))}

          {/* Half-hour grid lines */}
          {hours.map(({ hour }) => (
            <div
              key={`half-${hour}`}
              style={{
                ...styles.hourLine,
                top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                borderBottom: `1px dashed ${darkMode ? '#2a2a3a' : '#eee'}`
              }}
            />
          ))}

          {/* Day column dividers */}
          {DAYS.map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${((i + 1) / DAYS.length) * 100}%`,
                top: 0,
                bottom: 0,
                borderRight: `1px solid ${lineBorder}`
              }}
            />
          ))}

          {/* Course blocks */}
          {schedule.map((entry, i) => {
            const startMin = timeToMinutes(entry.start_time);
            const endMin = timeToMinutes(entry.end_time);
            const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
            const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
            const left = (entry.day_of_week / DAYS.length) * 100;
            const width = 100 / DAYS.length;

            return (
              <div
                key={`${entry.course_id}-${entry.day_of_week}-${i}`}
                style={{
                  ...styles.courseBlock,
                  top,
                  height: Math.max(height, 20),
                  left: `calc(${left}% + 2px)`,
                  width: `calc(${width}% - 4px)`,
                  backgroundColor: entry.color || '#3174ad'
                }}
                title={`${entry.course_name}\n${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}${entry.location ? '\n' + entry.location : ''}`}
              >
                <div style={styles.blockTitle}>{entry.course_name}</div>
                <div style={styles.blockTime}>{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</div>
                {entry.location && <div style={styles.blockLocation}>{entry.location}</div>}
              </div>
            );
          })}

          {/* Empty state */}
          {schedule.length === 0 && (
            <div style={{ ...styles.emptyState, color: subtext }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No classes scheduled</div>
              <button onClick={onEditSchedule} style={styles.addBtn}>
                + Add Your Class Schedule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: 'calc(100vh - 120px)',
    margin: '15px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column'
  },
  headerRow: {
    display: 'flex',
    height: HEADER_HEIGHT,
    flexShrink: 0
  },
  timeColumn: {
    width: '70px',
    flexShrink: 0,
    position: 'relative'
  },
  dayHeader: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px'
  },
  gridBody: {
    flex: 1,
    display: 'flex',
    overflowY: 'auto',
    position: 'relative'
  },
  daysContainer: {
    flex: 1,
    position: 'relative',
    height: (END_HOUR - START_HOUR) * HOUR_HEIGHT
  },
  timeLabel: {
    position: 'absolute',
    right: '8px',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '1',
    transform: 'translateY(-6px)'
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0
  },
  courseBlock: {
    position: 'absolute',
    borderRadius: '6px',
    padding: '4px 6px',
    overflow: 'hidden',
    cursor: 'default',
    color: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px'
  },
  blockTitle: {
    fontSize: '11px',
    fontWeight: '700',
    lineHeight: '1.2',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  blockTime: {
    fontSize: '10px',
    opacity: 0.9
  },
  blockLocation: {
    fontSize: '10px',
    opacity: 0.8
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  addBtn: {
    marginTop: '8px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default Timetable;
