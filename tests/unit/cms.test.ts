import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { z } from 'astro/zod';
import { cmsConfig, type CmsField } from '../../src/cms/config';
import { aboutSchema, noteSchema, projectSchema, settingsSchema, writingSchema } from '../../src/lib/schemas';

const sveltiaSchema = JSON.parse(readFileSync('node_modules/@sveltia/cms/schema/sveltia-cms.json', 'utf8'));
const validate = new Ajv({ strict: false, allErrors: true, validateFormats: false, logger: false }).compile(sveltiaSchema);

const image = () => z.string();
const shapes = {
  writing: writingSchema(image).shape,
  notes: noteSchema.shape,
  projects: projectSchema(image).shape,
  about: aboutSchema.shape,
  settings: settingsSchema.shape,
};

function fieldsFor(name: keyof typeof shapes): CmsField[] {
  for (const c of cmsConfig.collections) {
    if ('folder' in c && c.name === name) return c.fields;
    if ('files' in c) for (const f of c.files) if (f.name === name) return f.fields;
  }
  throw new Error(`No CMS collection/file named ${name}`);
}

describe('CMS config', () => {
  it('is valid against the Sveltia CMS JSON schema', () => {
    expect(validate(cmsConfig), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it('the validator rejects a broken config (sanity check)', () => {
    expect(validate({ ...cmsConfig, backend: { name: 'nope' } })).toBe(false);
  });

  it('signs in with a token only, against this repo and branch', () => {
    expect(cmsConfig.backend).toMatchObject({ name: 'github', branch: 'main', auth_methods: ['token'] });
    expect(cmsConfig.backend.repo).toMatch(/^[^/]+\/thearchitectsmind$/);
  });

  it.each(Object.keys(shapes) as (keyof typeof shapes)[])('%s: CMS fields match the Zod schema', (name) => {
    const shape = shapes[name] as Record<string, z.ZodType>;
    const fields = fieldsFor(name).filter((f) => f.name !== 'body');
    expect(fields.map((f) => f.name).sort()).toEqual(Object.keys(shape).sort());
    const zodRequired = Object.keys(shape).filter((k) => !shape[k].safeParse(undefined).success).sort();
    const cmsRequired = fields.filter((f) => f.required !== false).map((f) => f.name).sort();
    expect(cmsRequired).toEqual(zodRequired);
  });

  it('starts new entries as drafts', () => {
    for (const name of ['writing', 'notes', 'projects'] as const) {
      expect(fieldsFor(name).find((f) => f.name === 'draft')).toMatchObject({ widget: 'boolean', default: true });
    }
  });
});
