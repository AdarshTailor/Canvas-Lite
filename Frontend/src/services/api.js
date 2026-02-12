import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const validateToken = async (canvasUrl, canvasToken) => {
  const response = await axios.post(`${API_BASE_URL}/validate-token`, {
    canvas_url: canvasUrl,
    canvas_token: canvasToken
  });
  return response.data;
};

export const syncAssignments = async (canvasUrl, canvasToken) => {
  const response = await axios.post(`${API_BASE_URL}/sync`, {
    canvas_url: canvasUrl,
    canvas_token: canvasToken
  });
  return response.data;
};

export const getAssignments = async (canvasToken) => {
  const response = await axios.get(`${API_BASE_URL}/assignments`, {
    params: { canvas_token: canvasToken }
  });
  return response.data;
};

export const getSyncStatus = async (canvasToken) => {
  const response = await axios.get(`${API_BASE_URL}/sync-status`, {
    params: { canvas_token: canvasToken }
  });
  return response.data;
};

export const getCalendarEvents = async (canvasToken, startDate, endDate) => {
  const params = { canvas_token: canvasToken };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await axios.get(`${API_BASE_URL}/calendar-events`, { params });
  return response.data;
};

export const getCourses = async (canvasToken) => {
  const response = await axios.get(`${API_BASE_URL}/courses`, {
    params: { canvas_token: canvasToken }
  });
  return response.data;
};

/**
 * Updated to support Multi-User Architecture
 * @param {string} assignmentId - This should be the canvas_id
 * @param {boolean} isCompleted - The new status
 * @param {string} canvasToken - Required to identify the specific user
 */
export const getClassSchedule = async (canvasToken) => {
  const response = await axios.get(`${API_BASE_URL}/schedule`, {
    params: { canvas_token: canvasToken }
  });
  return response.data;
};

export const saveClassSchedule = async (canvasToken, entries) => {
  const response = await axios.post(`${API_BASE_URL}/schedule`, {
    canvas_token: canvasToken,
    entries
  });
  return response.data;
};

export const toggleAssignmentCompletion = async (assignmentId, isCompleted, canvasToken) => {
  const response = await axios.patch(
    `${API_BASE_URL}/assignments/${assignmentId}/complete`,
    { 
      is_completed: isCompleted,
      canvas_token: canvasToken // Sent in body for security and identification
    }
  );
  return response.data;
};