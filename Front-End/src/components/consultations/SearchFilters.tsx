import { useState } from 'react';
import { Filter, ChevronDown, X, Star } from 'lucide-react';
import type { SearchFilters } from '@/services/consultationService';

interface SearchFiltersProps {
    filters: SearchFilters;
    onFilterChange: (filters: SearchFilters) => void;
    onClear: () => void;
}

const specializations = [
    { value: 'gynecology', label: 'أمراض نساء' },
    { value: 'obstetrics', label: 'توليد' },
    { value: 'fertility', label: 'خصوبة' },
    { value: 'endocrinology', label: 'غدد صماء' },
    { value: 'general_practitioner', label: 'طب عام' },
    { value: 'pediatrics', label: 'أطفال' },
    { value: 'nutrition', label: 'تغذية' },
    { value: 'other', label: 'أخرى' },
];

const sessionTypes = [
    { value: 'video', label: 'فيديو فقط' },
    { value: 'offline', label: 'عيادة فقط' },
    { value: 'both', label: 'الكل' },
];

const availabilityOptions = [
    { value: 'today', label: 'اليوم' },
    { value: 'this_week', label: 'هذا الأسبوع' },
    { value: 'this_month', label: 'هذا الشهر' },
];

const sortOptions = [
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'price_low', label: 'الأقل سعراً' },
    { value: 'price_high', label: 'الأعلى سعراً' },
    { value: 'experience', label: 'الأكثر خبرة' },
    { value: 'consultations', label: 'الأكثر استشارات' },
];

export const SearchFiltersComponent = ({ filters, onFilterChange, onClear }: SearchFiltersProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = (key: keyof SearchFilters, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                        <Filter className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">تصفية النتائج</h3>
                        <p className="text-sm text-gray-500">
                            {activeFiltersCount > 0 ? `${activeFiltersCount} فلتر نشط` : 'اختر معايير البحث'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="text-sm text-pink-600 hover:text-pink-700"
                        >
                            مسح الكل
                        </button>
                    )}
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Filters Body */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-6 border-t border-gray-100 mt-2">
                    {/* Specialization */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">التخصص</label>
                        <div className="flex flex-wrap gap-2">
                            {specializations.map(spec => (
                                <button
                                    key={spec.value}
                                    onClick={() => updateFilter('specialization', filters.specialization === spec.value ? undefined : spec.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.specialization === spec.value
                                            ? 'bg-pink-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {spec.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Session Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع الجلسة</label>
                        <div className="flex gap-2">
                            {sessionTypes.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => updateFilter('session_type', filters.session_type === type.value ? undefined : type.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.session_type === type.value
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نطاق السعر</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="من"
                                value={filters.min_price || ''}
                                onChange={(e) => updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="إلى"
                                value={filters.max_price || ''}
                                onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                            />
                            <span className="text-gray-500 text-sm">جنيه</span>
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للتقييم</label>
                        <div className="flex gap-2">
                            {[4, 3, 2, 1].map(rating => (
                                <button
                                    key={rating}
                                    onClick={() => updateFilter('min_rating', filters.min_rating === rating ? undefined : rating)}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${filters.min_rating === rating
                                            ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Star className={`w-4 h-4 ${filters.min_rating === rating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                    {rating}+
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
                        <div className="flex gap-2">
                            {[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'English' }].map(lang => (
                                <button
                                    key={lang.value}
                                    onClick={() => {
                                        const current = filters.languages || [];
                                        const updated = current.includes(lang.value)
                                            ? current.filter(l => l !== lang.value)
                                            : [...current, lang.value];
                                        updateFilter('languages', updated.length > 0 ? updated : undefined);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.languages?.includes(lang.value)
                                            ? 'bg-purple-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Availability */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">التوفر</label>
                        <div className="flex gap-2">
                            {availabilityOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateFilter('availability', filters.availability === opt.value ? undefined : opt.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.availability === opt.value
                                            ? 'bg-green-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
                        <select
                            value={filters.sort_by || 'rating'}
                            onChange={(e) => updateFilter('sort_by', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 bg-white"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && !isExpanded && (
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                    {filters.specialization && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                            {specializations.find(s => s.value === filters.specialization)?.label}
                            <X
                                className="w-3.5 h-3.5 cursor-pointer"
                                onClick={() => updateFilter('specialization', undefined)}
                            />
                        </span>
                    )}
                    {filters.session_type && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {sessionTypes.find(s => s.value === filters.session_type)?.label}
                            <X
                                className="w-3.5 h-3.5 cursor-pointer"
                                onClick={() => updateFilter('session_type', undefined)}
                            />
                        </span>
                    )}
                    {filters.min_rating && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                            {filters.min_rating}+ ⭐
                            <X
                                className="w-3.5 h-3.5 cursor-pointer"
                                onClick={() => updateFilter('min_rating', undefined)}
                            />
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchFiltersComponent;
