import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import apiClient from '../services/apiClient';
import { useCart } from '../context/CartContext';
import honeycombClient from '../services/honeycombClient';
import { getRandomPerson } from '../config/honeycomb';

const CheckoutScreen = ({ navigation, route }) => {
    const { cart } = route.params;
    const [isProcessing, setIsProcessing] = useState(false);
    const { clearCart } = useCart();

    useEffect(() => {
        addBreadcrumb('Viewed Checkout');
    }, []);

    const handleCheckout = async () => {
        addBreadcrumb('Tapped Complete Payment');

        if (cart.items.length === 0) {
            return;
        }

        setIsProcessing(true);

        try {
            const user = {
                id: 'user_123',
                email: 'user@example.com',
                paymentMethods: Math.random() < 0.5 ? [] : undefined
            };

            addBreadcrumb('Attempting Purchase - Starting Validation');

            honeycombClient.checkout().catch(() => { });

            const person = getRandomPerson();
            const orderPayload = {
                email: user.email,
                street_address: person.street_address,
                zip_code: parseInt(person.zip_code, 10),
                city: person.city,
                state: person.state,
                country: person.country,
                credit_card_number: person.credit_card_number,
                credit_card_expiration_month: parseInt(person.credit_card_expiration_month, 10),
                credit_card_expiration_year: parseInt(person.credit_card_expiration_year, 10),
                credit_card_cvv: parseInt(person.credit_card_cvv, 10),
            };

            const response = await apiClient.post('/api/v1/orders', orderPayload);

            const result = await response.json();

            if (response.ok) {
                addBreadcrumb('Checkout Successful - Order Placed');
                apiClient.delete('/api/v1/cart').catch(() => { });
                Alert.alert('Success', 'Order placed successfully!');
                clearCart();
                navigation.navigate('Product List');
            } else {
                throw new Error(result.message || 'Checkout failed');
            }
        } catch (error) {
            addBreadcrumb(`Checkout Failed: ${error.message}`);
            Alert.alert('Error', 'Failed to complete checkout. Please try again.');
            console.error('Checkout error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const totalAmount = cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );

    return (
        <SafeAreaView testID="checkoutView" style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>CHECKOUT</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ORDER SUMMARY</Text>
                    <View style={styles.card}>
                        {cart.items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemName}>
                                    {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                                </Text>
                                <Text style={styles.itemPrice}>USD {(item.price * item.quantity).toFixed(2)}</Text>
                            </View>
                        ))}
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalPrice}>USD {totalAmount.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>SHIPPING</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Address</Text>
                            <Text style={styles.value}>456 Commerce St</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>City</Text>
                            <Text style={styles.value}>Brooklyn, NY 11201</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PAYMENT</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Method</Text>
                            <Text style={styles.value}>Credit Card</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Card</Text>
                            <Text style={styles.value}>**** 4242</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    testID="placeOrderButton"
                    style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                    onPress={handleCheckout}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.payButtonText}>PAY USD {totalAmount.toFixed(2)}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1B1B1B',
    },
    backButton: {
        width: 60,
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    itemName: {
        fontSize: 15,
        color: '#1B1B1B',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
    },
    totalPrice: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1B1B1B',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 15,
        color: '#1B1B1B',
    },
    value: {
        fontSize: 15,
        color: '#888',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    payButton: {
        backgroundColor: '#5AC8C8',
        height: 50,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default CheckoutScreen;
