
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { pregnancyService } from '@/services/pregnancyService';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from 'recharts';
import { Loader2, TrendingUp, Info } from 'lucide-react';

export const PregnancyWeightDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['pregnancyWeightChart'],
        queryFn: pregnancyService.getWeightChartData,
        enabled: open,
    });

    if (!open) return null;

    // Merge data for ComposedChart
    // We expect chartData to contain { chart_data: [], recommended_range_data: [] }

    const mergedData = chartData?.recommended_range_data?.map((rangeItem: any) => {
        const userEntry = chartData?.chart_data?.find((d: any) => d.week === rangeItem.week);
        return {
            ...rangeItem,
            userWeight: userEntry ? userEntry.weight : null
        };
    }) || [];

    const currentStatus = chartData?.current_status;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] bg-muted flex flex-col p-0 overflow-hidden rounded-[2rem] font-primary">

                {/* Header */}
                <div className="bg-white p-6 border-b border-border flex justify-between items-center shadow-sm z-10">
                    <div>
                        <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                            محنا الوزن
                            <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <TrendingUp size={18} />
                            </span>
                        </DialogTitle>
                        <p className="text-muted-foreground text-sm mt-1">متابعة زيادة الوزن الصحية خلال فترة الحمل</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SummaryCard label="الوزن الحالي" value={`${chartData?.chart_data?.at(-1)?.weight || '--'} kg`} color="emerald" />
                                <SummaryCard label="البداية" value={`${chartData?.recommended_range_data?.[0]?.min || '--'} kg`} color="slate" />
                                <SummaryCard label="إجمالي الزيادة" value={`${(chartData?.chart_data?.at(-1)?.weight - chartData?.recommended_range_data?.[0]?.min).toFixed(1) || '--'} kg`} color="blue" />
                                <SummaryCard label="الحالة" value={currentStatus === 'within_range' ? 'طبيعي ✅' : 'يحتاج متابعة ⚠️'} color={currentStatus === 'within_range' ? 'emerald' : 'orange'} />
                            </div>

                            {/* Chart Container */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-border h-[400px]">
                                <h4 className="font-bold text-foreground/80 mb-4 flex items-center gap-2">
                                    <Info size={16} /> الرسم البياني
                                </h4>
                                <ResponsiveContainer width="100%" height="90%">
                                    <ComposedChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="week" label={{ value: 'الأسبوع', position: 'insideBottom', offset: -5 }} stroke="#94a3b8" fontSize={12} />
                                        <YAxis label={{ value: 'الوزن (kg)', angle: -90, position: 'insideLeft' }} stroke="#94a3b8" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelFormatter={(value) => `الأسبوع ${value}`}
                                        />

                                        {/* Recommended Range Area */}
                                        <Area
                                            type="monotone"
                                            dataKey="max"
                                            stroke="none"
                                            fill="url(#rangeGradient)"
                                            fillOpacity={1}
                                        />
                                        {/* To create a band, we usually stack areas or use a specialized range chart. 
                                            For simplicity in Recharts, we can display the 'max' as area and 'min' as white area on top, or just lines.
                                            Better approach: Use "Range Area Chart". 
                                            Recharts needs [min, max] for 'dataKey' in Area if strictly range? No, 'Area' takes one key.
                                            Workaround: Area for 'max', and start 'min' ? 
                                            Actually, let's just use two Lines for range (green dashed) and one Line for user weight.
                                        */}

                                        <Line type="monotone" dataKey="max" stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} dot={false} name="الحد الأقصى" />
                                        <Line type="monotone" dataKey="min" stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} dot={false} name="الحد الأدنى" />

                                        <Line
                                            type="monotone"
                                            dataKey="userWeight"
                                            stroke="#0f172a"
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                            activeDot={{ r: 6 }}
                                            name="وزنك"
                                            connectNulls
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const SummaryCard = ({ label, value, color }: any) => {
    const colors: any = {
        emerald: "bg-emerald-50 text-emerald-700",
        blue: "bg-blue-50 text-blue-700",
        slate: "bg-muted/50 text-foreground/80",
        orange: "bg-orange-50 text-orange-700",
    };

    return (
        <div className={`p-4 rounded-2xl ${colors[color] || colors.slate} flex flex-col items-center justify-center text-center`}>
            <span className="text-xs font-bold opacity-70 mb-1">{label}</span>
            <span className="text-xl font-black">{value}</span>
        </div>
    );
};
