import React from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const Calendar = ({ assignments, calendarEvents = [], courses = [], darkMode }) => {
  // Convert assignments to calendar events
  const assignmentEvents = assignments
    .filter(a => a.due_at)
    .map(a => ({
      id: `assignment-${a.id}`,
      title: `${a.course_name}: ${a.title}`,
      start: new Date(a.due_at),
      end: new Date(a.due_at),
      resource: { ...a, event_type: 'assignment' },
      allDay: false
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

  // Merge all event types
  const events = [...assignmentEvents, ...classEvents, ...courseEvents];

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

    // Assignment styling (existing logic)
    const isCompleted = event.resource.is_completed;
    const dueDate = moment(event.start);
    const now = moment();
    const daysUntilDue = dueDate.diff(now, 'days');

    let backgroundColor = '#3174ad'; // Default blue

    if (isCompleted) {
      backgroundColor = '#4caf50'; // Green for completed
    } else if (daysUntilDue < 0) {
      backgroundColor = '#d32f2f'; // Red for overdue
    } else if (daysUntilDue <= 2) {
      backgroundColor = '#f57c00'; // Orange for due soon
    } else if (daysUntilDue <= 7) {
      backgroundColor = '#fbc02d'; // Yellow for due this week
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: isCompleted ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block',
        textDecoration: isCompleted ? 'line-through' : 'none'
      }
    };
  };

  const CustomEvent = ({ event }) => (
    <div style={{ fontSize: '12px', padding: '2px' }}>
      <strong>
        {event.resource.event_type === 'course' ? '📘 ' : ''}
        {event.resource.event_type === 'class_event' ? '🏫 ' : ''}
        {event.title}
      </strong>
      {event.resource.event_type === 'assignment' && event.resource.points_possible && (
        <div style={{ fontSize: '11px' }}>
          {event.resource.points_possible} pts
        </div>
      )}
      {event.resource.event_type === 'class_event' && event.resource.location_name && (
        <div style={{ fontSize: '11px' }}>
          📍 {event.resource.location_name}
        </div>
      )}
      {event.resource.event_type === 'course' && (
        <div style={{ fontSize: '11px' }}>
          {event.resource.course_code || ''} {event.resource.marker === 'start' ? '▶' : '◼'}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      ...styles.container,
      backgroundColor: darkMode ? '#1e1e2e' : '#f5f5f5',
      border: darkMode ? '1px solid #333' : '1px solid #e0e0e0'
    }}
      className={darkMode ? 'dark-calendar' : ''}
    >
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
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
    border: '1px solid #e0e0e0'
  }
};

export default Calendar;
