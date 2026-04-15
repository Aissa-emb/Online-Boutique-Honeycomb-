# Demo Guide: QuickShop Pitch App

Follow these steps to demonstrate composable observability with Embrace and OpenTelemetry.

## Part 1: Start the Services

1. **Start the Backend:**
   ```bash
   cd quickshop-backend
   npm install

   # With OTLP export (replace with your backend's endpoint and key):
   OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.example.com \
   OTEL_EXPORTER_OTLP_HEADERS="x-api-key=YOUR_API_KEY" \
   node server.js

   # Or without OTLP export (console-only):
   node server.js
   ```

2. **Run the Mobile App:**
   ```bash
   cd quickshop-mobile
   npm install
   cd ios && pod install && cd ..
   npx react-native start --port 8083
   # In a separate terminal:
   npx react-native run-ios
   ```

3. **(Optional) Start a Tunnel for NSF:**
   ```bash
   ngrok http 3005
   # Copy the HTTPS URL and set it in quickshop-mobile/src/config/api.js
   ```

## Part 2: Trigger the Crash

1. **Browse:** Scroll through the jersey catalog on the home screen.
2. **Select:** Tap any jersey to view its detail page.
3. **Add to Cart:** Choose a size and tap "Add to Bag".
4. **Checkout:** Navigate to the cart and tap "Checkout".
5. **Pay:** Tap "Complete Payment".
6. **💥 Crash!** The app will crash with:
   ```
   TypeError: Cannot read property 'executeTransaction' of null
   ```

## Part 3: Observe the Telemetry

### In Embrace
- Open the **User Timeline** for the crashed session
- You'll see breadcrumbs leading up to the crash:
  - `Viewed Product Detail: [Jersey Name]`
  - `Added to cart: [Jersey Name], Size: M`
  - `Viewed Checkout`
  - `Tapped Complete Payment`
  - `Cart has items, initiating native payment bridge...`
  - `Payment bridge encountered unrecoverable state`
  - 💥 Crash
- The crash report includes a full JS stack trace

### In Your OTLP Backend
- Query for traces from `quickshop-backend`
- Each API call generates multi-span traces (e.g., `payment.validate`, `payment.process`, `order.create`)
- If NSF is enabled, the `trace-id` from Embrace network spans will match the backend traces

## Part 4: The Story

This demo showcases how **composable observability** connects mobile and backend telemetry:
- **Mobile signals** (crashes, breadcrumbs, network spans) are captured by Embrace
- **Backend signals** (traces, metrics) are exported via standard OTLP to any backend
- **Trace correlation** via W3C `traceparent` propagation connects the two
- A single user journey is visible end-to-end across both systems
