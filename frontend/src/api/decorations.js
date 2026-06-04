import client from './client';

export const getDecorationPackages = async (params) => {
  const response = await client.get('/decorations/packages/', { params });
  return response.data;
};

export const getDecorationPackage = async (id) => {
  const response = await client.get(`/decorations/packages/${id}/`);
  return response.data;
};
