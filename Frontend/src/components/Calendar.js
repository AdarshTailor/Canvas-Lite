import React from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const PALETTE = ['#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00acc1','#6d4c41','#546e7a','#d81b60','#3949ab','#00897b','#f4511e'];

const hashColor = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};

const shortCode = (name) => {
  if (!name) return '';
  const m = name.match(/[A-Z]{2,4}-\d{4}/);
  return m ? m[0].replace('-', ' ') : name.split(' ').slice(0, 2).join(' ');
};

const getCourseColor = (courseName, classSchedule) => {
  const entry = classSchedule.find(e => e.course_name === courseName);
  return entry?.color || hashColor(courseName || '');
};

const Calendar = ({ assignments, calendarEvents = [], courses = [], classSchedule = [], darkMode }) => {
  // Convert assignments to calendar events — colored by course
  const assignmentEvents = assignments
    .filter(a => a.due_at)
    .map(a => ({
      id: `assignment-${a.id}`,
      title: a.title,
      start: new Date(a.due_at),
      end: new Date(a.due_at),
      resource: { ...a, event_type: 'assignment', courseColor: getCourseColor(a.course_name, classSchedule) },
      allDay: true
    }));

  // Convert Canvas calendar events (class times) to calendar events
  const classEvents = calendarEvents
    .filter(e => e.start_at)
    .map(e => ({
      id: `event-${e.id}`,
      title: e.context_name ? `${e.context_name}: ${e.title}` : e.title,
      start: new Date(e.start_at),
      end: e.end_at ? new Date(e.end_at) : new Date(e.start_at),
      resource: { ...e, event_type: 'class_event' },
      allDay: false
    }));

  // Convert courses to start/end marker events
  const courseEvents = [];
  courses.forEach(c => {
    if (c.start_at) {
      courseEvents.push({
        id: `course-start-${c.id}`,
        title: `${c.name} - Starts`,
        start: new Date(c.start_at),
        end: new Date(c.start_at),
        resource: { ...c, event_type: 'course', marker: 'start' },
        allDay: true
      });
    }
    if (c.end_at) {
      courseEvents.push({
        id: `course-end-${c.id}`,
        title: `${c.name} - Ends`,
        start: new Date(c.end_at),
        end: new Date(c.end_at),
        resource: { ...c, event_type: 'course', marker: 'end' },
        allDay: true
      });
    }
  });

  // Generate recurring weekly events from class schedule
  const scheduleEvents = [];
  if (classSchedule.length > 0) {
    // Generate events for ~20 weeks around today (covers a semester)
    const today = new Date();
    const semesterStart = new Date(today);
    semesterStart.setDate(semesterStart.getDate() - 7 * 4); // 4 weeks back
    const semesterEnd = new Date(today);
    semesterEnd.setDate(semesterEnd.getDate() + 7 * 16); // 16 weeks forward

    // day_of_week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
    // JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const dayOfWeekToJS = [1, 2, 3, 4, 5]; // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5

    // Guard against duplicate DB entries for the same course+day
    const seenKeys = new Set();
    const uniqueSchedule = classSchedule.filter(entry => {
      const key = `${entry.course_id}-${entry.course_name}-${entry.day_of_week}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    uniqueSchedule.forEach((entry, ei) => {
      const jsDay = dayOfWeekToJS[entry.day_of_week];
      if (jsDay === undefined) return;

      const [startH, startM] = entry.start_time.split(':').map(Number);
      const [endH, endM] = entry.end_time.split(':').map(Number);

      // Find the first matching weekday on or after semesterStart
      const cursor = new Date(semesterStart);
      while (cursor.getDay() !== jsDay) {
        cursor.setDate(cursor.getDate() + 1);
      }

      // Create an event for each week
      while (cursor <= semesterEnd) {
        const start = new Date(cursor);
        start.setHours(startH, startM, 0, 0);
        const end = new Date(cursor);
        end.setHours(endH, endM, 0, 0);

        scheduleEvents.push({
          id: `schedule-${entry.course_id}-${entry.course_name}-${entry.day_of_week}-${cursor.getTime()}`,
          title: entry.course_name,
          start,
          end,
          resource: {
            event_type: 'schedule',
            course_name: entry.course_name,
            location: entry.location,
            color: entry.color
          },
          allDay: false
        });

        cursor.setDate(cursor.getDate() + 7);
      }
    });
  }

  // Unified events: assignments + class schedule + course markers
  const events = [...assignmentEvents, ...scheduleEvents, ...courseEvents];

  const eventStyleGetter = (event) => {
    // Course start/end markers
    if (event.resource.event_type === 'course') {
      return {
        style: {
          backgroundColor: event.resource.marker === 'start' ? '#00897b' : '#e53935',
          borderRadius: '5px',
          opacity: 0.85,
          color: 'white',
          border: '0px',
          display: 'block',
          fontSize: '11px'
        }
      };
    }

    // Class schedule blocks — use the course's assigned color
    if (event.resource.event_type === 'schedule') {
      return {
        style: {
          backgroundColor: event.resource.color || '#3174ad',
          borderRadius: '5px',
          opacity: 1,
          color: 'white',
          border: '0px',
          display: 'block'
        }
      };
    }

    // Class events get a distinct purple color
    if (event.resource.event_type === 'class_event') {
      return {
        style: {
          backgroundColor: '#7c4dff',
          borderRadius: '5px',
          opacity: 1,
          color: 'white',
          border: '0px',
          display: 'block'
        }
      };
    }

    // Assignment: background = course color, left border = urgency
    const isCompleted = event.resource.is_completed;
    const daysUntilDue = moment(event.start).diff(moment(), 'days');
    const courseColor = event.resource.courseColor || '#3174ad';

    let urgencyBorder = 'transparent';
    if (isCompleted) urgencyBorder = '#4caf50';
    else if (daysUntilDue < 0) urgencyBorder = '#d32f2f';
    else if (daysUntilDue <= 2) urgencyBorder = '#ff7043';
    else if (daysUntilDue <= 7) urgencyBorder = '#ffd54f';

    return {
      style: {
        backgroundColor: courseColor,
        borderRadius: '5px',
        opacity: isCompleted ? 0.5 : 1,
        color: 'white',
        border: 'none',
        borderLeft: `4px solid ${urgencyBorder}`,
        display: 'block',
        textDecoration: isCompleted ? 'line-through' : 'none'
      }
    };
  };

  const CustomEvent = ({ event }) => {
    if (event.resource.event_type === 'assignment') {
      const daysUntilDue = moment(event.start).diff(moment(), 'days');
      let urgencyLabel = null;
      if (event.resource.is_completed) urgencyLabel = null;
      else if (daysUntilDue < 0) urgencyLabel = <span style={{ fontSize: '10px', opacity: 0.9 }}>⚠ Overdue</span>;
      else if (daysUntilDue === 0) urgencyLabel = <span style={{ fontSize: '10px', opacity: 0.9 }}>Due today</span>;
      else if (daysUntilDue <= 2) urgencyLabel = <span style={{ fontSize: '10px', opacity: 0.9 }}>Due soon</span>;

      return (
        <div style={{ fontSize: '12px', padding: '2px 3px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', opacity: 0.85, letterSpacing: '0.3px' }}>
            {shortCode(event.resource.course_name)}
          </div>
          <div style={{ fontWeight: '600', lineHeight: 1.2 }}>{event.title}</div>
          {urgencyLabel}
        </div>
      );
    }

    return (
      <div style={{ fontSize: '12px', padding: '2px' }}>
        <strong>
          {event.resource.event_type === 'course' ? '📘 ' : ''}
          {event.resource.event_type === 'class_event' ? '🏫 ' : ''}
          {event.title}
        </strong>
        {event.resource.event_type === 'class_event' && event.resource.location_name && (
          <div style={{ fontSize: '11px' }}>📍 {event.resource.location_name}</div>
        )}
        {event.resource.event_type === 'schedule' && event.resource.location && (
          <div style={{ fontSize: '11px' }}>📍 {event.resource.location}</div>
        )}
        {event.resource.event_type === 'course' && (
          <div style={{ fontSize: '11px' }}>
            {event.resource.course_code || ''} {event.resource.marker === 'start' ? '▶' : '◼'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      ...styles.container,
      backgroundColor: darkMode ? '#1e1e2e' : '#f5f5f5',
      border: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
    }}
      className={darkMode ? 'dark-calendar' : ''}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '0 0 10px 0',
        fontSize: '11px',
        color: darkMode ? '#aaa' : '#666'
      }}>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#888', position: 'relative', overflow: 'hidden' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: '#d32f2f' }} /></span>Overdue</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#888', position: 'relative', overflow: 'hidden' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: '#ff7043' }} /></span>Due Soon</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#888', position: 'relative', overflow: 'hidden' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: '#ffd54f' }} /></span>This Week</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#888' }} />Upcoming</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#888', opacity: 0.5 }} />Completed</span>
        <span style={{ ...styles.legendItem, borderLeft: darkMode ? '1px solid #444' : '1px solid #ddd', paddingLeft: '12px' }}>
          <span style={{ ...styles.legendDot, backgroundColor: '#7c4dff' }} />Class Schedule
        </span>
        <span style={{ ...styles.legendItem, fontStyle: 'italic', opacity: 0.7 }}>Color = course</span>
      </div>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1 }}
        eventPropGetter={eventStyleGetter}
        components={{
          event: CustomEvent
        }}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
        popup
        onSelectEvent={(event) => {
          if (event.resource.html_url) {
            window.open(event.resource.html_url, '_blank', 'noopener,noreferrer');
          }
        }}
        tooltipAccessor={(event) => {
          if (event.resource.event_type === 'course') {
            const start = moment(event.start).format('MMM D, YYYY');
            const end = event.end ? moment(event.end).format('MMM D, YYYY') : 'TBD';
            return `${event.resource.name}\n${event.resource.course_code || ''}\n${start} - ${end}`;
          }
          if (event.resource.event_type === 'class_event') {
            return `${event.resource.context_name || ''}\n${event.resource.title}${event.resource.location_name ? '\n📍 ' + event.resource.location_name : ''}`;
          }
          if (event.resource.event_type === 'schedule') {
            const startTime = moment(event.start).format('h:mm A');
            const endTime = moment(event.end).format('h:mm A');
            return `${event.resource.course_name}\n${startTime} - ${endTime}${event.resource.location ? '\n📍 ' + event.resource.location : ''}`;
          }
          return `${event.resource.course_name}\n${event.resource.title}\n${event.resource.points_possible || 0} points`;
        }}
      />
    </div>
  );
};

const styles = {
  container: {
    height: 'calc(100vh - 120px)',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    margin: '15px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    display: 'inline-block'
  }
};

export default Calendar;
