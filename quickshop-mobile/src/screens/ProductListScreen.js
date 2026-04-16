import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, StatusBar, ImageBackground } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import ProductCard from '../components/ProductCard';
import CartIcon from '../components/CartIcon';
import { useCart } from '../context/CartContext';
import honeycombClient from '../services/honeycombClient';
import apiClient from '../services/apiClient';

const CATEGORIES = [
    { id: '1', name: 'All' },
    { id: '2', name: 'Vintage' },
    { id: '3', name: 'Home' },
    { id: '4', name: 'Outdoor' },
    { id: '5', name: 'Novelty' },
];

export const PRODUCTS = [
    {
        id: 1,
        name: 'Honeybee Plush',
        categoryId: '5',
        season: 'Novelty',
        price: 29.79,
        image: require('../assets/products/honeybee_plush.png'),
        badge: 'Popular',
        description: 'A cute and cuddly honeybee plush toy. Perfect for nature lovers of all ages.',
    },
    {
        id: 2,
        name: '20 Sided Die',
        categoryId: '5',
        season: 'Novelty',
        price: 15.19,
        image: require('../assets/products/twenty_sided_die.png'),
        badge: null,
        description: 'A beautifully crafted 20-sided die made from natural wood with laser-engraved numbers.',
    },
    {
        id: 3,
        name: 'Vintage Typewriter',
        categoryId: '2',
        season: 'Vintage',
        price: 67.98,
        image: require('../assets/products/vintage_typewriter.png'),
        badge: 'Classic',
        description: 'A fully functional vintage typewriter from the 1940s era. A true collector\'s item.',
    },
    {
        id: 4,
        name: 'Vintage Camera Lens',
        categoryId: '2',
        season: 'Vintage',
        price: 12.48,
        image: require('../assets/products/vintage_camera_lens.png'),
        badge: null,
        description: 'A classic manual focus camera lens with brass construction. Perfect for photography enthusiasts.',
    },
    {
        id: 5,
        name: 'Home Barista Kit',
        categoryId: '3',
        season: 'Home',
        price: 123.99,
        image: require('../assets/products/home_barista_kit.png'),
        badge: 'Hot',
        description: 'Everything you need to brew the perfect cup at home. Includes pour-over dripper, grinder, and scale.',
    },
    {
        id: 6,
        name: 'Terrarium',
        categoryId: '3',
        season: 'Home',
        price: 36.44,
        image: require('../assets/products/terrarium.png'),
        badge: null,
        description: 'A geometric glass terrarium with gold metal frame. Bring a touch of nature to any space.',
    },
    {
        id: 7,
        name: 'Film Camera',
        categoryId: '2',
        season: 'Vintage',
        price: 2244.99,
        image: require('../assets/products/film_camera.png'),
        badge: 'Rare',
        description: 'A vintage twin-lens reflex film camera in excellent condition. A functional work of art.',
    },
    {
        id: 8,
        name: 'Vintage Record Player',
        categoryId: '2',
        season: 'Vintage',
        price: 65.50,
        image: require('../assets/products/vintage_record_player.png'),
        badge: null,
        description: 'A classic vinyl record player with warm analog sound. Perfect for vinyl enthusiasts.',
    },
    {
        id: 9,
        name: 'Metal Camping Mug',
        categoryId: '4',
        season: 'Outdoor',
        price: 24.33,
        image: require('../assets/products/metal_camping_mug.png'),
        badge: null,
        description: 'A durable enamel camping mug. Built to withstand the elements while keeping your coffee hot.',
    },
    {
        id: 10,
        name: 'City Bike',
        categoryId: '4',
        season: 'Outdoor',
        price: 789.50,
        image: require('../assets/products/city_bike.png'),
        badge: 'Featured',
        description: 'This single gear bike probably cannot climb the hills of San Francisco.',
    },
    {
        id: 11,
        name: 'Air Plant',
        categoryId: '3',
        season: 'Home',
        price: 12.30,
        image: require('../assets/products/air_plant.png'),
        badge: null,
        description: 'A low-maintenance succulent air plant in a handmade ceramic pot. Perfect for any desk or shelf.',
    },
];

