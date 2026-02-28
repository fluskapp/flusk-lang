#!/usr/bin/env node
import { resolve, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseAll, validate } from './index.js';
import { generateEntitySchema, generateEntityType, generateEntityRepository } from './generators/node/entity.gen.js';
import { generateFunction } from './generators/node/function.gen.js';
import { generateCommand } from './generators/node/command.gen.js';
import { generateRoute } from './generators/node/route.gen.js';
import { generateProvider } from './generators/node/provider.gen.js';
import { generateClient } from './generators/node/client.gen.js';
import { generateBarrel } from './generators/node/barrel.gen.js';
import { generateService } from './generators/node/service.gen.js';
import { generateMiddleware } from './generators/node/middleware.gen.js';
import { generatePlugin } from './generators/node/plugin.gen.js';
import { generateEvent } from './generators/node/event.gen.js';
import { generateWorker } from './generators/node/worker.gen.js';
import { generateStream } from './generators/node/stream.gen.js';
import { generateHook } from './generators/node/hook.gen.js';
import { generatePythonEntity } from './generators/python/entity.gen.js';
import { generatePythonFunction } from './generators/python/function.gen.js';
const rootDir = resolve(process.cwd(), '..');
const schemaDir = join(rootDir, 'schema');
const generatedDir = join(rootDir, 'generated');
const command = process.argv[2];
const target = process.argv.includes('--target')
    ? process.argv[process.argv.indexOf('--target') + 1] : 'all';
const skipRefs = process.argv.includes('--skip-refs');
const writeFile = (path, content) => {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content, 'utf-8');
    console.log(`  wrote ${path}`);
};
const buildNode = () => {
    const schema = skipRefs ? parseAll(schemaDir) : validate(schemaDir);
    const nodeDir = join(generatedDir, 'node', 'src');
    const allFiles = [];
    for (const entity of schema.entities) {
        const dir = join(nodeDir, 'entities');
        const name = entity.name.toLowerCase();
        writeFile(join(dir, `${name}.schema.ts`), generateEntitySchema(entity));
        writeFile(join(dir, `${name}.types.ts`), generateEntityType(entity));
        writeFile(join(dir, `${name}.repository.ts`), generateEntityRepository(entity));
        allFiles.push(`entities/${name}.schema.ts`, `entities/${name}.types.ts`);
    }
    for (const fn of schema.functions) {
        const f = `functions/${fn.name}.function.ts`;
        writeFile(join(nodeDir, f), generateFunction(fn));
        allFiles.push(f);
    }
    for (const cmd of schema.commands) {
        const f = `commands/${cmd.name}.command.ts`;
        writeFile(join(nodeDir, f), generateCommand(cmd));
        allFiles.push(f);
    }
    for (const route of schema.routes) {
        const f = `routes/${route.name}.routes.ts`;
        writeFile(join(nodeDir, f), generateRoute(route));
        allFiles.push(f);
    }
    for (const provider of schema.providers) {
        const f = `providers/${provider.name}.provider.ts`;
        writeFile(join(nodeDir, f), generateProvider(provider));
        allFiles.push(f);
    }
    for (const client of schema.clients) {
        const f = `clients/${client.name}.client.ts`;
        writeFile(join(nodeDir, f), generateClient(client));
        allFiles.push(f);
    }
    for (const svc of schema.services) {
        const f = `services/${svc.name}.service.ts`;
        writeFile(join(nodeDir, f), generateService(svc));
        allFiles.push(f);
    }
    for (const mw of schema.middlewares) {
        const f = `middlewares/${mw.name}.middleware.ts`;
        writeFile(join(nodeDir, f), generateMiddleware(mw));
        allFiles.push(f);
    }
    for (const plugin of schema.plugins) {
        const f = `plugins/${plugin.name}.plugin.ts`;
        writeFile(join(nodeDir, f), generatePlugin(plugin));
        allFiles.push(f);
    }
    for (const event of schema.events) {
        const f = `events/${event.name}.event.ts`;
        writeFile(join(nodeDir, f), generateEvent(event));
        allFiles.push(f);
    }
    for (const worker of schema.workers) {
        const f = `workers/${worker.name}.worker.ts`;
        writeFile(join(nodeDir, f), generateWorker(worker));
        allFiles.push(f);
    }
    for (const stream of schema.streams) {
        const f = `streams/${stream.name}.stream.ts`;
        writeFile(join(nodeDir, f), generateStream(stream));
        allFiles.push(f);
    }
    for (const hook of schema.hooks) {
        const f = `hooks/${hook.name}.hook.ts`;
        writeFile(join(nodeDir, f), generateHook(hook));
        allFiles.push(f);
    }
    writeFile(join(nodeDir, 'index.ts'), generateBarrel(allFiles));
    console.log('✅ Node.js generation complete');
};
const buildPython = () => {
    const schema = skipRefs ? parseAll(schemaDir) : validate(schemaDir);
    const pyDir = join(generatedDir, 'python');
    for (const entity of schema.entities) {
        writeFile(join(pyDir, 'entities', `${entity.name.toLowerCase()}.py`), generatePythonEntity(entity));
    }
    for (const fn of schema.functions) {
        writeFile(join(pyDir, 'functions', `${fn.name}.py`), generatePythonFunction(fn));
    }
    console.log('✅ Python generation complete');
};
if (command === 'validate') {
    try {
        const schema = validate(schemaDir);
        const count = Object.values(schema).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`✅ Validated ${count} definitions`);
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
else if (command === 'build') {
    try {
        if (target === 'all' || target === 'node')
            buildNode();
        if (target === 'all' || target === 'python')
            buildPython();
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
else {
    console.log('Usage: flusk-lang <validate|build> [--target node|python]');
}
