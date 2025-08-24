/**
 * Core type definitions for amazonq-sdd package
 * These types define the structure of all major entities in the system
 */

// ============================================
// Core Domain Entities
// ============================================

/**
 * Represents a single SDD command (spec-init, spec-requirements, etc.)
 */
export interface Command {
  /** Command name (e.g., 'spec-init', 'spec-requirements') */
  name: string;
  
  /** Human-readable description of the command */
  description: string;
  
  /** Expected command arguments */
  arguments: CommandArgument[];
  
  /** Path to the prompt template file */
  templatePath: string;
  
  /** Path to the shell script template */
  scriptTemplatePath: string;
  
  /** Supported platforms for this command */
  platforms: Platform[];
  
  /** Whether this command requires approval flag (-y) */
  requiresApproval?: boolean;
}

/**
 * Command argument definition
 */
export interface CommandArgument {
  /** Argument name */
  name: string;
  
  /** Argument type */
  type: 'string' | 'boolean' | 'number' | 'array';
  
  /** Whether this argument is required */
  required: boolean;
  
  /** Default value if not provided */
  defaultValue?: any;
  
  /** Help description for this argument */
  description: string;
}

/**
 * Amazon Q CLI-compatible prompt template for a command
 */
export interface Template {
  /** Unique template identifier */
  id: string;
  
  /** Associated command name */
  commandName: string;
  
  /** Structured prompt text for Amazon Q CLI */
  promptText: string;
  
  /** Dynamic content placeholders */
  variables: TemplateVariable[];
  
  /** Amazon Q CLI-specific metadata */
  metadata: TemplateMetadata;
  
  /** Template version for compatibility tracking */
  version: string;
}

/**
 * Template variable for dynamic content
 */
export interface TemplateVariable {
  /** Variable name (e.g., 'FEATURE_NAME', 'PROJECT_PATH') */
  name: string;
  
  /** Variable type */
  type: 'string' | 'path' | 'boolean' | 'array';
  
  /** Whether this variable is required */
  required: boolean;
  
  /** Default value or generator function */
  defaultValue?: string | (() => string);
}

/**
 * Shell script wrapper that integrates with Amazon Q CLI
 */
export interface Script {
  /** Associated command name */
  commandName: string;
  
  /** Target platform */
  platform: Platform;
  
  /** Generated shell script content */
  scriptContent: string;
  
  /** Whether script should be made executable */
  executable: boolean;
  
  /** Command alias (e.g., 'kiro-spec-init') */
  aliasName: string;
  
  /** Script file extension based on platform */
  fileExtension: '.sh' | '.ps1' | '.bat';
}

/**
 * Configuration data for AMAZONQ.md and related files
 */
export interface Config {
  /** Project name */
  projectName: string;
  
  /** Selected language */
  language: Language;
  
  /** Path to Amazon Q CLI binary */
  amazonQCLIPath: string;
  
  /** .kiro/ directory location */
  kiroDirectory: string;
  
  /** Localized strings for UI and messages */
  localization: LocalizedStrings;
  
  /** Configuration version */
  version: string;
  
  /** Installation timestamp */
  installedAt: Date;
  
  /** Custom user settings */
  customSettings?: Record<string, any>;
}

/**
 * Localized strings for different languages
 */
export interface LocalizedStrings {
  /** UI messages */
  messages: Record<string, string>;
  
  /** Error messages */
  errors: Record<string, string>;
  
  /** Command descriptions */
  commands: Record<string, string>;
  
  /** Help text */
  help: Record<string, string>;
}

// ============================================
// Installation and Options Types
// ============================================

/**
 * User preferences for installation
 */
export interface InstallOptions {
  /** Language preference */
  language?: Language;
  
  /** Platform override (auto-detected if not specified) */
  platform?: Platform;
  
  /** Custom .kiro/ directory location */
  kiroDirectory?: string;
  
  /** Preview changes without applying */
  dryRun?: boolean;
  
  /** Force overwrite existing files */
  force?: boolean;
  
  /** Verbose output for debugging */
  verbose?: boolean;
  
  /** Skip Amazon Q CLI detection */
  skipDetection?: boolean;
}

/**
 * Installation result information
 */
export interface InstallResult {
  /** Whether installation succeeded */
  success: boolean;
  
  /** Installed commands */
  installedCommands: string[];
  
  /** Created file paths */
  createdFiles: string[];
  
  /** Any warnings during installation */
  warnings: string[];
  
  /** Any errors during installation */
  errors: string[];
  
  /** Installation summary message */
  message: string;
}

// ============================================
// Validation Types
// ============================================

