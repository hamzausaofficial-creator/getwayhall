import client from './client';

export const getInventoryItems = async (params) => {
  const response = await client.get('/inventory/items/', { params });
  return response.data;
};

export const getInventoryItem = async (id) => {
  const response = await client.get(`/inventory/items/${id}/`);
  return response.data;
};
