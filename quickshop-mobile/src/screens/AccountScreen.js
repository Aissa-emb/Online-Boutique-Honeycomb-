import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBreadcrumb } from '@embrace-io/react-native';
import apiClient from '../services/apiClient';
import honeycombClient from '../services/honeycombClient';
import { DEMO_CURRENCIES } from '../config/honeycomb';

const AccountScreen = ({ navigation }) => {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [selectedCurrency, setSelectedCurrency] = useState('USD');

    useEffect(() => {
        addBreadcrumb('Viewed Account');
        apiClient.get('/api/v1/currencies').catch(() => { });
        apiClient.get('/api/v1/cart').catch(() => { });
        apiClient.get('/api/v1/products').catch(() => { });
    }, []);

    const handleTogglePush = (value) => {
        setPushEnabled(value);
        addBreadcrumb(`Push notifications ${value ? 'enabled' : 'disabled'}`);
    };

    const handleToggleEmail = (value) => {
        setEmailEnabled(value);
        addBreadcrumb(`Email notifications ${value ? 'enabled' : 'disabled'}`);
    };

    const Section = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionHeader}>{title}</Text>
            <View style={styles.card}>{children}</View>
        </View>
    );

    const Row = ({ label, value, onPress, showChevron }) => (
        <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.rowRight}>
                {value && <Text style={styles.rowValue}>{value}</Text>}
                {showChevron && <Text style={styles.chevron}>›</Text>}
            </View>
        </TouchableOpacity>
    );

    const ToggleRow = ({ label, value, onToggle }) => (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ true: '#5AC8C8' }}
                thumbColor="#fff"
            />
        </View>
    );

    return (
        <SafeAreaView testID="accountView" style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#1B1B1B" />
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>ONLINE<Text style={styles.topBarTitleLight}>BOUTIQUE</Text></Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Account</Text>

                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>OB</Text>
                    </View>
                    <View>
                        <Text style={styles.profileName}>Online Boutique User</Text>
                        <Text style={styles.profileEmail}>user@onlineboutique.dev</Text>
                    </View>
                </View>

                <Section title="SHIPPING">
                    <Row label="Default Address" value="456 Commerce St" showChevron />
                    <View style={styles.divider} />
                    <Row label="City" value="Brooklyn, NY 11201" />
                </Section>

                <Section title="PAYMENT">
                    <Row label="Default Card" value="Visa •••• 4242" showChevron />
                    <View style={styles.divider} />
                    <Row label="Credit Card" value="Connected" />
                </Section>

                <Section title="NOTIFICATIONS">
                    <ToggleRow label="Push Notifications" value={pushEnabled} onToggle={handleTogglePush} />
                    <View style={styles.divider} />
                    <ToggleRow label="Email Updates" value={emailEnabled} onToggle={handleToggleEmail} />
                </Section>

                <Section title="CURRENCY">
                    <View style={styles.currencyRow}>
                        {DEMO_CURRENCIES.map(code => (
                            <TouchableOpacity
                                key={code}
                                style={[
                                    styles.currencyChip,
                                    selectedCurrency === code && styles.currencyChipActive
                                ]}
                                onPress={() => {
                                    setSelectedCurrency(code);
                                    addBreadcrumb(`Currency changed to ${code}`);
                                    apiClient.setCurrency(code);
                                    honeycombClient.setCurrency(code);
                                    apiClient.post('/api/v1/session/currency', { currency_code: code }).catch(() => { });
                                }}
                            >
                                <Text style={[
                                    styles.currencyText,
                                    selectedCurrency === code && styles.currencyTextActive
                                ]}>{code}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Section>

                <Section title="SUPPORT">
                    <Row label="Help Center" showChevron onPress={() => addBreadcrumb('Tapped Help Center')} />
                    <View style={styles.divider} />
                    <Row label="Contact Us" showChevron onPress={() => addBreadcrumb('Tapped Contact Us')} />
                    <View style={styles.divider} />
                    <Row label="App Version" value="2.0.0" />
                    <View style={styles.divider} />
                    <Row label="Log Out" showChevron onPress={() => {
                        addBreadcrumb('Tapped Log Out');
                        apiClient.post('/api/v1/session/logout', {}).catch(() => { });
                    }} />
                </Section>

                <TouchableOpacity
                    testID="forceCrashButton"
                    style={{ opacity: 0.01, padding: 10, alignItems: 'center', marginBottom: 20 }}
                    onPress={() => {
                        addBreadcrumb('Force crash triggered from Account screen');
                        // Deterministic crash for testing - throw after a short delay to let breadcrumb flush
                        setTimeout(() => {
                            throw new Error('Force crash triggered for Embrace testing');
                        }, 100);
                    }}
                >
                    <Text style={{ fontSize: 10, color: '#F5F5F5' }}>Force Crash</Text>
                </TouchableOpacity>
            </ScrollView>
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
    scrollContent: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '800', color: '#1B1B1B', marginBottom: 20 },
    profileCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 4, padding: 20, marginBottom: 24,
        borderWidth: 1, borderColor: '#E5E5E5',
    },
    avatar: {
        width: 56, height: 56, borderRadius: 4, backgroundColor: '#1B1B1B',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    profileName: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', marginBottom: 4 },
    profileEmail: { fontSize: 14, color: '#888' },
    section: { marginBottom: 24 },
    sectionHeader: {
        fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8,
        marginLeft: 4, letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 16,
        borderWidth: 1, borderColor: '#E5E5E5',
    },
    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14,
    },
    rowLabel: { fontSize: 15, color: '#1B1B1B' },
    rowRight: { flexDirection: 'row', alignItems: 'center' },
    rowValue: { fontSize: 15, color: '#888', marginRight: 8 },
    chevron: { fontSize: 20, color: '#CCC' },
    divider: { height: 1, backgroundColor: '#F2F2F2' },
    currencyRow: {
        flexDirection: 'row', paddingVertical: 12, justifyContent: 'space-between',
    },
    currencyChip: {
        flex: 1, marginHorizontal: 4, paddingVertical: 10, borderRadius: 4,
        borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center',
    },
    currencyChipActive: {
        backgroundColor: '#5AC8C8', borderColor: '#5AC8C8',
    },
    currencyText: {
        fontSize: 14, fontWeight: '700', color: '#1B1B1B',
    },
    currencyTextActive: {
        color: '#fff',
    },
});

export default AccountScreen;
