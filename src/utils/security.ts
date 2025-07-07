import validator from 'validator';
import { logger } from './logger';

export interface SecurityConfig {
  enableInputValidation: boolean;
  enableApiKeySanitization: boolean;
  logSecurityEvents: boolean;
  strictMode: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors: string[];
  warnings: string[];
}

export interface SecurityEvent {
  type: 'input_validation' | 'api_key_exposure' | 'suspicious_activity' | 'rate_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: Record<string, any>;
  timestamp: number;
}

/**
 * Comprehensive security utility for input validation, sanitization, and threat detection
 * 
 * Provides production-ready security features including:
 * - Input validation and sanitization
 * - API key protection and masking
 * - Security event logging and monitoring
 * - Data leak prevention
 * - SQL injection and XSS protection
 * 
 * @example
 * ```typescript
 * const security = new SecurityManager({
 *   enableInputValidation: true,
 *   strictMode: true
 * });
 * 
 * // Validate and sanitize player names
 * const result = security.validatePlayerName('player123');
 * if (!result.isValid) {
 *   throw new Error(`Invalid player name: ${result.errors.join(', ')}`);
 * }
 * 
 * // Secure API key handling
 * const maskedKey = security.maskApiKey('abcd-1234-efgh-5678');
 * security.validateApiKey(apiKey);
 * ```
 */
export class SecurityManager {
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private suspiciousActivityCount = 0;
  private lastSecurityCheck = Date.now();

