/**
 * Feature Exploder — converts FeatureNode → individual sub-YAML strings
 * Each output maps to an existing parser/generator in the system
 */

export { explodeFeature, type ExplodedFiles, type ExplodedFile } from './exploder.js';
export { writeExploded } from './writer.js';
export { diffFeature, type Changeset, type FileChange, type FieldChange, type BreakingChange } from './diff.js';
