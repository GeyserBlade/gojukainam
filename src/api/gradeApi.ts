// src/api/gradeApi.ts
import apiClient from './apiClient';
import { Grade } from '../../shared/types/grade';

const endpoint = '/grades';

export const getAllGrades = async (): Promise<Grade[]> => {
  const { data } = await apiClient.get(endpoint);
  return data;
};

export const getGradeById = async (id: string): Promise<Grade> => {
  const { data } = await apiClient.get(`${endpoint}/${id}`);
  return data;
};

export const createGrade = async (grade: Grade): Promise<Grade> => {
  const { data } = await apiClient.post(endpoint, grade);
  return data;
};

export const updateGrade = async (id: string, grade: Partial<Grade>): Promise<Grade> => {
  const { data } = await apiClient.put(`${endpoint}/${id}`, grade);
  return data;
};

export const deleteGrade = async (id: string): Promise<void> => {
  await apiClient.delete(`${endpoint}/${id}`);
};
