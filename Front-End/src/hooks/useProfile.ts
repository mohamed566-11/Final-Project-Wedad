import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { toast } from 'sonner';

export const useProfile = () => {
  const queryClient = useQueryClient();

  // Fetch full profile
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch stats separately if needed, or extract from profile
  const statsQuery = useQuery({
    queryKey: ['profile-stats'],
    queryFn: profileService.getStats,
    enabled: !!profileQuery.data, // Only fetch if profile exists
  });

  // Fetch life stages
  const lifeStagesQuery = useQuery({
    queryKey: ['life-stages'],
    queryFn: profileService.getLifeStages,
    staleTime: Infinity, // These rarely change
  });

  // Fetch Medical Files
  const medicalFilesQuery = useQuery({
    queryKey: ['medical-files'],
    queryFn: profileService.getMedicalFiles,
  });

  // Mutation for Basic Info
  const updateBasicInfoMutation = useMutation({
    mutationFn: profileService.updateBasicInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('تم تحديث المعلومات الأساسية بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل تحديث المعلومات');
    },
  });

  // Mutation for Medical Info
  const updateMedicalInfoMutation = useMutation({
    mutationFn: profileService.updateMedicalInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('تم تحديث المعلومات الطبية بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل تحديث المعلومات الطبية');
    },
  });

  // Mutation for Emergency Contact
  const updateEmergencyContactMutation = useMutation({
    mutationFn: profileService.updateEmergencyContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('تم تحديث معلومات الطوارئ بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل تحديث معلومات الطوارئ');
    },
  });

  // Delete Image Mutation
  const deleteImageMutation = useMutation({
    mutationFn: profileService.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('تم حذف الصورة الشخصية بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل حذف الصورة');
    },
  });

  // Mutation for Password Update
  const updatePasswordMutation = useMutation({
    mutationFn: profileService.updatePassword,
    onSuccess: () => {
      toast.success('تم تغيير كلمة المرور بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل تغيير كلمة المرور');
    },
  });

  // Medical Files Mutations
  const uploadMedicalFileMutation = useMutation({
    mutationFn: profileService.uploadMedicalFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-files'] });
      toast.success('تم رفع الملف الطبي بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل رفع الملف');
    },
  });

  const deleteMedicalFileMutation = useMutation({
    mutationFn: profileService.deleteMedicalFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-files'] });
      toast.success('تم حذف الملف الطبي بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'فشل حذف الملف');
    },
  });

  return {
    profile: profileQuery.data?.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    stats: statsQuery.data?.data,
    lifeStages: lifeStagesQuery.data?.data,

    updateBasicInfo: updateBasicInfoMutation.mutate,
    isUpdatingBasic: updateBasicInfoMutation.isPending,

    updateMedicalInfo: updateMedicalInfoMutation.mutate,
    isUpdatingMedical: updateMedicalInfoMutation.isPending,

    updateEmergencyContact: updateEmergencyContactMutation.mutate,
    isUpdatingEmergency: updateEmergencyContactMutation.isPending,

    deleteImage: deleteImageMutation.mutate,
    isDeletingImage: deleteImageMutation.isPending,

    updatePassword: updatePasswordMutation.mutate,
    isUpdatingPassword: updatePasswordMutation.isPending,

    medicalFiles: medicalFilesQuery.data?.data,
    isMedicalFilesLoading: medicalFilesQuery.isLoading,

    uploadMedicalFile: uploadMedicalFileMutation.mutate,
    isUploadingMedicalFile: uploadMedicalFileMutation.isPending,

    deleteMedicalFile: deleteMedicalFileMutation.mutate,
    isDeletingMedicalFile: deleteMedicalFileMutation.isPending,

    refreshProfile: profileQuery.refetch,
  };
};