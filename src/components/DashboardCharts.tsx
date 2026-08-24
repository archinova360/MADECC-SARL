import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Project, Appointment, ContactMessage, NewsletterSubscriber } from '../types.ts';
import { Calendar, Building, Mail, Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import { formatCurrency } from '../lib/utils.ts';

interface DashboardChartsProps {
  projects: Project[];
  appointments: Appointment[];
  contacts: ContactMessage[];
  subscribers: NewsletterSubscriber[];
  currency?: string;
  dbAnalytics?: {
    managedProjectsCount: number;
    totalProjectBudgetValue: number;
    managedContractsCount: number;
    totalContractValue: number;
    totalRevenue: number;
    pendingConsultations: number;
    unreadInquiries: number;
    pendingReviews: number;
    newsletterSubscribers: number;
    activeUsers: number;
    uploadedDocuments: number;
    bookingApprovalRate: string;
  } | null;
}

export default function DashboardCharts({
  projects,
  appointments,
  contacts,
  subscribers,
  currency = 'XAF',
  dbAnalytics,
}: DashboardChartsProps) {
  // 1. Process Booking / Consultation Trends (Grouped by Month/Year)
  const bookingTrendsData = useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    
    // Seed last 6 months with 0s to make sure there is always a clean trend line
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyCounts[label] = 0;
    }

    appointments.forEach((appt) => {
      if (!appt.appointmentDate) return;
      try {
        const d = new Date(appt.appointmentDate);
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (label in monthlyCounts) {
          monthlyCounts[label] += 1;
        } else {
          // If older/newer than the 6 month window, we still count if it's valid
          monthlyCounts[label] = (monthlyCounts[label] || 0) + 1;
        }
      } catch (err) {
        // Ignore parsing errors
      }
    });

    return Object.entries(monthlyCounts).map(([month, count]) => ({
      month,
      Consultations: count,
    }));
  }, [appointments]);

  // 2. Process Project Budgets & Total Contract Values
  const projectBudgetData = useMemo(() => {
    return projects.map((p) => {
      let budgetVal = 0;
      if (p.budget) {
        // Clean budget string like "120,000" or "$50,000" to float
        const cleaned = p.budget.replace(/[^0-9.]/g, '');
        budgetVal = parseFloat(cleaned) || 0;
      }
      return {
        name: p.title.length > 20 ? p.title.slice(0, 17) + '...' : p.title,
        Budget: budgetVal,
        status: p.status,
      };
    }).slice(0, 8); // Limit to top 8 projects to avoid rendering clutter
  }, [projects]);

  // 3. Process Project Status Distribution
  const projectStatusData = useMemo(() => {
    const counts = {
      planning: 0,
      'in-progress': 0,
      completed: 0,
      'on-hold': 0,
    };

    projects.forEach((p) => {
      if (p.status in counts) {
        counts[p.status as keyof typeof counts] += 1;
      }
    });

    return [
      { name: 'Planning', value: counts.planning, color: '#6366f1' }, // Indigo
      { name: 'In Progress', value: counts['in-progress'], color: '#f59e0b' }, // Amber
      { name: 'Completed', value: counts.completed, color: '#10b981' }, // Emerald
      { name: 'On Hold', value: counts['on-hold'], color: '#ef4444' }, // Red
    ].filter((item) => item.value > 0);
  }, [projects]);

  // 4. Process Engagement Trends (Contacts vs Subscribers over time)
  const engagementData = useMemo(() => {
    const dailyEngagement: Record<string, { Inquiries: number; Subscribers: number }> = {};
    
    // Seed last 7 days
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      dailyEngagement[label] = { Inquiries: 0, Subscribers: 0 };
    }

    contacts.forEach((c) => {
      if (!c.createdAt) return;
      try {
        const d = new Date(c.createdAt);
        const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        if (label in dailyEngagement) {
          dailyEngagement[label].Inquiries += 1;
        }
      } catch (e) {}
    });

    subscribers.forEach((s) => {
      if (!s.createdAt) return;
      try {
        const d = new Date(s.createdAt);
        const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        if (label in dailyEngagement) {
          dailyEngagement[label].Subscribers += 1;
        }
      } catch (e) {}
    });

    return Object.entries(dailyEngagement).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }, [contacts, subscribers]);

  // 5. Compute aggregate metrics
  const aggregateMetrics = useMemo(() => {
    let totalValue = 0;
    let totalRevenue = 0;

    if (dbAnalytics) {
      totalValue = dbAnalytics.totalContractValue;
      totalRevenue = dbAnalytics.totalRevenue;
    } else {
      projects.forEach((p) => {
        if (p.budget) {
          const cleaned = p.budget.replace(/[^0-9.]/g, '');
          totalValue += parseFloat(cleaned) || 0;
        }
      });
    }

    const conversionRate = dbAnalytics 
      ? dbAnalytics.bookingApprovalRate 
      : (appointments.length > 0
        ? ((appointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length / appointments.length) * 100).toFixed(1)
        : '0.0');

    return {
      totalValue,
      totalRevenue,
      conversionRate,
    };
  }, [projects, appointments, dbAnalytics]);

  const currencyFormatter = (value: number) => {
    return formatCurrency(value, currency);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Key metrics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Contract Value</span>
            <span className="text-white text-2xl font-extrabold mt-0.5 block">
              {currencyFormatter(aggregateMetrics.totalValue)}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total Live Revenue</span>
            <span className="text-white text-2xl font-extrabold mt-0.5 block">
              {currencyFormatter(aggregateMetrics.totalRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Booking Approval Rate</span>
            <span className="text-white text-2xl font-extrabold mt-0.5 block">
              {aggregateMetrics.conversionRate}%
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Active Subscribers</span>
            <span className="text-white text-2xl font-extrabold mt-0.5 block">
              {dbAnalytics ? dbAnalytics.newsletterSubscribers : subscribers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Project Booking trends (Area Chart) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Consultation Booking Volume</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Last 6 Months</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Consultations" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorConsultations)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Top Project Budgets (Bar Chart) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Top Engineering Project Budgets</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Active Contracts</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectBudgetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M ${currency}` : val >= 1000 ? `${(val / 1000).toFixed(0)}k ${currency}` : `${val} ${currency}`} />
                <Tooltip
                  formatter={(value: any) => [currencyFormatter(value), 'Budget']}
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {projectBudgetData.map((entry, index) => {
                    const colors: Record<string, string> = {
                      planning: '#6366f1',
                      'in-progress': '#f59e0b',
                      completed: '#10b981',
                      'on-hold': '#ef4444',
                    };
                    return <Cell key={`cell-${index}`} fill={colors[entry.status] || '#3b82f6'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Site Engagement Channel Traffic (Line Chart) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Site Traffic & Engagement</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Last 7 Days</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="Inquiries" stroke="#ec4899" strokeWidth={2.5} activeDot={{ r: 6 }} name="Contact Inquiries" />
                <Line type="monotone" dataKey="Subscribers" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} name="Newsletter Subs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Project Status Distribution (Pie Chart) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Portfolio Distribution</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Status Allocation</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 h-[220px] w-full">
              {projectStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                      formatter={(value: any) => [`${value} projects`, 'Allocation']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No project data to allocate
                </div>
              )}
            </div>
            <div className="sm:col-span-5 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Legend</h4>
              <div className="space-y-2">
                {projectStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
