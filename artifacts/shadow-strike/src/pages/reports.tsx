import React, { useState } from "react";
import { useGetReports, useDeleteReport } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { getAuthHeaders } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Calendar, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Reports() {
  const { token, isAuthenticated } = useAuth();
  const { data, isLoading, refetch } = useGetReports({
    query: { enabled: isAuthenticated },
    request: getAuthHeaders(token)
  });
  const deleteMutation = useDeleteReport({ request: getAuthHeaders(token) });
  
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this report?")) {
      await deleteMutation.mutateAsync({ id });
      refetch();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to view your saved reports.</p>
        </div>
      </div>
    );
  }

  const reports = data?.reports || [];
  const selectedReport = reports.find(r => r.id === selectedReportId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Saved Reports</h1>
        <p className="text-muted-foreground">Access and review your historical threat analyses.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          {/* Using generated image as requested */}
          <img 
            src={`${import.meta.env.BASE_URL}images/empty-reports.png`} 
            alt="No reports" 
            className="w-48 h-48 mx-auto mb-6 opacity-80"
          />
          <h3 className="text-xl font-bold text-foreground">No reports found</h3>
          <p className="text-muted-foreground mt-2 mb-6">You haven't saved any analysis reports yet.</p>
          <Button asChild>
            <a href={`${import.meta.env.BASE_URL}analyze`}>Start Analysis</a>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:border-primary/50 ${selectedReportId === report.id ? 'border-primary ring-1 ring-primary shadow-md' : 'border-slate-200'}`}
                  onClick={() => setSelectedReportId(report.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                      <Button variant="ghost" size="icon" className="w-8 h-8 h-8 -mt-2 -mr-2 text-slate-400 hover:text-destructive" onClick={(e) => handleDelete(report.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-foreground mb-3 truncate" title={report.title}>{report.title}</h3>
                    <div className="flex gap-2">
                      <Badge variant={report.result.threatLevel === 'critical' ? 'critical' : report.result.threatLevel === 'high' ? 'destructive' : report.result.threatLevel === 'medium' ? 'warning' : 'success'} className="uppercase text-[10px]">
                        {report.result.threatLevel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Risk: {report.result.riskScore}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedReport ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-slate-200 shadow-lg">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-2xl">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">{selectedReport.title}</CardTitle>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Full Report
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Executive Summary</h4>
                        <p className="text-sm text-slate-600 leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-100">
                          {selectedReport.result.summary}
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Attacker Origin</p>
                          <p className="font-semibold">{selectedReport.result.attackerOrigin}</p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Attack Type</p>
                          <p className="font-semibold">{selectedReport.result.attackType}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Identified Tactics (MITRE)</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.result.mitreMappings.map(m => (
                            <Badge key={m.id} variant="secondary" className="px-3 py-1 font-mono">
                              {m.id}: {m.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Predicted Next Steps</h4>
                        <ul className="space-y-2">
                          {selectedReport.result.nextStepsPrediction.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                              <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 min-h-[400px]"
                >
                  <p className="text-muted-foreground">Select a report from the list to view details.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
