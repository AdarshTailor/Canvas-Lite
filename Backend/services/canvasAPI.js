const axios = require('axios');

class CanvasAPI {
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.accessToken = accessToken;
    this.headers = {
      'Authorization': `Bearer ${accessToken}`
    };
  }

  async testConnection() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/users/self`,
        { headers: this.headers, timeout: 10000 }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error.message);
      return false;
    }
  }

  async getCourses() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/courses`,
        {
          headers: this.headers,
          params: {
            enrollment_state: 'active',
            per_page: 100
          },
          timeout: 10000
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error.message);
      return [];
    }
  }

  async getAssignments(courseId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/courses/${courseId}/assignments`,
        {
          headers: this.headers,
          params: { per_page: 100 },
          timeout: 10000
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error.message);
      return [];
    }
  }

  async getAllAssignments() {
    const courses = await this.getCourses();
    const allAssignments = [];

    for (const course of courses) {
      const courseId = course.id;
      const courseName = course.name || 'Unknown Course';

      const assignments = await this.getAssignments(courseId);

      for (const assignment of assignments) {
        assignment.course_name = courseName;
        assignment.course_id = String(courseId);
        allAssignments.push(assignment);
      }
    }

    return allAssignments;
  }

  async getCalendarEvents(startDate, endDate) {
    try {
      const courses = await this.getCourses();
      const contextCodes = courses.map(c => `course_${c.id}`);

      const allEvents = [];
      // Fetch in batches since context_codes is an array param
      for (let i = 0; i < contextCodes.length; i += 10) {
        const batch = contextCodes.slice(i, i + 10);
        const response = await axios.get(
          `${this.baseUrl}/api/v1/calendar_events`,
          {
            headers: this.headers,
            params: {
              type: 'event',
              start_date: startDate,
              end_date: endDate,
              per_page: 100,
              'context_codes[]': batch
            },
            timeout: 15000
          }
        );
        allEvents.push(...response.data);
      }

      return allEvents;
    } catch (error) {
      console.error('Error fetching calendar events:', error.message);
      return [];
    }
  }

  parseAssignment(assignment) {
    let dueAt = assignment.due_at;
    if (dueAt) {
      try {
        dueAt = new Date(dueAt);
      } catch {
        dueAt = null;
      }
    }

    return {
      canvas_id: String(assignment.id),
      title: assignment.name || 'Untitled Assignment',
      description: assignment.description || '',
      due_at: dueAt,
      course_name: assignment.course_name || 'Unknown Course',
      course_id: assignment.course_id,
      points_possible: assignment.points_possible,
      submission_types: (assignment.submission_types || []).join(','),
      html_url: assignment.html_url
    };
  }
}

module.exports = CanvasAPI;