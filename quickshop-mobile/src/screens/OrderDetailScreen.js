import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar } from 'react-native';
import { addBreadcrumb } from '@embrace-io/react-native';
import { PRODUCTS } from './ProductListScreen';

const STATUS_COLORS = {
    delivered: '#34C759',
    shipped: '#007AFF',
    processing: '#FF9500',
    return_initiated: '#FF3B30',
};

const OrderDetailScreen = ({ route, navigation }) => {
    const { orderId, order } = route.params;

    useEffect(() => {
        addBreadcrumb(`Viewing OrderDetail: ${orderId}`);
    }, [orderId]);

    return (
        <SafeAreaView testID="orderDetailView" style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>ORDER DETAILS</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.orderSummary}>
                    <Text style={styles.orderIdText}>{order.id}</Text>
                    <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>

                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status.toLowerCase()] || '#8E8E93' }]} />
                        <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>ITEMS</Text>

                {order.items.map((item, idx) => {
                    const catalogProduct = PRODUCTS.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase()));
                    const resolvedImage = catalogProduct ? catalogProduct.image : (item.image || PRODUCTS[idx % PRODUCTS.length].image);

                    return (
                        <View key={idx} style={styles.itemRow}>
                            <View style={styles.imageBox}>
                                <Image source={resolvedImage} style={styles.itemImage} resizeMode="cover" />
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>USD {(item.price || (order.total / order.items.length)).toFixed(2)}</Text>
                        </View>
                    );
                })}

                <View style={styles.divider} />

                <View style={styles.totalsContainer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>USD {order.total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Shipping</Text>
                        <Text style={styles.totalValue}>Free</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Taxes</Text>
                        <Text style={styles.totalValue}>USD 0.00</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>USD {order.total.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>
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
        paddingBottom: 40,
    },
    orderSummary: {
        padding: 24,
        backgroundColor: '#fff',
    },
    orderIdText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1B1B1B',
        marginBottom: 6,
    },
    dateText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B1B1B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginHorizontal: 24,
        marginTop: 24,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 16,
        alignItems: 'center',
    },
    imageBox: {
        width: 64,
        height: 64,
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        overflow: 'hidden',
        marginRight: 16,
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
        marginBottom: 4,
    },
    itemQty: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B1B1B',
    },
    totalsContainer: {
        padding: 24,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 15,
        color: '#888',
        fontWeight: '500',
    },
    totalValue: {
        fontSize: 15,
        color: '#1B1B1B',
        fontWeight: '600',
    },
    grandTotalRow: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1B1B1B',
        letterSpacing: 1,
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1B1B1B',
    },
});

export default OrderDetailScreen;
