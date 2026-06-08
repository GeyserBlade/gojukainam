// src/api/studentApi.ts
import apiClient from './apiClient';
import { Student } from '../../shared/types/student';

const endpoint = '/students';

export const getAllStudents = async (): Promise<Student[]> => {
  const { data } = await apiClient.get(endpoint);
  return data;
};

export const getStudentById = async (id: string): Promise<Student> => {
  const { data } = await apiClient.get(`${endpoint}/${id}`);
  return data;
};

export const createStudent = async (student: Student): Promise<Student> => {
  const { data } = await apiClient.post(endpoint, student);
  return data;
};

export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  const { data } = await apiClient.put(`${endpoint}/${id}`, student);
  return data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await apiClient.delete(`${endpoint}/${id}`);
};
