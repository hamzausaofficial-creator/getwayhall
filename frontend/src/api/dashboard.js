import client from './client';

export const getDashboardStats = async (params = {}) => {
  const response = await client.get('/dashboard/stats/', {
    params: { ...params, _t: Date.now() },
  });
  return response.data;
};
