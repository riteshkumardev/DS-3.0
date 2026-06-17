// 🚀 Centralized API instance import kiya jo aapke stocks wale code me hai
import API from './apiConfig';

/**
 * @desc    Record/Create a new lead order or follow-up action item
 * @route   POST /api/leads/follow-ups
 */
export const createFollowUp = (payload) => API.post('/leads/follow-ups', payload);

/**
 * @desc    Get all active, pending and overdue follow-ups for Dashboard Alerts
 * @route   GET /api/leads/active
 */
export const getActiveFollowUps = () => API.get('/leads/active');

/**
 * @desc    Get pending client actions based on vehicle route location (e.g., LAKHISARAI, DUMKA)
 * @route   GET /api/leads/route/:location
 */
export const getLeadsByRouteLocation = (location) => {
    const cleanLocation = String(location || "").trim().toUpperCase();
    return API.get(`/leads/route/${cleanLocation}`);
};

/**
 * @desc    Update lead status (e.g., PENDING -> ORDER_RECEIVED or COMPLAINT_RESOLVED)
 * @route   PUT /api/leads/follow-ups/:id
 */
export const updateLeadStatus = (id, payload) => API.put(`/leads/follow-ups/${id}`, payload);