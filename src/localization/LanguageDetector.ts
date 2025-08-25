/**
 * Language Detection Utility
 * 
 * Provides language detection based on various sources including system locale,
 * environment variables, user preferences, and file extensions
 */

import { Language } from '../types';
import { Logger } from '../utils/logger';

export interface LanguageDetectionOptions {
  fallbackLanguage?: Language;
  preferredLanguage?: Language;
  respectSystemLocale?: boolean;
  customDetectors?: LanguageDetector[];
}

export interface LanguageDetector {
  name: string;
  priority: number;
  detect(): Language | null;
}

/**
 * Detects and manages language preferences
 */
export class LanguageDetectionService {
  private logger: Logger;
  private options: Required<Omit<LanguageDetectionOptions, 'preferredLanguage' | 'customDetectors'>> & {
    preferredLanguage?: Language;
    customDetectors: LanguageDetector[];
  };
  private detectors: LanguageDetector[] = [];

  constructor(logger: Logger, options: LanguageDetectionOptions = {}) {
    this.logger = logger;
    this.options = {
      fallbackLanguage: Language.ENGLISH,
      respectSystemLocale: true,
      customDetectors: [],
      ...options
    };

    this.setupDefaultDetectors();
    this.addCustomDetectors(this.options.customDetectors);
  }

  /**
   * Detect the best language to use based on all available sources
   */
  public detectLanguage(): Language {
    // If preferred language is set, use it
    if (this.options.preferredLanguage) {
      this.logger.debug(`Using preferred language: ${this.options.preferredLanguage}`);
      return this.options.preferredLanguage;
    }

    // Try each detector in priority order
    const sortedDetectors = this.detectors.sort((a, b) => b.priority - a.priority);
    
    for (const detector of sortedDetectors) {
      try {
        const detected = detector.detect();
        if (detected && this.isSupported(detected)) {
          this.logger.debug(`Language detected by ${detector.name}: ${detected}`);
          return detected;
        }
      } catch (error) {
        this.logger.warn(`Language detector ${detector.name} failed: ${error}`);
      }
    }

    this.logger.debug(`No language detected, using fallback: ${this.options.fallbackLanguage}`);
    return this.options.fallbackLanguage;
  }

  /**
   * Detect language from file path/extension
   */
  public detectFromFilePath(filePath: string): Language | null {
    const languageMap: Record<string, Language> = {
      '.en.': Language.ENGLISH,
      '.ja.': Language.JAPANESE,
      '.zh-TW.': Language.CHINESE_TRADITIONAL,
      '.zh-tw.': Language.CHINESE_TRADITIONAL,
      '_en.': Language.ENGLISH,
      '_ja.': Language.JAPANESE,
      '_zh-TW.': Language.CHINESE_TRADITIONAL,
      '_zh-tw.': Language.CHINESE_TRADITIONAL
    };

    const normalizedPath = filePath.toLowerCase();
    
    for (const [pattern, language] of Object.entries(languageMap)) {
      if (normalizedPath.includes(pattern)) {
        return language;
      }
    }

    return null;
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): Language[] {
    return [Language.ENGLISH, Language.JAPANESE, Language.CHINESE_TRADITIONAL];
  }

  /**
   * Check if a language is supported
   */
  public isSupported(language: Language): boolean {
    return this.getSupportedLanguages().includes(language);
  }

  /**
   * Add a custom language detector
   */
  public addDetector(detector: LanguageDetector): void {
    this.detectors.push(detector);
    this.logger.debug(`Added language detector: ${detector.name} (priority: ${detector.priority})`);
  }

  /**
   * Remove a language detector
   */
  public removeDetector(name: string): boolean {
    const index = this.detectors.findIndex(d => d.name === name);
    if (index >= 0) {
      this.detectors.splice(index, 1);
      this.logger.debug(`Removed language detector: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Set preferred language (highest priority)
   */
  public setPreferredLanguage(language: Language | null): void {
    this.options.preferredLanguage = language || undefined;
    this.logger.debug(`Set preferred language: ${language || 'none'}`);
  }

  /**
   * Get current preferred language
   */
  public getPreferredLanguage(): Language | null {
    return this.options.preferredLanguage || null;
  }

  /**
   * Setup default language detectors
   */
  private setupDefaultDetectors(): void {
    // Environment variable detector
    this.detectors.push({
      name: 'environment',
      priority: 80,
      detect: () => {
        const lang = process.env.AMAZONQ_LANG || process.env.AMAZONQ_LANGUAGE;
        if (lang) {
          const normalized = this.normalizeLanguageCode(lang);
          return this.codeToLanguage(normalized);
        }
        return null;
      }
    });

    // System locale detector
    if (this.options.respectSystemLocale) {
      this.detectors.push({
        name: 'system-locale',
        priority: 70,
        detect: () => {
          const locale = process.env.LC_ALL || process.env.LC_MESSAGES || 
                        process.env.LANG || process.env.LANGUAGE;
          
          if (!locale) return null;
          
          const langCode = this.normalizeLanguageCode(locale.split('_')[0].split('.')[0]);
          return this.codeToLanguage(langCode);
        }
      });
    }

    // Node.js ICU locale detector
    this.detectors.push({
      name: 'intl-locale',
      priority: 60,
      detect: () => {
        try {
          const locale = Intl.DateTimeFormat().resolvedOptions().locale;
          if (locale) {
            const langCode = this.normalizeLanguageCode(locale.split('-')[0]);
            return this.codeToLanguage(langCode);
          }
        } catch (error) {
          // Intl might not be available in all environments
        }
        return null;
      }
    });

    // Default detector (fallback)
    this.detectors.push({
      name: 'fallback',
      priority: 0,
      detect: () => this.options.fallbackLanguage
    });
  }

  /**
   * Add custom detectors
   */
  private addCustomDetectors(detectors: LanguageDetector[]): void {
    detectors.forEach(detector => this.addDetector(detector));
  }

  /**
   * Normalize language code to lowercase
   */
  private normalizeLanguageCode(code: string): string {
    return code.toLowerCase().trim();
  }

  /**
   * Convert language code to Language enum
   */
  private codeToLanguage(code: string): Language | null {
    const mapping: Record<string, Language> = {
      'en': Language.ENGLISH,
      'eng': Language.ENGLISH,
      'english': Language.ENGLISH,
      'ja': Language.JAPANESE,
      'jp': Language.JAPANESE,
      'jpn': Language.JAPANESE,
      'japanese': Language.JAPANESE,
      'zh': Language.CHINESE_TRADITIONAL,
      'zh-tw': Language.CHINESE_TRADITIONAL,
      'zh-hk': Language.CHINESE_TRADITIONAL,
      'zh-mo': Language.CHINESE_TRADITIONAL,
      'chinese': Language.CHINESE_TRADITIONAL,
      'traditional': Language.CHINESE_TRADITIONAL
    };

    return mapping[code] || null;
  }
}