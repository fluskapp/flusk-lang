import { readdir, readFile } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

// ─────────────────────────────────────────────────────────────────────────────
// FluskSchema types (ported from flusk-lang-compiler)
// ─────────────────────────────────────────────────────────────────────────────

export interface FluskSchema {
  name: string;
  type: 'entity' | 'component' | 'layout' | 'api' | 'widget' | 'dashboard' | 'table' | 'builder' | 'form' | 'marketing' | 'chat' | 'atomic' | 'molecule' | 'organism' | string;
  description?: string;
  _metadata: {
    filePath: string;
    fileName: string;
    directory: string;
  };

  // Entity-specific fields
  fields?: Record<string, FieldDefinition>;
  relationships?: RelationshipDefinition[];
  indexes?: IndexDefinition[];
  endpoints?: EndpointDefinition[];
  validation?: ValidationRule[];
  entity_events?: EventDefinition[];
  jobs?: JobDefinition[];

  // Component-specific fields
  props?: Record<string, PropDefinition>;
  layout?: LayoutDefinition;
  slots?: Record<string, SlotDefinition>;
  styling?: StylingDefinition;
  animations?: AnimationDefinition;
  websocket?: WebSocketDefinition;
  real_time?: RealTimeDefinition;
  component_events?: ComponentEventDefinition[];
  shortcuts?: ShortcutDefinition[];
  accessibility?: AccessibilityDefinition;
  performance?: PerformanceDefinition;
  state?: StateDefinition;
  data_sources?: Record<string, DataSourceDefinition>;
  components?: Record<string, ComponentUsageDefinition>;
}

export interface FieldDefinition {
  type: 'string' | 'text' | 'integer' | 'uuid' | 'timestamp' | 'boolean' | 'json' | 'enum';
  required?: boolean;
  primary?: boolean;
  auto?: boolean;
  index?: boolean;
  unique?: boolean;
  default?: unknown;
  nullable?: boolean;
  description?: string;
  range?: [number, number];
  values?: string[];
  schema?: unknown;
  min_length?: number;
  max_length?: number;
  on_update?: boolean;
}

export interface RelationshipDefinition {
  name: string;
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';
  target: string;
  foreign_key?: string;
  description?: string;
}

export interface IndexDefinition {
  fields: string[];
  name?: string;
  unique?: boolean;
  order?: string;
}

export interface EndpointDefinition {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  auth?: 'required' | 'optional';
  body?: { fields: string[] };
  query?: Record<string, string>;
  include?: string[];
  websocket?: boolean;
}

export interface ValidationRule {
  field: string;
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
}

export interface EventDefinition {
  trigger: string;
  event: string;
  payload: string[];
  condition?: string;
}

export interface JobDefinition {
  name: string;
  schedule: string;
  description: string;
}

export interface PropDefinition {
  type: string;
  required?: boolean;
  default?: unknown;
  description?: string;
  enum?: string[];
  schema?: unknown;
}

export interface LayoutDefinition {
  type: string;
  template_areas?: string;
  columns?: string;
  rows?: string;
  container?: string;
  responsive?: Record<string, unknown>;
}

export interface SlotDefinition {
  component: string;
  area: string;
  props: Record<string, string>;
}

export interface StylingDefinition {
  container?: string;
  [key: string]: unknown;
}

export interface AnimationDefinition {
  [key: string]: string;
}

export interface WebSocketDefinition {
  endpoints: Array<{ path: string; filters: string[] }>;
}

export interface RealTimeDefinition {
  websocket_events: Array<{
    event: string;
    action: string;
    animation?: string;
    sound?: string;
    color?: string;
  }>;
  auto_scroll?: {
    trigger_on: string[];
    smooth_scroll?: boolean;
    scroll_speed?: string;
    pause_on_user_scroll?: boolean;
    resume_delay?: number;
  };
}

export interface ComponentEventDefinition {
  [key: string]: {
    description: string;
    payload: Record<string, string>;
    debounce?: number;
  };
}

export interface ShortcutDefinition {
  key: string;
  action: string;
}

export interface AccessibilityDefinition {
  role?: string;
  aria_label?: string;
  landmarks?: Record<string, string>;
  skip_links?: Array<{ target: string; text: string }>;
  announcements?: Array<{ trigger: string; message: string }>;
  keyboard_navigation?: boolean;
  screen_reader_announcements?: boolean;
}

export interface PerformanceDefinition {
  virtualization?: { enabled: boolean; item_height: number; overscan: number };
  lazy_loading?: { enabled: boolean; threshold: string };
  memoization?: Array<{ component: string; dependencies: string[] }>;
  update_throttle?: number;
  animation_duration?: number;
  max_visible_items?: number;
}

export interface StateDefinition {
  global?: string[];
  local?: string[];
}

