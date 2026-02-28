import { describe, it, expect } from 'vitest';
import { KnowledgeBaseRepository } from '../src/entities/knowledgeBase.repository.js';

describe('KnowledgeBase Entity', () => {
  it('creates a knowledgeBase', async () => {
    const repo = new KnowledgeBaseRepository();
    const data = {
      solution_id: 'test',
      name: 'test-name',
      type: 'file',
      source: 'test-source',
      content_hash: 'test-content_hash',
      chunk_count: 'test',
      status: 'pending',
      error_message: 'test-error_message',
    };
    const result = await repo.create(data);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('findBySolution', async () => {
    const repo = new KnowledgeBaseRepository();
    const result = await repo.findBySolution();
    expect(Array.isArray(result)).toBe(true);
  });

  it('findReady', async () => {
    const repo = new KnowledgeBaseRepository();
    const result = await repo.findReady();
    expect(Array.isArray(result)).toBe(true);
  });
});
