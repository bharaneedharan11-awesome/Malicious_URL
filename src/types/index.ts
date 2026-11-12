export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RuleEvaluation {
  id: string;
  name: string;
  category: 'lexical' | 'host' | 'structure' | 'content' | 'reputation';
  triggered: boolean;
  scoreImpact: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: string;
}

export interface UrlDecomposition {
  originalUrl: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  port: string;
  subdomain: string;
  registeredDomain: string;
  topLevelDomain: string;
  path: string;
  query: string;
  urlLength: number;
  domainLength: number;
  entropy: number;
}

export interface ThreatIntelligence {
  enabled: boolean;
  analyzedAt?: string;
  verdict?: 'BENIGN' | 'SUSPICIOUS' | 'PHISHING' | 'MALICIOUS';
  confidenceScore?: number; // 0 - 100
  targetedBrand?: string;
  socialEngineeringTactics?: string[];
  threatSummary?: string;
  indicatorsOfCompromise?: string[];
  mitigationSteps?: string[];
}

export interface ScanResult {
  id: string;
  url: string;
  timestamp: string;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  decomposition: UrlDecomposition;
  rules: RuleEvaluation[];
  triggeredCount: number;
  summary: string;
  recommendation: string;
  threatIntel?: ThreatIntelligence;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  loginAt: string;
}