export interface DataSourceDefinition {
  api: string;
  method: string;
  params?: Record<string, string>;
  include?: string[];
  websocket?: string;
  refresh_on?: string[];
  real_time?: boolean;
}

export interface ComponentUsageDefinition {
  component: string;
  condition?: string;
  props: Record<string, string>;
}

export interface GenerationResult {
  filesGenerated: number;
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SchemaParser
// ─────────────────────────────────────────────────────────────────────────────

export class SchemaParser {
  parse(schema: FluskSchema): FluskSchema {
    if (!schema.type && !schema.name) return schema;
    if (!schema.name) schema.name = 'unknown';
    if (!schema.type) return schema;

    switch (schema.type) {
      case 'entity':
        return this.parseEntity(schema);
      case 'component':
        return this.parseComponent(schema);
      case 'layout':
        return this.parseLayout(schema);
      case 'api':
        return this.parseApi(schema);
      default:
        return schema;
    }
  }

  private parseEntity(schema: FluskSchema): FluskSchema {
    if (!schema.fields || Object.keys(schema.fields).length === 0) {
      throw new Error(`Entity ${schema.name} must have at least one field`);
    }

    const hasPrimaryKey = Object.values(schema.fields).some((field) => field.primary);
    if (!hasPrimaryKey) {
      throw new Error(`Entity ${schema.name} must have a primary key field`);
    }

    for (const [fieldName, field] of Object.entries(schema.fields)) {
      this.validateFieldDefinition(fieldName, field);
    }

    if (schema.relationships) {
      for (const relationship of schema.relationships) {
        this.validateRelationship(relationship);
      }
    }

    return schema;
  }

  private parseComponent(schema: FluskSchema): FluskSchema {
    if (schema.props) {
      for (const [propName, prop] of Object.entries(schema.props)) {
        this.validatePropDefinition(propName, prop);
      }
    }

    if (schema.data_sources) {
      for (const [sourceName, source] of Object.entries(schema.data_sources)) {
        this.validateDataSource(sourceName, source);
      }
    }

    return schema;
  }

  private parseLayout(schema: FluskSchema): FluskSchema {
    if (schema.layout && schema.layout.type === 'grid') {
      if (!schema.layout.template_areas && !schema.layout.columns) {
        throw new Error(`Grid layout ${schema.name} must have template_areas or columns`);
      }
    }
    return schema;
  }

  private parseApi(schema: FluskSchema): FluskSchema {
    if (!schema.endpoints || schema.endpoints.length === 0) {
      throw new Error(`API schema ${schema.name} must have at least one endpoint`);
    }
    for (const endpoint of schema.endpoints) {
      if (!endpoint.method || !endpoint.path) {
        throw new Error(`API endpoint must have method and path`);
      }
    }
    return schema;
  }

  async validate(schemas: FluskSchema[]): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [] };

