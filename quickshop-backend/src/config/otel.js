const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { ConsoleSpanExporter, AlwaysOnSampler } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

function setupTelemetry() {
    // ──────────────────────────────────────────────────────────
    // OTLP Configuration
    //
    // Set these environment variables to export to your backend:
    //   OTEL_EXPORTER_OTLP_ENDPOINT  — e.g. https://api.your-backend.com
    //   OTEL_EXPORTER_OTLP_HEADERS   — e.g. x-api-key=YOUR_KEY
    //
    // If no endpoint is set, traces are logged to the console.
    // ──────────────────────────────────────────────────────────
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const otlpHeaders = {};

    // Parse OTEL_EXPORTER_OTLP_HEADERS (comma-separated key=value pairs)
    if (process.env.OTEL_EXPORTER_OTLP_HEADERS) {
        process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').forEach(pair => {
            const [key, ...rest] = pair.trim().split('=');
            if (key && rest.length) {
                otlpHeaders[key.trim()] = rest.join('=').trim();
            }
        });
    }

    const resource = new Resource({
        'service.name': 'online-boutique-backend',
        'service.version': '2.1.0',
        'deployment.environment': process.env.NODE_ENV || 'production',
        'service.namespace': 'online-boutique',
        'host.name': require('os').hostname(),
    });

    let traceExporter;
    let metricExporter;

    if (otlpEndpoint) {
        traceExporter = new OTLPTraceExporter({
            url: `${otlpEndpoint}/v1/traces`,
            headers: otlpHeaders,
        });

        metricExporter = new OTLPMetricExporter({
            url: `${otlpEndpoint}/v1/metrics`,
            headers: otlpHeaders,
        });

        console.log(`📡 Telemetry configured → ${otlpEndpoint}`);
    } else {
        console.warn('⚠️  OTEL_EXPORTER_OTLP_ENDPOINT not set — falling back to console exporter.');
        console.warn('   Set OTEL_EXPORTER_OTLP_ENDPOINT and OTEL_EXPORTER_OTLP_HEADERS to export traces.');
        traceExporter = new ConsoleSpanExporter();
        metricExporter = new OTLPMetricExporter({ url: 'http://localhost:4318/v1/metrics' });
    }

    const sdk = new NodeSDK({
        resource,
        traceExporter,
        sampler: new AlwaysOnSampler(),
        metricReader: new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 15000,
        }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-http': { enabled: true },
                '@opentelemetry/instrumentation-express': { enabled: true },
            }),
        ],
    });

    sdk.start();
    console.log('📡 OpenTelemetry SDK initialized successfully');

    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('OpenTelemetry SDK shut down'))
            .catch((err) => console.error('Error shutting down OTel SDK', err))
            .finally(() => process.exit(0));
    });

    process.on('SIGINT', () => {
        sdk.shutdown()
            .then(() => console.log('OpenTelemetry SDK shut down'))
            .catch((err) => console.error('Error shutting down OTel SDK', err))
            .finally(() => process.exit(0));
    });
}

module.exports = { setupTelemetry };
