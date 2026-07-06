import React, { useState, useMemo } from 'react';
import { useDoctorFinancialStats, useDoctorTransactions, useDoctorPayouts, useRequestPayout, useDoctorChartData } from '@/hooks/useDoctorQueries';
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Wallet,
    Download,
    Filter,
    Loader2,
    Clock,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Building2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingDown,
    X,
    Coins
} from 'lucide-react';
import Card from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const DoctorFinancials: React.FC = () => {
    const { data: statsResponse, isLoading: statsLoading } = useDoctorFinancialStats();
    const { data: chartDataResponse } = useDoctorChartData('year'); // Get yearly data for chart

    // Transactions State
    const [page, setPage] = useState(1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Payouts State
    const [payoutPage, setPayoutPage] = useState(1);

    // Dialog State
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'wallet'>('bank_transfer');
    const [payoutDetails, setPayoutDetails] = useState({
        bank_name: '',
        account_number: '',
        account_name: '',
        wallet_number: ''
    });

    // Queries
    const { data: transactionsResponse, isLoading: transactionsLoading } = useDoctorTransactions({
        page,
        per_page: 10,
        date_from: dateFrom,
        date_to: dateTo
    });

    const { data: payoutsResponse, isLoading: payoutsLoading } = useDoctorPayouts({
        page: payoutPage,
        per_page: 10
    });

    const requestPayoutMutation = useRequestPayout();

    const stats = statsResponse?.data;
    const transactions = transactionsResponse?.data || [];
    const transactionPagination = transactionsResponse?.pagination?.meta;
    const payouts = payoutsResponse?.data || [];
    const payoutPagination = payoutsResponse?.pagination?.meta;

    const chartData = useMemo(() => {
        if (!chartDataResponse?.data?.earnings_trend) return [];
        const { labels, data } = chartDataResponse.data.earnings_trend;
        return labels.map((label: string, index: number) => ({
            name: label,
            amount: data[index] || 0
        }));
    }, [chartDataResponse]);

    const handleRequestPayout = () => {
        setIsPayoutOpen(true);
    };

    const submitPayout = () => {
        const amount = parseFloat(payoutAmount);
        if (!amount || amount < 100) {
            toast.error('الحد الأدنى للسحب هو 100 جنيه');
            return;
        }
        if (amount > (stats?.withdrawable_balance || 0)) {
            toast.error('المبلغ المطلوب أكبر من الرصيد المتاح');
            return;
        }

        const details = payoutMethod === 'bank_transfer'
            ? {
                bank_name: payoutDetails.bank_name,
                account_number: payoutDetails.account_number,
                account_name: payoutDetails.account_name
            }
            : {
                wallet_number: payoutDetails.wallet_number
            };

        requestPayoutMutation.mutate({
            amount,
            method: payoutMethod,
            details
        }, {
            onSuccess: () => {
                setIsPayoutOpen(false);
                setPayoutAmount('');
                setPayoutDetails({ bank_name: '', account_number: '', account_name: '', wallet_number: '' });
            }
        });
    };

    if (statsLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    <p className="text-slate-500 font-bold">جاري تحميل البيانات المالية والمحفظة...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">

            {/* Premium Header/Cover Section */}
            <div className="relative rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] p-8 md:p-12 text-white overflow-hidden shadow-2xl isolate">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
                <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-indigo-200 text-xs font-bold mb-4">
                            <Coins className="w-4 h-4" />
                            المحفظة الذكية
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight tracking-tight">
                            المحفظة والتقارير المالية
                        </h1>
                        <p className="text-indigo-200 text-sm md:text-base font-semibold max-w-xl leading-relaxed">
                            تابع أرباحك من الاستشارات الطبية، وإدارة عمليات السحب والتحويلات المالية المباشرة إلى حسابك البنكي أو محفظتك الإلكترونية بكل سهولة.
                        </p>
                    </div>

                    <Button
                        onClick={handleRequestPayout}
                        disabled={!stats?.withdrawable_balance || stats?.withdrawable_balance <= 0}
                        className="bg-white text-[#1E1B4B] hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-xl font-black rounded-2xl px-8 py-7 h-auto text-lg transition-all duration-300 gap-3 border border-white/20 hover:shadow-indigo-500/10 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        <Wallet className="w-6 h-6 text-indigo-600" />
                        طلب سحب أرباح
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي الأرباح المستلمة"
                    value={stats?.total_earnings}
                    currency="ج.م"
                    icon={<TrendingUp size={24} />}
                    color="emerald"
                    trend="+12%"
                />
                <StatCard
                    title="أرباح الشهر الحالي"
                    value={stats?.month_earnings}
                    currency="ج.م"
                    icon={<Calendar size={24} />}
                    color="blue"
                    trend="+5%"
                />
                <StatCard
                    title="الرصيد المتاح للسحب"
                    value={stats?.withdrawable_balance}
                    currency="ج.م"
                    icon={<Wallet size={24} />}
                    color="purple"
                    highlight
                />
                <StatCard
                    title="تاريخ السحب القادم"
                    value={stats?.next_payout_date || '-'}
                    icon={<Clock size={24} />}
                    color="amber"
                    isDate
                />
            </div>

            {/* Chart Section */}
            <Card className="rounded-[32px] border border-slate-100 bg-white p-6 md:p-8 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">مخطط نمو الأرباح</h3>
                        <p className="text-slate-500 text-sm font-semibold mt-1">عرض بياني للأرباح الشهرية التي تم تحقيقها خلال العام الحالي</p>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100">
                        تحديث مباشر
                    </div>
                </div>

                <div className="h-[300px] w-full mt-4" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.length > 0 ? chartData : mockChartData}>
                            <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', backgroundColor: 'white', fontFamily: 'inherit' }}
                                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                itemStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
                                cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#4f46e5"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorEarnings)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Tabs & Transactions List Container */}
            <Tabs defaultValue="transactions" className="w-full">

                {/* Custom Styled Responsive Tab Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <TabsList className="bg-white p-2 rounded-full shadow-xl shadow-slate-200/40 border border-slate-200 flex gap-2 h-auto w-full sm:w-auto overflow-x-auto">
                        <TabsTrigger
                            value="transactions"
                            className="flex-1 sm:flex-none rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 transition-all duration-300"
                        >
                            سجل المعاملات
                        </TabsTrigger>
                        <TabsTrigger
                            value="payouts"
                            className="flex-1 sm:flex-none rounded-full px-8 py-3.5 font-black text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 transition-all duration-300"
                        >
                            طلبات السحب
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Transactions Panel */}
                <TabsContent value="transactions" className="mt-0 outline-none">
                    <Card className="rounded-[32px] border border-slate-100 bg-white overflow-hidden shadow-2xl shadow-slate-200/40">
                        {/* Table Header Controls */}
                        <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    المعاملات المالية
                                </h3>
                                <p className="text-slate-500 text-xs font-semibold mt-1">تصفية وبحث في جميع استشاراتك وعمليات الدفع</p>
                            </div>

                            {/* Premium Date Filters */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400 shrink-0">من:</span>
                                    <input
                                        type="date"
                                        className="border border-slate-200 rounded-full px-5 py-2.5 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 shadow-sm font-bold w-full"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400 shrink-0">إلى:</span>
                                    <input
                                        type="date"
                                        className="border border-slate-200 rounded-full px-5 py-2.5 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 shadow-sm font-bold w-full"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                                {(dateFrom || dateTo) && (
                                    <Button
                                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        className="rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-5 h-11 border border-rose-150 gap-2 shrink-0 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        مسح التصفية
                                    </Button>
                                )}
                            </div>
                        </div>

                        {transactionsLoading ? (
                            <div className="py-24 text-center">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500 mb-3" />
                                <p className="text-slate-500 font-bold text-sm">جاري تحميل سجل المعاملات الطبية...</p>
                            </div>
                        ) : transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table className="w-full text-right border-collapse">
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-b border-slate-100">
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">رقم العملية</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">تاريخ ووقت المعاملة</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">التفاصيل / المريض</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">المبلغ المحول لحسابك</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">حالة الدفع</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx: any) => {
                                            const isConsultation = tx.type === 'consultation' || tx.type === 'online';
                                            return (
                                                <TableRow key={tx.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors group">
                                                    <TableCell className="font-mono text-slate-500 text-xs font-bold py-6 px-6">
                                                        #{tx.transaction_id || tx.id}
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-black text-slate-800">{tx.date}</span>
                                                            <span className="text-xs text-slate-400 font-bold">{tx.time}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-transform group-hover:scale-105 duration-300 ${isConsultation
                                                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-500'
                                                                    : 'bg-rose-50 border-rose-100 text-rose-500'
                                                                }`}>
                                                                {isConsultation ? <Plus size={16} /> : <ArrowUpRight size={16} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-800">{tx.description || (isConsultation ? 'استشارة طبية' : 'عملية سحب وتصفية أرباح')}</p>
                                                                {tx.patient_name && <p className="text-xs text-slate-400 font-bold mt-0.5">المريض: {tx.patient_name}</p>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <span className={`text-base font-black ${isConsultation ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                            {isConsultation ? '+' : '-'}{tx.amount} <span className="text-xs font-bold text-slate-400">ج.م</span>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <StatusBadge status={tx.status} />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <EmptyState
                                title="لا توجد معاملات بعد"
                                description="ستظهر هنا جميع المعاملات المالية الخاصة بك، من أرباح وسحوبات."
                            />
                        )}

                        {/* Pagination */}
                        <Pagination
                            current={page}
                            last={transactionPagination?.total_pages || 1}
                            onPageChange={setPage}
                        />
                    </Card>
                </TabsContent>

                {/* Payouts Panel */}
                <TabsContent value="payouts" className="mt-0 outline-none">
                    <Card className="rounded-[32px] border border-slate-100 bg-white overflow-hidden shadow-2xl shadow-slate-200/40">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                                طلبات السهم والتحويلات
                            </h3>
                            <p className="text-slate-500 text-xs font-semibold mt-1">تاريخ وجدول السحوبات التي قمت بطلبها من المنصة</p>
                        </div>

                        {payoutsLoading ? (
                            <div className="py-24 text-center">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500 mb-3" />
                                <p className="text-slate-500 font-bold text-sm">جاري تحميل سجل السحوبات...</p>
                            </div>
                        ) : payouts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table className="w-full text-right border-collapse">
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-b border-slate-100">
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">رقم الطلب</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">تاريخ الطلب</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">طريقة الدفع والسحب</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">المبلغ المطلوب</TableHead>
                                            <TableHead className="text-right py-5 px-6 font-black text-slate-400 text-xs">الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.map((payout: any) => (
                                            <TableRow key={payout.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors group">
                                                <TableCell className="font-mono text-slate-500 text-xs font-bold py-6 px-6">#{payout.id}</TableCell>
                                                <TableCell className="py-6 px-6">
                                                    <span className="text-sm font-black text-slate-800">{payout.created_at}</span>
                                                </TableCell>
                                                <TableCell className="py-6 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100/80 flex items-center justify-center text-slate-500">
                                                            {payout.method === 'bank_transfer' ? <Building2 size={14} /> : <CreditCard size={14} />}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">{payout.method === 'bank_transfer' ? 'تحويل بنكي' : 'محفظة إلكترونية'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-6">
                                                    <span className="text-base font-black text-slate-800">
                                                        {payout.amount} <span className="text-xs font-bold text-slate-400">ج.م</span>
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-6 px-6">
                                                    <StatusBadge status={payout.status} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <EmptyState
                                title="لا توجد طلبات سحب"
                                description="لم تقم بتقديم أي طلب سحب أرباح حتى الآن."
                            />
                        )}

                        <Pagination
                            current={payoutPage}
                            last={payoutPagination?.total_pages || 1}
                            onPageChange={setPayoutPage}
                        />
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Payout Dialog */}
            <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-3xl rounded-[32px] bg-white" dir="rtl">
                    <div className="bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl" />
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-indigo-300" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-white mb-2">طلب سحب أرباح جديد</DialogTitle>
                        <DialogDescription className="text-indigo-200 text-sm font-medium">
                            يمكنك سحب أرباحك مباشرةً. الحد الأدنى للسحب هو 100 جنيه مصري.
                        </DialogDescription>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl text-center">
                            <p className="text-xs text-slate-400 font-bold mb-1">رصيدك الكلي المتاح حالياً</p>
                            <h3 className="text-3xl font-black text-emerald-600">
                                {stats?.withdrawable_balance} <span className="text-sm font-black text-emerald-500">ج.م</span>
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-right font-black text-slate-700 text-sm">المبلغ المراد سحبه</Label>
                                <div className="relative">
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="h-12 text-right pl-16 rounded-xl font-bold bg-slate-50 border-slate-200 text-slate-800 text-lg focus:bg-white"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">جنيه</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-right font-black text-slate-700 text-sm">اختر طريقة السحب المفضلة</Label>
                                <Select
                                    value={payoutMethod}
                                    onValueChange={(val: any) => setPayoutMethod(val)}
                                >
                                    <SelectTrigger dir="rtl" className="h-12 rounded-xl border-slate-250 font-bold bg-slate-50">
                                        <SelectValue placeholder="اختر طريقة السحب" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="rounded-xl">
                                        <SelectItem value="bank_transfer" className="font-bold">تحويل بنكي مباشر</SelectItem>
                                        <SelectItem value="wallet" className="font-bold">محفظة إلكترونية (فودافون كاش...)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {payoutMethod === 'bank_transfer' ? (
                                <div className="space-y-3 animate-fade-in bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="space-y-2">
                                        <Label className="text-right text-xs font-black text-slate-500 uppercase">اسم البنك</Label>
                                        <Input
                                            value={payoutDetails.bank_name}
                                            onChange={(e) => setPayoutDetails({ ...payoutDetails, bank_name: e.target.value })}
                                            className="text-right rounded-xl bg-white border-slate-200 font-medium"
                                            placeholder="مثال: البنك الأهلي المصري"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-right text-xs font-black text-slate-500 uppercase">رقم الحساب / IBAN</Label>
                                        <Input
                                            value={payoutDetails.account_number}
                                            onChange={(e) => setPayoutDetails({ ...payoutDetails, account_number: e.target.value })}
                                            className="text-right rounded-xl bg-white border-slate-200 font-mono text-sm"
                                            placeholder="EG00000000000000000000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-right text-xs font-black text-slate-500 uppercase">اسم المستفيد بالكامل</Label>
                                        <Input
                                            value={payoutDetails.account_name}
                                            onChange={(e) => setPayoutDetails({ ...payoutDetails, account_name: e.target.value })}
                                            className="text-right rounded-xl bg-white border-slate-200 font-medium"
                                            placeholder="الاسم ثلاثي كما يظهر في البنك"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-fade-in bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <Label className="text-right text-xs font-black text-slate-500 uppercase">رقم المحفظة الرقمية</Label>
                                    <Input
                                        value={payoutDetails.wallet_number}
                                        onChange={(e) => setPayoutDetails({ ...payoutDetails, wallet_number: e.target.value })}
                                        className="text-right rounded-xl bg-white border-slate-200 font-bold"
                                        placeholder="01xxxxxxxxx"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">يرجى التأكد من أن الرقم يدعم استقبال الأموال.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-row-reverse sm:justify-start gap-3 rounded-b-[32px]">
                        <Button
                            onClick={submitPayout}
                            disabled={requestPayoutMutation.isPending}
                            className="bg-[#1E1B4B] hover:bg-indigo-700 text-white w-full h-12 text-sm font-black rounded-xl shadow-lg transition-all"
                        >
                            {requestPayoutMutation.isPending ? <Loader2 className="animate-spin ml-2" /> : null}
                            إرسال طلب السحب
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsPayoutOpen(false)}
                            className="w-full h-12 rounded-xl font-bold bg-white text-slate-600 hover:bg-slate-100"
                        >
                            إلغاء الطلب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Sub-components

const StatCard = ({ title, value, currency, icon, color, trend, highlight, isDate }: any) => {
    const colorStyles: any = {
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-600 ring-emerald-500/10",
        blue: "bg-blue-50 border-blue-100 text-blue-600 ring-blue-500/10",
        purple: "bg-indigo-50 border-indigo-150 text-indigo-600 ring-indigo-500/10",
        amber: "bg-amber-50 border-amber-100 text-amber-600 ring-amber-500/10",
    };

    return (
        <Card className={`p-6 rounded-[32px] border relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${highlight
                ? 'border-indigo-500/80 shadow-2xl shadow-indigo-500/10 bg-gradient-to-br from-white via-white to-indigo-50/20'
                : 'border-slate-100 hover:shadow-slate-200/50 bg-white'
            }`}>
            {highlight && <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-[32px]" />}

            <div className="flex justify-between items-start z-10 relative">
                <div className="space-y-3">
                    <p className="text-slate-400 text-xs font-black flex items-center gap-2">
                        {title}
                        {highlight && <Badge className="text-[10px] bg-indigo-50 hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-lg">فوري</Badge>}
                    </p>
                    <h3 className={`text-3xl font-black ${isDate ? 'text-slate-800' : 'text-slate-900 font-sans'}`}>
                        {value !== undefined
                            ? (isDate ? value : Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }))
                            : '0'
                        } {currency && <span className="text-sm text-slate-400 font-bold">{currency}</span>}
                    </h3>
                    {trend && !isDate && (
                        <p className="text-emerald-500 text-xs font-bold flex items-center gap-1.5">
                            <TrendingUp size={14} />
                            <span>مقارنة بالشهر السابق</span>
                        </p>
                    )}
                </div>
                <div className={`p-3.5 rounded-2xl shadow-sm border transition-transform duration-300 group-hover:scale-110 ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        completed: "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-50",
        approved: "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-50",
        pending: "bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-50",
        processing: "bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-50",
        refunded: "bg-purple-50 text-purple-700 border-purple-200/60 hover:bg-purple-50",
        failed: "bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-50",
        rejected: "bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-50",
        cancelled: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50",
    };

    const icons: any = {
        completed: <CheckCircle2 size={14} />,
        approved: <CheckCircle2 size={14} />,
        pending: <Clock size={14} />,
        processing: <Loader2 size={14} className="animate-spin" />,
        refunded: <ArrowDownLeft size={14} />,
        failed: <AlertCircle size={14} />,
        rejected: <XCircle size={14} />,
    };

    const labels: any = {
        completed: "مكتمل",
        approved: "مقبول",
        pending: "قيد المراجعة",
        processing: "جاري التحويل",
        refunded: "مسترد",
        failed: "فشل الطلب",
        rejected: "مرفوض",
        cancelled: "ملغي",
    };

    const style = styles[status] || styles.pending;
    const icon = icons[status] || icons.pending;
    const label = labels[status] || status;

    return (
        <Badge variant="outline" className={`${style} flex items-center gap-1.5 w-fit px-3 py-1 font-black rounded-full text-xs`}>
            {icon} {label}
        </Badge>
    );
};

const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-18 h-18 bg-slate-50 rounded-[20px] flex items-center justify-center mb-4 border border-slate-100 shadow-sm text-indigo-500">
            <Coins className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-400 max-w-sm text-sm font-semibold">{description}</p>
    </div>
);

const Pagination = ({ current, last, onPageChange }: any) => {
    if (last <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-3 py-6 border-t border-slate-100 bg-slate-50/30">
            <Button
                variant="outline"
                onClick={() => onPageChange(Math.max(1, current - 1))}
                disabled={current === 1}
                className="h-10 rounded-xl font-bold bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black text-xs"
            >
                السابق
            </Button>
            <span className="text-xs font-black text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                صفحة {current} من {last}
            </span>
            <Button
                variant="outline"
                onClick={() => onPageChange(Math.min(last, current + 1))}
                disabled={current === last}
                className="h-10 rounded-xl font-bold bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black text-xs"
            >
                التالي
            </Button>
        </div>
    );
};

// Mock chart fallback data
const mockChartData = [
    { name: 'يناير', amount: 0 },
    { name: 'فبراير', amount: 0 },
    { name: 'مارس', amount: 0 },
    { name: 'أبريل', amount: 0 },
    { name: 'مايو', amount: 0 },
    { name: 'يونيو', amount: 0 },
];

export default DoctorFinancials;
