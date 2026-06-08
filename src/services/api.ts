import axios from 'axios';
import { Student } from '../types';

const API_URL = 'http://localhost:5000/api';

export const getStudents = async (): Promise<Student[]> => {
  const res = await axios.get(`${API_URL}/students`);
  return res.data;
};

export const addStudent = async (student: Partial<Student>): Promise<Student> => {
  const res = await axios.post(`${API_URL}/students`, student);
  return res.data;
};