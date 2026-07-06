import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Eye,
    Clock,
    ArrowLeft,
    BookOpen,
    Sparkles,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { RecentArticle } from '../../services/landingService';
import { cn } from '@/lib/utils';
import './Landing.css';

interface ArticlesSectionProps {
    data: RecentArticle[];
}

const ArticlesSection: React.FC<ArticlesSectionProps> = ({ data }) => {
    return (
        <section className="py-32 bg-muted/50 relative overflow-hidden" dir="rtl">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-background to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary-50/20 rounded-full blur-[160px] translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="px-4 py-1.5 rounded-full bg-card text-primary font-black text-[10px] uppercase tracking-widest border border-border shadow-sm">
                                المعرفة الصحية
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-tight italic">
                            مقالات طبية <br />
                            <span className="text-primary underline decoration-primary-100 underline-offset-[12px] decoration-8">بآراء الخبراء</span>
                        </h2>
                    </div>
                    <Link
                        to="/articles"
                        className="group flex items-center gap-4 px-10 py-5 rounded-full bg-card border border-border text-foreground font-black text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-500 shadow-soft hover:shadow-glow"
                    >
                        تصفحي أرشيف المقالات
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </motion.div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.slice(0, 3).map((article, index) => (
                        <motion.article
                            key={article.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="group flex flex-col premium-card rounded-[32px] bg-card border-none shadow-soft hover:shadow-glow transition-all duration-700 h-full"
                        >
                            <Link to={`/articles/${article.slug}`} className="relative aspect-[16/10] overflow-hidden block rounded-t-[32px] image-zoom-container">
                                {article.image_url && !article.image_url.includes('default-aericle.png') ? (
                                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100/30 flex flex-col items-center justify-center">
                                        <BookOpen className="w-16 h-16 text-primary/10 mb-2" />
                                        <Sparkles className="w-6 h-6 text-primary-200" />
                                    </div>
                                )}

                                {article.life_stage && (
                                    <div className="absolute top-6 left-6 p-0.5 rounded-full bg-white/20 backdrop-blur-md shadow-2xl">
                                        <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xl text-primary font-black text-[9px] uppercase tracking-widest border border-white">
                                            {article.life_stage.name_ar}
                                        </div>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            </Link>

                            <div className="p-7 flex flex-col flex-grow">
                                <div className="flex items-center gap-5 mb-5 text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">{(article.views_count || 0).toLocaleString('ar-EG')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">{article.reading_time || 5} دق</span>
                                    </div>
                                </div>

                                <Link to={`/articles/${article.slug}`}>
                                    <h3 className="text-xl font-black text-foreground mb-3 group-hover:text-primary transition-colors tracking-tighter leading-tight italic text-reveal">
                                        {article.title}
                                    </h3>
                                </Link>

                                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6 line-clamp-3">
                                    {article.excerpt}
                                </p>

                                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                                    {article.doctor && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted ring-2 ring-card">
                                                {article.doctor.image_url ? (
                                                    <img src={article.doctor.image_url} alt={article.doctor.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">مراجعة</p>
                                                <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{article.doctor.name}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </div>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section >
    );
};

export default ArticlesSection;
