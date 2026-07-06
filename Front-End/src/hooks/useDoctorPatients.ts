import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import { toast } from 'sonner';

export const useDoctorPatients = (params: any) => {
    return useQuery({
        queryKey: ['doctor-patients', params],
        queryFn: () => doctorService.getPatients(params),
        placeholderData: (previousData) => previousData, // smooth pagination
    });
};

export const useDoctorPatientDetails = (id: number) => {
    return useQuery({
        queryKey: ['doctor-patient', id],
        queryFn: () => doctorService.getPatient(id),
        enabled: !!id,
    });
};

export const useAddPatientNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, note }: { id: number; note: string }) => doctorService.addPatientNote(id, note),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['doctor-patient', variables.id] });
            toast.success('تم إضافة الملاحظة بنجاح');
        },
        onError: () => toast.error('حدث خطأ أثناء إضافة الملاحظة'),
    });
};
