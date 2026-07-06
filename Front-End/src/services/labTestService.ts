import api from './api';
import type {
  LabTest,
  LabTestStatusResponse,
  UploadLabTestResponse,
} from '../types/labTest';

const BASE = '/patient/lab-tests';

export const labTestService = {
  /**
   * رفع صورة تحليل جديدة
   * POST /patient/lab-tests
   */
  upload: async (image: File): Promise<UploadLabTestResponse> => {
    const form = new FormData();
    form.append('image', image);
    const { data } = await api.post(BASE, form);
    return data.data;
  },

  /**
   * Polling endpoint — جلب حالة التحليل
   * GET /patient/lab-tests/{id}/status
   */
  checkStatus: async (id: number): Promise<LabTestStatusResponse> => {
    const { data } = await api.get(`${BASE}/${id}/status`);
    return data.data;
  },

  /**
   * جلب كل التحاليل مع pagination
   * GET /patient/lab-tests?page={page}
   */
  getAll: async (page = 1): Promise<{ data: LabTest[]; meta: unknown }> => {
    const { data } = await api.get(`${BASE}?page=${page}`);
    return data;
  },

  /**
   * تفاصيل تحليل واحد
   * GET /patient/lab-tests/{id}
   */
  getOne: async (id: number): Promise<LabTest> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /**
   * حذف تحليل
   * DELETE /patient/lab-tests/{id}
   */
  deleteTest: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
