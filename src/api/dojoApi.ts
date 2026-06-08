// src/api/dojoApi.ts
import apiClient from './apiClient';
import { Dojo } from '../../shared/types/dojo';

const endpoint = '/dojos';

export const getAllDojos = async (): Promise<Dojo[]> => {
  const { data } = await apiClient.get(endpoint);
  return data;
};

export const getDojoById = async (id: string): Promise<Dojo> => {
  const { data } = await apiClient.get(`${endpoint}/${id}`);
  return data;
};

export const createDojo = async (dojo: Dojo): Promise<Dojo> => {
  const { data } = await apiClient.post(endpoint, dojo);
  return data;
};

export const updateDojo = async (id: string, dojo: Partial<Dojo>): Promise<Dojo> => {
  const { data } = await apiClient.put(`${endpoint}/${id}`, dojo);
  return data;
};

export const deleteDojo = async (id: string): Promise<void> => {
  await apiClient.delete(`${endpoint}/${id}`);
};
