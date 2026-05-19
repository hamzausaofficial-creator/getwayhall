import client from './client';

export const getVenues = async (params) => {
  const response = await client.get('/venues/', { params });
  return response.data;
};

export const getVenue = async (id) => {
  const response = await client.get(`/venues/${id}/`);
  return response.data;
};

export const createVenue = async (data) => {
  const response = await client.post('/venues/', data);
  return response.data;
};

export const updateVenue = async (id, data) => {
  const response = await client.put(`/venues/${id}/`, data);
  return response.data;
};

export const deleteVenue = async (id) => {
  const response = await client.delete(`/venues/${id}/`);
  return response.data;
};
