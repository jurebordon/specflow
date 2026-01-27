import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';

/**
 * Compile and render a Handlebars template file with the given context.
 *
 * @param {string} templatePath - Absolute path to the .template file
 * @param {Record<string, unknown>} context - Template variables
 * @returns {string} Rendered content
 */
export function renderTemplate(templatePath, context) {
  const source = readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}

/**
 * Render a raw template string with the given context.
 *
 * @param {string} source - Template string
 * @param {Record<string, unknown>} context - Template variables
 * @returns {string} Rendered content
 */
export function renderString(source, context) {
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}