  // Common attack patterns
  private readonly sqlInjectionPatterns = [
    /(%27)|(')|(--)|(%23)|(#)/i,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/i,
    /\w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/i,
    /((%27)|('))union/i,
    /exec(\s|\+)+(s|x)p\w+/i
  ];

  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src[^>]*>/gi
  ];

  private readonly commandInjectionPatterns = [
    /[;&|`$()]/,
    /\.\.\//,
    /\/etc\/passwd/,
    /\/bin\//,
    /cmd\.exe/i,
    /powershell/i
  ];

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableInputValidation: true,
      enableApiKeySanitization: true,
      logSecurityEvents: true,
      strictMode: false,
      ...config
    };
  }

  /**
   * Validate and sanitize player names
   */
  public validatePlayerName(playerName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!playerName || typeof playerName !== 'string') {
      errors.push('Player name must be a non-empty string');
      return { isValid: false, errors, warnings };
    }

    // Basic sanitization
    const sanitized = validator.escape(playerName.trim());

    // Length validation
    if (sanitized.length < 3) {
      errors.push('Player name must be at least 3 characters long');
    }
    if (sanitized.length > 50) {
      errors.push('Player name must be no more than 50 characters long');
    }

    // Character validation
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      errors.push('Player name can only contain letters, numbers, underscores, and hyphens');
    }

    // Security checks
    this.checkForSecurityThreats(sanitized, 'player_name');

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings
    };
  }

  /**
   * Validate and sanitize match IDs
   */
  public validateMatchId(matchId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!matchId || typeof matchId !== 'string') {
      errors.push('Match ID must be a non-empty string');
      return { isValid: false, errors, warnings };
    }

    const sanitized = matchId.trim();

    // PUBG match IDs are typically UUIDs
    if (!validator.isUUID(sanitized)) {
      errors.push('Match ID must be a valid UUID');
    }

    // Security checks
    this.checkForSecurityThreats(sanitized, 'match_id');

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings
    };
  }

  /**
   * Validate API keys securely
   */
  public validateApiKey(apiKey: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!apiKey || typeof apiKey !== 'string') {
      errors.push('API key must be a non-empty string');
      return { isValid: false, errors, warnings };
    }

    // Don't sanitize API keys, just validate format
    const trimmed = apiKey.trim();

    // Basic format validation (adjust based on PUBG API key format)
    if (trimmed.length < 32) {
      errors.push('API key appears to be too short');
    }

    if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
      warnings.push('API key contains unexpected characters');
    }

    // Log API key validation attempt (without exposing the key)
    this.logSecurityEvent({
      type: 'api_key_exposure',
      severity: 'medium',
      message: 'API key validation attempted',
      context: {
        keyLength: trimmed.length,
        hasValidFormat: errors.length === 0
      },
      timestamp: Date.now()
    });

    return {
      isValid: errors.length === 0,
      sanitized: trimmed,
      errors,
      warnings
    };
  }

  /**
   * Safely mask API keys for logging
   */
  public maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }
    
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(0, apiKey.length - 8));
    
    return `${start}${middle}${end}`;
  }

  /**
   * Validate URL parameters and query strings
   */
  public validateUrlParameter(param: string, paramName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof param !== 'string') {
      errors.push(`${paramName} must be a string`);
      return { isValid: false, errors, warnings };
    }

    // Sanitize the parameter
    let sanitized = validator.escape(param.trim());

    // URL encode for safety
    sanitized = encodeURIComponent(sanitized);

    // Security checks
    this.checkForSecurityThreats(param, `url_param_${paramName}`);

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings
    };
  }

  /**
   * Check for common security threats in input
   */
  private checkForSecurityThreats(input: string, context: string): void {
    if (!this.config.enableInputValidation) return;

    const threats: string[] = [];

    // Check for SQL injection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        threats.push('Potential SQL injection detected');
        break;
      }
    }

    // Check for XSS
    for (const pattern of this.xssPatterns) {
      if (pattern.test(input)) {
        threats.push('Potential XSS detected');
        break;
      }
    }

    // Check for command injection
    for (const pattern of this.commandInjectionPatterns) {
      if (pattern.test(input)) {
        threats.push('Potential command injection detected');
        break;
      }
    }

    // Log threats
    if (threats.length > 0) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        message: `Security threats detected in ${context}`,
        context: {
          input: this.sanitizeForLogging(input),
          threats,
          location: context
        },
        timestamp: Date.now()
      });

      this.suspiciousActivityCount++;
    }
  }

  /**
   * Sanitize sensitive data for safe logging
   */
  public sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Mask potential API keys
      if (data.length > 20 && /^[a-zA-Z0-9\-_]+$/.test(data)) {
        return this.maskApiKey(data);
      }
      
      // Truncate long strings
      if (data.length > 100) {
        return data.substring(0, 100) + '...[truncated]';
      }
      
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (['apiKey', 'password', 'token', 'secret'].includes(key.toLowerCase())) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: SecurityEvent): void {
    if (!this.config.logSecurityEvents) return;

    this.securityEvents.push(event);

    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to system logger
    if (event.severity === 'critical' || event.severity === 'high') {
      logger.error('Security event detected', {
        type: event.type,
        severity: event.severity,
        message: event.message,
        context: this.sanitizeForLogging(event.context)
      });
    } else {
      logger.client('Security event detected', {
        type: event.type,
        severity: event.severity,
        message: event.message,
        context: this.sanitizeForLogging(event.context)
      });
    }
  }

  /**
   * Get recent security events
   */
  public getSecurityEvents(limit = 50): SecurityEvent[] {
    return this.securityEvents
      .slice(-limit)
      .map(event => ({
        ...event,
        context: this.sanitizeForLogging(event.context)
      }));
  }

  /**
   * Check overall security status
   */
  public getSecurityStatus(): {
    status: 'secure' | 'warning' | 'critical';
    suspiciousActivityCount: number;
    recentEvents: number;
    lastCheck: number;
  } {
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp > Date.now() - 3600000 // Last hour
    ).length;

    let status: 'secure' | 'warning' | 'critical' = 'secure';
    
    if (this.suspiciousActivityCount > 10 || recentEvents > 20) {
      status = 'critical';
    } else if (this.suspiciousActivityCount > 5 || recentEvents > 10) {
      status = 'warning';
    }

    return {
      status,
      suspiciousActivityCount: this.suspiciousActivityCount,
      recentEvents,
      lastCheck: this.lastSecurityCheck
    };
  }

  /**
   * Reset security counters (for testing or after addressing issues)
   */
  public resetSecurityCounters(): void {
    this.suspiciousActivityCount = 0;
    this.securityEvents = [];
    this.lastSecurityCheck = Date.now();
  }

  /**
   * Validate environment configuration for security
   */
  public validateEnvironmentSecurity(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      // Production-specific checks
      if (process.env.DEBUG) {
        warnings.push('Debug mode should be disabled in production');
      }
      
      if (!process.env.PUBG_API_KEY) {
        errors.push('PUBG_API_KEY environment variable is required in production');
      }
    }

    // Check for exposed secrets in environment
    for (const [key, value] of Object.entries(process.env)) {
      if (key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('key')) {
        if (value && value.length < 16) {
          warnings.push(`Environment variable ${key} appears to have a weak value`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const securityManager = new SecurityManager({
  enableInputValidation: process.env.ENABLE_INPUT_VALIDATION !== 'false',
  enableApiKeySanitization: true,
  logSecurityEvents: process.env.LOG_SECURITY_EVENTS !== 'false',
  strictMode: process.env.SECURITY_STRICT_MODE === 'true'
});