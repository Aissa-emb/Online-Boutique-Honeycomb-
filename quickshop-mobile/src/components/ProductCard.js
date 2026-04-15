import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated } from 'react-native';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, onPress, onAdd }) => {
    const { cartItems } = useCart();
    const cartItem = cartItems.find(item => item.id === product.id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;
    const isAdded = quantityInCart > 0;

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Pressable style={styles.card} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image source={product.image} style={styles.image} resizeMode="cover" />
                {product.badge && (
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{product.badge}</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{product.name.toUpperCase()}</Text>
                <Text style={styles.price}>USD {product.price.toFixed(2)}</Text>

                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={onAdd}
                >
                    <Animated.View style={[
                        styles.addButton,
                        isAdded && styles.addButtonAdded,
                        { transform: [{ scale: scaleAnim }] }
                    ]}>
                        <Text style={[styles.addButtonText, isAdded && styles.addButtonTextAdded]}>
                            {isAdded ? `ADDED (${quantityInCart})` : 'ADD TO CART'}
                        </Text>
                    </Animated.View>
                </Pressable>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginBottom: 20,
        width: '47%',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    imageContainer: {
        height: 160,
        width: '100%',
        backgroundColor: '#F5F5F5',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 2,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    info: {
        padding: 10,
    },
    name: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B1B1B',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    price: {
        fontSize: 13,
        fontWeight: '400',
        color: '#666',
        marginBottom: 10,
    },
    addButton: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 2,
        backgroundColor: '#5AC8C8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonAdded: {
        backgroundColor: '#1B1B1B',
    },
    addButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addButtonTextAdded: {
        color: '#fff',
    },
});

export default ProductCard;
