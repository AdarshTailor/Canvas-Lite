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
            per_page: 100,
            'include[]': 'term'
          },
          timeout: 10000
        }
      );

      // Filter to current semester only — default reject unless provably current
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      let currentSemester;
      if (currentMonth <= 5) currentSemester = 'spring';
      else if (currentMonth <= 7) currentSemester = 'summer';
      else currentSemester = 'fall';

      const isCurrentSemester = (text) => {
        const lower = text.toLowerCase();
        const semesterPattern = /(spring|fall|summer)\s*(20\d{2}|\d{2})\b/g;
        let match;
        while ((match = semesterPattern.exec(lower)) !== null) {
          const sem = match[1];
          let yr = parseInt(match[2]);
          if (yr < 100) yr += 2000;
          if (sem === currentSemester && yr === currentYear) return 'current';
          return 'old'; // has semester info but doesn't match current
        }
        return 'none'; // no semester info found
      };

      return response.data.filter(course => {
        // 1. Check term name
        const termCheck = (course.term && course.term.name) ? isCurrentSemester(course.term.name) : 'none';
        if (termCheck === 'current') return true;
        if (termCheck === 'old') return false;

        // 2. Check course name for semester+year patterns
        const nameCheck = isCurrentSemester(course.name || '');
        if (nameCheck === 'current') return true;
        if (nameCheck === 'old') return false;

        // 3. No semester info anywhere — check if term dates encompass now
        if (course.term && course.term.start_at && course.term.end_at) {
          const termStart = new Date(course.term.start_at);
          const termEnd = new Date(course.term.end_at);
          if (termStart <= now && termEnd >= now) return true;
          return false;
        }

        // 4. Check course-level dates
        if (course.start_at && course.end_at) {
          const courseStart = new Date(course.start_at);
          const courseEnd = new Date(course.end_at);
          if (courseStart <= now && courseEnd >= now) return true;
          return false;
        }

        // 5. No semester info, no dates — likely an advising shell, filter out
        return false;
      });
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

        // Paginate through all results for each batch
        let page = 1;
        while (true) {
          // Use URLSearchParams to correctly serialize context_codes[]
          // axios 1.x default serializer adds indexes (context_codes[][0])
          // which Canvas API does not understand
          const params = new URLSearchParams();
          params.append('type', 'event');
          params.append('start_date', startDate);
          params.append('end_date', endDate);
          params.append('per_page', '100');
          params.append('page', String(page));
          batch.forEach(code => params.append('context_codes[]', code));

          const response = await axios.get(
            `${this.baseUrl}/api/v1/calendar_events`,
            {
              headers: this.headers,
              params,
              timeout: 15000
            }
          );

          allEvents.push(...response.data);

          // Stop if we got fewer than per_page results (last page)
          if (response.data.length < 100) break;
          page++;
        }
      }

      return allEvents;
    } catch (error) {
      console.error('Error fetching calendar events:', error.message);
      return [];
    }
  }

  async getScheduleData() {
    const results = { courses: [], sections: [], calendarEvents: [], enrollments: [] };

    try {
      // 1. Courses with sections and term info
      const coursesRes = await axios.get(
        `${this.baseUrl}/api/v1/courses`,
        {
          headers: this.headers,
          params: {
            enrollment_state: 'active',
            per_page: 100,
            'include[]': ['sections', 'term', 'total_students']
          },
          timeout: 10000
        }
      );
      results.courses = coursesRes.data;

      // 2. Detailed sections for each course (may contain meeting times)
      const filteredCourses = await this.getCourses();
      for (const course of filteredCourses) {
        try {
          const sectionsRes = await axios.get(
            `${this.baseUrl}/api/v1/courses/${course.id}/sections`,
            {
              headers: this.headers,
              params: { 'include[]': ['students', 'total_students'] },
              timeout: 10000
            }
          );
          results.sections.push({
            course_id: course.id,
            course_name: course.name,
            sections: sectionsRes.data
          });
        } catch (err) {
          results.sections.push({ course_id: course.id, error: err.message });
        }
      }

      // 3. Calendar events — fetch WITHOUT type filter to see everything
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const contextCodes = filteredCourses.map(c => `course_${c.id}`);
      const params = new URLSearchParams();
      params.append('start_date', start);
      params.append('end_date', end);
      params.append('per_page', '50');
      contextCodes.forEach(code => params.append('context_codes[]', code));

      const eventsRes = await axios.get(
        `${this.baseUrl}/api/v1/calendar_events`,
        { headers: this.headers, params, timeout: 15000 }
      );
      results.calendarEvents = eventsRes.data;

      // 4. User enrollments
      const enrollRes = await axios.get(
        `${this.baseUrl}/api/v1/users/self/enrollments`,
        {
          headers: this.headers,
          params: { per_page: 100 },
          timeout: 10000
        }
      );
      results.enrollments = enrollRes.data;
    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  async getICSFeeds() {
    try {
      // Get courses with calendar ICS URLs
      const coursesRes = await axios.get(
        `${this.baseUrl}/api/v1/courses`,
        {
          headers: this.headers,
          params: {
            enrollment_state: 'active',
            per_page: 100,
            'include[]': ['sections', 'term']
          },
          timeout: 10000
        }
      );

      const filteredCourses = await this.getCourses();
      const filteredIds = new Set(filteredCourses.map(c => c.id));

      const results = [];
      for (const course of coursesRes.data) {
        if (!filteredIds.has(course.id)) continue;
        if (!course.calendar || !course.calendar.ics) continue;

        try {
          const icsRes = await axios.get(course.calendar.ics, { timeout: 10000 });
          results.push({
            course_id: course.id,
            course_name: course.name,
            ics_url: course.calendar.ics,
            ics_content: icsRes.data
          });
        } catch (err) {
          results.push({
            course_id: course.id,
            course_name: course.name,
            error: err.message
          });
        }
      }

      return results;
    } catch (error) {
      return [{ error: error.message }];
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