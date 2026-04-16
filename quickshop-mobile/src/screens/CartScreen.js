import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import { useCart } from '../context/CartContext';
import honeycombClient from '../services/honeycombClient';
import apiClient from '../services/apiClient';

const CartScreen = ({ navigation }) => {
    const { cartItems, updateQuantity, removeFromCart, totalPrice } = useCart();

    useEffect(() => {
        addBreadcrumb('Viewed Cart');
        apiClient.get('/api/v1/cart').catch(() => { });
        apiClient.get('/api/v1/ads?context_keys=cart,upsell').catch(() => { });
        apiClient.get('/api/v1/currencies').catch(() => { });
        honeycombClient.viewCart();
    }, []);

    const proceedToCheckout = () => {
        addBreadcrumb(`Checkout Started - ${cartItems.length} Items`);
        navigation.navigate('Checkout', { cart: { items: cartItems } });
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemRow}>
            <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>

                <View style={styles.quantityRow}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNumber}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>USD {(item.price * item.quantity).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView testID="cartView" style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>ONLINE<Text style={styles.topBarTitleLight}>BOUTIQUE</Text></Text>
            </View>
            {cartItems.length === 0 ? (
                <View testID="emptyCartView" style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
                    <Text style={styles.emptySubtitle}>Browse our collection to find something you love.</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Product List')}
                    >
                        <Text style={styles.browseButtonText}>BROWSE PRODUCTS</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        testID="cartItemsList"
                        data={cartItems}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                    />
                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>
                                USD {totalPrice.toFixed(2)}
                            </Text>
                        </View>
                        <TouchableOpacity testID="proceedToCheckoutButton" style={styles.checkoutButton} onPress={proceedToCheckout}>
                            <Text style={styles.checkoutButtonText}>PROCEED TO CHECKOUT</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    topBar: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1B1B1B',
        alignItems: 'center',
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1,
    },
    topBarTitleLight: {
        fontWeight: '300',
        color: '#ccc',
    },
    listContent: {
        padding: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    imageContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        overflow: 'hidden',
        marginRight: 16,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 13,
        color: '#888',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
        marginBottom: 8,
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#F5F5F5',
        alignSelf: 'flex-start',
        borderRadius: 4,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
    qtyNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B1B1B',
        paddingHorizontal: 8,
    },
    priceContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    removeBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    removeText: {
        color: '#FF3B30',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1B1B1B',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#888',
        marginBottom: 32,
        textAlign: 'center',
    },
    browseButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: '#5AC8C8',
        borderRadius: 2,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 1,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1B1B1B',
    },
    checkoutButton: {
        backgroundColor: '#5AC8C8',
        height: 50,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default CartScreen;
