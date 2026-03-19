import { Router } from "express";
import { authMiddleware, JwtPayload } from "../lib/auth.js";

const router = Router();

function detectThreatLevel(logs: string): "low" | "medium" | "high" | "critical" {
  const lower = logs.toLowerCase();
  const criticalKeywords = ["ransomware", "rootkit", "exfiltration", "apt", "zero-day", "lateral movement", "privilege escalation", "c2", "command and control", "data breach"];
  const highKeywords = ["brute force", "sql injection", "xss", "rce", "remote code execution", "malware", "trojan", "backdoor", "exploit", "reverse shell"];
  const mediumKeywords = ["failed login", "port scan", "suspicious", "unauthorized", "anomaly", "phishing", "flood", "dos", "ddos"];
  
  if (criticalKeywords.some(k => lower.includes(k))) return "critical";
  if (highKeywords.some(k => lower.includes(k))) return "high";
  if (mediumKeywords.some(k => lower.includes(k))) return "medium";
  return "low";
}

function calculateRiskScore(threatLevel: string, logs: string): number {
  const base: Record<string, number> = { low: 15, medium: 40, high: 68, critical: 88 };
  const score = base[threatLevel] ?? 20;
  const variance = Math.floor(Math.random() * 10);
  return Math.min(100, score + variance);
}

function detectAttackerOrigin(logs: string): string {
  const lower = logs.toLowerCase();
  const origins: Record<string, string[]> = {
    "Russia": ["ru", "russian", "russia", "moscow", "apt28", "apt29", "cozy bear", "fancy bear"],
    "China": ["cn", "chinese", "china", "beijing", "apt1", "apt41", "panda"],
    "North Korea": ["dprk", "lazarus", "north korea", "kimsuky"],
    "Iran": ["iran", "iranian", "tehran", "apt33", "apt35"],
    "Unknown / Eastern Europe": ["eastern europe", "ukraine"],
    "United States": ["us", "nsa", "equation group"],
  };
  for (const [country, keywords] of Object.entries(origins)) {
    if (keywords.some(k => lower.includes(k))) return country;
  }
  const ipMatch = logs.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  if (ipMatch) return `Unknown (IP: ${ipMatch[1]})`;
  return "Unknown / Unattributed";
}

function detectAttackType(logs: string): string {
  const lower = logs.toLowerCase();
  if (lower.includes("ransomware")) return "Ransomware Attack";
  if (lower.includes("phishing")) return "Phishing Campaign";
  if (lower.includes("sql injection") || lower.includes("sqli")) return "SQL Injection";
  if (lower.includes("brute force") || lower.includes("bruteforce")) return "Brute Force Attack";
  if (lower.includes("ddos") || lower.includes("dos")) return "DDoS Attack";
  if (lower.includes("xss") || lower.includes("cross-site")) return "Cross-Site Scripting (XSS)";
  if (lower.includes("rce") || lower.includes("remote code")) return "Remote Code Execution";
  if (lower.includes("port scan") || lower.includes("nmap")) return "Network Reconnaissance";
  if (lower.includes("lateral movement")) return "Lateral Movement / APT";
  if (lower.includes("exfiltration") || lower.includes("data theft")) return "Data Exfiltration";
  if (lower.includes("malware") || lower.includes("trojan")) return "Malware Infection";
  if (lower.includes("privilege escalation")) return "Privilege Escalation";
  return "Multi-Vector Intrusion";
}

