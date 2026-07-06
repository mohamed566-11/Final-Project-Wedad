import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Users,
    Calendar,
    FileText,
    Loader2,
    Clock,
    ChevronLeft,
    Activity,
    ArrowLeft
} from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { doctorDashboardSearch } from '@/services/searchService';
import { cn } from '@/lib/utils';

export const DoctorDashboardSearch: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Toggle with Cmd+K or Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const performSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await doctorDashboardSearch(q);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) performSearch(query);
            else setResults(null);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSelect = (type: string, item: any) => {
        setOpen(false);
        if (type === 'patient') {
            navigate(`/doctor/patients/${item.id}`);
        } else if (type === 'article') {
            navigate(`/doctor/articles/${item.id}/edit`);
        } else if (type === 'consultation') {
            navigate(`/doctor/consultations/${item.id}`);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white transition-all bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl group w-full max-w-[300px]"
                dir="rtl"
            >
                <Search size={18} className="text-white/40 group-hover:text-white transition-colors" />
                <span className="font-bold">ابحثي عن المرضى أو المواضيع...</span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/40">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="relative">
                    <CommandInput
                        placeholder="ابحثي في المرضى، الاستشارات، أو مقالاتك..."
                        value={query}
                        onValueChange={setQuery}
                        className="h-14 font-bold border-none focus:ring-0 text-right pr-12"
                        dir="rtl"
                    />
                    {loading && (
                        <div className="absolute left-4 top-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                <CommandList className="max-h-[70vh] p-2" dir="rtl">
                    <CommandEmpty className="py-12 text-center text-slate-400 font-bold">
                        لا توجد نتائج بحث لـ "{query}"
                    </CommandEmpty>

                    {results?.results.patients && results.results.patients.length > 0 && (
                        <CommandGroup heading={<span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-4 block">المرضى</span>}>
                            {results.results.patients.map((p: any) => (
                                <CommandItem
                                    key={`p-${p.id}`}
                                    onSelect={() => handleSelect('patient', p)}
                                    className="cursor-pointer flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-400" />}
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-black text-slate-900 leading-tight">{p.name}</div>
                                        <div className="text-[10px] font-bold text-slate-500">{p.life_stage || 'مريضة'}</div>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results?.results.consultations && results.results.consultations.length > 0 && (
                        <CommandGroup heading={<span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-4 block">الاستشارات</span>}>
                            {results.results.consultations.map((c: any) => (
                                <CommandItem
                                    key={`c-${c.id}`}
                                    onSelect={() => handleSelect('consultation', c)}
                                    className="cursor-pointer flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-black text-slate-900 leading-tight">{c.patient_name}</div>
                                        <div className="text-[10px] font-bold text-slate-500">{c.date} • {c.status}</div>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results?.results.articles && results.results.articles.length > 0 && (
                        <CommandGroup heading={<span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-4 block">مقالاتي</span>}>
                            {results.results.articles.map((a: any) => (
                                <CommandItem
                                    key={`a-${a.id}`}
                                    onSelect={() => handleSelect('article', a)}
                                    className="cursor-pointer flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-black text-slate-900 leading-tight mb-1">{a.title}</div>
                                        <Badge variant="outline" className="text-[8px] font-black h-4 px-1">{a.status}</Badge>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {(results?.results.patients?.length > 0 || results?.results.consultations?.length > 0 || results?.results.articles?.length > 0) && (
                        <div className="p-4 border-t border-slate-50 flex justify-center">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    navigate(`/doctor/search?q=${encodeURIComponent(query)}`);
                                }}
                                className="text-xs font-black text-primary hover:underline flex items-center gap-2"
                            >
                                عرض كافة النتائج التفصيلية
                                <ArrowLeft size={14} />
                            </button>
                        </div>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
};
