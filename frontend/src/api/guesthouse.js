import client from './client';

const unwrap = (data) => (Array.isArray(data) ? data : data?.results || data || []);

export const getGuestHouseStats = (params) => client.get('/guesthouse/stats/', { params }).then((r) => r.data);
export const getGuestHouseReports = (params) => client.get('/guesthouse/reports/', { params }).then((r) => r.data);
export const getGuestHouseCalendar = (params) => client.get('/guesthouse/calendar/', { params }).then((r) => r.data);
export const getGuestHouseAlerts = () => client.get('/guesthouse/alerts/').then((r) => r.data);
export const guestHouseSearch = (q) => client.get('/guesthouse/search/', { params: { q } }).then((r) => r.data);

export const listRooms = (params) => client.get('/guesthouse/rooms/', { params }).then((r) => unwrap(r.data));
export const getRoom = (id) => client.get(`/guesthouse/rooms/${id}/`).then((r) => r.data);
export const createRoom = (payload) => client.post('/guesthouse/rooms/', payload).then((r) => r.data);
export const updateRoom = (id, payload) => client.patch(`/guesthouse/rooms/${id}/`, payload).then((r) => r.data);
export const deleteRoom = (id) => client.delete(`/guesthouse/rooms/${id}/`);

export const listStays = (params) => client.get('/guesthouse/stays/', { params }).then((r) => unwrap(r.data));
export const getStay = (id) => client.get(`/guesthouse/stays/${id}/`).then((r) => r.data);
export const createStay = (payload) => client.post('/guesthouse/stays/', payload).then((r) => r.data);
export const updateStay = (id, payload) => client.patch(`/guesthouse/stays/${id}/`, payload).then((r) => r.data);
export const deleteStay = (id) => client.delete(`/guesthouse/stays/${id}/`);
export const stayCheckIn = (id) => client.post(`/guesthouse/stays/${id}/check_in/`).then((r) => r.data);
export const stayCheckOut = (id) => client.post(`/guesthouse/stays/${id}/check_out/`).then((r) => r.data);
export const stayCancel = (id) => client.post(`/guesthouse/stays/${id}/cancel/`).then((r) => r.data);
export const stayConfirm = (id) => client.post(`/guesthouse/stays/${id}/confirm/`).then((r) => r.data);

export const listGhPayments = (params) => client.get('/guesthouse/payments/', { params }).then((r) => unwrap(r.data));
export const getGhPayment = (id) => client.get(`/guesthouse/payments/${id}/`).then((r) => r.data);
export const createGhPayment = (payload) => client.post('/guesthouse/payments/', payload).then((r) => r.data);
export const updateGhPayment = (id, payload) => client.patch(`/guesthouse/payments/${id}/`, payload).then((r) => r.data);
export const deleteGhPayment = (id) => client.delete(`/guesthouse/payments/${id}/`);

export const listGhExpenses = (params) => client.get('/guesthouse/expenses/', { params }).then((r) => unwrap(r.data));
export const getGhExpense = (id) => client.get(`/guesthouse/expenses/${id}/`).then((r) => r.data);
export const createGhExpense = (payload) => client.post('/guesthouse/expenses/', payload).then((r) => r.data);
export const updateGhExpense = (id, payload) => client.patch(`/guesthouse/expenses/${id}/`, payload).then((r) => r.data);
export const deleteGhExpense = (id) => client.delete(`/guesthouse/expenses/${id}/`);
