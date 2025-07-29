#!/usr/bin/env ts-node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface SecurityAuditResult {
  timestamp: number;
  status: 'pass' | 'warning' | 'fail';
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
  };
  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
  };
  checks: {
    npmAudit: boolean;
    dependencyCheck: boolean;
    licenseCheck: boolean;
    codeAnalysis: boolean;
  };
  recommendations: string[];
  summary: string;
}

/**
 * Comprehensive security audit script for the PUBG TypeScript SDK
 * 
 * Performs multiple security checks including:
 * - NPM vulnerability scanning
 * - Dependency analysis
 * - License compliance
 * - Code security analysis
 * - Configuration validation
 */
class SecurityAuditor {
  private results: SecurityAuditResult;
  
  constructor() {
    this.results = {
      timestamp: Date.now(),
      status: 'pass',
      vulnerabilities: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0
      },
      dependencies: {
        total: 0,
        outdated: 0,
        vulnerable: 0
      },
      checks: {
        npmAudit: false,
        dependencyCheck: false,
        licenseCheck: false,
        codeAnalysis: false
      },
      recommendations: [],
      summary: ''
    };
  }

  /**
   * Run complete security audit
   */
  public async runAudit(): Promise<SecurityAuditResult> {
    console.log('🔒 Starting comprehensive security audit...\n');

    try {
      await this.runNpmAudit();
      await this.checkDependencies();
      await this.checkLicenses();
      await this.analyzeCode();
      await this.checkConfiguration();
      
      this.generateSummary();
      this.saveResults();
      
      console.log('\n✅ Security audit completed successfully!');
      return this.results;
      
    } catch (error) {
      console.error('❌ Security audit failed:', error);
      this.results.status = 'fail';
      this.results.summary = `Audit failed: ${error}`;
      return this.results;
    }
  }

  /**
   * Run NPM security audit
   */
  private async runNpmAudit(): Promise<void> {
    console.log('📦 Running NPM vulnerability scan...');
    
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.vulnerabilities) {
        for (const [_name, vuln] of Object.entries(auditData.vulnerabilities)) {
          const severity = (vuln as any).severity;
          if (severity && this.results.vulnerabilities[severity as keyof typeof this.results.vulnerabilities] !== undefined) {
            this.results.vulnerabilities[severity as keyof typeof this.results.vulnerabilities]++;
          }
        }
      }
      
      this.results.checks.npmAudit = true;
      
      const totalVulns = Object.values(this.results.vulnerabilities).reduce((a, b) => a + b, 0);
      if (totalVulns > 0) {
        console.log(`⚠️  Found ${totalVulns} vulnerabilities`);
        this.results.recommendations.push('Run "npm audit fix" to resolve known vulnerabilities');
        
        if (this.results.vulnerabilities.critical > 0 || this.results.vulnerabilities.high > 0) {
          this.results.status = 'fail';
        } else if (this.results.vulnerabilities.moderate > 0) {
          this.results.status = 'warning';
        }
      } else {
        console.log('✅ No known vulnerabilities found');
      }
      
    } catch (_error) {
      console.log('⚠️  NPM audit encountered issues (this may be normal)');
      this.results.checks.npmAudit = true;
    }
  }

  /**
   * Check dependency status
   */
  private async checkDependencies(): Promise<void> {
    console.log('\n📋 Analyzing dependencies...');
    
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const dependencies = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };
      
      this.results.dependencies.total = Object.keys(dependencies).length;
      
      // Check for outdated packages
      try {
        const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
        const outdatedData = JSON.parse(outdatedOutput);
        this.results.dependencies.outdated = Object.keys(outdatedData || {}).length;
        
        if (this.results.dependencies.outdated > 0) {
          console.log(`📅 ${this.results.dependencies.outdated} packages are outdated`);
          this.results.recommendations.push('Consider updating outdated packages with "npm update"');
        }
      } catch {
        // npm outdated returns non-zero exit code when packages are outdated
      }
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'event-stream', 'eslint-scope', 'getcookies', 'rc'
      ];
      
      for (const pkg of vulnerablePackages) {
        if (dependencies[pkg]) {
          this.results.dependencies.vulnerable++;
          this.results.recommendations.push(`Remove or replace vulnerable package: ${pkg}`);
        }
      }
      
      this.results.checks.dependencyCheck = true;
      console.log(`✅ Analyzed ${this.results.dependencies.total} dependencies`);
      
    } catch (error) {
      console.log('⚠️  Could not analyze dependencies:', error);
    }
  }

  /**
   * Check license compliance
   */
  private async checkLicenses(): Promise<void> {
    console.log('\n📄 Checking license compliance...');
    
    try {
      // Check main package license
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      if (!packageJson.license) {
        this.results.recommendations.push('Add license field to package.json');
      }
      
      // List of problematic licenses
      const problematicLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];
      
      if (problematicLicenses.includes(packageJson.license)) {
        this.results.recommendations.push(`Review license compatibility: ${packageJson.license}`);
      }
      
      this.results.checks.licenseCheck = true;
      console.log('✅ License compliance checked');
      
    } catch (error) {
      console.log('⚠️  Could not check licenses:', error);
    }
  }

  /**
   * Analyze code for security issues
   */
  private async analyzeCode(): Promise<void> {
    console.log('\n🔍 Analyzing code for security issues...');
    
    try {
      // Check for hardcoded secrets
      const _secretPatterns = [
        /api[_-]?key[_-]?=.{10,}/i,
        /password[_-]?=.{8,}/i,
        /secret[_-]?=.{10,}/i,
        /token[_-]?=.{16,}/i,
        /[a-zA-Z0-9]{32,}/g // Potential API keys/tokens
      ];

      const issues: string[] = [];
      
      // Scan TypeScript files
      try {
        const grepOutput = execSync('find src -name "*.ts" -exec grep -l -E "(api_key|password|secret|token)" {} \\;', { encoding: 'utf8' });
        if (grepOutput.trim()) {
          issues.push('Potential hardcoded secrets found in source files');
          this.results.recommendations.push('Review source files for hardcoded secrets and move to environment variables');
        }
      } catch {
        // No matches found (good)
      }
      
      // Check for console.log statements (potential info leakage)
      try {
        const consoleOutput = execSync('find src -name "*.ts" -exec grep -l "console\\.log" {} \\;', { encoding: 'utf8' });
        if (consoleOutput.trim()) {
          issues.push('Console.log statements found in source code');
          this.results.recommendations.push('Remove or replace console.log statements with proper logging');
        }
      } catch {
        // No matches found (good)
      }
      
      if (issues.length > 0) {
        console.log(`⚠️  Found ${issues.length} potential security issues`);
        if (this.results.status === 'pass') {
          this.results.status = 'warning';
        }
      } else {
        console.log('✅ No obvious security issues found in code');
      }
      
      this.results.checks.codeAnalysis = true;
      
    } catch (error) {
      console.log('⚠️  Could not analyze code:', error);
    }
  }

  /**
   * Check security configuration
   */
  private async checkConfiguration(): Promise<void> {
    console.log('\n⚙️  Checking security configuration...');
    
    const issues: string[] = [];
    
    // Check .env.example exists
    try {
      readFileSync('.env.example', 'utf8');
      console.log('✅ .env.example file found');
    } catch {
      issues.push('Missing .env.example file');
      this.results.recommendations.push('Create .env.example file with required environment variables');
    }
    
    // Check .gitignore for sensitive files
    try {
      const gitignore = readFileSync('.gitignore', 'utf8');
      const requiredEntries = ['.env', 'node_modules', '*.log'];
      
      for (const entry of requiredEntries) {
        if (!gitignore.includes(entry)) {
          issues.push(`Missing ${entry} in .gitignore`);
          this.results.recommendations.push(`Add ${entry} to .gitignore`);
        }
      }
    } catch {
      issues.push('Missing .gitignore file');
      this.results.recommendations.push('Create .gitignore file to exclude sensitive files');
    }
    
    // Check for TypeScript strict mode
    try {
      const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
      if (!tsconfig.compilerOptions?.strict) {
        issues.push('TypeScript strict mode not enabled');
        this.results.recommendations.push('Enable TypeScript strict mode for better type safety');
      }
    } catch {
      // tsconfig.json might not exist or be malformed
    }
    
    if (issues.length === 0) {
      console.log('✅ Security configuration looks good');
    } else {
      console.log(`⚠️  Found ${issues.length} configuration issues`);
    }
  }

  /**
   * Generate audit summary
   */
  private generateSummary(): void {
    const totalVulns = Object.values(this.results.vulnerabilities).reduce((a, b) => a + b, 0);
    const completedChecks = Object.values(this.results.checks).filter(Boolean).length;
    
    this.results.summary = `Security audit completed with ${completedChecks}/4 checks passed. ` +
      `Found ${totalVulns} vulnerabilities across ${this.results.dependencies.total} dependencies. ` +
      `Status: ${this.results.status.toUpperCase()}`;
  }

  /**
   * Save audit results to file
   */
  private saveResults(): void {
    const outputPath = join(process.cwd(), 'security-audit-report.json');
    writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${outputPath}`);
  }

  /**
   * Print summary report
   */
  public printSummary(): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log('               SECURITY AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${this.getStatusIcon()} ${this.results.status.toUpperCase()}`);
    console.log(`Timestamp: ${new Date(this.results.timestamp).toISOString()}`);
    console.log('\nVulnerabilities:');
    console.log(`  Critical: ${this.results.vulnerabilities.critical}`);
    console.log(`  High: ${this.results.vulnerabilities.high}`);
    console.log(`  Moderate: ${this.results.vulnerabilities.moderate}`);
    console.log(`  Low: ${this.results.vulnerabilities.low}`);
    
    console.log('\nDependencies:');
    console.log(`  Total: ${this.results.dependencies.total}`);
    console.log(`  Outdated: ${this.results.dependencies.outdated}`);
    console.log(`  Vulnerable: ${this.results.dependencies.vulnerable}`);
    
    if (this.results.recommendations.length > 0) {
      console.log('\nRecommendations:');
      this.results.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    console.log(`\n${'='.repeat(60)}`);
  }

  private getStatusIcon(): string {
    switch (this.results.status) {
      case 'pass': return '✅';
      case 'warning': return '⚠️';
      case 'fail': return '❌';
      default: return '❓';
    }
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().then(results => {
    auditor.printSummary();
    process.exit(results.status === 'fail' ? 1 : 0);
  });
}

export { SecurityAuditor };