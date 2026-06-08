// src/api/familyApi.ts
import apiClient from './apiClient';
import { Family } from '../../shared/types/family';

const endpoint = '/families';

export const getAllFamilies = async (): Promise<Family[]> => {
  const { data } = await apiClient.get(endpoint);
  return data;
};

export const getFamilyById = async (id: string): Promise<Family> => {
  const { data } = await apiClient.get(`${endpoint}/${id}`);
  return data;
};

export const createFamily = async (family: Family): Promise<Family> => {
  const { data } = await apiClient.post(endpoint, family);
  return data;
};

export const updateFamily = async (id: string, family: Partial<Family>): Promise<Family> => {
  const { data } = await apiClient.put(`${endpoint}/${id}`, family);
  return data;
};

export const deleteFamily = async (id: string): Promise<void> => {
  await apiClient.delete(`${endpoint}/${id}`);
};
