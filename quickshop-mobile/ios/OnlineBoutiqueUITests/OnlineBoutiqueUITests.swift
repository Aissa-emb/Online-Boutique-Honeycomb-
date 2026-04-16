import XCTest

final class OnlineBoutiqueUITests: XCTestCase {

    var app: XCUIApplication!
    let rnLoadTimeout: TimeInterval = 30.0
    let elementTimeout: TimeInterval = 10.0

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()

        // Pass RUN_SOURCE environment variable to the app
        if let runSource = ProcessInfo.processInfo.environment["RUN_SOURCE"] {
            app.launchEnvironment["RUN_SOURCE"] = runSource
        }

        app.launch()

        // Wait for React Native to load — homeView should appear
        let homeView = app.otherElements["homeView"]
        let loaded = homeView.waitForExistence(timeout: rnLoadTimeout)
        XCTAssertTrue(loaded, "React Native app did not load within \(rnLoadTimeout)s")
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Helper Methods

    /// Send app to background and bring it back to foreground to flush Embrace session
    private func flushSession() {
        XCUIDevice.shared.press(.home)
        sleep(2)
        app.activate()
        sleep(2)
    }

    /// Tap a tab bar button by its testID
    private func tapTab(_ tabID: String) {
        let tab = app.buttons[tabID]
        if tab.waitForExistence(timeout: elementTimeout) {
            tab.tap()
            sleep(1)
        }
    }

    /// Tap the first product card in the product list
    private func tapFirstProduct() {
        let firstCard = app.otherElements["product-card-1"]
        if firstCard.waitForExistence(timeout: elementTimeout) {
            firstCard.tap()
            sleep(2)
        }
    }

    /// ~35% random chance to navigate to Account and trigger a crash
    private func calculateAndCreateCrash() {
        let random = Int.random(in: 1...100)
        if random <= 35 {
            tapTab("accountTab")
            sleep(1)
            let crashButton = app.buttons["forceCrashButton"]
            if crashButton.waitForExistence(timeout: 5) {
                crashButton.tap()
                sleep(3)
            }
        }
    }

    // MARK: - Test 1: Browse Products

