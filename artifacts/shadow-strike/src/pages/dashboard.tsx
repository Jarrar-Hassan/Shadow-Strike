import React, { useMemo } from "react";
import { useGetReports } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { getAuthHeaders } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, FileText, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { Loader2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, token, isAuthenticated } = useAuth();
  
  const { data, isLoading } = useGetReports({
    query: { enabled: isAuthenticated },
    request: getAuthHeaders(token)
  });

  const reports = data?.reports || [];

  const analytics = useMemo(() => {
    if (!reports.length) return null;
    
    const total = reports.length;
    const avgScore = Math.round(reports.reduce((acc, r) => acc + r.result.riskScore, 0) / total);
    const criticalCount = reports.filter(r => r.result.threatLevel === 'critical').length;
    
    const threatCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const attackTypes: Record<string, number> = {};

    reports.forEach(r => {
      // Threat levels
      if (threatCounts[r.result.threatLevel] !== undefined) {
        threatCounts[r.result.threatLevel]++;
      }
      
      // Attack types
      const type = r.result.attackType;
      if (attackTypes[type]) {
        attackTypes[type]++;
      } else {
        attackTypes[type] = 1;
      }
    });

    const threatChartData = [
      { name: 'Low', value: threatCounts.low, color: '#10b981' },
      { name: 'Medium', value: threatCounts.medium, color: '#f59e0b' },
      { name: 'High', value: threatCounts.high, color: '#f97316' },
      { name: 'Critical', value: threatCounts.critical, color: '#e11d48' },
    ].filter(item => item.value > 0);

    const attackTypeChartData = Object.entries(attackTypes)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return { total, avgScore, criticalCount, threatChartData, attackTypeChartData };
  }, [reports]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold mb-2">Welcome back, {user?.email}</h1>
          <p className="text-slate-300 max-w-2xl">Here is an overview of your security analysis activity and threat landscape.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !analytics ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-foreground">No data available</h3>
          <p className="text-muted-foreground mt-2 mb-6">Run some log analyses to populate your dashboard.</p>
          <Button asChild>
            <Link href="/analyze">Start Analysis</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Row */}
          <div className="grid sm:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Avg Risk Score</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.avgScore}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Critical Alerts</p>
                  <p className="text-3xl font-bold text-slate-900">{analytics.criticalCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg">Top Attack Types</CardTitle>
                <CardDescription>Most frequent threat classifications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.attackTypeChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg">Threat Level Distribution</CardTitle>
                <CardDescription>Severity breakdown across all reports</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.threatChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {analytics.threatChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
                <CardDescription>Last 5 security analyses</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Threat Level</th>
                    <th className="px-6 py-4 font-medium">Risk Score</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reports.slice(0, 5).map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 max-w-[200px] truncate" title={report.title}>
                        {report.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={report.result.threatLevel === 'critical' ? 'critical' : report.result.threatLevel === 'high' ? 'destructive' : report.result.threatLevel === 'medium' ? 'warning' : 'success'} className="uppercase text-[10px]">
                          {report.result.threatLevel}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{report.result.riskScore}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${report.result.riskScore > 75 ? 'bg-rose-500' : report.result.riskScore > 50 ? 'bg-orange-500' : report.result.riskScore > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${report.result.riskScore}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                          <Link href="/reports">View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
