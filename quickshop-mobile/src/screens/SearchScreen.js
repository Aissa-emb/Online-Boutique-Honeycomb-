import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import apiClient from '../services/apiClient';
import { PRODUCTS } from './ProductListScreen';

const TRENDING = ['Film Camera', 'City Bike', 'Terrarium', 'Barista Kit', 'Typewriter'];

const SearchScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');

    useEffect(() => {
        addBreadcrumb('Viewed Search');
        apiClient.get('/api/v1/products').catch(() => { });
        apiClient.get('/api/v1/ads?context_keys=search,discover').catch(() => { });
    }, []);

    useEffect(() => {
        if (query.length > 0) {
            apiClient.get(`/api/v1/products/search?q=${encodeURIComponent(query)}`).catch(() => { });
        }
    }, [query]);

    const filteredProducts = query
        ? PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.season.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    return (
        <SafeAreaView testID="searchView" style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>ONLINE<Text style={styles.topBarTitleLight}>BOUTIQUE</Text></Text>
            </View>

            <View style={styles.searchContainer}>
                <Image source={require('../assets/icons/search.png')} style={styles.searchIcon} resizeMode="contain" />
                <TextInput
                    testID="searchInput"
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor="#8E8E93"
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                />
            </View>

            {!query ? (
                <View style={styles.trendingSection}>
                    <Text style={styles.trendingTitle}>TRENDING SEARCHES</Text>
                    {TRENDING.map((term, i) => (
                        <TouchableOpacity key={i} testID={`trending-${term.replace(/\s+/g, '-').toLowerCase()}`} style={styles.trendingItem} onPress={() => setQuery(term)}>
                            <Text style={styles.trendingText}>{term}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.resultsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            testID={`searchResult-${item.id}`}
                            style={styles.resultCard}
                            onPress={() => {
                                addBreadcrumb(`Search result tapped: ${item.name}`);
                                navigation.navigate('Search Product Detail', { product: item });
                            }}
                        >
                            <View style={styles.resultImageContainer}>
                                <Image source={item.image} style={styles.resultImage} resizeMode="cover" />
                            </View>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultCategory}>{item.season.toUpperCase()}</Text>
                                <Text style={styles.resultName}>{item.name}</Text>
                                <Text style={styles.resultPrice}>USD {item.price.toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No products found for "{query}"</Text>
                        </View>
                    }
                />
            )}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 44,
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
    },
    trendingSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    trendingTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 1,
        marginBottom: 16,
    },
    trendingItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    trendingText: {
        fontSize: 16,
        color: '#1B1B1B',
    },
    resultsList: {
        padding: 16,
    },
    resultCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    resultImageContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        marginRight: 16,
        overflow: 'hidden',
    },
    resultImage: {
        width: '100%',
        height: '100%',
    },
    resultInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    resultCategory: {
        fontSize: 10,
        fontWeight: '600',
        color: '#888',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1B1B1B',
        marginBottom: 4,
    },
    resultPrice: {
        fontSize: 14,
        fontWeight: '400',
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 15,
        color: '#888',
    },
});

export default SearchScreen;
