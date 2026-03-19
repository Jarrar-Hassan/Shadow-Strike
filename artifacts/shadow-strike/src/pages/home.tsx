import React from "react";
import { Link } from "wouter";
import { Shield, Lock, Zap, ArrowRight, Activity, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Background Image requested in requirements.yaml */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero abstract background" 
            className="w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8">
            <Shield className="w-4 h-4" />
            <span>Next-Gen AI Security Operations</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground mb-8 tracking-tight leading-tight">
            Uncover Hidden Threats <br className="hidden md:block"/>
            with <span className="text-primary">Contextual AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            ShadowStrike analyzes raw security logs in seconds, mapping attacker behavior to the MITRE ATT&CK framework and generating actionable defense intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-8 text-base">
              <Link href="/analyze">
                Start Analyzing <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-300">
              View Sample Report
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Enterprise-Grade Intelligence</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Stop analyzing logs manually. Let our specialized AI engine extract the narrative behind the alerts.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                title: "Instant Log Parsing",
                desc: "Paste raw syslogs, cloudtrail, or proxy logs. We automatically parse, normalize, and extract indicators of compromise."
              },
              {
                icon: Database,
                title: "MITRE ATT&CK Mapping",
                desc: "Every identified action is mapped to specific tactics and techniques so you understand the attacker's playbook."
              },
              {
                icon: Lock,
                title: "Actionable Defenses",
                desc: "Get prioritized, short-term and long-term mitigation steps tailored to the specific threats discovered in your environment."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