/**
 * Template metadata for Amazon Q CLI compatibility
 */
export interface TemplateMetadata {
  /** Amazon Q CLI version compatibility */
  amazonQVersion: string;
  
  /** Required Amazon Q CLI features */
  requiredFeatures: string[];
  
  /** Template category */
  category: 'spec' | 'steering' | 'utility';
  
  /** Estimated execution time */
  estimatedTime?: number;
  
  /** Template tags for organization */
  tags: string[];
}

/**
 * Validation result for templates, scripts, and configurations
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Validated entity type */
  entityType: 'template' | 'script' | 'configuration' | 'installation' | 'amazonq_prompt';
  
  /** Additional validation metadata */
  metadata?: Record<string, any>;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Field or property that failed validation */
  field?: string;
  
  /** Actual value that failed */
  actualValue?: any;
  
  /** Expected value or format */
  expectedValue?: any;
  
  /** Suggestion for resolution */
  suggestion?: string;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Affected field */
  field?: string;
  
  /** Actual value that failed */
  actualValue?: any;
  
  /** Expected value or format */
  expectedValue?: any;
  
  /** Suggestion for resolution */
  suggestion?: string;
}

// ============================================
// Enums and Constants
// ============================================

/**
 * Supported platforms
 */
export enum Platform {
  MAC = 'mac',
  WINDOWS = 'windows',
  LINUX = 'linux'
}

/**
 * Supported languages
 */
export enum Language {
  ENGLISH = 'en',
  JAPANESE = 'ja',
  CHINESE_TRADITIONAL = 'zh-TW'
}

/**
 * Installation status phases
 */
export enum InstallationPhase {
  DETECTING = 'detecting',
  VALIDATING = 'validating',
  GENERATING = 'generating',
  INSTALLING = 'installing',
  CONFIGURING = 'configuring',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * SDD command types
 */
export enum CommandType {
  SPEC_INIT = 'spec-init',
  SPEC_REQUIREMENTS = 'spec-requirements',
  SPEC_DESIGN = 'spec-design',
  SPEC_TASKS = 'spec-tasks',
  SPEC_IMPL = 'spec-impl',
  SPEC_STATUS = 'spec-status',
  STEERING = 'steering',
  STEERING_CUSTOM = 'steering-custom'
}

/**
 * Validation types for different content categories
 */
export enum ValidationType {
  TEMPLATE = 'template',
  CONFIGURATION = 'configuration',
  SCRIPT = 'script',
  AMAZONQ_COMPATIBILITY = 'amazonq_compatibility',
  INSTALLATION = 'installation'
}

/**
 * Error types for error handling
 */
export enum ErrorType {
  AMAZON_Q_NOT_FOUND = 'AMAZON_Q_NOT_FOUND',
  INVALID_PLATFORM = 'INVALID_PLATFORM',
  TEMPLATE_GENERATION_FAILED = 'TEMPLATE_GENERATION_FAILED',
  SCRIPT_GENERATION_FAILED = 'SCRIPT_GENERATION_FAILED',
  CONFIGURATION_INVALID = 'CONFIGURATION_INVALID',
  INSTALLATION_FAILED = 'INSTALLATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PATH_NOT_FOUND = 'PATH_NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Application error class
 */
export class AmazonQSDDError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AmazonQSDDError';
  }
}

// ============================================
// Utility Types
// ============================================

/**
 * Generate options for template generation
 */
export interface GenerateOptions {
  /** Commands to generate templates for */
  commands?: CommandType[];
  
  /** Target platform */
  platform: Platform;
  
  /** Language for localization */
  language: Language;
  
  /** Output directory */
  outputDir: string;
}

/**
 * Validation options
 */
export interface ValidateOptions {
  /** Strict validation mode */
  strict?: boolean;
  
  /** Skip Amazon Q CLI compatibility check */
  skipCompatibility?: boolean;
  
  /** Custom validation rules */
  customRules?: ValidationRule[];
}

/**
 * Custom validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;
  
  /** Validation function */
  validate: (value: any) => boolean | ValidationResult;
  
  /** Error message if validation fails */
  errorMessage: string;
}

/**
 * Type guard to check if a value is a Platform
 */
export function isPlatform(value: any): value is Platform {
  return Object.values(Platform).includes(value);
}

/**
 * Type guard to check if a value is a Language
 */
export function isLanguage(value: any): value is Language {
  return Object.values(Language).includes(value);
}

/**
 * Type guard to check if a value is a CommandType
 */
export function isCommandType(value: any): value is CommandType {
  return Object.values(CommandType).includes(value);
}