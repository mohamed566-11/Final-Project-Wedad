import { Link } from "react-router-dom";
import { Clock, Eye, Calendar, User, ArrowLeft, Bookmark } from "lucide-react";
import { Article } from "@/services/articleService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ArticleCardProps {
  article: Article;
  variant?: "grid" | "list" | "featured";
  showStatus?: boolean;
  showActions?: boolean;
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  archived: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const statusLabels: Record<string, string> = {
  approved: "منشور",
  pending_review: "قيد المراجعة",
  rejected: "مرفوض",
  draft: "مسودة",
  archived: "مؤرشف",
};

export const ArticleCard = ({
  article,
  variant = "grid",
  showStatus = false,
  className,
}: ArticleCardProps) => {
  const isFeatured = variant === "featured";
  const isList = variant === "list";

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/10 border-slate-100 hover:border-slate-200 h-full flex flex-col bg-white rounded-[32px]",
        isFeatured ? "md:grid md:grid-cols-12 md:gap-0" : "",
        isList ? "flex-row items-stretch" : "",
        className,
      )}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative overflow-hidden block shrink-0",
          isFeatured ? "md:col-span-1 border-none" : "aspect-[16/9]",
          isList ? "w-40 h-auto" : "",
        )}
        style={isFeatured ? { gridColumn: "span 5", order: 2 } : {}}
      >
        <Link
          to={`/articles/${article.slug}`}
          className="block w-full h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>

          <motion.img
            src={
              article.image_url ||
              `https://picsum.photos/seed/${article.id}/800/600`
            }
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://picsum.photos/seed/${article.id}/800/600`;
            }}
          />

          {/* Quick Action Overlay */}
          <div className="absolute top-3 left-3 z-20">
            <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all duration-300">
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </Link>

        {/* Categories Badge Overlay */}
        {article.life_stage && !isList && (
          <div className="absolute top-4 right-4 z-20">
            <Badge className="bg-white/90 backdrop-blur-md text-slate-800 hover:bg-white border-2 border-white/50 px-3 py-1.5 rounded-2xl shadow-sm font-bold text-[11px] transition-all hover:scale-105">
              {article.life_stage.name_ar}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div
        className={cn(
          "flex flex-col flex-grow relative",
          isFeatured
            ? "md:col-span-7 justify-center p-8 md:p-10 order-1"
            : "p-6",
        )}
      >
        <div className="flex-grow">
          {/* Status Badge */}
          {showStatus && (
            <div className="mb-4">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 rounded-xl border text-[11px] font-bold",
                  statusColors[article.status] || "bg-slate-100",
                )}
              >
                {statusLabels[article.status] || article.status}
              </Badge>
            </div>
          )}

          {/* Meta Top */}
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            {article.published_date_human && (
              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {article.published_date_human}
              </span>
            )}
            {article.reading_time && (
              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {article.reading_time} دقائق
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/articles/${article.slug}`} className="block group/title">
            <h3
              className={cn(
                "font-black text-slate-900 group-hover/title:text-primary transition-colors leading-tight",
                isFeatured
                  ? "text-2xl lg:text-3xl mb-5"
                  : "text-lg mb-3 line-clamp-2",
              )}
            >
              {article.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {article.excerpt && (
            <p
              className={cn(
                "text-slate-500 leading-relaxed font-medium",
                isFeatured
                  ? "text-lg line-clamp-3 mb-8"
                  : "text-sm line-clamp-2 mb-6",
              )}
            >
              {article.excerpt}
            </p>
          )}


        </div>

        {/* Footer Component */}
        <div
          className={cn(
            "flex items-center justify-between mt-auto pt-4 border-t border-slate-50",
            isFeatured ? "border-none pt-0" : "",
          )}
        >
          {article.doctor ? (
            <div className="flex items-center gap-3 w-full">
              <div className="relative group/author shrink-0">
                {article.doctor.image_url ? (
                  <img
                    src={article.doctor.image_url}
                    alt={article.doctor.name}
                    className="w-10 h-10 rounded-2xl object-cover border-2 border-white ring-2 ring-slate-50 group-hover/author:ring-primary-100 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center border-2 border-white ring-2 ring-slate-50">
                    <User className="w-5 h-5 text-primary-300" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {article.doctor.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {article.doctor.specialization_ar || "طبيب متخصص"}
                </span>
              </div>

              <div className="mr-auto">
                <Link
                  to={`/articles/${article.slug}`}
                  className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-primary/20 hover:-translate-y-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mr-auto w-full flex justify-end">
              <Link
                to={`/articles/${article.slug}`}
                className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-primary/20 hover:-translate-y-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ArticleCard;
