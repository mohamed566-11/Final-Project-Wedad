import React, { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Upload, Trash2, FileText, Bot, Loader2, AlertCircle,
    RefreshCw, CheckCircle2, Clock, XCircle, CloudUpload,
    DatabaseZap, Filter
} from "lucide-react";
import Card from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { adminChatbotService, ChatbotDocument } from "@/services/adminChatbotService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BOT_TYPES = [
    { id: "public",       label: "وداد العامة",    color: "violet", emoji: "🌐" },
    { id: "pre_marriage", label: "ما قبل الزواج", color: "blue",   emoji: "💍" },
    { id: "pregnancy",    label: "الحمل",          color: "rose",   emoji: "🤰" },
    { id: "motherhood",   label: "الأمومة",        color: "emerald",emoji: "👶" },
];

const STATUS_CONFIG = {
    ready:      { label: "جاهز",      icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    processing: { label: "معالجة...", icon: Loader2,      cls: "text-amber-600 bg-amber-50 border-amber-200 animate-pulse" },
    uploaded:   { label: "مرفوع",     icon: Clock,        cls: "text-blue-600 bg-blue-50 border-blue-200" },
    failed:     { label: "فشل",       icon: XCircle,      cls: "text-red-600 bg-red-50 border-red-200" },
};

const formatFileSize = (bytes: number): string => {
    if (!bytes) return "–";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const KnowledgeBasePage: React.FC = () => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedBot, setSelectedBot] = useState<string>("all");
    const [uploadBot,   setUploadBot]   = useState<string>("public");
    const [file,        setFile]        = useState<File | null>(null);
    const [isDragging,  setIsDragging]  = useState(false);

    // ── Query: Documents ──────────────────────────────────────
    const { data: docData, isLoading, refetch } = useQuery({
        queryKey: ["admin_chatbot_documents", selectedBot],
        queryFn: () =>
            adminChatbotService.getDocuments(
                selectedBot !== "all" ? { bot_type: selectedBot } : undefined
            ),
        refetchInterval: 15_000, // Poll every 15s to catch processing→ready
    });

    const documents: ChatbotDocument[] = docData?.data ?? [];

    // ── Mutation: Upload ──────────────────────────────────────
    const uploadMutation = useMutation({
        mutationFn: () => adminChatbotService.uploadDocument(uploadBot, file!),
        onMutate: () => {
            toast.loading("جاري إرسال الملف إلى قائمة المعالجة...", { id: "upload" });
        },
        onSuccess: () => {
            toast.success("✅ تم إرسال الملف — سيظهر كـ «جاهز» بعد المعالجة", { id: "upload" });
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            queryClient.invalidateQueries({ queryKey: ["admin_chatbot_documents"] });
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "حدث خطأ أثناء الرفع";
            toast.error(`فشل الرفع: ${msg}`, { id: "upload" });
        },
    });

    // ── Mutation: Delete ──────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminChatbotService.deleteDocument(id),
        onMutate: (id) => toast.loading("جاري الحذف...", { id: `del-${id}` }),
        onSuccess: (_d, id) => {
            toast.success("تم الحذف بنجاح", { id: `del-${id}` });
            queryClient.invalidateQueries({ queryKey: ["admin_chatbot_documents"] });
        },
        onError: (_e, id) => toast.error("فشل الحذف", { id: `del-${id}` }),
    });

    const handleDelete = (doc: ChatbotDocument) => {
        if (!confirm(`هل أنت متأكد من حذف "${doc.file_name}"؟`)) return;
        deleteMutation.mutate(doc.id);
    };

    // ── Drag & Drop ────────────────────────────────────────────
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (!dropped) return;
        const ext = dropped.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "txt", "md"].includes(ext ?? "")) {
            toast.error("نوع الملف غير مقبول — يُسمح فقط بـ PDF, TXT, MD");
            return;
        }
        setFile(dropped);
    }, []);

    const getBotMeta = (type: string) =>
        BOT_TYPES.find(b => b.id === type) ?? { label: type, color: "violet", emoji: "🤖" };

    const statusBadge = (status: ChatbotDocument["status"]) => {
        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.uploaded;
        const Icon = cfg.icon;
        return (
            <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.cls)}>
                <Icon className="w-3 h-3" />
                {cfg.label}
            </span>
        );
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <DatabaseZap className="w-7 h-7 text-violet-600" />
                        قاعدة المعرفة (RAG)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        رفع وإدارة المستندات التي تستند إليها المساعدات الذكية في إجاباتها
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-white gap-1.5 self-start">
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    تحديث
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── Upload Panel ── */}
                <Card variant="elevated" className="p-6 lg:col-span-1">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-base">
                        <CloudUpload className="w-5 h-5 text-violet-500" />
                        رفع ملف جديد
                    </h3>

                    <div className="space-y-4">
                        {/* Bot Selector */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                <Bot className="inline w-4 h-4 ml-1 text-violet-400" />
                                المساعد الذكي المستهدف
                            </label>
                            <select
                                value={uploadBot}
                                onChange={e => setUploadBot(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-border focus:border-violet-500 bg-white outline-none text-sm transition-colors"
                            >
                                {BOT_TYPES.map(bot => (
                                    <option key={bot.id} value={bot.id}>
                                        {bot.emoji} {bot.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dropzone */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                                الملف (PDF, TXT, MD — حتى 10MB)
                            </label>
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
                                    isDragging
                                        ? "border-violet-500 bg-violet-50"
                                        : file
                                            ? "border-violet-400 bg-violet-50/50"
                                            : "border-border hover:border-violet-400 hover:bg-muted/30"
                                )}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.txt,.md"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) setFile(f);
                                    }}
                                />
                                {file ? (
                                    <div className="space-y-2">
                                        <FileText className="w-10 h-10 text-violet-500 mx-auto" />
                                        <p className="text-sm font-medium text-violet-700 truncate px-2">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        <button
                                            onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                            className="text-xs text-rose-500 hover:text-rose-700 underline"
                                        >
                                            إزالة الملف
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                                        <p className="text-sm text-muted-foreground">
                                            اسحب الملف هنا أو <span className="text-violet-600 font-medium">انقر للاختيار</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground/70">PDF · TXT · MD · حتى 10 ميجابايت</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            variant="admin"
                            className="w-full gap-2"
                            onClick={() => uploadMutation.mutate()}
                            disabled={!file || uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الرفع...</>
                            ) : (
                                <><CloudUpload className="w-4 h-4" /> رفع وإضافة للمعرفة</>
                            )}
                        </Button>

                        {/* Info note */}
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>المعالجة تتم في الخلفية (Async). ستظهر الحالة «جاهز» بعد اكتمال التضمين.</p>
                        </div>
                    </div>
                </Card>

                {/* ── Documents List ── */}
                <Card variant="elevated" className="p-0 lg:col-span-2 overflow-hidden flex flex-col min-h-[500px]">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-border flex flex-wrap gap-3 items-center justify-between bg-muted/40">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-semibold text-foreground text-sm">المستندات</h3>
                            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {documents.length}
                            </span>
                        </div>
                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedBot}
                                onChange={e => setSelectedBot(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-border text-xs bg-white focus:border-violet-500 outline-none"
                            >
                                <option value="all">🔘 جميع البوتات</option>
                                {BOT_TYPES.map(bot => (
                                    <option key={bot.id} value={bot.id}>{bot.emoji} {bot.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                <p className="text-sm">جاري تحميل المستندات...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-3">
                                <div className="p-4 bg-muted rounded-full">
                                    <FileText className="w-10 h-10 text-border" />
                                </div>
                                <p className="text-sm font-medium">لا توجد مستندات</p>
                                <p className="text-xs">ارفع ملفاً من اليسار لإضافته لقاعدة المعرفة</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {documents.map(doc => {
                                    const botMeta = getBotMeta(doc.bot_type);
                                    const isDeleting = deleteMutation.isPending && deleteMutation.variables === doc.id;
                                    return (
                                        <div
                                            key={doc.id}
                                            className={cn(
                                                "px-4 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors group",
                                                isDeleting && "opacity-50 pointer-events-none"
                                            )}
                                        >
                                            {/* File Icon */}
                                            <div className="p-2 bg-violet-50 border border-violet-100 rounded-lg flex-shrink-0">
                                                <FileText className="w-5 h-5 text-violet-500" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-foreground truncate" title={doc.file_name}>
                                                    {doc.file_name}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {/* Bot badge */}
                                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-muted rounded-md border border-border">
                                                        {botMeta.emoji} {botMeta.label}
                                                    </span>
                                                    {/* Size */}
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {doc.formatted_size || formatFileSize(doc.file_size)}
                                                    </span>
                                                    {/* Date */}
                                                    <span className="text-[10px] text-muted-foreground" dir="ltr">
                                                        {new Date(doc.created_at).toLocaleDateString("ar-EG")}
                                                    </span>
                                                    {/* Status */}
                                                    {statusBadge(doc.status)}
                                                </div>
                                                {doc.error_message && (
                                                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 truncate">
                                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                        {doc.error_message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                disabled={isDeleting}
                                                className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="حذف الملف"
                                            >
                                                {isDeleting
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default KnowledgeBasePage;
