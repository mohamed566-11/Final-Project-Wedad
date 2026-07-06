import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, Users, Calendar, FileText,
    ArrowRight, Loader2, ArrowLeft,
    Filter, Layout, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { doctorDashboardSearch } from '@/services/searchService';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorSearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchResults = async (q: string) => {
        if (q.length < 2) return;
        setLoading(true);
        try {
            const data = await doctorDashboardSearch(q);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (query) {
            fetchResults(query);
        } else {
            setResults(null);
        }
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams({ q: searchTerm });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground leading-tight">البحث الموحد</h1>
                    <p className="text-muted-foreground font-medium text-sm mt-1">ابحث في قاعدة بيانات مرضاك، استشاراتك، ومقالاتك الطبية</p>
                </div>
            </div>

            {/* Search Input Area */}
            <div className="card-elevated bg-white p-6 rounded-[32px] shadow-2xl shadow-border/50">
                <form onSubmit={handleSearch} className="relative group">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-border group-focus-within:text-primary transition-colors w-6 h-6" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث باسم المريض، رقم الهاتف، عنوان المقال، أو تفاصيل الاستشارة..."
                        className="h-16 pr-16 pl-32 bg-muted border-transparent focus:bg-white focus:ring-primary/10 rounded-2xl transition-all font-bold text-lg text-foreground/80 placeholder:text-border placeholder:font-medium"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="w-10 h-10 flex items-center justify-center bg-white text-muted-foreground hover:text-red-500 rounded-xl transition-all shadow-sm"
                            >
                                <ArrowRight className="w-5 h-5 rotate-45" />
                            </button>
                        )}
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary-600 text-white rounded-xl h-10 px-6 font-black shadow-lg shadow-primary/20"
                        >
                            بحث
                        </Button>
                    </div>
                </form>
            </div>

            {/* Results Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[40px] border-2 border-dashed border-border">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-bold animate-pulse">جاري البحث في الأرشيف الطبي...</p>
                </div>
            ) : !query ? (
                <div className="text-center py-32 bg-muted rounded-[40px] border border-dashed border-border">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Search size={48} className="text-border" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">ابدأ البحث الآن</h3>
                    <p className="text-muted-foreground font-medium">أدخل كلمات البحث للوصول السريع للمعلومات</p>
                </div>
            ) : results?.total === 0 ? (
                <div className="text-center py-32 bg-white rounded-[40px] border border-border shadow-xl shadow-border/50">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search size={48} className="text-red-200" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">لا توجد نتائج لـ "{query}"</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">تأكد من كتابة الكلمات بشكل صحيح أو جرب كلمات بحث مختلفة</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Patients Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                                <Users className="w-6 h-6 text-primary" />
                                المرضى
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{results?.results.patients.length}</span>
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {results?.results.patients.map((p: any) => (
                                <motion.div
                                    key={`p-${p.id}`}
                                    whileHover={{ x: -8 }}
                                    className="card-elevated bg-white p-4 rounded-2xl flex items-center gap-4 cursor-pointer group"
                                    onClick={() => navigate(`/doctor/patients/${p.id}`)}
                                >
                                    <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden border border-muted group-hover:scale-110 transition-transform">
                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Users className="text-border" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors">{p.name}</h4>
                                        <p className="text-xs font-bold text-muted-foreground">{p.life_stage || 'مريضة'}</p>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 text-border group-hover:text-primary transition-all" />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Consultations Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-primary" />
                                الاستشارات
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{results?.results.consultations.length}</span>
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {results?.results.consultations.map((c: any) => (
                                <motion.div
                                    key={`c-${c.id}`}
                                    whileHover={{ x: -8 }}
                                    className="card-elevated bg-white p-4 rounded-2xl flex items-center gap-4 cursor-pointer group"
                                    onClick={() => navigate(`/doctor/consultations/${c.id}`)}
                                >
                                    <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Calendar />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-foreground group-hover:text-primary transition-colors">{c.patient_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] font-black h-5 uppercase tracking-wide">{c.status}</Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground">{c.date}</span>
                                        </div>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 text-border group-hover:text-primary transition-all" />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Articles Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                                <FileText className="w-6 h-6 text-primary" />
                                مقالاتي
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{results?.results.articles.length}</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results?.results.articles.map((a: any) => (
                                <motion.div
                                    key={`a-${a.id}`}
                                    whileHover={{ y: -8 }}
                                    className="card-elevated bg-white p-6 rounded-[32px] cursor-pointer group flex flex-col justify-between h-full"
                                    onClick={() => navigate(`/doctor/articles/${a.id}/edit`)}
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            <FileText size={24} />
                                        </div>
                                        <h4 className="font-black text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">{a.title}</h4>
                                    </div>
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-muted">
                                        <Badge variant="outline" className="text-[10px] font-black h-5 uppercase tracking-wide">{a.status}</Badge>
                                        <ArrowLeft className="w-4 h-4 text-border group-hover:text-primary transition-all group-hover:-translate-x-1" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSearchPage;
