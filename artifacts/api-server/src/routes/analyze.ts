import { Router } from "express";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

function detectThreatLevel(logs: string): "low" | "medium" | "high" | "critical" {
  const lower = logs.toLowerCase();
  const criticalKeywords = ["ransomware", "rootkit", "exfiltration", "apt", "zero-day", "lateral movement", "privilege escalation", "c2", "command and control", "data breach", "mimikatz"];
  const highKeywords = ["brute force", "sql injection", "xss", "rce", "remote code execution", "malware", "trojan", "backdoor", "exploit", "reverse shell", "webshell", "metasploit"];
  const mediumKeywords = ["failed login", "port scan", "suspicious", "unauthorized", "anomaly", "phishing", "flood", "dos", "ddos", "authentication failure"];
  if (criticalKeywords.some(k => lower.includes(k))) return "critical";
  if (highKeywords.some(k => lower.includes(k))) return "high";
  if (mediumKeywords.some(k => lower.includes(k))) return "medium";
  return "low";
}

function calculateRiskScore(threatLevel: string): number {
  const base: Record<string, number> = { low: 12, medium: 38, high: 65, critical: 87 };
  return Math.min(100, (base[threatLevel] ?? 20) + Math.floor(Math.random() * 10));
}

function calculateConfidenceScore(logs: string, mitreMappings: any[]): number {
  const lines = logs.split('\n').filter(l => l.trim()).length;
  const base = Math.min(60, lines * 3);
  return Math.min(98, base + mitreMappings.length * 8);
}

