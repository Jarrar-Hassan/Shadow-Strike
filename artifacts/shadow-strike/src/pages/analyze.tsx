import React, { useState } from "react";
import { useAnalyzeLogs, useSaveReport } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { getAuthHeaders } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth/auth-modal";
import { RiskGauge } from "@/components/visuals/risk-gauge";
import { NetworkGraph } from "@/components/visuals/network-graph";
import { Activity, ShieldAlert, Cpu, CheckCircle2, ChevronRight, Save, Loader2, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function Analyze() {
  const { isAuthenticated, token } = useAuth();
  const [logs, setLogs] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  
  const analyzeMutation = useAnalyzeLogs({ request: getAuthHeaders(token) });
  const saveMutation = useSaveReport({ request: getAuthHeaders(token) });

  const handleAnalyze = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!logs.trim()) return;
    
    analyzeMutation.mutate({ data: { logs } });
  };

  const handleSave = () => {
    if (!analyzeMutation.data) return;
    const title = prompt("Enter a title for this report:", reportTitle || "Incident Report");
    if (!title) return;
    
    saveMutation.mutate({
      data: {
        title,
        logs,
        result: analyzeMutation.data
      }
    }, {
      onSuccess: () => {
        alert("Report saved successfully!");
      }
    });
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      case 'critical': return 'critical';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Threat Analysis Console</h1>
        <p className="text-muted-foreground">Paste your raw security logs below for AI-powered investigation.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col shadow-md border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Raw Logs Input
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col relative">
              <textarea
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Paste syslogs, AWS CloudTrail, firewall logs, or application logs here..."
                className="w-full h-full min-h-[400px] p-6 resize-none outline-none font-mono text-sm text-slate-700 bg-transparent placeholder:text-slate-400"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={!logs.trim() || analyzeMutation.isPending}
                  className="w-full h-12 text-base shadow-lg shadow-primary/25"
                >
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Logs...</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" /> Run Analysis</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 space-y-6">
          {!analyzeMutation.data && !analyzeMutation.isPending && (
            <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm border flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Awaiting Input</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2">Run analysis on your logs to generate a comprehensive threat report.</p>
              </div>
            </div>
          )}

          {analyzeMutation.isPending && (
            <div className="h-full min-h-[400px] flex items-center justify-center border border-slate-100 rounded-3xl bg-white shadow-sm">
              <div className="text-center flex flex-col items-center">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                  <Cpu className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Processing Telemetry...</h3>
                <p className="text-sm text-muted-foreground mt-2">Correlating behaviors with MITRE ATT&CK...</p>
              </div>
            </div>
          )}

          {analyzeMutation.data && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Top Metrics Row */}
              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="overflow-hidden border-slate-200">
                  <div className="flex h-full">
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Threat Level</p>
                      <Badge variant={getThreatColor(analyzeMutation.data.threatLevel)} className="w-fit text-lg px-4 py-1 uppercase tracking-widest font-bold">
                        {analyzeMutation.data.threatLevel}
                      </Badge>
                      
                      <div className="mt-6 space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Attacker Origin</p>
                          <p className="font-semibold text-foreground">{analyzeMutation.data.attackerOrigin}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Attack Type</p>
                          <p className="font-semibold text-foreground">{analyzeMutation.data.attackType}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1 bg-slate-100 my-6"></div>
                    <div className="p-6 flex items-center justify-center">
                      <RiskGauge score={analyzeMutation.data.riskScore} />
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200 bg-slate-900 text-white">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {analyzeMutation.data.summary}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* MITRE & Graph */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>Attack Pathology</CardTitle>
                </CardHeader>
                <CardContent>
                  <NetworkGraph 
                    nodes={analyzeMutation.data.graphNodes} 
                    edges={analyzeMutation.data.graphEdges} 
                  />
                  
                  <div className="mt-8">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-b pb-2">MITRE ATT&CK Mapping</h4>
                    <div className="grid gap-3">
                      {analyzeMutation.data.mitreMappings.map((mitre) => (
                        <div key={mitre.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
                          <div className="w-16 flex-shrink-0">
                            <Badge variant="outline" className="font-mono bg-white">{mitre.id}</Badge>
                          </div>
                          <div>
                            <h5 className="font-semibold text-foreground">{mitre.name} <span className="text-muted-foreground font-normal">({mitre.tactic})</span></h5>
                            <p className="text-sm text-slate-600 mt-1">{mitre.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Defense */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Incident Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-200">
                      {analyzeMutation.data.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute w-3 h-3 rounded-full -left-[30px] top-1.5 ring-4 ring-white
                            ${event.severity === 'critical' ? 'bg-rose-500' : 
                              event.severity === 'high' ? 'bg-orange-500' : 
                              event.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          />
                          <p className="text-xs font-mono text-muted-foreground mb-1">{event.time}</p>
                          <p className="text-sm font-medium text-foreground">{event.event}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5" />
                      Recommended Defenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyzeMutation.data.defenseActions.map((defense, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={defense.priority === 'immediate' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                              {defense.priority}
                            </Badge>
                            <span className="font-semibold text-sm text-foreground">{defense.action}</span>
                          </div>
                          <p className="text-xs text-slate-600">{defense.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  size="lg" 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="shadow-lg shadow-primary/25"
                >
                  {saveMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Analysis Report
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
