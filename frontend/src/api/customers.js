import client from './client';

export const getCustomers = async (params) => {
  const response = await client.get('/customers/', { params });
  return response.data;
};

/** Guest House booking / guest list — primary bookers only (excludes linked companions). */
export const getPrimaryCustomers = async () => {
  const data = await getCustomers({ primary_only: '1' });
  return data?.results || data || [];
};

export const createCustomer = async (data) => {
  const response = await client.post('/customers/', data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await client.put(`/customers/${id}/`, data);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await client.delete(`/customers/${id}/`);
  return response.data;
};

export const getCustomerTravelCompanions = async (customerId) => {
  const response = await client.get(`/customers/${customerId}/travel-companions/`);
  return response.data?.companions || [];
};