const ProductListScreen = ({ navigation }) => {
    const [selectedCategory, setSelectedCategory] = useState('1');
    const { addToCart } = useCart();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        addBreadcrumb('Viewed Product List (Home)');
        apiClient.get('/api/v1/products').catch(() => {});
        apiClient.get('/api/v1/currencies').catch(() => {});
        apiClient.get('/api/v1/ads?context_keys=home,featured').catch(() => {});
        honeycombClient.browseIndex();
    }, []);

    const handleProductPress = (product) => {
        addBreadcrumb(`Product selected: ${product.name}`);
        navigation.navigate('Product Detail', { product });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.heroBanner}>
                <Text style={styles.heroSubtitle}>Online</Text>
                <Text style={styles.heroTitle}>BOUTIQUE</Text>
                <Text style={styles.heroEstablished}>EST. 2015</Text>
            </View>

            <View style={styles.hotProductsHeader}>
                <Text style={styles.hotProductsLabel}>Hot</Text>
                <Text style={styles.hotProductsTitle}>PRODUCTS</Text>
            </View>

            <View style={styles.categoriesSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryContent}
                >
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            testID={`category-${cat.name}`}
                            style={[
                                styles.categoryItem,
                                selectedCategory === cat.id && styles.categoryItemActive
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[
                                styles.categoryName,
                                selectedCategory === cat.id && styles.categoryNameActive
                            ]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    return (
        <SafeAreaView testID="homeView" style={[styles.container, { backgroundColor: '#fff' }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" translucent={false} />
            <View style={styles.stickyHeader}>
                <Text style={styles.stickyLogo}>ONLINE<Text style={styles.stickyLogoLight}>BOUTIQUE</Text></Text>
                <View style={styles.stickyActions}>
                    <TouchableOpacity
                        testID="searchButton"
                        style={styles.stickyIconButton}
                        onPress={() => navigation.navigate('Search')}
                    >
                        <Image source={require('../assets/icons/search.png')} style={styles.stickySearchIcon} resizeMode="contain" />
                    </TouchableOpacity>
                    <CartIcon color="#fff" />
                </View>
            </View>
            <FlatList
                testID="productList"
                data={selectedCategory === '1' ? PRODUCTS : PRODUCTS.filter(p => p.categoryId === selectedCategory)}
                keyExtractor={item => item.id.toString()}
                key={'2-col'}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <ProductCard
                        product={item}
                        onPress={() => handleProductPress(item)}
                        onAdd={() => {
                            addBreadcrumb(`Quick added to cart: ${item.name}`);
                            addToCart(item);
                            apiClient.post('/api/v1/cart/items', { product_id: String(item.id), quantity: 1 }).catch(() => {});
                            honeycombClient.addToCart(item.id, 1);
                        }}
                    />
                )}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.columnWrapper}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    stickyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1B1B1B',
        zIndex: 10,
    },
    stickyLogo: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1,
    },
    stickyLogoLight: {
        fontWeight: '300',
        color: '#ccc',
    },
    stickyActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stickyIconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    stickySearchIcon: {
        width: 22,
        height: 22,
        tintColor: '#fff',
    },
    headerContainer: {
        marginBottom: 10,
    },
    heroBanner: {
        backgroundColor: '#1B1B1B',
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroSubtitle: {
        fontSize: 22,
        fontStyle: 'italic',
        color: '#fff',
        fontWeight: '400',
        marginBottom: -4,
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 6,
    },
    heroEstablished: {
        fontSize: 12,
        color: '#888',
        letterSpacing: 3,
        marginTop: 4,
    },
    hotProductsHeader: {
        alignItems: 'center',
        paddingVertical: 28,
        backgroundColor: '#fff',
    },
    hotProductsLabel: {
        fontSize: 18,
        fontStyle: 'italic',
        color: '#333',
        fontWeight: '400',
        marginBottom: -2,
    },
    hotProductsTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1B1B1B',
        letterSpacing: 3,
    },
    categoriesSection: {
        paddingBottom: 5,
    },
    categoryScroll: {
        paddingHorizontal: 16,
    },
    categoryContent: {
        paddingRight: 40,
    },
    categoryItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#F2F2F2',
    },
    categoryItemActive: {
        backgroundColor: '#5AC8C8',
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryNameActive: {
        color: '#fff',
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    }
});

export default ProductListScreen;
