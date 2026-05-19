import client from './client';

export const login = async (credentials) => {
  const response = await client.post('/auth/login/', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await client.post('/auth/register/', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await client.get('/auth/me/');
  return response.data;
};

export const updateMe = async (data) => {
  const response = await client.patch('/auth/me/', data);
  return response.data;
};
