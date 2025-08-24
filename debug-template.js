// Quick debug script to test template validation
const { TemplateValidator } = require('./dist/validation/TemplateValidator');
const { Logger } = require('./dist/utils/logger');

const logger = new Logger();
const validator = new TemplateValidator(logger);

const template1 = '# {{title}}\n\nWelcome {{name}}!';
const result1 = validator.validateTemplate(template1);

console.log('Template 1 Result:');
console.log('Valid:', result1.valid);
console.log('Errors:', result1.errors);
console.log('Warnings:', result1.warnings);

const template2 = '{{#each items}}{{name}}{{/each}}';
const result2 = validator.validateTemplate(template2, { validateHelpers: true });

console.log('\nTemplate 2 Result:');
console.log('Valid:', result2.valid);
console.log('Errors:', result2.errors);
console.log('Warnings:', result2.warnings);