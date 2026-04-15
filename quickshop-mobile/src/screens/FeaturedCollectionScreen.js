import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import { useCart } from '../context/CartContext';
import apiClient from '../services/apiClient';

const FEATURED_COLLECTION = [
    {
        id: 101,
        name: 'Film Camera',
        category: 'Vintage / Photography',
        price: 2244.99,
        badge: 'RARE',
        image: require('../assets/products/film_camera.png'),
        description: 'A vintage twin-lens reflex film camera in excellent condition.',
    },
    {
        id: 102,
        name: 'Home Barista Kit',
        category: 'Home / Coffee',
        price: 123.99,
        badge: 'HOT',
        image: require('../assets/products/home_barista_kit.png'),
        description: 'Everything you need to brew the perfect cup at home.',
    },
    {
        id: 103,
        name: 'City Bike',
        category: 'Outdoor / Transport',
        price: 789.50,
        badge: 'FEATURED',
        image: require('../assets/products/city_bike.png'),
        description: 'This single gear bike probably cannot climb the hills of San Francisco.',
    },
    {
        id: 104,
        name: 'Vintage Record Player',
        category: 'Vintage / Audio',
        price: 65.50,
        badge: 'CLASSIC',
        image: require('../assets/products/vintage_record_player.png'),
        description: 'A classic vinyl record player with warm analog sound.',
    },
    {
        id: 105,
        name: 'Vintage Typewriter',
        category: 'Vintage / Office',
        price: 67.98,
        badge: 'ARCHIVE',
        image: require('../assets/products/vintage_typewriter.png'),
        description: 'A fully functional vintage typewriter. A true collector\'s item.',
    },
    {
        id: 106,
        name: 'Terrarium',
        category: 'Home / Decor',
        price: 36.44,
        badge: 'NEW',
        image: require('../assets/products/terrarium.png'),
        description: 'A geometric glass terrarium with gold metal frame.',
    },
];

const FeaturedCollectionScreen = ({ navigation }) => {
    const { addToCart } = useCart();

    useEffect(() => {
        addBreadcrumb('Viewing Featured Collection');
        apiClient.get('/api/v1/products/search?q=featured').catch(() => { });
        apiClient.get('/api/v1/ads?context_keys=featured,collection,premium').catch(() => { });
        apiClient.get('/api/v1/products').catch(() => { });
    }, []);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.editorialHeader}>
                <Text style={styles.editorialSub}>CURATED SELECTION</Text>
                <Text style={styles.editorialTitle}>Other Products{'\n'}YOU MIGHT LIKE</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }) => (
        <View style={styles.productCard}>
            <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
            </View>
            <View style={styles.productDetails}>
                <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                        <Text style={styles.productName}>{item.name}</Text>
                    </View>
                    <Text style={styles.price}>USD {item.price.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart(item)}
                >
                    <Text style={styles.addButtonText}>ADD TO CART</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />

            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>ONLINE<Text style={styles.topBarTitleLight}>BOUTIQUE</Text></Text>
            </View>

            <FlatList
                data={FEATURED_COLLECTION}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
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
        paddingTop: 50,
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 30,
    },
    backButton: {
        paddingVertical: 8,
        marginBottom: 20,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
    },
    editorialHeader: {
        alignItems: 'center',
    },
    editorialSub: {
        color: '#888',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 2.5,
        marginBottom: 8,
    },
    editorialTitle: {
        color: '#1B1B1B',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
        lineHeight: 34,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 80,
    },
    productCard: {
        marginBottom: 24,
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    imageContainer: {
        width: '100%',
        height: 280,
        backgroundColor: '#F5F5F5',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    productDetails: {
        padding: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    categoryText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    productName: {
        color: '#1B1B1B',
        fontSize: 18,
        fontWeight: '700',
    },
    price: {
        color: '#666',
        fontSize: 15,
        fontWeight: '400',
    },
    addButton: {
        backgroundColor: '#5AC8C8',
        paddingVertical: 14,
        borderRadius: 2,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default FeaturedCollectionScreen;
