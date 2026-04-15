import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    StatusBar, Image
} from 'react-native';
import { addBreadcrumb } from '@embrace-io/react-native';
import apiClient from '../services/apiClient';

const WISHLIST_ITEMS = [
    { id: 7, name: 'Film Camera', season: 'Vintage', price: 2244.99, image: require('../assets/products/film_camera.png') },
    { id: 5, name: 'Home Barista Kit', season: 'Home', price: 123.99, image: require('../assets/products/home_barista_kit.png') },
    { id: 10, name: 'City Bike', season: 'Outdoor', price: 789.50, image: require('../assets/products/city_bike.png') },
];

const WishlistScreen = ({ navigation }) => {
    const [items, setItems] = useState(WISHLIST_ITEMS);

    useEffect(() => {
        addBreadcrumb('Viewed Wishlist');
        apiClient.get('/api/v1/products').catch(() => { });
        apiClient.get('/api/v1/ads?context_keys=wishlist,recommendations').catch(() => { });
    }, []);

    const removeItem = (id) => {
        addBreadcrumb(`Removed from wishlist: product ${id}`);
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemSeason}>{item.season ? item.season.toUpperCase() : ''}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>USD {item.price.toFixed(2)}</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                            addBreadcrumb(`Added to cart from wishlist: ${item.name}`);
                            navigation.navigate('Shopping Cart', { newItem: { ...item, quantity: 1 } });
                        }}
                    >
                        <Text style={styles.addButtonText}>ADD TO CART</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
                        <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <FlatList
                data={items}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <Text style={styles.title}>Wishlist</Text>
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                        <Text style={styles.emptySubtitle}>Save items you love for later</Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => navigation.navigate('Product List')}
                        >
                            <Text style={styles.browseButtonText}>BROWSE PRODUCTS</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    listContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '800', color: '#1B1B1B', marginBottom: 20 },
    itemCard: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 4,
        padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5',
    },
    imageContainer: {
        width: 100, height: 100, backgroundColor: '#F5F5F5', borderRadius: 4,
        overflow: 'hidden', marginRight: 16,
    },
    image: { width: '100%', height: '100%' },
    itemInfo: { flex: 1, justifyContent: 'center' },
    itemSeason: {
        fontSize: 10, fontWeight: '600', color: '#888', letterSpacing: 0.5, marginBottom: 4,
    },
    itemName: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', marginBottom: 4 },
    itemPrice: { fontSize: 14, fontWeight: '400', color: '#666', marginBottom: 10 },
    buttonRow: { flexDirection: 'row', alignItems: 'center' },
    addButton: {
        backgroundColor: '#5AC8C8', paddingHorizontal: 18, paddingVertical: 8,
        borderRadius: 2, marginRight: 10,
    },
    addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    removeButton: {
        width: 32, height: 32, borderRadius: 4, backgroundColor: '#F2F2F2',
        justifyContent: 'center', alignItems: 'center',
    },
    removeButtonText: { fontSize: 14, color: '#888' },
    center: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: '#888', marginBottom: 24 },
    browseButton: {
        paddingHorizontal: 28, paddingVertical: 14, backgroundColor: '#5AC8C8', borderRadius: 2,
    },
    browseButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});

export default WishlistScreen;