    @MainActor
    func testBrowseProducts() throws {
        print("Starting Browse Products test")

        // Verify home view loads
        let homeView = app.otherElements["homeView"]
        XCTAssertTrue(homeView.exists, "Home view should be visible")

        // Scroll the product list
        let productList = app.collectionViews["productList"]
        if productList.exists {
            productList.swipeUp()
            sleep(1)
        }

        // Tap into a product detail
        tapFirstProduct()

        let detailView = app.otherElements["productDetailView"]
        XCTAssertTrue(detailView.waitForExistence(timeout: elementTimeout), "Product detail should load")

        // Go back
        app.navigationBars.buttons.firstMatch.tap()
        sleep(1)

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 2: Add to Cart

    @MainActor
    func testAddToCart() throws {
        print("Starting Add to Cart test")

        // Tap first product
        tapFirstProduct()

        // Tap Add to Cart
        let addButton = app.buttons["productDetailAddToCartButton"]
        XCTAssertTrue(addButton.waitForExistence(timeout: elementTimeout), "Add to cart button should exist")
        addButton.tap()
        sleep(1)

        // Navigate to cart via tab
        tapTab("homeTab")
        sleep(1)

        // Navigate to cart from product list (via Shopping Cart in navigation)
        // Go back first
        if app.navigationBars.buttons.firstMatch.exists {
            app.navigationBars.buttons.firstMatch.tap()
            sleep(1)
        }

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 3: Checkout Flow

    @MainActor
    func testCheckoutFlow() throws {
        print("Starting Checkout Flow test")

        // Add a product to cart first
        tapFirstProduct()

        let addButton = app.buttons["productDetailAddToCartButton"]
        if addButton.waitForExistence(timeout: elementTimeout) {
            addButton.tap()
            sleep(1)
        }

        // Go back to product list
        if app.navigationBars.buttons.firstMatch.exists {
            app.navigationBars.buttons.firstMatch.tap()
            sleep(1)
        }

        // Navigate to cart - find and tap the cart icon or navigate via Shopping Cart
        // Swipe up to find the cart link or use the tab
        let productList = app.collectionViews["productList"]
        if productList.exists {
            productList.swipeUp()
        }
        sleep(1)

        // The checkout flow goes through nested stack navigation
        // We add to cart and find the checkout path
        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 4: Search Flow

    @MainActor
    func testSearchFlow() throws {
        print("Starting Search Flow test")

        // Navigate to search tab
        tapTab("searchTab")

        let searchView = app.otherElements["searchView"]
        XCTAssertTrue(searchView.waitForExistence(timeout: elementTimeout), "Search view should load")

        // Tap a trending search item
        let trendingItem = app.buttons["trending-film-camera"]
        if trendingItem.waitForExistence(timeout: elementTimeout) {
            trendingItem.tap()
            sleep(2)
        }

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 5: Quick Browse and Leave

    @MainActor
    func testQuickBrowseAndLeave() throws {
        print("Starting Quick Browse and Leave test")

        // Just view home briefly and scroll a tiny bit
        let homeView = app.otherElements["homeView"]
        XCTAssertTrue(homeView.exists, "Home view should be visible")

        app.swipeUp()
        sleep(1)

        // Immediately flush - short session
        flushSession()
    }

    // MARK: - Test 6: Abandoned Cart

    @MainActor
    func testAbandonedCart() throws {
        print("Starting Abandoned Cart test")

        // Add item to cart
        tapFirstProduct()

        let addButton = app.buttons["productDetailAddToCartButton"]
        if addButton.waitForExistence(timeout: elementTimeout) {
            addButton.tap()
            sleep(1)
        }

        // Navigate away without checking out - go to search
        tapTab("searchTab")
        sleep(2)

        // Browse around but never go to checkout
        tapTab("homeTab")
        sleep(1)

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 7: Account View

    @MainActor
    func testAccountView() throws {
        print("Starting Account View test")

        tapTab("accountTab")

        let accountView = app.otherElements["accountView"]
        XCTAssertTrue(accountView.waitForExistence(timeout: elementTimeout), "Account view should load")

        // Scroll through settings
        app.swipeUp()
        sleep(1)
        app.swipeDown()
        sleep(1)

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 8: Repeat Product Browsing

    @MainActor
    func testRepeatProductBrowsing() throws {
        print("Starting Repeat Product Browsing test")

        // Browse multiple products back and forth
        for productId in [1, 2, 3] {
            let card = app.otherElements["product-card-\(productId)"]
            if card.waitForExistence(timeout: elementTimeout) {
                card.tap()
                sleep(2)

                // Go back
                if app.navigationBars.buttons.firstMatch.exists {
                    app.navigationBars.buttons.firstMatch.tap()
                    sleep(1)
                }
            }
        }

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 9: Home to Search to Cart

    @MainActor
    func testHomeToSearchToCart() throws {
        print("Starting Home to Search to Cart test")

        // Start at Home
        let homeView = app.otherElements["homeView"]
        XCTAssertTrue(homeView.exists, "Should start at home")

        // Go to Search
        tapTab("searchTab")
        sleep(2)

        // Go to Orders (proxy for Cart tab since there's no cart tab)
        tapTab("ordersTab")
        sleep(2)

        // Back to Home
        tapTab("homeTab")
        sleep(1)

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 10: Multi-Session Timeline

    @MainActor
    func testMultiSessionTimeline() throws {
        print("Starting Multi-Session Timeline test")

        // Create 5 rapid sessions via background/foreground cycles
        for i in 1...5 {
            print("Session cycle \(i)/5")

            // Do a brief action in each cycle
            if i % 2 == 0 {
                tapTab("searchTab")
                sleep(1)
                tapTab("homeTab")
            } else {
                app.swipeUp()
                sleep(1)
            }

            // Background and foreground to create a new session
            XCUIDevice.shared.press(.home)
            sleep(2)
            app.activate()
            sleep(2)
        }

        // Final flush
        flushSession()
    }

    // MARK: - Test 11: Order History

    @MainActor
    func testOrderHistory() throws {
        print("Starting Order History test")

        tapTab("ordersTab")

        let orderHistoryView = app.otherElements["orderHistoryView"]
        XCTAssertTrue(orderHistoryView.waitForExistence(timeout: elementTimeout), "Order history should load")

        // Tap the first order card
        let firstOrder = app.buttons["orderCard-ORD-2024-8931A"]
        if firstOrder.waitForExistence(timeout: elementTimeout) {
            firstOrder.tap()
            sleep(2)

            let detailView = app.otherElements["orderDetailView"]
            XCTAssertTrue(detailView.waitForExistence(timeout: elementTimeout), "Order detail should load")

            // Go back
            if app.navigationBars.buttons.firstMatch.exists {
                app.navigationBars.buttons.firstMatch.tap()
                sleep(1)
            }
        }

        calculateAndCreateCrash()
        flushSession()
    }

    // MARK: - Test 12: Crash A (Force)

    @MainActor
    func testCrashA_Force() throws {
        print("Starting Force Crash test")

        // Browse briefly
        app.swipeUp()
        sleep(1)

        // Navigate to Account
        tapTab("accountTab")
        sleep(1)

        // Scroll down to find crash button
        app.swipeUp()
        sleep(1)

        // Tap the crash button — this WILL crash the app
        let crashButton = app.buttons["forceCrashButton"]
        if crashButton.waitForExistence(timeout: elementTimeout) {
            crashButton.tap()
            // App will crash here — test ends
            sleep(5)
        }
    }

    // MARK: - Test 13: Crash B (Flush)

    @MainActor
    func testCrashB_Flush() throws {
        print("Starting Crash Flush test")

        // This test runs AFTER a crash. On relaunch, Embrace SDK
        // detects the pending crash report and uploads it.

        // Wait for the app to fully load
        let homeView = app.otherElements["homeView"]
        XCTAssertTrue(homeView.waitForExistence(timeout: rnLoadTimeout), "App should relaunch after crash")

        // Browse briefly to create a session
        app.swipeUp()
        sleep(1)
        app.swipeDown()
        sleep(1)

        // Flush to ensure crash report gets uploaded
        flushSession()
    }
}
