import { useClerk } from '@clerk/clerk-react';

export const getAuthToken = async () => {
  const clerk = useClerk();
  const token = await clerk.session?.getToken();
  return token;
};

export const appendAuthHeaders = async (headers: HeadersInit = {}) => {
  const token = await getAuthToken();
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers;
};