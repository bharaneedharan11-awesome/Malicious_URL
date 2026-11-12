import { ScanResult, RuleEvaluation, UrlDecomposition, RiskLevel } from '../types';

// Top recognized legitimate brands frequently targeted by phishing
const TARGETED_BRANDS = [
  { brand: 'paypal', legitimateDomains: ['paypal.com', 'paypal.me'] },
  { brand: 'google', legitimateDomains: ['google.com', 'google.co.uk', 'google.co.in', 'gmail.com', 'accounts.google.com'] },
  { brand: 'microsoft', legitimateDomains: ['microsoft.com', 'office.com', 'live.com', 'outlook.com', 'onedrive.live.com'] },
  { brand: 'apple', legitimateDomains: ['apple.com', 'icloud.com', 'appleid.apple.com'] },
  { brand: 'amazon', legitimateDomains: ['amazon.com', 'amazon.co.uk', 'amazon.in', 'amazon.de', 'aws.amazon.com'] },
  { brand: 'netflix', legitimateDomains: ['netflix.com'] },
  { brand: 'facebook', legitimateDomains: ['facebook.com', 'fb.com', 'messenger.com'] },
  { brand: 'instagram', legitimateDomains: ['instagram.com'] },
  { brand: 'chase', legitimateDomains: ['chase.com'] },
  { brand: 'wellsfargo', legitimateDomains: ['wellsfargo.com'] },
  { brand: 'bankofamerica', legitimateDomains: ['bankofamerica.com', 'bofa.com'] },
  { brand: 'binance', legitimateDomains: ['binance.com'] },
  { brand: 'coinbase', legitimateDomains: ['coinbase.com'] },
  { brand: 'whatsapp', legitimateDomains: ['whatsapp.com'] },
  { brand: 'steam', legitimateDomains: ['steampowered.com', 'steamcommunity.com'] },
  { brand: 'dhl', legitimateDomains: ['dhl.com'] },
  { brand: 'fedex', legitimateDomains: ['fedex.com'] },
];

// High-risk TLDs commonly seen in mass spam and credential harvesters
const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'work', 'click', 'buzz',
  'country', 'stream', 'loan', 'cam', 'icu', 'vip', 'fit', 'rest', 'monster',
  'surf', 'cyou', 'sbs', 'quest', 'cfd', 'support', 'date', 'faith'
]);

// Common URL shorteners masking original destination
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'cutt.ly', 'rebrand.ly', 'tiny.cc', 'shorte.st', 'soo.gd'
]);

// Sensitive keywords associated with credential harvesting and phishing lures
const SENSITIVE_KEYWORDS = [
  'login', 'signin', 'verify', 'account', 'security', 'update', 'banking',
  'password', 'authenticate', 'wallet', 'recover', 'billing', 'invoice',
  'webscr', 'confirm', 'support', 'suspension', 'alert', 'token', 'secure-login'
];

// High-risk downloadable payload extensions
const EXECUTABLE_EXTENSIONS = ['.exe', '.scr', '.bat', '.apk', '.vbs', '.zip', '.iso', '.cmd', '.msi'];

/**
 * Calculates Shannon Entropy of a string to detect randomized/DGA domains
 * H = - SUM( p(x) * log2(p(x)) )
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

/**
 * Validates and extracts components from URL
 */
export function parseAndDecomposeUrl(rawUrl: string): { decomposition: UrlDecomposition; error?: string } {
  let normalized = rawUrl.trim();
  if (!normalized) {
    return {
      decomposition: {} as UrlDecomposition,
      error: 'URL cannot be empty.',
    };
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'http://' + normalized;
  }

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    const parts = hostname.split('.');

    let tld = '';
    let registeredDomain = hostname;
    let subdomain = '';

    if (parts.length > 1) {
      tld = parts[parts.length - 1];
      // Check for compound ccTLDs like .co.uk
      if (parts.length >= 3 && ['co', 'com', 'org', 'net', 'edu', 'gov'].includes(parts[parts.length - 2])) {
        tld = `${parts[parts.length - 2]}.${tld}`;
        registeredDomain = `${parts[parts.length - 3]}.${tld}`;
        subdomain = parts.slice(0, parts.length - 3).join('.');
      } else {
        registeredDomain = `${parts[parts.length - 2]}.${tld}`;
        subdomain = parts.slice(0, parts.length - 2).join('.');
      }
    }

    const entropy = calculateShannonEntropy(hostname);

    const decomposition: UrlDecomposition = {
      originalUrl: rawUrl,
      normalizedUrl: normalized,
      protocol: parsed.protocol.replace(':', ''),
      hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      subdomain,
      registeredDomain,
      topLevelDomain: tld,
      path: parsed.pathname || '/',
      query: parsed.search || '',
      urlLength: normalized.length,
      domainLength: hostname.length,
      entropy,
    };

    return { decomposition };
  } catch {
    return {
      decomposition: {} as UrlDecomposition,
      error: 'Invalid URL format. Please provide a well-formed web address (e.g., https://example.com).',
    };
  }
}

