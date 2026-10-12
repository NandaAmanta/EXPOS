import React, { useState, useMemo } from 'react';
import { formatRupiah } from '@/lib/printer';
import {
    TrendingUp,
    Calendar,
    Clock,
    BarChart3,
    ArrowUpRight,
    ShoppingBag,
} from 'lucide-react';

export interface TrendItem {
    date?: string;
    hour?: string;
    label: string;
    day_name?: string;
    revenue: number;
    orders: number;
}

interface SalesLineChartProps {
    salesTrend: TrendItem[];
    hourlyTrend: TrendItem[];
    chartSummary?: {
        revenue_7d: number;
        orders_7d: number;
        revenue_30d: number;
        orders_30d: number;
        peak_revenue: number;
        peak_date: string | null;
    };
}

export default function SalesLineChart({
    salesTrend,
    hourlyTrend,
    chartSummary,
}: SalesLineChartProps) {
    const [period, setPeriod] = useState<'7d' | '30d' | 'today'>('7d');
    const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Active dataset based on period
    const activeData = useMemo<TrendItem[]>(() => {
        if (period === 'today') {
            return hourlyTrend || [];
        }
        if (period === '7d') {
            return (salesTrend || []).slice(-7);
        }
        return salesTrend || [];
    }, [period, salesTrend, hourlyTrend]);

    // Values based on active metric
    const values = useMemo(() => {
        return activeData.map((d) => (metric === 'revenue' ? d.revenue : d.orders));
    }, [activeData, metric]);

    const maxValue = useMemo(() => {
        const max = Math.max(...values, 0);
        return max === 0 ? (metric === 'revenue' ? 100000 : 10) : max;
    }, [values, metric]);

    const totalValue = useMemo(() => {
        return values.reduce((acc, curr) => acc + curr, 0);
    }, [values]);

    const avgValue = useMemo(() => {
        if (values.length === 0) return 0;
        return totalValue / values.length;
    }, [values, totalValue]);

    // SVG Dimensions & Coordinates
    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 40, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Y-axis tick intervals
    const yTicks = useMemo(() => {
        return [1, 0.75, 0.5, 0.25, 0];
    }, []);

    // Point coordinates
    const points = useMemo(() => {
        if (activeData.length === 0) return [];
        const stepX = activeData.length > 1 ? chartW / (activeData.length - 1) : chartW / 2;
        return activeData.map((item, index) => {
            const val = metric === 'revenue' ? item.revenue : item.orders;
            const x = padding.left + (activeData.length > 1 ? index * stepX : chartW / 2);
            const ratio = maxValue > 0 ? val / maxValue : 0;
            const y = padding.top + chartH - ratio * chartH;
            return { x, y, val, item, index };
        });
    }, [activeData, metric, chartW, chartH, maxValue, padding]);

    // Generate smooth cubic Bezier curve path
    const { linePath, areaPath } = useMemo(() => {
        if (points.length === 0) return { linePath: '', areaPath: '' };
        if (points.length === 1) {
            const p = points[0];
            const line = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`;
            const area = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${padding.top + chartH} L ${p.x - 20} ${padding.top + chartH} Z`;
            return { linePath: line, areaPath: area };
        }

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX1 = p0.x + (p1.x - p0.x) / 2;
            const cpY1 = p0.y;
            const cpX2 = p0.x + (p1.x - p0.x) / 2;
            const cpY2 = p1.y;
            d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }

        const baselineY = padding.top + chartH;
        const area = `${d} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

        return { linePath: d, areaPath: area };
    }, [points, chartH, padding]);

    const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

    // Formatting helper
    const formatYTick = (val: number) => {
        if (metric === 'orders') return Math.round(val).toString();
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
        return val.toString();
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
            {/* Top Toolbar: Title, Switchers */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <span>Grafik Tren Penjualan</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Live Trend
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Analisis dinamika omset dan frekuensi order berdasarkan waktu
                    </p>
                </div>

                {/* Period & Metric Switchers */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Metric Switcher */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setMetric('revenue')}
                            className={`px-3 py-1 rounded-lg transition ${
                                metric === 'revenue'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Omset (Rp)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetric('orders')}
                            className={`px-3 py-1 rounded-lg transition ${
                                metric === 'orders'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Struk
                        </button>
                    </div>

                    {/* Period Switcher */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setPeriod('7d')}
                            className={`px-3 py-1 rounded-lg transition ${
                                period === '7d'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            7 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => setPeriod('30d')}
                            className={`px-3 py-1 rounded-lg transition ${
                                period === '30d'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            30 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => setPeriod('today')}
                            className={`px-3 py-1 rounded-lg transition ${
                                period === 'today'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Hari Ini
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Total {period === '7d' ? '7 Hari' : period === '30d' ? '30 Hari' : 'Hari Ini'}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                        {metric === 'revenue' ? formatRupiah(totalValue) : `${totalValue} Struk`}
                    </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Rata-Rata {period === 'today' ? 'Per Jam' : 'Harian'}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                        {metric === 'revenue'
                            ? formatRupiah(Math.round(avgValue))
                            : `${avgValue.toFixed(1)} Struk`}
                    </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
                        Penjualan Tertinggi
                    </span>
                    <span className="text-base font-extrabold text-emerald-800 mt-0.5 block">
                        {metric === 'revenue'
                            ? formatRupiah(maxValue)
                            : `${maxValue} Struk`}
                    </span>
                </div>
            </div>

            {/* SVG Line Chart Interactive Container */}
            <div className="relative w-full overflow-hidden select-none">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-56 sm:h-64 overflow-visible"
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <defs>
                        {/* Area Gradient Fill */}
                        <linearGradient id="sales-emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                            <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Glow Filter */}
                        <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.4" />
                        </filter>
                    </defs>

                    {/* Y-Axis Grid Lines & Tick Labels */}
                    {yTicks.map((tickRatio, idx) => {
                        const y = padding.top + chartH - tickRatio * chartH;
                        const tickVal = maxValue * tickRatio;
                        return (
                            <g key={idx}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="#f1f5f9"
                                    strokeDasharray={tickRatio === 0 ? 'none' : '4 4'}
                                    strokeWidth={tickRatio === 0 ? '1.5' : '1'}
                                />
                                <text
                                    x={padding.left - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#94a3b8"
                                    fontFamily="monospace"
                                >
                                    {formatYTick(tickVal)}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis Tick Labels */}
                    {points.map((p, idx) => {
                        // Skip labels on 30d to prevent cluttering
                        const shouldShowLabel =
                            period !== '30d' ||
                            idx === 0 ||
                            idx === points.length - 1 ||
                            idx % 4 === 0;

                        if (!shouldShowLabel) return null;

                        return (
                            <text
                                key={idx}
                                x={p.x}
                                y={height - 12}
                                textAnchor="middle"
                                fontSize="10"
                                fill={hoveredIndex === idx ? '#0f172a' : '#94a3b8'}
                                fontWeight={hoveredIndex === idx ? 'bold' : 'normal'}
                            >
                                {p.item.label}
                            </text>
                        );
                    })}

                    {/* Gradient Area */}
                    {areaPath && (
                        <path
                            d={areaPath}
                            fill="url(#sales-emerald-gradient)"
                            className="transition-all duration-300"
                        />
                    )}

                    {/* Line Stroke */}
                    {linePath && (
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#059669"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#emerald-glow)"
                            className="transition-all duration-300"
                        />
                    )}

                    {/* Vertical Hover Tracking Guideline */}
                    {activePoint && (
                        <line
                            x1={activePoint.x}
                            y1={padding.top}
                            x2={activePoint.x}
                            y2={padding.top + chartH}
                            stroke="#059669"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            opacity="0.8"
                        />
                    )}

                    {/* Data Points (Circles) & Hover Triggers */}
                    {points.map((p, idx) => {
                        const isHovered = hoveredIndex === idx;
                        return (
                            <g
                                key={idx}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(idx)}
                            >
                                {/* Invisible wide hit-area for easy touch/hover */}
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={period === '30d' ? 8 : 14}
                                    fill="transparent"
                                />

                                {/* Visible circle dot */}
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHovered ? 6 : period === '30d' ? 2.5 : 4}
                                    fill={isHovered ? '#ffffff' : '#059669'}
                                    stroke="#059669"
                                    strokeWidth={isHovered ? 3 : 2}
                                    className="transition-all duration-150"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Interactive Tooltip Card Floating on Top */}
                {activePoint && (
                    <div
                        className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75"
                        style={{
                            left: `${(activePoint.x / width) * 100}%`,
                            top: `${(activePoint.y / height) * 100 - 10}%`,
                        }}
                    >
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[130px]">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {activePoint.item.day_name ? `${activePoint.item.day_name}, ` : ''}
                                    {activePoint.item.label}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-bold">
                                    {activePoint.item.orders} Struk
                                </span>
                            </div>
                            <div className="font-extrabold text-sm text-emerald-400">
                                {formatRupiah(activePoint.item.revenue)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Legend */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                        <span>Tren Omset</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                        <span>Data Aktual POS</span>
                    </span>
                </div>
                <span>Arahkan kursor / sentuh titik untuk melihat detail</span>
            </div>
        </div>
    );
}
