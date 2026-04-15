import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

const CartIcon = ({ color = '#000' }) => {
    const { totalQuantity } = useCart();
    const navigation = useNavigation();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (totalQuantity > 0) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [totalQuantity, scaleAnim]);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.navigate('Shopping Cart')}
        >
            <Image source={require('../assets/icons/cart.png')} style={[styles.icon, { tintColor: color }]} resizeMode="contain" />
            {totalQuantity > 0 && (
                <Animated.View style={[styles.badgeContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.badgeText}>{totalQuantity > 99 ? '99+' : totalQuantity}</Text>
                </Animated.View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    icon: {
        width: 24,
        height: 24,
    },
    badgeContainer: {
        position: 'absolute',
        top: 2,
        right: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    }
});

export default CartIcon;
