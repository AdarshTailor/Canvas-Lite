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

export const toggleAssignmentCompletion = async (assignmentId, isCompleted) => {
  const response = await axios.patch(
    `${API_BASE_URL}/assignments/${assignmentId}/complete`,
    null,
    { params: { is_completed: isCompleted } }
  );
  return response.data;
};
