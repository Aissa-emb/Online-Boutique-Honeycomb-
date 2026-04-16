#!/bin/bash
set -e

# Run all UI tests sequentially on a single simulator for session stitching.
# Usage: RUN_SOURCE=one-simulator-stitched ./scripts/run-all-tests.sh

SCHEME="QuickShop"
WORKSPACE="quickshop-mobile/ios/QuickShop.xcworkspace"
DESTINATION="${DESTINATION:-platform=iOS Simulator,name=iPhone 16}"
RUN_SOURCE="${RUN_SOURCE:-one-simulator-stitched}"

TESTS=(
    "testBrowseProducts"
    "testAddToCart"
    "testCheckoutFlow"
    "testSearchFlow"
    "testQuickBrowseAndLeave"
    "testAbandonedCart"
    "testAccountView"
    "testRepeatProductBrowsing"
    "testHomeToSearchToCart"
    "testMultiSessionTimeline"
    "testOrderHistory"
)

echo "========================================="
echo "Running all ${#TESTS[@]} tests sequentially"
echo "RUN_SOURCE: $RUN_SOURCE"
echo "Destination: $DESTINATION"
echo "========================================="

PASSED=0
FAILED=0

for test in "${TESTS[@]}"; do
    echo ""
    echo "--- Running: $test ---"
    
    if xcodebuild test-without-building \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -destination "$DESTINATION" \
        -only-testing "OnlineBoutiqueUITests/OnlineBoutiqueUITests/$test" \
        RUN_SOURCE="$RUN_SOURCE" \
        2>&1 | tail -20; then
        echo "✅ $test PASSED"
        ((PASSED++))
    else
        echo "❌ $test FAILED"
        ((FAILED++))
    fi
    
    sleep 2
done

echo ""
echo "========================================="
echo "Results: $PASSED passed, $FAILED failed out of ${#TESTS[@]} total"
echo "========================================="

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
