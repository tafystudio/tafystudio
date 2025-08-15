import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';

export class HALValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();
  
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      validateFormats: true,
    });
    
    // Add format validators including date-time
    addFormats(this.ajv);
    
    this.loadSchemas();
  }
  
  private loadSchemas() {
    const schemasDir = path.join(__dirname, '..', 'schemas');
    this.loadSchemasFromDir(schemasDir);
  }
  
  private loadSchemasFromDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        this.loadSchemasFromDir(fullPath);
      } else if (entry.name.endsWith('.json')) {
        const schema = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        if (schema.$id) {
          const validator = this.ajv.compile(schema);
          this.validators.set(schema.$id, validator);
        }
      }
    }
  }
  
  /**
   * Validate a message against its schema
   */
  validate(schemaId: string, data: unknown): { valid: boolean; errors?: any[] } {
    const validator = this.validators.get(schemaId);
    
    if (!validator) {
      return {
        valid: false,
        errors: [{ message: `Schema not found: ${schemaId}` }],
      };
    }
    
    const valid = validator(data);
    
    return {
      valid,
      errors: valid ? undefined : validator.errors || [],
    };
  }
  
  /**
   * Validate a complete HAL message (envelope + payload)
   */
  validateMessage(message: unknown): { valid: boolean; errors?: any[] } {
    // First validate the envelope
    const envelopeResult = this.validate(
      'https://tafystudio.com/schemas/hal/common/envelope/1.0',
      message
    );
    
    if (!envelopeResult.valid) {
      return envelopeResult;
    }
    
    // Then validate the payload against its schema
    const msg = message as any;
    const payloadSchemaId = this.schemaToId(msg.schema);
    
    if (!payloadSchemaId) {
      return {
        valid: false,
        errors: [{ message: `Unknown schema: ${msg.schema}` }],
      };
    }
    
    return this.validate(payloadSchemaId, msg.payload);
  }
  
  /**
   * Convert schema identifier to schema ID
   */
  private schemaToId(schema: string): string | undefined {
    // Convert tafylabs/hal/motor/differential/1.0 to
    // https://tafystudio.com/schemas/hal/motor/differential/1.0
    const match = schema.match(/^([^/]+)\/hal\/(.+)$/);
    if (!match) {
      return undefined;
    }
    
    return `https://tafystudio.com/schemas/hal/${match[2]}`;
  }
  
  /**
   * Get all loaded schema IDs
   */
  getSchemaIds(): string[] {
    return Array.from(this.validators.keys());
  }
}