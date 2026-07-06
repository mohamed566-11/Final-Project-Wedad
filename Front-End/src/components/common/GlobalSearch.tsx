import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    FileText,
    User,
    Loader2,
    X,
    ArrowLeft,
    ChevronLeft,
    Clock
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
import { globalSearch, SearchResult } from '@/services/searchService';
import { cn } from '@/lib/utils';

export const GlobalSearch: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const navigate = useNavigate();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent searches', e);
            }
        }
    }, []);

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
            const data = await globalSearch(q);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) performSearch(query);
            else setResults(null);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const addToRecent = (q: string) => {
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recent_searches', JSON.stringify(updated));
    };

    const handleSelect = (type: 'article' | 'doctor', item: any) => {
        setOpen(false);
        addToRecent(query);

        if (type === 'article') {
            navigate(`/articles/${item.slug}`);
        } else {
            navigate(`/doctors/${item.id}`);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-teal-600 transition-all bg-slate-100/50 hover:bg-white border border-slate-200/50 rounded-2xl group shadow-sm hover:shadow-md"
                dir="rtl"
            >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-teal-50 transition-all">
                    <Search size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                </div>
                <span className="hidden lg:inline font-black text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-teal-600">البحث الذكي...</span>
                <kbd className="hidden lg:inline-flex h-6 select-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-black text-slate-300">
                    <span className="text-[10px]">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="relative">
                    <CommandInput
                        placeholder="ابحثي عن مقالات، أطباء، أو مواضيع طبية..."
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
                    <CommandEmpty className="py-12 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Search size={48} strokeWidth={1} />
                            <p className="font-bold text-lg">لا توجد نتائج بحث لـ "{query}"</p>
                            <p className="text-sm">جربي كلمات أخرى أو تصفحي الأقسام</p>
                        </div>
                    </CommandEmpty>

                    {!query && recentSearches.length > 0 && (
                        <CommandGroup heading={<span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">عمليات بحث أخيرة</span>}>
                            {recentSearches.map((s) => (
                                <CommandItem
                                    key={s}
                                    onSelect={() => setQuery(s)}
                                    className="cursor-pointer flex items-center gap-3 p-3 rounded-2xl"
                                >
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="font-bold">{s}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results?.results.doctors && results.results.doctors.length > 0 && (
                        <CommandGroup heading={<span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-4 block">الأطباء</span>}>
                            {results.results.doctors.map((doctor) => (
                                <CommandItem
                                    key={`doc-${doctor.id}`}
                                    onSelect={() => handleSelect('doctor', doctor)}
                                    className="cursor-pointer flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className="relative">
                                        <img
                                            src={doctor.image_url}
                                            alt={doctor.name}
                                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-100"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-black text-slate-900 leading-tight">{doctor.name}</div>
                                        <div className="text-xs font-bold text-slate-500">{doctor.specialization_ar}</div>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results?.results.articles && results.results.articles.length > 0 && (
                        <CommandGroup heading={<span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2 mt-4 block">المقالات</span>}>
                            {results.results.articles.map((article) => (
                                <CommandItem
                                    key={`art-${article.id}`}
                                    onSelect={() => handleSelect('article', article)}
                                    className="cursor-pointer flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {article.image_url ? (
                                            <img src={article.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText size={24} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-black text-slate-900 leading-tight mb-1">{article.title}</div>
                                        <div className="flex items-center gap-2">
                                            {article.life_stage && (
                                                <Badge variant="outline" className={cn("text-[8px] font-black h-4 px-1.5",
                                                    article.life_stage.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        article.life_stage.color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                            "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    {article.life_stage.name_ar}
                                                </Badge>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-bold">{article.reading_time} دق قراءة</span>
                                        </div>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest" dir="rtl">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><kbd className="bg-white border px-1 rounded">ENTER</kbd> للاختيار</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white border px-1 rounded">ESC</kbd> للإغلاق</span>
                    </div>
                    <span>وداد - رفيقك الصحي</span>
                </div>
            </CommandDialog>
        </>
    );
};
