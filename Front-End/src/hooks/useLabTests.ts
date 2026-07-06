import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labTestService } from '../services/labTestService';
import type { LabTest } from '../types/labTest';
import { toast } from 'sonner';

export function useLabTests() {
  const queryClient = useQueryClient();

  // Fetch history
  const labTestsQuery = useQuery({
    queryKey: ['lab-tests'],
    queryFn: () => labTestService.getAll(),
  });

  // Upload mutation (Synchronous OCR)
  const uploadMutation = useMutation({
    mutationFn: labTestService.upload,
    onSuccess: (res) => {
      // res.status is now returned immediately as 'completed' or 'failed'
      if (res.status === 'completed') {
        toast.success('تم استخراج نتائج التحليل بنجاح ✓');
      } else {
        // Even if the DB says 'failed', it didn't throw an HTTP error
        toast.error('لم نتمكن من قراءة الصور بدقة عالية، جربي تحميل صورة أوضح');
      }
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'فشل رفع الصورة';
      const status = err.response?.status ? `(Status: ${err.response.status})` : '';
      toast.error(`${msg} ${status}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: labTestService.deleteTest,
    onSuccess: () => {
      toast.success('تم الحذف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
    },
    onError: () => {
      toast.error('فشل الحذف، حاولي مرة أخرى');
    },
  });

  return {
    labTests: labTestsQuery.data?.data as LabTest[] | undefined,
    isLoading: labTestsQuery.isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    isPolling: false, // Disabled polling
    currentPollingId: null,
    deleteTest: deleteMutation.mutate,
    error: labTestsQuery.error,
  };
}
