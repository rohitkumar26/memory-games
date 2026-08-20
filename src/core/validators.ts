// ============================================
// Validators — Manifest schema validation
// ============================================

import type { GameManifest, ValidationResult } from './types';

const VALID_CATEGORIES = [
  'visual-spatial',
  'sequence-recall',
  'pattern-completion',
  'category-sorting',
  'object-recall',
  'drawing-tracing'
];

const VALID_ENGINES = [
  'dom-engine',
  'canvas-engine',
  'webgl-engine'
];

const ID_REGEX = /^[a-z0-9-]+$/;

export function validateManifest(manifest: GameManifest): ValidationResult {
  const errors: string[] = [];

  if (!manifest.id || !ID_REGEX.test(manifest.id)) {
    errors.push('id: required, must be kebab-case (a-z, 0-9, hyphen)');
  }

  if (!manifest.name || manifest.name.length < 1 || manifest.name.length > 50) {
    errors.push('name: required, 1-50 chars');
  }

  if (!manifest.description || manifest.description.length < 1 || manifest.description.length > 200) {
    errors.push('description: required, 1-200 chars');
  }

  if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('version: required, must be SemVer');
  }

  if (!manifest.engine || !VALID_ENGINES.includes(manifest.engine)) {
    errors.push(`engine: required, must be one of: ${VALID_ENGINES.join(', ')}`);
  }

  if (!manifest.category || !VALID_CATEGORIES.includes(manifest.category)) {
    errors.push(`category: required, must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!manifest.difficulty || manifest.difficulty.min < 1 || manifest.difficulty.max <= manifest.difficulty.min) {
    errors.push('difficulty: min >= 1, max > min');
  }

  if (!manifest.ageRange || manifest.ageRange.min < 3 || manifest.ageRange.max > 12 || manifest.ageRange.max <= manifest.ageRange.min) {
    errors.push('ageRange: min >= 3, max <= 12, max > min');
  }

  if (!manifest.assets) {
    errors.push('assets: required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
