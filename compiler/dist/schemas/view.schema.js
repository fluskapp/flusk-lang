export const viewSchema = {
    type: 'object',
    required: ['name', 'type', 'description', 'route', 'sections'],
    additionalProperties: false,
    properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['page', 'dashboard', 'chat', 'form', 'table', 'detail', 'builder'] },
        description: { type: 'string' },
        route: { type: 'string' },
        layout: { type: 'string', enum: ['full', 'sidebar', 'split', 'centered'] },
        auth: { type: 'boolean', default: true },
        ssr: { type: 'boolean', default: false },
        loader: {
            type: 'object',
            properties: {
                source: { type: 'string' },
                params: { type: 'array', items: { type: 'string' } },
            },
        },
        sections: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['name', 'type'],
                additionalProperties: false,
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['stat-cards', 'chart', 'data-table', 'form', 'chat-messages', 'chat-input', 'code-editor', 'preview', 'custom'] },
                    source: { type: 'string' },
                    columns: { type: 'array', items: { type: 'string' } },
                    actions: { type: 'array', items: { type: 'string' } },
                    widgets: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['type', 'source', 'label'],
                            properties: {
                                type: { type: 'string', enum: ['stat-card'] },
                                source: { type: 'string' },
                                label: { type: 'string' },
                                format: { type: 'string', enum: ['number', 'currency', 'percent'] },
                            },
                        },
                    },
                    chart: {
                        type: 'object',
                        required: ['type', 'xAxis', 'yAxis'],
                        properties: {
                            type: { type: 'string', enum: ['area', 'bar', 'line', 'pie', 'donut'] },
                            xAxis: { type: 'string' },
                            yAxis: { type: 'string' },
                            color: { type: 'string' },
                        },
                    },
                    features: {
                        type: 'object',
                        properties: {
                            streaming: { type: 'boolean' },
                            markdown: { type: 'boolean' },
                            codeBlocks: { type: 'boolean' },
                            fileUpload: { type: 'boolean' },
                        },
                    },
                    fields: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['name', 'type', 'label', 'required'],
                            properties: {
                                name: { type: 'string' },
                                type: { type: 'string', enum: ['text', 'textarea', 'select', 'number', 'toggle', 'json'] },
                                label: { type: 'string' },
                                required: { type: 'boolean' },
                                options: { type: 'array', items: { type: 'string' } },
                            },
                        },
                    },
                },
            },
        },
    },
};
