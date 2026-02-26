export interface ViewDef {
    name: string;
    type: 'page' | 'dashboard' | 'chat' | 'form' | 'table' | 'detail' | 'builder';
    description: string;
    route: string;
    layout?: 'full' | 'sidebar' | 'split' | 'centered';
    auth?: boolean;
    ssr?: boolean;
    loader?: {
        source: string;
        params?: string[];
    };
    sections: Array<{
        name: string;
        type: 'stat-cards' | 'chart' | 'data-table' | 'form' | 'chat-messages' | 'chat-input' | 'code-editor' | 'preview' | 'custom';
        source?: string;
        columns?: string[];
        actions?: string[];
        widgets?: Array<{
            type: 'stat-card';
            source: string;
            label: string;
            format?: 'number' | 'currency' | 'percent';
        }>;
        chart?: {
            type: 'area' | 'bar' | 'line' | 'pie' | 'donut';
            xAxis: string;
            yAxis: string;
            color?: string;
        };
        features?: {
            streaming?: boolean;
            markdown?: boolean;
            codeBlocks?: boolean;
            fileUpload?: boolean;
        };
        fields?: Array<{
            name: string;
            type: 'text' | 'textarea' | 'select' | 'number' | 'toggle' | 'json';
            label: string;
            required: boolean;
            options?: string[];
        }>;
    }>;
}
export declare const parseView: (filePath: string) => ViewDef;
//# sourceMappingURL=view.parser.d.ts.map
