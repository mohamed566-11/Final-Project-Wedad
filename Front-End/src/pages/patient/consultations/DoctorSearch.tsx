import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Sparkles, Users, ArrowRight,
    Stethoscope, Heart, Baby, Activity
} from 'lucide-react';
import { consultationService, Doctor, SearchFilters } from '@/services/consultationService';
import { DoctorCard } from '@/components/consultations/DoctorCard';
import SearchFiltersComponent from '@/components/consultations/SearchFilters';
import BackButton from '@/components/common/BackButton';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { cn } from '@/lib/utils';

const specializations = [
    { value: 'gynecology', label: 'أمراض نساء', icon: Heart, color: 'from-pink-400 to-rose-500' },
    { value: 'obstetrics', label: 'توليد', icon: Baby, color: 'from-purple-400 to-indigo-500' },
    { value: 'fertility', label: 'خصوبة', icon: Sparkles, color: 'from-rose-400 to-pink-500' },
    { value: 'nutrition', label: 'تغذية', icon: Activity, color: 'from-green-400 to-emerald-500' },
];

export const DoctorSearch = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<SearchFilters>({});
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        lastPage: 1,
    });
    const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
    const [loadingRecommended, setLoadingRecommended] = useState(true);

    // Fetch doctors
    const fetchDoctors = async (newFilters?: SearchFilters, page = 1) => {
        setLoading(true);
        setError(null);

        try {
            const response = await consultationService.searchDoctors({
                ...filters,
                ...newFilters,
                page,
            });

            if (response.status || (response.data && response.meta)) {
                // Determine the correct array of doctors based on ApiResponse structure
                const doctorsArray = Array.isArray(response.data)
                    ? response.data
                    : (response.data?.data ? response.data.data : response.data?.doctors || []);

                setDoctors(doctorsArray);

                // Handle Pagination
                const pag = response.pagination?.meta || response.meta || response.data?.pagination;
                if (pag) {
                    setPagination({
                        total: pag.total || 0,
                        page: pag.current_page || 1,
                        lastPage: pag.last_page || pag.total_pages || 1,
                    });
                }
            }
        } catch (err) {
            setError('حدث خطأ في جلب الأطباء');
        } finally {
            setLoading(false);
        }
    };

    // Fetch recommended doctors
    const fetchRecommended = async () => {
        try {
            const response = await consultationService.getRecommendedDoctors();
            if (response.status && response.data) {
                setRecommendedDoctors(response.data.slice(0, 4));
            }
        } catch (err) {
            // Ignore errors for recommended
        } finally {
            setLoadingRecommended(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
        fetchRecommended();
    }, []);

    const handleFilterChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        fetchDoctors(newFilters, 1);
    };

    const handleClearFilters = () => {
        setFilters({});
        fetchDoctors({}, 1);
    };

    // Auto-search when user types but with a debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search !== searchQuery) {
                handleFilterChange({ ...filters, search: searchQuery });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSpecializationClick = (spec: string) => {
        const newFilters = { ...filters, specialization: spec };
        setFilters(newFilters);
        fetchDoctors(newFilters, 1);
    };

    const handlePageChange = (page: number) => {
        fetchDoctors(filters, page);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50" dir="rtl">
            <PublicHeader darkHero={true} />
            <main className="flex-1">
                {/* Hero Header (Dark Premium) */}
                <div className="relative bg-slate-950 pt-28 pb-20 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
                </div>

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="mb-8">
                        <BackButton className="text-white hover:bg-white/10 hover:text-white rounded-xl backdrop-blur-md transition-all" />
                    </div>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 text-white/90 text-xs font-bold mb-6 border border-white/10 backdrop-blur-md">
                            <Sparkles size={14} className="text-primary" />
                            احجزي استشارتك بكل سهولة
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            ابحثي عن <span className="text-primary">طبيبك</span> المناسب
                        </h1>
                        <p className="text-lg text-slate-400 mb-10 max-w-2xl font-bold">
                            اعثري على نخبة الأطباء المتخصصين في صحة المرأة، واحصلي على الرعاية التي تستحقينها.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl bg-white/5 p-2.5 rounded-[32px] backdrop-blur-2xl border border-white/10 shadow-2xl mb-8">
                            <div className="relative flex items-center">
                                <Search className="absolute right-6 w-6 h-6 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="ابحثي باسم الطبيب، أو التخصص..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-16 pl-6 py-4 rounded-[22px] bg-white text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-primary/20 border-none text-base font-bold shadow-inner transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Quick Specialization Buttons */}
                        <div className="flex flex-wrap gap-2.5">
                            {specializations.map(spec => {
                                const isSelected = filters.specialization === spec.value;
                                return (
                                    <button
                                        key={spec.value}
                                        onClick={() => handleSpecializationClick(spec.value)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all border backdrop-blur-md shadow-sm",
                                            isSelected
                                                ? "bg-primary text-white border-primary shadow-primary/20 scale-105"
                                                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        <spec.icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-primary")} />
                                        {spec.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Recommended Doctors */}
                {recommendedDoctors.length > 0 && !filters.specialization && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">مقترح لك</h2>
                                <p className="text-sm text-gray-500">بناءً على ملفك الشخصي</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {loadingRecommended ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
                                ))
                            ) : (
                                recommendedDoctors.map(doctor => (
                                    <DoctorCard key={doctor.id} doctor={doctor} />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6">
                    <SearchFiltersComponent
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClear={handleClearFilters}
                    />
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">جميع الأطباء</h2>
                            <p className="text-sm text-gray-500">
                                {pagination.total} طبيب متاح
                            </p>
                        </div>
                    </div>
                </div>

                {/* Doctors Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 rounded-2xl p-8 text-center">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={() => fetchDoctors()}
                            className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center">
                        <Stethoscope className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">لا يوجد أطباء</h3>
                        <p className="text-gray-500">جرب تغيير معايير البحث</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(doctor => (
                            <DoctorCard key={doctor.id} doctor={doctor} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {[...Array(pagination.lastPage)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`w-10 h-10 rounded-xl font-medium transition-all ${pagination.page === i + 1
                                    ? 'bg-pink-500 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default DoctorSearch;
