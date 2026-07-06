import api from './api';

export const profileService = {
  // Get full profile
  getProfile: async () => {
    const response = await api.get('/patient/profile');
    return response.data;
  },

  // Update basic info
  updateBasicInfo: async (data: FormData) => {
    const response = await api.post('/patient/profile/basic', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update medical info
  updateMedicalInfo: async (data: any) => {
    const response = await api.put('/patient/profile/medical', data);
    return response.data;
  },

  // Update emergency contact
  updateEmergencyContact: async (data: any) => {
    const response = await api.put('/patient/profile/emergency', data);
    return response.data;
  },

  // Get profile stats
  getStats: async () => {
    const response = await api.get('/patient/profile/stats');
    return response.data;
  },

  // Delete profile image
  deleteImage: async () => {
    const response = await api.delete('/patient/profile/image');
    return response.data;
  },

  // Get life stages
  getLifeStages: async () => {
    const response = await api.get('/patient/life-stages');
    return response.data;
  },

  updatePassword: async (data: any) => {
    const response = await api.put('/patient/profile/password', data);
    return response.data;
  },

  // Medical Files
  getMedicalFiles: async () => {
    const response = await api.get('/patient/profile/medical-files');
    return response.data;
  },

  uploadMedicalFile: async (data: FormData) => {
    const response = await api.post('/patient/profile/medical-files', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteMedicalFile: async (id: number) => {
    const response = await api.delete(`/patient/profile/medical-files/${id}`);
    return response.data;
  },

  downloadMedicalFile: async (id: number) => {
    return await api.get(`/patient/profile/medical-files/${id}/download`, {
      responseType: 'blob'
    });
  }
};
