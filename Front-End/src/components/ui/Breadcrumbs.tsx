import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "inline-flex flex-wrap items-center gap-3 bg-white/90 px-5 py-2 rounded-2xl border border-slate-200/50 mb-10 shadow-xl shadow-slate-900/5 backdrop-blur-xl max-w-full",
                className
            )}
            dir="rtl"
        >
            <Link
                to="/"
                className="flex items-center gap-2 text-[11px] font-black text-slate-500 hover:text-teal-600 transition-all group"
            >
                <Home size={14} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                <span className="uppercase tracking-widest">الرئيسية</span>
            </Link>

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
                    {item.path ? (
                        <Link
                            to={item.path}
                            className="text-[11px] font-black text-slate-500 hover:text-teal-600 transition-all uppercase tracking-widest"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-[11px] font-black text-teal-600 uppercase tracking-widest">
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </motion.div>
    );
};

export default Breadcrumbs;
