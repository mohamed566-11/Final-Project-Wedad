import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useDoctorArticles = (params: any) => {
    return useQuery({
        queryKey: ['doctor-articles', params],
        queryFn: () => doctorService.getArticles(params),
        staleTime: 0,
        refetchOnMount: true,
        placeholderData: (previousData) => previousData,
    });
};

export const useDoctorArticle = (id: number) => {
    return useQuery({
        queryKey: ['doctor-article', id],
        queryFn: () => doctorService.getArticle(id),
        staleTime: 0,
        refetchOnMount: true,
        enabled: !!id,
    });
};

export const useCreateArticle = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: doctorService.createArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-articles'] });
            toast.success('تم إنشاء المقال بنجاح');
            navigate('/doctor/articles');
        },
        onError: (error: any) => {
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
            } else {
                toast.error(error.response?.data?.message || 'فشل إنشاء المقال');
            }
        }
    });
};

export const useUpdateArticle = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => doctorService.updateArticle(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-articles'] });
            toast.success('تم تحديث المقال بنجاح');
            navigate('/doctor/articles');
        },
        onError: (error: any) => {
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
            } else {
                toast.error(error.response?.data?.message || 'فشل تحديث المقال');
            }
        }
    });
};

export const useDeleteArticle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: doctorService.deleteArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-articles'] });
            toast.success('تم حذف المقال');
        },
        onError: () => toast.error('فشل حذف المقال')
    });
};

export const useSubmitArticle = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: doctorService.submitArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctor-articles'] });
            toast.success('تم إرسال المقال للمراجعة');
        },
        onError: () => toast.error('فشل إرسال المقال')
    });
};
