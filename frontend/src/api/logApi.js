import API from './apiConfig';

export const getSystemLogs = (page = 1) => API.get(`/logs?page=${page}`);
export const getLogsByModule = (moduleName) => API.get(`/logs/module/${moduleName}`);