/**
 * Localization Manager
 * 
 * Provides multi-language support with string interpolation and fallback mechanisms
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Language, LocalizedStrings } from '../types';
import { Logger } from '../utils/logger';

export interface LocalizationOptions {
  fallbackLanguage?: Language;
  enableCaching?: boolean;
  strict?: boolean; // If true, throws on missing keys instead of returning key
}

/**
 * Manages localized strings with interpolation and fallback support
 */
export class LocalizationManager {
  private logger: Logger;
  private cache: Map<Language, LocalizedStrings>;
  private options: Required<LocalizationOptions>;
  private localizationPath: string;

  constructor(logger: Logger, options: LocalizationOptions = {}) {
    this.logger = logger;
    this.cache = new Map();
    this.options = {
      fallbackLanguage: Language.ENGLISH,
      enableCaching: true,
      strict: false,
      ...options
    };
    this.localizationPath = join(__dirname);
  }

  /**
   * Get localized strings for a specific language
   */
  public getStrings(language: Language): LocalizedStrings {
    if (this.options.enableCaching && this.cache.has(language)) {
      return this.cache.get(language)!;
    }

    try {
      const strings = this.loadLanguageFile(language);
      
      if (this.options.enableCaching) {
        this.cache.set(language, strings);
      }
      
      return strings;
    } catch (error) {
      this.logger.warn(`Failed to load localization for ${language}, falling back to ${this.options.fallbackLanguage}`);
      
      // Try fallback language
      if (language !== this.options.fallbackLanguage) {
        try {
          const fallbackStrings = this.loadLanguageFile(this.options.fallbackLanguage);
          
          if (this.options.enableCaching) {
            this.cache.set(this.options.fallbackLanguage, fallbackStrings);
          }
          
          return fallbackStrings;
        } catch (fallbackError) {
          this.logger.error(`Failed to load fallback localization: ${fallbackError}`);
        }
      }
      
      // Return empty strings if all else fails
      return this.getEmptyLocalizationStrings();
    }
  }

  /**
   * Get a localized message with interpolation
   */
  public getMessage(language: Language, section: keyof LocalizedStrings, key: string, ...args: any[]): string {
    const strings = this.getStrings(language);
    const sectionStrings = strings[section];
    
    if (!sectionStrings || !(key in sectionStrings)) {
      if (this.options.strict) {
        throw new Error(`Localization key not found: ${section}.${key} for language ${language}`);
      }
      
      this.logger.warn(`Localization key not found: ${section}.${key} for language ${language}`);
      return `[${section}.${key}]`;
    }
    
    let message = sectionStrings[key];
    
    // Simple string interpolation: replace {0}, {1}, etc.
    args.forEach((arg, index) => {
      message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
    });
    
    // Replace escaped newlines
    message = message.replace(/\\n/g, '\n');
    
    return message;
  }

  /**
   * Get a localized message from the messages section
   */
  public msg(language: Language, key: string, ...args: any[]): string {
    return this.getMessage(language, 'messages', key, ...args);
  }

  /**
   * Get a localized error message
   */
  public error(language: Language, key: string, ...args: any[]): string {
    return this.getMessage(language, 'errors', key, ...args);
  }

  /**
   * Get a localized command description
   */
  public command(language: Language, key: string, ...args: any[]): string {
    return this.getMessage(language, 'commands', key, ...args);
  }

  /**
   * Get a localized help text
   */
  public help(language: Language, key: string, ...args: any[]): string {
    return this.getMessage(language, 'help', key, ...args);
  }

  /**
   * Detect system language with fallback
   */
  public detectSystemLanguage(): Language {
    const env = process.env;
    const locale = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
    
    if (!locale) {
      this.logger.debug('No system locale detected, using fallback language');
      return this.options.fallbackLanguage;
    }
    
    // Extract language code from locale (e.g., 'en_US.UTF-8' -> 'en')
    const langCode = locale.split('_')[0].split('.')[0].toLowerCase();
    
    switch (langCode) {
      case 'ja':
        return Language.JAPANESE;
      case 'zh':
        // Check for Traditional Chinese variants
        if (locale.includes('TW') || locale.includes('HK') || locale.includes('MO')) {
          return Language.CHINESE_TRADITIONAL;
        }
        return this.options.fallbackLanguage; // Simplified Chinese not supported
      case 'en':
      default:
        return Language.ENGLISH;
    }
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages(): Language[] {
    return [Language.ENGLISH, Language.JAPANESE, Language.CHINESE_TRADITIONAL];
  }

  /**
   * Check if a language is supported
   */
  public isLanguageSupported(language: Language): boolean {
    return this.getSupportedLanguages().includes(language);
  }

  /**
   * Clear localization cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.debug('Localization cache cleared');
  }

  /**
   * Preload all supported languages into cache
   */
  public preloadLanguages(): void {
    this.getSupportedLanguages().forEach(language => {
      try {
        this.getStrings(language);
        this.logger.debug(`Preloaded localization for ${language}`);
      } catch (error) {
        this.logger.warn(`Failed to preload localization for ${language}: ${error}`);
      }
    });
  }

  /**
   * Load language file from disk
   */
  private loadLanguageFile(language: Language): LocalizedStrings {
    const fileName = this.getLanguageFileName(language);
    const filePath = join(this.localizationPath, fileName);
    
    if (!existsSync(filePath)) {
      throw new Error(`Localization file not found: ${filePath}`);
    }
    
    try {
      const content = readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      
      // Validate structure
      this.validateLocalizationStructure(parsed, language);
      
      return parsed as LocalizedStrings;
    } catch (error) {
      throw new Error(`Failed to parse localization file ${filePath}: ${error}`);
    }
  }

  /**
   * Get language file name for a given language
   */
  private getLanguageFileName(language: Language): string {
    const fileNames = {
      [Language.ENGLISH]: 'en.json',
      [Language.JAPANESE]: 'ja.json',
      [Language.CHINESE_TRADITIONAL]: 'zh-TW.json'
    };
    
    return fileNames[language];
  }

  /**
   * Validate localization file structure
   */
  private validateLocalizationStructure(data: any, language: Language): void {
    const requiredSections = ['messages', 'errors', 'commands', 'help'];
    
    for (const section of requiredSections) {
      if (!data[section] || typeof data[section] !== 'object') {
        throw new Error(`Invalid localization structure for ${language}: missing or invalid '${section}' section`);
      }
    }
    
    // Check for required keys
    const requiredKeys = {
      messages: ['language_name'],
      errors: ['config_not_found', 'invalid_format'],
      commands: ['spec_init', 'spec_requirements'],
      help: ['development_guidelines']
    };
    
    for (const [section, keys] of Object.entries(requiredKeys)) {
      for (const key of keys) {
        if (!(key in data[section])) {
          this.logger.warn(`Missing required localization key: ${section}.${key} for language ${language}`);
        }
      }
    }
  }

  /**
   * Get empty localization strings as fallback
   */
  private getEmptyLocalizationStrings(): LocalizedStrings {
    return {
      messages: { language_name: 'Unknown' },
      errors: {},
      commands: {},
      help: {}
    };
  }
}