function buildMitreMappings(logs: string, attackType: string) {
  const lower = logs.toLowerCase();
  const mappings = [];

  if (lower.includes("phishing") || lower.includes("email")) {
    mappings.push({ id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries send spear phishing emails with malicious attachments or links to gain initial access." });
  }
  if (lower.includes("brute force") || lower.includes("password") || lower.includes("failed login")) {
    mappings.push({ id: "T1110", name: "Brute Force", tactic: "Credential Access", description: "Adversaries attempt to gain access by trying many passwords or username/password combinations." });
  }
  if (lower.includes("port scan") || lower.includes("nmap") || lower.includes("scan")) {
    mappings.push({ id: "T1046", name: "Network Service Discovery", tactic: "Discovery", description: "Adversaries scan victim systems to discover running services and open ports." });
  }
  if (lower.includes("lateral") || lower.includes("pivot")) {
    mappings.push({ id: "T1021", name: "Remote Services", tactic: "Lateral Movement", description: "Adversaries use legitimate remote access services to move throughout the network." });
  }
  if (lower.includes("privilege") || lower.includes("root") || lower.includes("admin")) {
    mappings.push({ id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "Privilege Escalation", description: "Adversaries exploit software vulnerabilities in an attempt to elevate privileges." });
  }
  if (lower.includes("exfil") || lower.includes("upload") || lower.includes("transfer")) {
    mappings.push({ id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration", description: "Adversaries steal data by exfiltrating it over an existing command and control channel." });
  }
  if (lower.includes("sql") || lower.includes("inject")) {
    mappings.push({ id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", description: "Adversaries exploit vulnerability in internet facing application to gain initial access." });
  }
  if (lower.includes("ransomware") || lower.includes("encrypt")) {
    mappings.push({ id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", description: "Adversaries encrypt data on target systems or on large numbers of systems in a network to interrupt availability." });
  }
  if (lower.includes("c2") || lower.includes("command and control") || lower.includes("beacon")) {
    mappings.push({ id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control", description: "Adversaries communicate using application layer protocols to avoid detection/network filtering." });
  }
  
  if (mappings.length === 0) {
    mappings.push({ id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", description: "Adversaries abuse command and script interpreters to execute commands, scripts, or binaries." });
    mappings.push({ id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion", description: "Adversaries obtain and abuse credentials of existing accounts to gain initial access or persist in an environment." });
  }
  
  return mappings;
}

function buildTimeline(logs: string) {
  const lines = logs.split('\n').filter(l => l.trim().length > 0).slice(0, 8);
  const severities = ["low", "medium", "high", "critical"] as const;
  const timeline = [];
  const now = new Date();
  
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const t = new Date(now.getTime() - (lines.length - i) * 5 * 60000);
    const timeStr = t.toISOString().replace('T', ' ').substring(0, 19);
    const lower = lines[i].toLowerCase();
    let severity: "low" | "medium" | "high" | "critical" = "low";
    if (lower.includes("error") || lower.includes("fail") || lower.includes("denied")) severity = "medium";
    if (lower.includes("attack") || lower.includes("exploit") || lower.includes("inject")) severity = "high";
    if (lower.includes("critical") || lower.includes("breach") || lower.includes("ransomware")) severity = "critical";
    timeline.push({ time: timeStr, event: lines[i].trim().substring(0, 120), severity });
  }
  
  if (timeline.length === 0) {
    timeline.push({ time: now.toISOString().replace('T',' ').substring(0,19), event: "Security event detected in logs", severity: "medium" as const });
  }
  
  return timeline;
}

function buildNextSteps(attackType: string, threatLevel: string) {
  const steps: Record<string, string[]> = {
    "Ransomware Attack": [
      "Attempt to move laterally to backup systems and encrypt them",
      "Exfiltrate sensitive data before triggering full encryption",
      "Send ransom demand via encrypted communication channel",
      "Deploy additional ransomware variants if initial payment fails",
    ],
    "Brute Force Attack": [
      "Attempt credential stuffing against other services using harvested credentials",
      "Establish persistence via backdoor or rogue admin account",
      "Conduct internal reconnaissance after gaining access",
      "Move laterally to higher-value systems",
    ],
    "SQL Injection": [
      "Extract database contents including user credentials",
      "Attempt to write web shell for persistent access",
      "Escalate to OS command execution if database runs with elevated privileges",
      "Pivot to internal network from compromised database server",
    ],
    "Network Reconnaissance": [
      "Identify high-value targets from discovered services",
      "Attempt exploitation of discovered vulnerable services",
      "Map internal network topology for lateral movement planning",
      "Establish persistent foothold through identified vulnerabilities",
    ],
    "Phishing Campaign": [
      "Deploy secondary payload from phishing link",
      "Harvest credentials entered on fake login pages",
      "Use compromised account to send more phishing emails internally",
      "Establish persistence and begin quiet data collection",
    ],
  };
  
  return steps[attackType] ?? [
    "Establish persistent access through multiple backdoors",
    "Conduct internal network reconnaissance",
    "Escalate privileges to gain domain admin access",
    "Exfiltrate sensitive data before detection",
    "Cover tracks and remove forensic evidence",
  ];
}

function buildDefenseActions(threatLevel: string, attackType: string) {
  return [
    { priority: "immediate", action: "Isolate Affected Systems", description: "Immediately quarantine compromised hosts from the network to prevent lateral movement." },
    { priority: "immediate", action: "Reset Compromised Credentials", description: "Force password reset for all accounts that may have been compromised. Enable MFA." },
    { priority: "immediate", action: "Block Attacker IPs", description: "Add detected attacker IP addresses to firewall blocklist and WAF rules." },
    { priority: "short-term", action: "Patch Exploited Vulnerabilities", description: "Apply security patches for all vulnerabilities identified in this attack vector." },
    { priority: "short-term", action: "Enhance Monitoring", description: "Deploy additional SIEM rules and increase log verbosity for affected systems." },
    { priority: "short-term", action: "Conduct Forensic Analysis", description: "Perform full forensic investigation to understand the complete attack scope and timeline." },
    { priority: "long-term", action: "Implement Zero Trust Architecture", description: "Adopt zero-trust network model to minimize lateral movement risk in future attacks." },
    { priority: "long-term", action: "Security Awareness Training", description: "Provide targeted security training based on the attack vector used in this incident." },
    { priority: "long-term", action: "Red Team Exercise", description: "Schedule a red team exercise to validate effectiveness of implemented countermeasures." },
  ];
}

function buildGraph(attackType: string, mitreMappings: any[]) {
  const nodes = [
    { id: "attacker", label: "Threat Actor", type: "attacker" },
    { id: "target", label: "Target System", type: "target" },
  ];
  const edges = [
    { from: "attacker", to: "target", label: attackType },
  ];
  
  mitreMappings.slice(0, 3).forEach((m, i) => {
    const techId = `tech_${i}`;
    nodes.push({ id: techId, label: m.name, type: "technique" });
    edges.push({ from: "attacker", to: techId, label: m.tactic });
    edges.push({ from: techId, to: "target", label: "exploits" });
  });
  
  return { nodes, edges };
}

router.post("/analyze", authMiddleware, async (req, res) => {
  const { logs } = req.body;
  if (!logs || typeof logs !== "string" || logs.trim().length === 0) {
    res.status(400).json({ error: "Logs content is required" });
    return;
  }

  const threatLevel = detectThreatLevel(logs);
  const riskScore = calculateRiskScore(threatLevel, logs);
  const attackerOrigin = detectAttackerOrigin(logs);
  const attackType = detectAttackType(logs);
  const mitreMappings = buildMitreMappings(logs, attackType);
  const timeline = buildTimeline(logs);
  const nextStepsPrediction = buildNextSteps(attackType, threatLevel);
  const defenseActions = buildDefenseActions(threatLevel, attackType);
  const { nodes: graphNodes, edges: graphEdges } = buildGraph(attackType, mitreMappings);

  const threatDescriptions: Record<string, string> = {
    critical: "CRITICAL THREAT DETECTED: This attack represents an immediate, severe risk to your infrastructure. Advanced persistent threat indicators suggest a sophisticated, targeted campaign with potential for catastrophic damage.",
    high: "HIGH SEVERITY THREAT: Significant malicious activity detected with clear indicators of compromise. Immediate response recommended to prevent escalation and data loss.",
    medium: "MODERATE THREAT ACTIVITY: Suspicious patterns detected that warrant investigation. Early indicators suggest possible targeted activity requiring monitoring and mitigation.",
    low: "LOW RISK ACTIVITY: Routine security events detected with no immediate threat indicators. Continue monitoring and ensure standard security controls are in place.",
  };

  res.json({
    threatLevel,
    riskScore,
    attackerOrigin,
    attackType,
    summary: `${threatDescriptions[threatLevel]} Attack vector classified as ${attackType} with ${mitreMappings.length} MITRE ATT&CK technique(s) identified. Origin attributed to ${attackerOrigin}. Risk score: ${riskScore}/100.`,
    mitreMappings,
    timeline,
    nextStepsPrediction,
    defenseActions,
    graphNodes,
    graphEdges,
  });
});

export default router;
