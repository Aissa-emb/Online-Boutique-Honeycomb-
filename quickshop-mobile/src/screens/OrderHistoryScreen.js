import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    StatusBar, ActivityIndicator, Image, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import apiClient from '../services/apiClient';
import { PRODUCTS } from './ProductListScreen';

const STATUS_COLORS = {
    delivered: '#34C759',
    shipped: '#007AFF',
    processing: '#FF9500',
    return_initiated: '#FF3B30',
};

const MOCK_ORDERS = [
    {
        id: 'ORD-2024-8931A',
        status: 'delivered',
        createdAt: '2024-03-25T14:30:00Z',
        total: 2280.49,
        items: [
            { name: 'Film Camera', quantity: 1, image: require('../assets/products/film_camera.png') },
            { name: 'Terrarium', quantity: 1, image: require('../assets/products/terrarium.png') }
        ]
    },
    {
        id: 'ORD-2024-7422B',
        status: 'shipped',
        createdAt: '2024-03-29T09:15:00Z',
        total: 789.50,
        items: [
            { name: 'City Bike', quantity: 1, image: require('../assets/products/city_bike.png') }
        ]
    }
];

const DATE_FILTERS = ['All Time', 'Last 30 Days'];

const OrderHistoryScreen = ({ navigation }) => {
    const [orders, setOrders] = useState(MOCK_ORDERS);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('All Time');

    useEffect(() => {
        addBreadcrumb('Viewed Order History');
        apiClient.get('/api/v1/products').catch(() => { });
        apiClient.get('/api/v1/cart').catch(() => { });
        apiClient.get('/api/v1/currencies').catch(() => { });
    }, []);

    const filteredOrders = orders.filter(order => {
        let dateMatch = true;
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'Last 30 Days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateMatch = orderDate >= thirtyDaysAgo;
        }

        let searchMatch = true;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const idMatch = order.id.toLowerCase().includes(query);
            const statusMatch = order.status.toLowerCase().includes(query);
            const itemMatch = order.items.some(item => item.name.toLowerCase().includes(query));
            searchMatch = idMatch || statusMatch || itemMatch;
        }

        return dateMatch && searchMatch;
    });

    const renderHeader = () => (
        <View style={styles.headerArea}>
            <Text style={styles.pageTitle}>Order History</Text>

            <View style={styles.searchContainer}>
                <Image source={require('../assets/icons/search.png')} style={styles.searchIcon} resizeMode="contain" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search orders, items, or status..."
                    placeholderTextColor="#8E8E93"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                {DATE_FILTERS.map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterPill, dateFilter === filter && styles.filterPillActive]}
                        onPress={() => setDateFilter(filter)}
                    >
                        <Text style={[styles.filterText, dateFilter === filter && styles.filterTextActive]}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => {
                addBreadcrumb(`Viewed order detail: ${item.id}`);
                navigation.navigate('OrderDetail', { orderId: item.id, order: item });
            }}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status.toLowerCase()] || '#8E8E93' }]} />
                    <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
            </View>

            <View style={styles.orderImagesRow}>
                {item.items.map((orderItem, idx) => (
                    <View key={idx} style={styles.imageContainer}>
                        {orderItem.image ? (
                            <Image source={orderItem.image} style={styles.itemImage} resizeMode="cover" />
                        ) : (
                            <Image source={require('../assets/icons/orders.png')} style={styles.placeholderIcon} resizeMode="contain" />
                        )}
                        <View style={styles.qtyBadge}>
                            <Text style={styles.qtyText}>{orderItem.quantity}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.itemsCountText}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
                <Text style={styles.totalText}>USD {item.total.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && orders.length === 0) {
        return (
            <View style={[styles.center, { backgroundColor: '#fff' }]}>
                <ActivityIndicator size="large" color="#5AC8C8" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>ONLINE<Text style={styles.topBarTitleLight}>BOUTIQUE</Text></Text>
            </View>
            <FlatList
                data={filteredOrders}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyTitle}>No Orders Found</Text>
                        <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
    listContent: { paddingBottom: 40 },
    headerArea: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#F5F5F5',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1B1B1B',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: '#8E8E93',
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1B1B1B',
        height: '100%',
    },
    filterScroll: {
        flexGrow: 0,
    },
    filterContent: {
        paddingRight: 20,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    filterPillActive: {
        backgroundColor: '#1B1B1B',
        borderColor: '#1B1B1B',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
    },
    filterTextActive: {
        color: '#fff',
    },
    orderCard: {
        backgroundColor: '#fff',
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    orderHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    orderId: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', marginBottom: 4 },
    dateText: { fontSize: 13, color: '#888', fontWeight: '500' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11, fontWeight: '700', color: '#1B1B1B', textTransform: 'uppercase', letterSpacing: 0.8,
    },
    orderImagesRow: { flexDirection: 'row', marginBottom: 16 },
    imageContainer: {
        width: 56, height: 56, backgroundColor: '#F5F5F5',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12, borderRadius: 4, borderWidth: 1, borderColor: '#E5E5E5',
        overflow: 'hidden',
    },
    itemImage: { width: '100%', height: '100%' },
    placeholderIcon: { width: 20, height: 20, tintColor: '#CCC' },
    qtyBadge: {
        position: 'absolute', top: -4, right: -4, backgroundColor: '#1B1B1B',
        width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#fff'
    },
    qtyText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    orderFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    },
    itemsCountText: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalText: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: '#888', textAlign: 'center' },
});

export default OrderHistoryScreen;
