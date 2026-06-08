// src/api/parentApi.ts
import apiClient from './apiClient';
import { Parent } from '../../shared/types/parent';

const endpoint = '/parents';

export const getAllParents = async (): Promise<Parent[]> => {
  const { data } = await apiClient.get(endpoint);
  return data;
};

export const getParentById = async (id: string): Promise<Parent> => {
  const { data } = await apiClient.get(`${endpoint}/${id}`);
  return data;
};

export const createParent = async (parent: Parent): Promise<Parent> => {
  const { data } = await apiClient.post(endpoint, parent);
  return data;
};

export const updateParent = async (id: string, parent: Partial<Parent>): Promise<Parent> => {
  const { data } = await apiClient.put(`${endpoint}/${id}`, parent);
  return data;
};

export const deleteParent = async (id: string): Promise<void> => {
  await apiClient.delete(`${endpoint}/${id}`);
};
