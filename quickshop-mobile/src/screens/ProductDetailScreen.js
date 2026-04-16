import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { addBreadcrumb } from '@embrace-io/react-native';
import { useCart } from '../context/CartContext';
import CartIcon from '../components/CartIcon';
import honeycombClient from '../services/honeycombClient';
import apiClient from '../services/apiClient';
import { mapProductId } from '../config/honeycomb';

const ProductDetailScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    useEffect(() => {
        addBreadcrumb(`Viewed Product Detail: ${product.name}`);
        addBreadcrumb(`Loading inventory for SKU ${product.id}`);
        const demoId = mapProductId(product.id);
        apiClient.get(`/api/v1/products/${demoId}`).catch(() => { });
        apiClient.get(`/api/v1/ads?context_keys=${encodeURIComponent(product.name)}`).catch(() => { });
        honeycombClient.browseProduct(product.id);
    }, [product.name]);

    const handleAddToCart = () => {
        addBreadcrumb(`Added to cart: ${product.name}, Qty: ${quantity}`);
        for (let i = 0; i < quantity; i++) {
            addToCart({ ...product });
        }
        apiClient.post('/api/v1/cart/items', { product_id: String(product.id), quantity }).catch(() => { });
        honeycombClient.addToCart(product.id, quantity);
    };

    return (
        <View testID="productDetailView" style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>ONLINE<Text style={styles.topBarTitleLight}>BOUTIQUE</Text></Text>
                <CartIcon color="#fff" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageSection}>
                    <Image source={product.image} style={styles.mainImage} resizeMode="contain" />
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.dividerTop} />
                    <Text testID="productDetailName" style={styles.name}>{product.name}</Text>
                    <Text testID="productDetailPrice" style={styles.price}>USD {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</Text>

                    <Text style={styles.descriptionLabel}>PRODUCT DESCRIPTION:</Text>
                    <Text style={styles.description}>
                        {product.description || 'A high-quality product from the Online Boutique. Designed for everyday use and built to last.'}
                    </Text>

                    <View style={styles.quantitySection}>
                        <View style={styles.quantityControl}>
                            <Text style={styles.quantityLabel}>QUANTITY</Text>
                            <View style={styles.quantitySelector}>
                                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                                    <Text style={styles.qtyBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyNumber}>{quantity}</Text>
                                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity testID="productDetailAddToCartButton" style={styles.addToCartButton} onPress={handleAddToCart} activeOpacity={0.8}>
                            <Text style={styles.addToCartText}>ADD TO CART</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
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
        paddingTop: 50,
        backgroundColor: '#1B1B1B',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fff',
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
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        height: 350,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainImage: {
        width: '85%',
        height: '85%',
    },
    infoSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
        backgroundColor: '#F5F5F5',
    },
    dividerTop: {
        height: 1,
        backgroundColor: '#DDD',
        marginBottom: 24,
    },
    name: {
        fontSize: 28,
        fontWeight: '400',
        color: '#1B1B1B',
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: '400',
        color: '#666',
        marginBottom: 24,
    },
    descriptionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1B1B1B',
        marginBottom: 6,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#555',
        marginBottom: 32,
    },
    quantitySection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    quantityControl: {
        marginRight: 16,
    },
    quantityLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
        letterSpacing: 1,
        marginBottom: 6,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 2,
        backgroundColor: '#fff',
    },
    qtyBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
    qtyNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B1B1B',
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#CCC',
        height: 36,
        lineHeight: 36,
        textAlign: 'center',
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: '#5AC8C8',
        height: 42,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default ProductDetailScreen;
