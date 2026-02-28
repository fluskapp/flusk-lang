import { describe, it, expect } from 'vitest';
import { parseFeatureFromString } from '../src/parsers/feature.parser.js';
import { generateAllTests, generateEntityTests, generateIntegrationTests } from '../src/generators/node/test.gen.js';

describe('Test Generator', () => {
  const feature = parseFeatureFromString(`
name: blog
entities:
  - name: post
    fields:
      - name: title
        type: string
      - name: status
        type: enum
        values: [draft, published]
    queries:
      - findPublished: { where: "status = 'published'" }

  - name: comment
    fields:
      - name: body
        type: string
      - name: likes
        type: number

tests:
  integration:
    - name: create-post-flow
      steps:
        - auth: session
        - post: /api/posts
          body: { title: "Test Post" }
          expect: { status: 200 }
        - get: /api/posts
          expect: { status: 200 }
        - assert: "post.count > 0"
`);

  it('generates entity tests', () => {
    const tests = generateEntityTests(feature);
    expect(tests).toHaveLength(2);
    expect(tests[0].path).toContain('post.test.ts');
    expect(tests[1].path).toContain('comment.test.ts');
  });

  it('entity tests include CRUD', () => {
    const tests = generateEntityTests(feature);
    expect(tests[0].content).toContain('creates a post');
    expect(tests[0].content).toContain("title: 'test-title'");
  });

  it('entity tests include query methods', () => {
    const tests = generateEntityTests(feature);
    expect(tests[0].content).toContain('findPublished');
  });

  it('generates integration tests', () => {
    const tests = generateIntegrationTests(feature);
    expect(tests).toHaveLength(1);
    expect(tests[0].path).toContain('blog-create-post-flow.test.ts');
  });

  it('integration test has HTTP steps', () => {
    const tests = generateIntegrationTests(feature);
    expect(tests[0].content).toContain("method: 'POST'");
    expect(tests[0].content).toContain("url: '/api/posts'");
    expect(tests[0].content).toContain('statusCode').toBeTruthy;
  });

  it('integration test has auth step', () => {
    const tests = generateIntegrationTests(feature);
    expect(tests[0].content).toContain('Auth: session');
  });

  it('generateAllTests combines both', () => {
    const tests = generateAllTests(feature);
    expect(tests).toHaveLength(3); // 2 entity + 1 integration
  });

  it('handles feature with no tests', () => {
    const minimal = parseFeatureFromString(`
name: simple
entities:
  - name: item
    fields:
      - name: name
        type: string
`);
    const tests = generateAllTests(minimal);
    expect(tests).toHaveLength(1); // entity test only
  });
});