    try {
      const keys = schemas.map((s) => `${s._metadata?.directory ?? ''}/${s.name}`);
      const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
      if (duplicates.length > 0) {
        result.errors.push(`Duplicate schemas (same directory + name): ${duplicates.join(', ')}`);
      }

      const entityNames = schemas.filter((s) => s.type === 'entity').map((s) => s.name);

      for (const schema of schemas) {
        if (schema.type === 'entity' && schema.relationships) {
          for (const relationship of schema.relationships) {
            if (!entityNames.includes(relationship.target)) {
              result.errors.push(
                `Entity ${schema.name} references unknown target "${relationship.target}" in relationship "${relationship.name}"`
              );
            }
          }
        }
      }

      const availableEndpoints = this.extractAvailableEndpoints(schemas);

      for (const schema of schemas) {
        if (schema.type === 'component' && schema.data_sources) {
          for (const [sourceName, source] of Object.entries(schema.data_sources)) {
            if (!this.isValidEndpoint(source.api, availableEndpoints)) {
              result.errors.push(
                `Component ${schema.name} data source "${sourceName}" references invalid API endpoint: ${source.api}`
              );
            }
          }
        }
      }

      result.valid = result.errors.length === 0;
    } catch (error) {
      result.valid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  private validateFieldDefinition(fieldName: string, field: FieldDefinition): void {
    const validTypes = ['string', 'text', 'integer', 'uuid', 'timestamp', 'boolean', 'json', 'enum'];

    if (!field.type || !validTypes.includes(field.type)) {
      throw new Error(`Field ${fieldName} has invalid type: ${field.type}`);
    }

    if (field.type === 'enum' && (!field.values || !Array.isArray(field.values))) {
      throw new Error(`Enum field ${fieldName} must have values array`);
    }

    if (field.range && (!Array.isArray(field.range) || field.range.length !== 2)) {
      throw new Error(`Field ${fieldName} range must be array of 2 numbers`);
    }
  }

  private validateRelationship(relationship: RelationshipDefinition): void {
    const validTypes = ['hasOne', 'hasMany', 'belongsTo', 'manyToMany'];

    if (!relationship.name) {
      throw new Error('Relationship must have a name');
    }

    if (!relationship.type || !validTypes.includes(relationship.type)) {
      throw new Error(`Relationship ${relationship.name} has invalid type: ${relationship.type}`);
    }

    if (!relationship.target) {
      throw new Error(`Relationship ${relationship.name} must have a target`);
    }
  }

  private validatePropDefinition(propName: string, prop: PropDefinition): void {
    if (!prop.type) {
      throw new Error(`Prop ${propName} must have a type`);
    }
  }

  private validateDataSource(sourceName: string, source: DataSourceDefinition): void {
    if (!source.api) {
      throw new Error(`Data source ${sourceName} must have an api endpoint`);
    }
    if (!source.method) {
      throw new Error(`Data source ${sourceName} must have a method`);
    }
    const validMethods = ['GET', 'POST', 'PATCH', 'DELETE'];
    if (!validMethods.includes(source.method)) {
      throw new Error(`Data source ${sourceName} has invalid method: ${source.method}`);
    }
  }

  private extractAvailableEndpoints(schemas: FluskSchema[]): Set<string> {
    const endpoints = new Set<string>();
    for (const schema of schemas) {
      if (schema.type === 'entity') {
        endpoints.add(`/api/${schema.name.toLowerCase()}s`);
        endpoints.add(`/api/${schema.name.toLowerCase()}s/{id}`);
      }
      if (schema.endpoints) {
        for (const endpoint of schema.endpoints) {
          endpoints.add(endpoint.path);
        }
      }
    }
    return endpoints;
  }

  private isValidEndpoint(apiPath: string, availableEndpoints: Set<string>): boolean {
    return availableEndpoints.has(apiPath) || apiPath.startsWith('/api/');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema loader
// ─────────────────────────────────────────────────────────────────────────────

async function collectYamlFiles(dir: string, base: string, results: string[]): Promise<void> {
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true }) as Dirent[];
  } catch {
    return;
  }
  for (const entry of entries) {
    const name = String(entry.name);
    const full = join(dir, name);
    if (entry.isDirectory()) {
      await collectYamlFiles(full, base, results);
    } else if (entry.isFile() && (name.endsWith('.yaml') || name.endsWith('.yml'))) {
      results.push(full);
    }
  }
}

/**
 * Read all .yaml/.yml files recursively from schemaDir, parse them as FluskSchema,
 * attach _metadata, run through SchemaParser, and return the array.
 */
export async function loadSaasSchemas(schemaDir: string): Promise<FluskSchema[]> {
  const parser = new SchemaParser();
  const yamlFiles: string[] = [];
  await collectYamlFiles(schemaDir, schemaDir, yamlFiles);

  const schemas: FluskSchema[] = [];

  for (const filePath of yamlFiles) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const parsed = yaml.load(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') continue;

      // Derive relative directory from schemaDir
      const relative = filePath.slice(schemaDir.length).replace(/^\//, '');
      const parts = relative.split('/');
      const fileName = parts[parts.length - 1] ?? relative;
      const directory = parts.slice(0, -1).join('/');

      const schema = parsed as unknown as FluskSchema;
      schema._metadata = {
        filePath,
        fileName,
        directory,
      };

      // Derive name from filename if not set
      if (!schema.name) {
        schema.name = fileName.replace(/\.(yaml|yml)$/, '');
      }

      // Derive type from directory if not set (e.g., entities/ → entity)
      if (!schema.type && directory) {
        const typeMap: Record<string, string> = {
          entities: 'entity', routes: 'route', views: 'view',
          commands: 'command', events: 'event', functions: 'function',
          clients: 'client', providers: 'provider', middlewares: 'middleware',
          plugins: 'plugin', workers: 'worker', streams: 'stream',
          features: 'feature', partials: 'partial',
        };
        const topDir = directory.split('/')[0] ?? '';
        if (typeMap[topDir]) schema.type = typeMap[topDir];
      }

      // Normalize flusk-lang array-style fields to Record<string, FieldDef>
      if (schema.fields && Array.isArray(schema.fields)) {
        const fieldsRecord: Record<string, any> = {};
        for (const f of schema.fields as any[]) {
          if (f && typeof f === 'object' && f.name) {
            const { name, ...rest } = f;
            fieldsRecord[name] = rest;
          }
        }
        schema.fields = fieldsRecord;
        // Auto-add id as primary key if not present
        if (!fieldsRecord['id']) {
          schema.fields = { id: { type: 'string', primary: true }, ...fieldsRecord };
        }
      }

      try {
        schemas.push(parser.parse(schema));
      } catch {
        // Parse errors are non-fatal — include the schema as-is
        schemas.push(schema);
      }
    } catch {
      // Skip unreadable / unparseable files
    }
  }

  return schemas;
}