function detectAttackerOrigin(logs: string): string {
  const lower = logs.toLowerCase();
  const origins: Record<string, string[]> = {
    "Russia (RU)": ["ru", "russian", "russia", "moscow", "apt28", "apt29", "cozy bear", "fancy bear"],
    "China (CN)": ["cn", "chinese", "china", "beijing", "apt1", "apt41", "panda"],
    "North Korea (DPRK)": ["dprk", "lazarus", "north korea", "kimsuky"],
    "Iran (IR)": ["iran", "iranian", "tehran", "apt33", "apt35", "charming kitten"],
    "Eastern Europe": ["eastern europe", "ukraine", "belarus"],
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
  if (lower.includes("brute force") || lower.includes("bruteforce") || lower.includes("password spray")) return "Credential-Based Attack";
  if (lower.includes("ddos") || lower.includes("dos")) return "DDoS / Volumetric Attack";
  if (lower.includes("xss") || lower.includes("cross-site")) return "Cross-Site Scripting (XSS)";
  if (lower.includes("rce") || lower.includes("remote code")) return "Remote Code Execution";
  if (lower.includes("port scan") || lower.includes("nmap") || lower.includes("masscan")) return "Network Reconnaissance";
  if (lower.includes("lateral movement") || lower.includes("pivot")) return "Lateral Movement / APT";
  if (lower.includes("exfiltration") || lower.includes("data theft") || lower.includes("exfil")) return "Data Exfiltration";
  if (lower.includes("malware") || lower.includes("trojan") || lower.includes("rat")) return "Malware / RAT Deployment";
  if (lower.includes("privilege escalation") || lower.includes("mimikatz")) return "Privilege Escalation";
  if (lower.includes("supply chain") || lower.includes("solarwinds")) return "Supply Chain Attack";
  if (lower.includes("zero-day") || lower.includes("0day")) return "Zero-Day Exploitation";
  return "Multi-Vector Intrusion";
}

function extractIOCs(logs: string) {
  const iocs: Array<{ type: string; value: string; context: string }> = [];
  
  // IPs
  const ipRegex = /\b(?!10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)(\d{1,3}(?:\.\d{1,3}){3})\b/g;
  const ips = [...new Set([...logs.matchAll(ipRegex)].map(m => m[1]))].slice(0, 8);
  ips.forEach(ip => iocs.push({ type: "ip", value: ip, context: "Detected in network traffic logs" }));
  
  // Domains
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|ru|cn|tk|pw|xyz|top|site)\b/gi;
  const domains = [...new Set([...logs.matchAll(domainRegex)].map(m => m[0]))].slice(0, 6);
  domains.forEach(d => iocs.push({ type: "domain", value: d, context: "Observed in DNS/HTTP traffic" }));
  
  // Hashes (MD5/SHA256)
  const md5Regex = /\b[a-fA-F0-9]{32}\b/g;
  const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;
  const hashes = [...new Set([...[...logs.matchAll(md5Regex)].map(m => m[0]), ...[...logs.matchAll(sha256Regex)].map(m => m[0])])].slice(0, 4);
  hashes.forEach(h => iocs.push({ type: "hash", value: h, context: "Malicious file hash detected" }));

  // CVE references
  const cveRegex = /CVE-\d{4}-\d{4,7}/gi;
  const cves = [...new Set([...logs.matchAll(cveRegex)].map(m => m[0]))].slice(0, 5);
  cves.forEach(cve => iocs.push({ type: "cve", value: cve, context: "Referenced vulnerability identifier" }));

  // Email addresses
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  const emails = [...new Set([...logs.matchAll(emailRegex)].map(m => m[0]))].slice(0, 4);
  emails.forEach(e => iocs.push({ type: "email", value: e, context: "Attacker or victim email address" }));

  // URLs
  const urlRegex = /https?:\/\/[^\s"'<>)]+/gi;
  const urls = [...new Set([...logs.matchAll(urlRegex)].map(m => m[0]))].slice(0, 4);
  urls.forEach(u => iocs.push({ type: "url", value: u, context: "Malicious or suspicious URL" }));

  return iocs;
}

function extractCVEs(logs: string): string[] {
  const cveRegex = /CVE-\d{4}-\d{4,7}/gi;
  return [...new Set([...logs.matchAll(cveRegex)].map(m => m[0]))];
}

function buildThreatActorProfile(attackerOrigin: string, attackType: string) {
  const profiles: Record<string, any> = {
    "Russia (RU)": {
      name: "APT28 / Fancy Bear",
      aliases: ["Sofacy", "STRONTIUM", "Tsar Team"],
      motivation: "Espionage, political disruption, military intelligence",
      sophistication: "nation-state",
      targetSectors: ["Government", "Defense", "Media", "Energy"],
      knownTools: ["X-Agent", "Sofacy", "Zebrocy", "Mimikatz"],
    },
    "China (CN)": {
      name: "APT41 / Double Dragon",
      aliases: ["Winnti", "Barium", "Wicked Panda"],
      motivation: "Espionage, financial gain, intellectual property theft",
      sophistication: "nation-state",
      targetSectors: ["Healthcare", "Telecom", "Technology", "Finance"],
      knownTools: ["ShadowPad", "Cobalt Strike", "PlugX", "DEADEYE"],
    },
    "North Korea (DPRK)": {
      name: "Lazarus Group",
      aliases: ["Hidden Cobra", "Zinc", "APT38"],
      motivation: "Financial theft, sanctions evasion, espionage",
      sophistication: "nation-state",
      targetSectors: ["Finance", "Cryptocurrency", "Defense", "Media"],
      knownTools: ["RATANKBA", "HOPLIGHT", "BlindingCan", "AppleJeus"],
    },
    "Iran (IR)": {
      name: "APT35 / Charming Kitten",
      aliases: ["Phosphorus", "TA453", "Magic Hound"],
      motivation: "Espionage, information gathering, regime support",
      sophistication: "high",
      targetSectors: ["Academia", "Journalism", "Human Rights", "Government"],
      knownTools: ["HYPERSCRAPE", "PowerShell RAT", "CharmPower"],
    },
  };
  
  const origin = Object.keys(profiles).find(k => attackerOrigin.includes(k.split(' ')[0]));
  if (origin && profiles[origin]) return profiles[origin];
  
  return {
    name: "Unknown Threat Actor",
    aliases: ["Unidentified"],
    motivation: attackType.includes("financial") ? "Financial gain" : "Unknown / Opportunistic",
    sophistication: "medium",
    targetSectors: ["General / Broad targeting"],
    knownTools: ["Commodity malware", "Open-source exploitation tools"],
  };
}

function buildMitreMappings(logs: string, attackType: string) {
  const lower = logs.toLowerCase();
  const mappings = [];
  if (lower.includes("phishing") || lower.includes("email")) mappings.push({ id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries send spear phishing emails with malicious attachments or links." });
  if (lower.includes("brute force") || lower.includes("password") || lower.includes("failed login")) mappings.push({ id: "T1110", name: "Brute Force", tactic: "Credential Access", description: "Adversaries attempt to gain access by trying many passwords or username/password combinations." });
  if (lower.includes("port scan") || lower.includes("nmap") || lower.includes("scan")) mappings.push({ id: "T1046", name: "Network Service Discovery", tactic: "Discovery", description: "Adversaries scan victim systems to discover running services and open ports." });
  if (lower.includes("lateral") || lower.includes("pivot") || lower.includes("smb")) mappings.push({ id: "T1021", name: "Remote Services", tactic: "Lateral Movement", description: "Adversaries use legitimate remote access services to move throughout the network." });
  if (lower.includes("privilege") || lower.includes("root") || lower.includes("mimikatz")) mappings.push({ id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "Privilege Escalation", description: "Adversaries exploit software vulnerabilities to elevate privileges." });
  if (lower.includes("exfil") || lower.includes("upload") || lower.includes("transfer")) mappings.push({ id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration", description: "Adversaries steal data by exfiltrating it over an existing C2 channel." });
  if (lower.includes("sql") || lower.includes("inject")) mappings.push({ id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", description: "Adversaries exploit vulnerability in internet-facing application." });
  if (lower.includes("ransomware") || lower.includes("encrypt")) mappings.push({ id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", description: "Adversaries encrypt data to interrupt availability." });
  if (lower.includes("c2") || lower.includes("beacon") || lower.includes("command and control")) mappings.push({ id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control", description: "Adversaries communicate using application layer protocols." });
  if (lower.includes("cred") || lower.includes("lsass") || lower.includes("dump")) mappings.push({ id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access", description: "Adversaries attempt to dump credentials to obtain account login information." });
  if (lower.includes("scheduled") || lower.includes("cron") || lower.includes("task")) mappings.push({ id: "T1053", name: "Scheduled Task/Job", tactic: "Persistence", description: "Adversaries abuse task scheduling functionality to facilitate malicious code execution." });
  if (lower.includes("registry") || lower.includes("autorun")) mappings.push({ id: "T1547", name: "Boot or Logon Autostart Execution", tactic: "Persistence", description: "Adversaries modify registry keys to execute malware on system startup." });
  if (mappings.length === 0) {
    mappings.push({ id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", description: "Adversaries abuse command and script interpreters to execute commands or binaries." });
    mappings.push({ id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion", description: "Adversaries obtain and abuse credentials of existing accounts." });
  }
  return mappings;
}

function buildTimeline(logs: string) {
  const lines = logs.split('\n').filter(l => l.trim().length > 0);
  const timeline = [];
  const now = new Date();
  const selected = lines.length > 6 ? lines.filter((_, i) => i % Math.ceil(lines.length / 6) === 0).slice(0, 6) : lines.slice(0, 6);
  for (let i = 0; i < selected.length; i++) {
    const t = new Date(now.getTime() - (selected.length - i) * 5 * 60000);
    const timeStr = t.toISOString().replace('T', ' ').substring(0, 19);
    const lower = selected[i].toLowerCase();
    let severity: "low" | "medium" | "high" | "critical" = "low";
    if (lower.includes("error") || lower.includes("fail") || lower.includes("denied")) severity = "medium";
    if (lower.includes("attack") || lower.includes("exploit") || lower.includes("inject")) severity = "high";
    if (lower.includes("critical") || lower.includes("breach") || lower.includes("ransomware")) severity = "critical";
    timeline.push({ time: timeStr, event: selected[i].trim().substring(0, 120), severity });
  }
  if (timeline.length === 0) {
    timeline.push({ time: now.toISOString().replace('T', ' ').substring(0, 19), event: "Security event detected in logs", severity: "medium" as const });
  }
  return timeline;
}

function buildNextSteps(attackType: string) {
  const steps: Record<string, string[]> = {
    "Ransomware Attack": ["Attempt to move laterally to backup systems and encrypt them", "Exfiltrate sensitive data before triggering full encryption", "Send ransom demand via encrypted communication channel", "Deploy additional ransomware variants if initial payment fails"],
    "Credential-Based Attack": ["Attempt credential stuffing against other services using harvested credentials", "Establish persistence via backdoor or rogue admin account", "Conduct internal reconnaissance after gaining access", "Move laterally to higher-value systems"],
    "SQL Injection": ["Extract database contents including user credentials and PII", "Attempt to write web shell for persistent access", "Escalate to OS command execution if DB runs with elevated privileges", "Pivot to internal network from compromised database server"],
    "Network Reconnaissance": ["Identify high-value targets from discovered open services", "Attempt exploitation of discovered vulnerable service versions", "Map internal network topology for lateral movement planning", "Establish persistent foothold through identified vulnerabilities"],
    "Phishing Campaign": ["Deploy secondary payload from phishing link if clicked", "Harvest credentials entered on fake login pages", "Use compromised account to send more targeted internal phishing", "Establish persistence and begin quiet data collection"],
    "Data Exfiltration": ["Move to additional data stores to maximize exfiltrated volume", "Set up persistent C2 channel using encrypted protocols", "Delete or corrupt original data for leverage in ransom", "Sell data on dark web markets if financially motivated"],
  };
  return steps[attackType] ?? ["Establish persistent access through multiple backdoors", "Conduct internal network reconnaissance to identify crown jewels", "Escalate privileges to gain domain administrator access", "Begin quiet exfiltration of sensitive data", "Cover tracks by clearing logs and disabling monitoring"];
}

function buildDefenseActions(threatLevel: string, attackType: string) {
  const immediateActions = [
    { priority: "immediate", action: "Isolate Affected Systems", description: "Immediately quarantine all compromised hosts from the network to prevent lateral movement." },
    { priority: "immediate", action: "Reset Compromised Credentials", description: "Force password reset for all potentially compromised accounts. Enforce MFA across the board." },
    { priority: "immediate", action: "Block Attacker Infrastructure", description: "Add all detected attacker IPs, domains and C2 indicators to firewall and DNS blocklists." },
  ];
  const shortTermActions = [
    { priority: "short-term", action: "Patch Exploited Vulnerabilities", description: "Apply security patches for all CVEs and weaknesses identified in this attack chain." },
    { priority: "short-term", action: "Enhance SIEM Detection Rules", description: "Deploy additional detection rules based on the specific TTPs observed in this incident." },
    { priority: "short-term", action: "Full Forensic Investigation", description: "Perform in-depth forensic analysis to establish the complete attack timeline and blast radius." },
    { priority: "short-term", action: "Notify Stakeholders", description: "Inform relevant teams, management, and regulatory bodies if data was exfiltrated." },
  ];
  const longTermActions = [
    { priority: "long-term", action: "Implement Zero Trust Architecture", description: "Adopt zero-trust principles to minimize the impact of future credential compromise." },
    { priority: "long-term", action: "Security Awareness Training", description: "Run targeted training based on the specific attack vector to reduce human-factor risk." },
    { priority: "long-term", action: "Adversarial Red Team Exercise", description: "Schedule a red team engagement to validate new defenses against simulated attack scenarios." },
  ];
  return [...immediateActions, ...shortTermActions, ...longTermActions];
}

function buildGraph(attackType: string, mitreMappings: any[]) {
  const nodes = [
    { id: "attacker", label: "Threat Actor", type: "attacker" },
    { id: "target", label: "Target Network", type: "target" },
  ];
  const edges = [{ from: "attacker", to: "target", label: attackType }];
  mitreMappings.slice(0, 4).forEach((m, i) => {
    const techId = `tech_${i}`;
    nodes.push({ id: techId, label: m.name, type: "technique" });
    edges.push({ from: "attacker", to: techId, label: m.tactic });
    edges.push({ from: techId, to: "target", label: "exploits" });
  });
  return { nodes, edges };
}

function buildIncidentPlaybook(attackType: string, threatLevel: string) {
  return [
    { phase: "Preparation", step: 1, action: "Assemble Incident Response Team", details: "Activate your IR team. Assign roles: Incident Commander, Threat Analyst, Forensics Lead, Communications Lead.", timeframe: "0-15 min" },
    { phase: "Identification", step: 2, action: "Confirm & Scope the Incident", details: "Validate indicators of compromise. Determine the full scope of affected systems, data, and users.", timeframe: "15-60 min" },
    { phase: "Containment", step: 3, action: "Immediate Containment", details: "Isolate infected systems. Block attacker IPs/domains at perimeter. Disable compromised accounts.", timeframe: "1-4 hrs" },
    { phase: "Containment", step: 4, action: "Secondary Containment", details: "Implement network segmentation. Review all privileged access. Deploy emergency firewall rules.", timeframe: "4-12 hrs" },
    { phase: "Eradication", step: 5, action: "Remove Threat Artifacts", details: "Eliminate all malware, backdoors, and attacker footholds. Scan all systems with updated signatures.", timeframe: "12-48 hrs" },
    { phase: "Recovery", step: 6, action: "Restore & Validate Systems", details: "Restore from known-good backups. Validate system integrity before returning to production.", timeframe: "1-7 days" },
    { phase: "Lessons Learned", step: 7, action: "Post-Incident Review", details: "Document the full timeline. Update detection rules and playbooks based on what was learned.", timeframe: "Within 2 weeks" },
  ];
}

router.post("/analyze", authMiddleware, async (req, res) => {
  const { logs } = req.body;
  if (!logs || typeof logs !== "string" || logs.trim().length === 0) {
    res.status(400).json({ error: "Logs content is required" });
    return;
  }

  const threatLevel = detectThreatLevel(logs);
  const riskScore = calculateRiskScore(threatLevel);
  const attackerOrigin = detectAttackerOrigin(logs);
  const attackType = detectAttackType(logs);
  const mitreMappings = buildMitreMappings(logs, attackType);
  const confidenceScore = calculateConfidenceScore(logs, mitreMappings);
  const timeline = buildTimeline(logs);
  const nextStepsPrediction = buildNextSteps(attackType);
  const defenseActions = buildDefenseActions(threatLevel, attackType);
  const { nodes: graphNodes, edges: graphEdges } = buildGraph(attackType, mitreMappings);
  const iocs = extractIOCs(logs);
  const cveIds = extractCVEs(logs);
  const threatActorProfile = buildThreatActorProfile(attackerOrigin, attackType);
  const incidentPlaybook = buildIncidentPlaybook(attackType, threatLevel);

  const threatDescriptions: Record<string, string> = {
    critical: "CRITICAL THREAT: Immediate response required. Advanced persistent threat indicators suggest a sophisticated, targeted campaign with potential for catastrophic infrastructure damage.",
    high: "HIGH SEVERITY THREAT: Significant malicious activity detected with clear indicators of compromise. Immediate response recommended to prevent escalation and data loss.",
    medium: "MODERATE THREAT ACTIVITY: Suspicious behavioral patterns detected. Early-stage indicators suggest targeted activity — escalate to your security team for investigation.",
    low: "LOW RISK ACTIVITY: Routine security events detected with no immediate threat indicators. Continue monitoring and ensure standard security controls are in place.",
  };

  res.json({
    threatLevel, riskScore, attackerOrigin, attackType, confidenceScore,
    summary: `${threatDescriptions[threatLevel]} Attack vector classified as "${attackType}" with ${mitreMappings.length} MITRE ATT&CK technique(s) identified. Origin attributed to ${attackerOrigin}. ${iocs.length} IOCs extracted. Risk score: ${riskScore}/100 (Confidence: ${confidenceScore}%).`,
    mitreMappings, timeline, nextStepsPrediction, defenseActions, graphNodes, graphEdges, iocs, cveIds, threatActorProfile, incidentPlaybook,
  });
});

export default router;
