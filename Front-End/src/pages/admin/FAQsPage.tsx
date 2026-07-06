import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Save, X, Search,
    ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
    GripVertical, Loader2, HelpCircle
} from 'lucide-react';
import Card from '@/components/common/Card';
import { toast } from 'sonner';
import adminSettingsService, { FAQ, LifeStage, FaqFormData } from '@/services/adminSettingsService';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FAQsPage: React.FC = () => {
    // State
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [lifeStages, setLifeStages] = useState<LifeStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStage, setFilterStage] = useState<number | ''>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState<FaqFormData>({
        question: '',
        answer: '',
        life_stage_id: null,
        is_active: true,
        order: 0
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Delete Confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<FAQ | null>(null);

    // Fetch FAQs
    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const params: { life_stage_id?: number; search?: string } = {};
            if (filterStage) params.life_stage_id = filterStage;
            if (searchTerm) params.search = searchTerm;

            const response = await adminSettingsService.getFaqs(params);
            setFaqs(response.data.data.faqs);
            setLifeStages(response.data.data.life_stages);
        } catch (error) {
            toast.error('فشل في تحميل الأسئلة الشائعة');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, [filterStage]);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFaqs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Open Modal
    const openModal = (faq?: FAQ) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                life_stage_id: faq.life_stage_id,
                is_active: faq.is_active,
                order: faq.order
            });
        } else {
            setEditingFaq(null);
            setFormData({
                question: '',
                answer: '',
                life_stage_id: null,
                is_active: true,
                order: faqs.length + 1
            });
        }
        setFormErrors({});
        setIsModalOpen(true);
    };

    // Close Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingFaq(null);
        setFormErrors({});
    };

    // Validate Form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.question.trim()) errors.question = 'السؤال مطلوب';
        if (!formData.answer.trim()) errors.answer = 'الإجابة مطلوبة';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save FAQ
    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            if (editingFaq) {
                await adminSettingsService.updateFaq(editingFaq.id, formData);
                toast.success('تم تحديث السؤال بنجاح');
            } else {
                await adminSettingsService.createFaq(formData);
                toast.success('تم إنشاء السؤال بنجاح');
            }
            closeModal();
            fetchFaqs();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    // Toggle Status
    const handleToggle = async (faq: FAQ) => {
        // Optimistic UI update
        const previousFaqs = [...faqs];
        const newIsActive = !faq.is_active;
        setFaqs(faqs.map(f => f.id === faq.id ? { ...f, is_active: newIsActive } : f));

        try {
            await adminSettingsService.toggleFaqStatus(faq.id);
            toast.success(newIsActive ? 'تم تفعيل السؤال' : 'تم إلغاء تفعيل السؤال');
        } catch (error) {
            setFaqs(previousFaqs); // Revert on failure
            toast.error('فشل في تغيير حالة السؤال');
            fetchFaqs(); // Re-fetch to be safe
        }
    };

    // Delete FAQ
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await adminSettingsService.deleteFaq(deleteConfirm.id);
            toast.success('تم حذف السؤال بنجاح');
            setDeleteConfirm(null);
            fetchFaqs();
        } catch (error) {
            toast.error('فشل في حذف السؤال');
        }
    };

    // Move FAQ Up/Down
    const moveRow = async (index: number, direction: 'up' | 'down') => {
        const newFaqs = [...faqs];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= faqs.length) return;

        // Swap order values instead of re-indexing everything
        const tempOrder = newFaqs[index].order;
        newFaqs[index].order = newFaqs[targetIndex].order;
        newFaqs[targetIndex].order = tempOrder;

        // Swap position in array for UI
        [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];
        
        setFaqs(newFaqs); // Optimistic UI update

        try {
            await adminSettingsService.reorderFaqs([
                { id: newFaqs[index].id, order: newFaqs[index].order },
                { id: newFaqs[targetIndex].id, order: newFaqs[targetIndex].order }
            ]);
            toast.success('تم إعادة الترتيب بنجاح');
        } catch (error) {
            toast.error('فشل في إعادة الترتيب');
            fetchFaqs(); // Revert on failure
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-violet-600" />
                        إدارة الأسئلة الشائعة
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إضافة وتعديل الأسئلة الشائعة وترتيبها للظهور في الصفحة الرئيسية
                    </p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => openModal()}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة سؤال جديد
                </Button>
            </div>

            <Card className="p-4 bg-white/50 backdrop-blur border-slate-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="ابحث في الأسئلة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 rounded-lg border border-border bg-white pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                        />
                    </div>
                    <select
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value ? parseInt(e.target.value) : '')}
                        className="h-10 rounded-lg border border-border bg-white px-3 text-sm md:w-[240px] focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
                    >
                        <option value="">كل المراحل</option>
                        {lifeStages.map(stage => (
                            <option key={stage.id} value={stage.id}>{stage.name_ar}</option>
                        ))}
                    </select>
                </div>
            </Card>

            <div className="border-none shadow-none bg-transparent pt-2">
                {loading ? (
                    <div className="h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
                        <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <HelpCircle className="w-12 h-12 text-slate-300" />
                        <p>لا توجد أسئلة شائعة حالياً</p>
                        <Button variant="outline" className="mt-2 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={() => openModal()}>
                            إضافة سؤال جديد
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full border-separate border-spacing-y-2 px-1 text-sm bg-transparent">
                            <thead>
                                <tr>
                                    <th className="text-right py-3 px-4 font-semibold text-foreground/70 text-xs">الترتيب</th>
                                    <th className="text-right py-3 px-4 font-semibold text-foreground/70 text-xs">السؤال</th>
                                    <th className="text-center py-3 px-4 font-semibold text-foreground/70 text-xs">المرحلة</th>
                                    <th className="text-center py-3 px-4 font-semibold text-foreground/70 text-xs">الحالة</th>
                                    <th className="text-center py-3 px-4 font-semibold text-foreground/70 text-xs">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {faqs.map((faq, index) => (
                                    <tr 
                                        key={faq.id} 
                                        className={`bg-white hover:bg-slate-50/80 transition-all rounded-2xl shadow-sm border border-slate-100 group ${!faq.is_active ? 'opacity-80 bg-slate-50/50' : ''}`}
                                    >
                                        <td className="py-3 px-4 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-violet-100 transition-colors w-[90px]">
                                            <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400 bg-slate-50 rounded-lg py-1 hover:bg-slate-100 transition-colors">
                                                <button
                                                    onClick={() => moveRow(index, 'up')}
                                                    disabled={index === 0}
                                                    className="hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors p-0.5 rounded-md hover:bg-violet-100"
                                                >
                                                    <ChevronUp size={18} />
                                                </button>
                                                <button
                                                    onClick={() => moveRow(index, 'down')}
                                                    disabled={index === faqs.length - 1}
                                                    className="hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors p-0.5 rounded-md hover:bg-violet-100"
                                                >
                                                    <ChevronDown size={18} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 border-y border-slate-100 group-hover:border-violet-100 transition-colors">
                                            <div className="font-semibold text-foreground text-sm">
                                                {faq.question}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 max-w-[500px] line-clamp-2 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 border-y border-slate-100 group-hover:border-violet-100 transition-colors text-center">
                                            {faq.life_stage ? (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold whitespace-nowrap">
                                                    {faq.life_stage.name_ar}
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium whitespace-nowrap">
                                                    عام
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 border-y border-slate-100 group-hover:border-violet-100 transition-colors text-center w-[120px]">
                                            <button
                                                className={`transition-all duration-300 ${faq.is_active ? 'text-emerald-500 hover:text-emerald-600 drop-shadow-sm' : 'text-slate-300 hover:text-slate-400'}`}
                                                onClick={() => handleToggle(faq)}
                                                title={faq.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                                            >
                                                {faq.is_active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-violet-100 transition-colors w-[140px]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-full transition-colors"
                                                    onClick={() => openModal(faq)}
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                                    onClick={() => setDeleteConfirm(faq)}
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl" dir="rtl">
                    <DialogHeader className="border-b border-slate-100 pb-4">
                        <DialogTitle className="text-xl font-bold text-violet-900 flex items-center gap-2">
                            {editingFaq ? <Edit2 className="w-5 h-5 text-violet-600" /> : <Plus className="w-5 h-5 text-violet-600" />}
                            {editingFaq ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">السؤال <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="مثال: كيف يمكنني حجز استشارة؟"
                                className={`w-full h-11 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${formErrors.question ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 bg-slate-50/50'}`}
                            />
                            {formErrors.question && <p className="text-rose-500 text-xs mt-1.5 font-medium">{formErrors.question}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">الإجابة <span className="text-rose-500">*</span></label>
                            <textarea
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="أدخل تفاصيل الإجابة بوضوح..."
                                rows={5}
                                className={`w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none ${formErrors.answer ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 bg-slate-50/50'}`}
                            />
                            {formErrors.answer && <p className="text-rose-500 text-xs mt-1.5 font-medium">{formErrors.answer}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">المرحلة الحياتية</label>
                                <select
                                    value={formData.life_stage_id || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        life_stage_id: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                >
                                    <option value="">عام (السؤال لا يتبع مرحلة محددة)</option>
                                    {lifeStages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name_ar}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">الحالة</label>
                                <div className="flex items-center gap-3 h-11 px-3 border border-slate-200 rounded-xl bg-slate-50/50">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`transition-all duration-300 ${formData.is_active ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}
                                    >
                                        {formData.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                    <span className={`text-sm font-medium ${formData.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {formData.is_active ? 'ظاهر للعامة' : 'مخفي حالياً'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-4 px-0">
                        <Button variant="outline" onClick={closeModal} className="rounded-xl font-medium border-slate-200 hover:bg-slate-100 h-11 px-6">
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium shadow-sm h-11 px-8 min-w-[120px]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 ml-2" />
                                    {editingFaq ? 'حفظ التعديلات' : 'إضافة السؤال'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="حذف سؤال شائع"
                message={`هل أنت متأكد من حذف السؤال "${deleteConfirm?.question}"؟ لن تتمكن من التراجع عن هذا الإجراء.`}
                loading={loading && !faqs.length}
            />
        </div>
    );
};

export default FAQsPage;
