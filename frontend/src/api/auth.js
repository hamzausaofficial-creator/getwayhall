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

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('profile_picture', file);
  const response = await client.patch('/auth/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const changePassword = async ({ current_password, new_password, confirm_password }) => {
  const response = await client.post('/auth/change-password/', {
    current_password,
    new_password,
    confirm_password,
  });
  return response.data;
};
