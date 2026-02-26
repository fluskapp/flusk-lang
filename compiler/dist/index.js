import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseEntity } from './parsers/entity.parser.js';
import { parseFunction } from './parsers/function.parser.js';
import { parseCommand } from './parsers/command.parser.js';
import { parseRoute } from './parsers/route.parser.js';
import { parseProvider } from './parsers/provider.parser.js';
import { parseClient } from './parsers/client.parser.js';
import { parseService } from './parsers/service.parser.js';
import { parseMiddleware } from './parsers/middleware.parser.js';
import { parsePlugin } from './parsers/plugin.parser.js';
import { parseEvent } from './parsers/event.parser.js';
import { parseWorker } from './parsers/worker.parser.js';
import { parseStream } from './parsers/stream.parser.js';
import { parseHook } from './parsers/hook.parser.js';
import { parseView } from './parsers/view.parser.js';
import { validateRefs } from './validators/refs.validator.js';
import { lintGeneratedCode } from './validators/lint.validator.js';
export { lintGeneratedCode };
const loadDir = (dir, parser) => {
    try {
        return readdirSync(dir)
            .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
            .map((f) => parser(join(dir, f)));
    }
    catch {
        return [];
    }
};
export const parseAll = (schemaDir) => {
    const schema = {
        entities: loadDir(join(schemaDir, 'entities'), parseEntity),
        functions: loadDir(join(schemaDir, 'functions'), parseFunction),
        commands: loadDir(join(schemaDir, 'commands'), parseCommand),
        routes: loadDir(join(schemaDir, 'routes'), parseRoute),
        providers: loadDir(join(schemaDir, 'providers'), parseProvider),
        clients: loadDir(join(schemaDir, 'clients'), parseClient),
        services: loadDir(join(schemaDir, 'services'), parseService),
        middlewares: loadDir(join(schemaDir, 'middlewares'), parseMiddleware),
        plugins: loadDir(join(schemaDir, 'plugins'), parsePlugin),
        events: loadDir(join(schemaDir, 'events'), parseEvent),
        workers: loadDir(join(schemaDir, 'workers'), parseWorker),
        streams: loadDir(join(schemaDir, 'streams'), parseStream),
        hooks: loadDir(join(schemaDir, 'hooks'), parseHook),
        views: loadDir(join(schemaDir, 'views'), parseView),
    };
    return schema;
};
export const validate = (schemaDir) => {
    const schema = parseAll(schemaDir);
    validateRefs(schema);
    return schema;
};
