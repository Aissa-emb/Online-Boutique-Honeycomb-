import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Image, LogBox } from 'react-native';
LogBox.ignoreLogs(['Error adding breadcrumb']);
import { CartProvider } from './src/context/CartContext';
import apiClient from './src/services/apiClient';

import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SearchScreen from './src/screens/SearchScreen';
import FeaturedCollectionScreen from './src/screens/FeaturedCollectionScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import AccountScreen from './src/screens/AccountScreen';
import WishlistScreen from './src/screens/WishlistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ label, iconSource, focused }) => (
    <View style={styles.tabIconContainer}>
        <Image
            source={iconSource}
            style={[
                styles.tabImage,
                { tintColor: focused ? '#5AC8C8' : '#8E8E93' }
            ]}
            resizeMode="contain"
        />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
);

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Product List" component={ProductListScreen} />
            <Stack.Screen name="FeaturedCollection" component={FeaturedCollectionScreen} />
            <Stack.Screen name="Product Detail" component={ProductDetailScreen} />
            <Stack.Screen name="Shopping Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
        </Stack.Navigator>
    );
}

function SearchStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SearchMain" component={SearchScreen} />
            <Stack.Screen name="Search Product Detail" component={ProductDetailScreen} />
        </Stack.Navigator>
    );
}

function OrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Order History" component={OrderHistoryScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </Stack.Navigator>
    );
}

function AccountStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Account Settings" component={AccountScreen} />
        </Stack.Navigator>
    );
}

export default function App() {
    const navigationRefVal = useNavigationContainerRef();
    const navigationRef = useRef(navigationRefVal);

    useEffect(() => {


        apiClient.get('/api/v1/products').catch(() => { });
        apiClient.get('/api/v1/currencies').catch(() => { });
        apiClient.get('/api/v1/ads?context_keys=home,launch').catch(() => { });
    }, []);

    return (
        <CartProvider>
            <NavigationContainer ref={navigationRefVal}>
                <Tab.Navigator
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: styles.tabBar,
                        tabBarShowLabel: false,
                    }}
                >
                    <Tab.Screen
                        name="Home"
                        component={HomeStack}
                        options={{
                            tabBarIcon: ({ focused }) => <TabIcon label="Home" iconSource={require('./src/assets/icons/home.png')} focused={focused} />,
                        }}
                    />
                    <Tab.Screen
                        name="Search"
                        component={SearchStack}
                        options={{
                            tabBarIcon: ({ focused }) => <TabIcon label="Search" iconSource={require('./src/assets/icons/search.png')} focused={focused} />,
                        }}
                    />
                    <Tab.Screen
                        name="Orders"
                        component={OrdersStack}
                        options={{
                            tabBarIcon: ({ focused }) => <TabIcon label="Orders" iconSource={require('./src/assets/icons/orders.png')} focused={focused} />,
                        }}
                    />
                    <Tab.Screen
                        name="Account"
                        component={AccountStack}
                        options={{
                            tabBarIcon: ({ focused }) => <TabIcon label="Account" iconSource={require('./src/assets/icons/account.png')} focused={focused} />,
                        }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </CartProvider>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#1B1B1B',
        borderTopWidth: 0,
        height: 85,
        paddingBottom: 20,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    tabImage: {
        width: 24,
        height: 24,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
    },
    tabLabelActive: {
        color: '#5AC8C8',
    },
});