/**
 * Main Heuristic Evaluation Engine
 */
export function evaluateUrl(rawUrl: string): { result?: ScanResult; error?: string } {
  const { decomposition, error } = parseAndDecomposeUrl(rawUrl);
  if (error || !decomposition) {
    return { error };
  }

  const rules: RuleEvaluation[] = [];
  const {
    normalizedUrl,
    hostname,
    protocol,
    port,
    subdomain,
    registeredDomain,
    topLevelDomain,
    path,
    query,
    urlLength,
    entropy,
  } = decomposition;

  const fullUrlLower = normalizedUrl.toLowerCase();
  const pathAndQuery = `${path}${query}`.toLowerCase();

  // 1. IP Address as Host
  const ipv4Pattern = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const isIpv4 = ipv4Pattern.test(hostname);
  const isIpv6 = hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']');
  const isIpHost = isIpv4 || isIpv6;

  rules.push({
    id: 'ip_host',
    name: 'IP Address as Hostname',
    category: 'host',
    triggered: isIpHost,
    scoreImpact: isIpHost ? 35 : 0,
    severity: 'high',
    description: 'Attackers frequently use direct IP addresses to host phishing sites and bypass domain reputation blocks.',
    evidence: isIpHost ? `Host resolved to raw numeric IP: ${hostname}` : 'Host uses registered domain name',
  });

  // 2. Target Brand Impersonation / Brand Squatting
  let brandSpoofed = '';
  let spoofEvidence = '';
  let brandTriggered = false;

  for (const item of TARGETED_BRANDS) {
    const brandName = item.brand;
    const inSubdomain = subdomain.toLowerCase().includes(brandName);
    const inPath = pathAndQuery.includes(brandName);
    const inDomain = registeredDomain.toLowerCase().includes(brandName);
    const isLegit = item.legitimateDomains.some((d) => registeredDomain.toLowerCase() === d);

    if ((inSubdomain || inPath || inDomain) && !isLegit) {
      brandTriggered = true;
      brandSpoofed = item.brand;
      spoofEvidence = `Targeted brand "${brandName}" found in URL while registered domain is "${registeredDomain}"`;
      break;
    }
  }

  rules.push({
    id: 'brand_squatting',
    name: 'Target Brand Impersonation',
    category: 'reputation',
    triggered: brandTriggered,
    scoreImpact: brandTriggered ? 30 : 0,
    severity: 'high',
    description: 'URL includes the name of a high-value institution or brand, but is not hosted on its legitimate domain.',
    evidence: brandTriggered ? spoofEvidence : 'No recognized brand impersonation detected',
  });

  // 3. At-Symbol (@) Redirection
  const hasAtSymbol = normalizedUrl.includes('@');
  rules.push({
    id: 'at_symbol',
    name: 'At-Symbol (@) Redirection Attack',
    category: 'structure',
    triggered: hasAtSymbol,
    scoreImpact: hasAtSymbol ? 30 : 0,
    severity: 'high',
    description: 'In URL syntax, text before "@" is treated as user authentication credentials, causing the browser to silently connect to the domain following the "@".',
    evidence: hasAtSymbol ? 'URL contains "@" character in authority component' : 'No "@" redirection pattern found',
  });

  // 4. Punycode / IDN Homograph Attack
  const isPunycode = hostname.startsWith('xn--') || hostname.includes('.xn--');
  rules.push({
    id: 'punycode_homograph',
    name: 'Punycode / Homograph Attack',
    category: 'host',
    triggered: isPunycode,
    scoreImpact: isPunycode ? 25 : 0,
    severity: 'high',
    description: 'Uses Internationalized Domain Names (IDN) with lookalike Cyrillic or Greek glyphs to visually mimic authentic brand domains.',
    evidence: isPunycode ? `Host contains punycode prefix: ${hostname}` : 'Standard ASCII domain encoding',
  });

  // 5. High Shannon Entropy (Randomized / DGA Domain)
  const isHighEntropy = entropy >= 3.8 && !isIpHost && hostname.length > 10;
  rules.push({
    id: 'domain_entropy',
    name: 'High Domain Randomness (Entropy)',
    category: 'host',
    triggered: isHighEntropy,
    scoreImpact: isHighEntropy ? 20 : 0,
    severity: 'medium',
    description: 'Domain exhibits high Shannon entropy, indicating an algorithmically generated random string (DGA) commonly used in botnets and disposable phishing.',
    evidence: `Domain entropy: ${entropy} bits/char (threshold: 3.8)`,
  });

  // 6. Suspicious Top-Level Domain (TLD)
  const isSuspiciousTld = SUSPICIOUS_TLDS.has(topLevelDomain.toLowerCase());
  rules.push({
    id: 'suspicious_tld',
    name: 'High-Abuse Top-Level Domain',
    category: 'reputation',
    triggered: isSuspiciousTld,
    scoreImpact: isSuspiciousTld ? 18 : 0,
    severity: 'medium',
    description: 'The domain uses a TLD with historically high abuse rates in automated spam, disposable phishing, and malware distribution campaigns.',
    evidence: isSuspiciousTld ? `TLD .${topLevelDomain} is classified in high-abuse watchlists` : `TLD .${topLevelDomain} is standard`,
  });

  // 7. Misleading Subdomain Stacking
  const subdomainParts = subdomain ? subdomain.split('.').filter(Boolean) : [];
  const excessiveSubdomains = subdomainParts.length >= 3;
  rules.push({
    id: 'subdomain_stacking',
    name: 'Excessive Subdomain Stacking',
    category: 'structure',
    triggered: excessiveSubdomains,
    scoreImpact: excessiveSubdomains ? 16 : 0,
    severity: 'medium',
    description: 'Attackers create deeply nested subdomains to push the actual domain out of view on mobile address bars or fool casual users.',
    evidence: excessiveSubdomains ? `Detected ${subdomainParts.length} subdomain layers: ${subdomain}` : `${subdomainParts.length} subdomain layer(s)`,
  });

  // 8. Hyphen Abuse in Domain
  const hyphenCount = (hostname.match(/-/g) || []).length;
  const excessiveHyphens = hyphenCount >= 3;
  rules.push({
    id: 'hyphen_abuse',
    name: 'Excessive Hyphen Abuse in Domain',
    category: 'lexical',
    triggered: excessiveHyphens,
    scoreImpact: excessiveHyphens ? 14 : 0,
    severity: 'medium',
    description: 'Phishing domains string multiple words with hyphens (e.g., secure-paypal-account-login.com) to simulate genuine service URLs.',
    evidence: `Host contains ${hyphenCount} hyphens (threshold: 3+)`,
  });

  // 9. Sensitive Credential Harvesting Keywords
  const foundKeywords = SENSITIVE_KEYWORDS.filter((kw) => fullUrlLower.includes(kw));
  const hasMultipleKeywords = foundKeywords.length >= 2;
  const hasKeyword = foundKeywords.length >= 1;
  const keywordScore = hasMultipleKeywords ? 16 : hasKeyword ? 8 : 0;

  rules.push({
    id: 'sensitive_keywords',
    name: 'Sensitive Authentication Keywords',
    category: 'lexical',
    triggered: hasKeyword,
    scoreImpact: keywordScore,
    severity: hasMultipleKeywords ? 'medium' : 'low',
    description: 'URL contains urgency or authentication terms (e.g., login, verify, banking) typically targeted in credential harvesting attacks.',
    evidence: hasKeyword ? `Keywords matched: ${foundKeywords.join(', ')}` : 'No suspicious authentication keywords found',
  });

  // 10. URL Shortener Masking
  const isShortener = URL_SHORTENERS.has(registeredDomain.toLowerCase()) || URL_SHORTENERS.has(hostname.toLowerCase());
  rules.push({
    id: 'url_shortener',
    name: 'URL Shortener Service Masking',
    category: 'structure',
    triggered: isShortener,
    scoreImpact: isShortener ? 15 : 0,
    severity: 'medium',
    description: 'URL uses a shortening service that conceals the true destination host, frequently exploited in SMS phishing (smishing).',
    evidence: isShortener ? `Detected shortener domain: ${registeredDomain}` : 'Direct URL, no known shortener',
  });

  // 11. Overly Long URL / Obfuscation
  const isExcessiveLength = urlLength > 85;
  rules.push({
    id: 'url_length',
    name: 'Abnormal URL Length',
    category: 'lexical',
    triggered: isExcessiveLength,
    scoreImpact: isExcessiveLength ? 12 : 0,
    severity: 'low',
    description: 'Very long URLs are frequently used to hide malicious domains or pass serialized tracking/exploit parameters in the query string.',
    evidence: `Total URL length is ${urlLength} characters (standard baseline < 85)`,
  });

  // 12. Non-Standard Port Usage
  const isNonStandardPort = port !== '80' && port !== '443' && port !== '';
  rules.push({
    id: 'non_standard_port',
    name: 'Non-Standard Web Port',
    category: 'structure',
    triggered: isNonStandardPort,
    scoreImpact: isNonStandardPort ? 15 : 0,
    severity: 'medium',
    description: 'Legitimate consumer web services rarely operate on non-standard ports (e.g. 8080, 2082, 8888) which often host rogue administrative consoles or malware command and control servers.',
    evidence: isNonStandardPort ? `Explicit port specified: :${port}` : 'Standard web port (80/443)',
  });

  // 13. Dangerous Executable or Script File Extension
  const matchedExtension = EXECUTABLE_EXTENSIONS.find((ext) => pathAndQuery.includes(ext));
  const hasDangerousExtension = !!matchedExtension;
  rules.push({
    id: 'executable_extension',
    name: 'Suspicious Executable Payload',
    category: 'content',
    triggered: hasDangerousExtension,
    scoreImpact: hasDangerousExtension ? 25 : 0,
    severity: 'high',
    description: 'URL directly points to an executable, archive, or script file (.exe, .bat, .scr, .iso) capable of initiating drive-by malware execution.',
    evidence: hasDangerousExtension ? `Dangerous file extension detected: ${matchedExtension}` : 'No direct executable extensions in path',
  });

  // 14. Insecure HTTP with Sensitive Keyword
  const isInsecureWithSensitive = protocol === 'http' && hasKeyword;
  rules.push({
    id: 'insecure_http_sensitive',
    name: 'Unencrypted HTTP with Sensitive Action',
    category: 'structure',
    triggered: isInsecureWithSensitive,
    scoreImpact: isInsecureWithSensitive ? 15 : 0,
    severity: 'medium',
    description: 'A login, verification, or banking path served over unencrypted HTTP exposes credentials to plain-text interception or indicates an improvised phishing kit.',
    evidence: isInsecureWithSensitive ? 'Plaintext HTTP used alongside authentication keywords' : 'Encrypted HTTPS or no sensitive action',
  });

  // 15. Double Slash (//) in URL Path
  const hasDoubleSlashInPath = path.includes('//');
  rules.push({
    id: 'double_slash_path',
    name: 'Double Slash Redirection in Path',
    category: 'structure',
    triggered: hasDoubleSlashInPath,
    scoreImpact: hasDoubleSlashInPath ? 14 : 0,
    severity: 'medium',
    description: 'A double slash in the path component often signifies an open redirect vulnerability or an attempt to bypass firewall path filters.',
    evidence: hasDoubleSlashInPath ? `Double slash detected in path: ${path}` : 'Normal path structure',
  });

  // Calculate Aggregated Score (Capped at 100)
  const rawScore = rules.reduce((acc, rule) => acc + (rule.triggered ? rule.scoreImpact : 0), 0);
  const riskScore = Math.min(100, Math.max(0, rawScore));

  let riskLevel: RiskLevel = 'Low';
  if (riskScore >= 65) {
    riskLevel = 'High';
  } else if (riskScore >= 30) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  const triggeredCount = rules.filter((r) => r.triggered).length;

  let summary = '';
  let recommendation = '';

  if (riskLevel === 'High') {
    summary = `High probability of malicious intent. Detected ${triggeredCount} suspicious indicator(s) including critical patterns like ${rules.filter(r => r.triggered && r.severity === 'high').map(r => r.name).join(', ') || 'multiple risk indicators'}.`;
    recommendation = 'DO NOT VISIT. Do not input passwords, credit card numbers, or personal details. Never download or execute files from this address.';
  } else if (riskLevel === 'Medium') {
    summary = `Elevated risk warning. Identified ${triggeredCount} abnormal characteristic(s) that match patterns commonly observed in phishing or deceptive websites.`;
    recommendation = 'PROCEED WITH CAUTION. Verify the true domain name carefully before interacting. Avoid entering sensitive credentials.';
  } else {
    summary = `Low risk profile. Standard structural and lexical characteristics observed across security checks.`;
    recommendation = 'Safe to browse under normal precautions. Always confirm the SSL certificate lock icon in your browser.';
  }

  const scanResult: ScanResult = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url: rawUrl,
    timestamp: new Date().toISOString(),
    riskScore,
    riskLevel,
    decomposition,
    rules,
    triggeredCount,
    summary,
    recommendation,
  };

  return { result: scanResult };
}
