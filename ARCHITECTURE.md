# System Architecture

```mermaid
graph TD
    User((User)) --> Mobile[Mobile App \n(QuickShop)]
    Mobile -- "HTTP API calls" --> API[Backend API \n(Node.js)]
    
    subgraph Telemetry
        Mobile -- "Crashes, Breadcrumbs, Network Spans" --> Embrace[Embrace Platform]
        API -- "OTel Traces + Metrics (OTLP)" --> Backend[Your OTLP Backend]
    end
    
    subgraph "Trace Correlation"
        Embrace -- "NSF forwards network spans" --> Backend
    end
    
    style Embrace fill:#bbf,stroke:#333
    style Backend fill:#f96,stroke:#333
```

## Data Flow

1. **User Journey:** User browses products → adds to cart → attempts checkout → crash occurs.
2. **Mobile Telemetry:** Embrace captures breadcrumbs, view spans, network spans, and the crash with full stack trace.
3. **Backend Telemetry:** OpenTelemetry auto-instrumentation captures multi-span traces for each API call and exports via OTLP.
4. **Correlation:** Embrace NSF forwards client-side network spans with W3C `traceparent`, correlating mobile requests with backend traces.
