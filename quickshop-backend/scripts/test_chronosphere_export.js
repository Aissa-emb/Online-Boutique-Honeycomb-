const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-node');
const { diag, DiagConsoleLogger, DiagLogLevel, trace } = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Enable Debug Logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const API_TOKEN = process.env.CHRONOSPHERE_API_TOKEN;
const ENDPOINT_BASE = process.env.CHRONOSPHERE_OTLP_ENDPOINT;

console.log('--- Verifying Chronosphere Export ---');
console.log(`Endpoint Base: ${ENDPOINT_BASE}`);
console.log(`Token Present: ${!!API_TOKEN}`);

// Configure Exporter
const traceExporter = new OTLPTraceExporter({
    url: `${ENDPOINT_BASE}/traces`,
    headers: {
        'API-Token': API_TOKEN
    }
});

const provider = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'quickshop-backend', // Match real service
    }),
    traceExporter,
});

provider.start();

const tracer = trace.getTracer('verification-script');
// FIX: Manually offset time by +24 hours (86400000ms) to account for system clock skew
const SKEW_OFFSET = 24 * 60 * 60 * 1000;
const now = Date.now() + SKEW_OFFSET;
const span = tracer.startSpan('manual-verification-span', {
    startTime: now
});
span.setAttribute('manual.verify', true);
span.end(now + 100); // end 100ms later

console.log(`Manual Span Created! Trace ID: ${span.spanContext().traceId}`);
console.log(`Timestamp (adjusted): ${new Date(now).toISOString()}`);
console.log('Flushing...');

// We need to access the processor to force flush, but NodeSDK abstracts it.
// Instead we'll just wait a bit and then shut down.
setTimeout(async () => {
    console.log('Shutting down...');
    await provider.shutdown();
    console.log('Shutdown complete.');
}, 5000);
