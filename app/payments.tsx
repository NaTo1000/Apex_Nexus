import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Pricing Catalogue ────────────────────────────────────────────────────────

interface PricingItem {
  id: string;
  category: "distribution" | "membership" | "recording" | "ownership";
  name: string;
  price: number;          // AUD cents
  period?: string;        // e.g. "per week"
  description: string;
  features: string[];
  color: string;
  badge?: string;
}

const PRICING: PricingItem[] = [
  // ── Membership ──
  {
    id: "membership_weekly",
    category: "membership",
    name: "DROPAi Full Membership",
    price: 2000,           // $20.00 AUD
    period: "per week",
    description: "Complete access to every DROPAi feature",
    features: [
      "Jamy Room — unlimited live jam sessions",
      "Collab Network — connect with artists worldwide",
      "DJ Booth — full dual-deck mixer",
      "Recording Studio — unlimited sessions",
      "AI Lyricist Booth — unlimited song generation",
      "Video Clip Generator — unlimited concepts",
      "AI Mastering — unlimited tracks",
      "Priority support",
    ],
    color: "#FFD700",
    badge: "BEST VALUE",
  },
  // ── Distribution ──
  {
    id: "dist_single",
    category: "distribution",
    name: "Single Drop",
    price: 1200,           // $12.00 AUD
    description: "Distribute 1 track to all 6 platforms — forever",
    features: [
      "1 single track",
      "Spotify, YouTube, Apple Music, SoundCloud, Beatport, Facebook",
      "One-time fee — no annual renewals",
      "DROPAi keeps 10% royalties",
      "ISRC code included",
      "Live within 24–48 hrs",
    ],
    color: "#C41E3A",
  },
  {
    id: "dist_album",
    category: "distribution",
    name: "Album Drop",
    price: 4500,           // $45.00 AUD
    description: "Distribute up to 10 tracks — forever",
    features: [
      "Up to 10 tracks",
      "All 6 platforms",
      "One-time fee — no annual renewals",
      "DROPAi keeps 10% royalties",
      "UPC + ISRC codes included",
      "Album artwork upload",
      "Live within 48–72 hrs",
    ],
    color: "#FF4D6D",
    badge: "POPULAR",
  },
  {
    id: "dist_double",
    category: "distribution",
    name: "Double Album",
    price: 7000,           // $70.00 AUD
    description: "Distribute up to 20 tracks — forever",
    features: [
      "Up to 20 tracks (2 discs)",
      "All 6 platforms",
      "One-time fee — no annual renewals",
      "DROPAi keeps 10% royalties",
      "UPC + ISRC codes included",
      "Priority distribution within 24 hrs",
      "Dedicated support",
    ],
    color: "#A78BFA",
  },
  // ── Recording & Ownership ──
  {
    id: "recording_single",
    category: "recording",
    name: "Record & Own",
    price: 300,            // $3.00 AUD
    period: "per song",
    description: "Record a track and receive full ownership certificate",
    features: [
      "1 recorded track",
      "Full ownership certificate",
      "Unique ownership ID",
      "Timestamped on record",
      "Artist name & date registered",
    ],
    color: "#34D399",
  },
  {
    id: "ownership_bundle",
    category: "ownership",
    name: "Ownership Bundle",
    price: 2300,           // $23.00 AUD
    description: "Record + full ownership package",
    features: [
      "1 recorded track",
      "Full ownership certificate",
      "Unique ownership ID",
      "Timestamped on record",
      "Priority certificate delivery",
      "PDF ownership document",
      "Ready for copyright registration",
    ],
    color: "#60A5FA",
    badge: "COMPLETE",
  },
];

// ─── Payment History ──────────────────────────────────────────────────────────

interface PaymentRecord {
  id: string;
  itemId: string;
  itemName: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
  receiptId: string;
}

const PAYMENT_STORAGE_KEY = "@dropai_payments_v1";
const MEMBERSHIP_KEY = "@dropai_membership_v1";

async function loadPayments(): Promise<PaymentRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function savePayment(record: PaymentRecord): Promise<void> {
  try {
    const existing = await loadPayments();
    await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify([record, ...existing]));
  } catch {}
}

interface MembershipState {
  active: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  plan: string | null;
}

async function loadMembership(): Promise<MembershipState> {
  try {
    const raw = await AsyncStorage.getItem(MEMBERSHIP_KEY);
    return raw ? JSON.parse(raw) : { active: false, startedAt: null, expiresAt: null, plan: null };
  } catch { return { active: false, startedAt: null, expiresAt: null, plan: null }; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tierId?: string;
    price?: string;
    context?: string;
  }>();

  const [activeTab, setActiveTab] = useState<"plans" | "checkout" | "history">(
    params.tierId ? "checkout" : "plans"
  );
  const [selectedItem, setSelectedItem] = useState<PricingItem | null>(
    params.tierId ? PRICING.find((p) => p.id === params.tierId) ?? null : null
  );
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [membership, setMembership] = useState<MembershipState>({
    active: false, startedAt: null, expiresAt: null, plan: null,
  });
  const [processing, setProcessing] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    loadPayments().then(setPayments);
    loadMembership().then(setMembership);
  }, []);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const handleSelectItem = useCallback((item: PricingItem) => {
    setSelectedItem(item);
    setActiveTab("checkout");
  }, []);

  const handlePayment = useCallback(async () => {
    if (!selectedItem) return;

    if (!cardName.trim() || cardNumber.replace(/\s/g, "").length < 16 ||
        cardExpiry.length < 5 || cardCvc.length < 3) {
      Alert.alert("Incomplete Details", "Please fill in all card details.");
      return;
    }

    setProcessing(true);

    // Simulate Stripe payment processing (in production, call Stripe API via server)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const receiptId = `DROPAI-${Date.now().toString(36).toUpperCase()}`;
    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      amount: selectedItem.price,
      status: "completed",
      createdAt: new Date().toISOString(),
      receiptId,
    };

    await savePayment(record);
    setPayments((prev) => [record, ...prev]);

    // Activate membership if applicable
    if (selectedItem.category === "membership") {
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const newMembership: MembershipState = {
        active: true,
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        plan: selectedItem.id,
      };
      await AsyncStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(newMembership));
      setMembership(newMembership);
    }

    setProcessing(false);

    Alert.alert(
      "Payment Successful",
      `Receipt: ${receiptId}\n\n${selectedItem.name} — $${(selectedItem.price / 100).toFixed(2)} AUD\n\nThank you for using DROPAi!`,
      [
        {
          text: "Done",
          onPress: () => {
            setActiveTab("history");
            setCardNumber("");
            setCardExpiry("");
            setCardCvc("");
            setCardName("");
          },
        },
      ]
    );
  }, [selectedItem, cardName, cardNumber, cardExpiry, cardCvc]);

  const membershipExpiry = membership.expiresAt
    ? new Date(membership.expiresAt).toLocaleDateString()
    : null;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" size={22} color="#F5F5F5" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSub}>Secure payments via Stripe</Text>
          </View>
          <View style={[styles.memberBadge, membership.active && styles.memberBadgeActive]}>
            <Text style={[styles.memberBadgeText, membership.active && { color: "#FFD700" }]}>
              {membership.active ? "MEMBER" : "FREE"}
            </Text>
          </View>
        </View>

        {/* Membership Status Banner */}
        {membership.active && (
          <View style={styles.membershipBanner}>
            <IconSymbol name="star.fill" size={16} color="#FFD700" />
            <Text style={styles.membershipBannerText}>
              Full Membership active · Expires {membershipExpiry}
            </Text>
          </View>
        )}

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(["plans", "checkout", "history"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── PLANS TAB ── */}
        {activeTab === "plans" && (
          <>
            {/* Membership */}
            <Text style={styles.sectionTitle}>Membership</Text>
            {PRICING.filter((p) => p.category === "membership").map((item) => (
              <PricingCard key={item.id} item={item} onSelect={handleSelectItem} />
            ))}

            {/* Distribution */}
            <Text style={styles.sectionTitle}>Music Distribution</Text>
            {PRICING.filter((p) => p.category === "distribution").map((item) => (
              <PricingCard key={item.id} item={item} onSelect={handleSelectItem} />
            ))}

            {/* Recording & Ownership */}
            <Text style={styles.sectionTitle}>Recording & Ownership</Text>
            {PRICING.filter((p) => p.category === "recording" || p.category === "ownership").map((item) => (
              <PricingCard key={item.id} item={item} onSelect={handleSelectItem} />
            ))}

            {/* Security note */}
            <View style={styles.securityNote}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                All payments are processed securely via Stripe. DROPAi never stores your card details. Transactions are encrypted with TLS 1.3.
              </Text>
            </View>
          </>
        )}

        {/* ── CHECKOUT TAB ── */}
        {activeTab === "checkout" && (
          <>
            {selectedItem ? (
              <>
                {/* Order Summary */}
                <View style={[styles.orderSummary, { borderColor: selectedItem.color }]}>
                  <Text style={styles.orderLabel}>Order Summary</Text>
                  <Text style={styles.orderName}>{selectedItem.name}</Text>
                  <Text style={styles.orderDesc}>{selectedItem.description}</Text>
                  {selectedItem.period && (
                    <Text style={styles.orderPeriod}>{selectedItem.period}</Text>
                  )}
                  <View style={styles.orderPriceRow}>
                    <Text style={styles.orderPriceLabel}>Total</Text>
                    <Text style={[styles.orderPrice, { color: selectedItem.color }]}>
                      ${(selectedItem.price / 100).toFixed(2)} AUD
                    </Text>
                  </View>
                </View>

                {/* Card Form */}
                <View style={styles.cardForm}>
                  <Text style={styles.cardFormTitle}>Card Details</Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Cardholder Name</Text>
                    <TextInput
                      style={styles.input}
                      value={cardName}
                      onChangeText={setCardName}
                      placeholder="Name on card"
                      placeholderTextColor="#4B5563"
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Card Number</Text>
                    <TextInput
                      style={styles.input}
                      value={cardNumber}
                      onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#4B5563"
                      keyboardType="number-pad"
                      maxLength={19}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Expiry</Text>
                      <TextInput
                        style={styles.input}
                        value={cardExpiry}
                        onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                        placeholder="MM/YY"
                        placeholderTextColor="#4B5563"
                        keyboardType="number-pad"
                        maxLength={5}
                        returnKeyType="next"
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>CVC</Text>
                      <TextInput
                        style={styles.input}
                        value={cardCvc}
                        onChangeText={(t) => setCardCvc(t.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                        placeholderTextColor="#4B5563"
                        keyboardType="number-pad"
                        maxLength={4}
                        returnKeyType="done"
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.stripeNote}>
                    <Text style={styles.stripeNoteText}>🔒 Secured by Stripe · PCI DSS Level 1</Text>
                  </View>
                </View>

                {/* Pay Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.payBtn,
                    { backgroundColor: selectedItem.color },
                    pressed && { opacity: 0.85 },
                    processing && { opacity: 0.7 },
                  ]}
                  onPress={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#F5F5F5" />
                  ) : (
                    <>
                      <Text style={styles.payBtnText}>
                        Pay ${(selectedItem.price / 100).toFixed(2)} AUD
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setActiveTab("plans")}
                >
                  <Text style={styles.changeBtnText}>Change Plan</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No plan selected</Text>
                <Pressable onPress={() => setActiveTab("plans")}>
                  <Text style={styles.emptyLink}>Browse Plans →</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {payments.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="clock" size={44} color="#2A2A35" />
                <Text style={styles.emptyTitle}>No payments yet</Text>
                <Text style={styles.emptySubtext}>Your payment history will appear here.</Text>
              </View>
            ) : (
              payments.map((p) => {
                const item = PRICING.find((pr) => pr.id === p.itemId);
                return (
                  <View key={p.id} style={styles.paymentRecord}>
                    <View style={styles.paymentRecordHeader}>
                      <Text style={styles.paymentName}>{p.itemName}</Text>
                      <Text style={[styles.paymentAmount, { color: item?.color ?? "#34D399" }]}>
                        ${(p.amount / 100).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.paymentReceipt}>Receipt: {p.receiptId}</Text>
                    <View style={styles.paymentFooter}>
                      <Text style={styles.paymentDate}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </Text>
                      <View style={[styles.paymentStatus, {
                        borderColor: p.status === "completed" ? "#34D399" : "#C41E3A"
                      }]}>
                        <Text style={[styles.paymentStatusText, {
                          color: p.status === "completed" ? "#34D399" : "#C41E3A"
                        }]}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Pricing Card Sub-component ───────────────────────────────────────────────

function PricingCard({ item, onSelect }: { item: PricingItem; onSelect: (item: PricingItem) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [pcStyles.card, pressed && { opacity: 0.85 }]}
      onPress={() => onSelect(item)}
    >
      {item.badge && (
        <View style={[pcStyles.badge, { backgroundColor: item.color }]}>
          <Text style={pcStyles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <View style={pcStyles.header}>
        <View style={pcStyles.nameBlock}>
          <Text style={pcStyles.name}>{item.name}</Text>
          <Text style={pcStyles.desc}>{item.description}</Text>
        </View>
        <View style={pcStyles.priceBlock}>
          <Text style={[pcStyles.price, { color: item.color }]}>
            ${(item.price / 100).toFixed(2)}
          </Text>
          {item.period && <Text style={pcStyles.period}>{item.period}</Text>}
        </View>
      </View>
      <View style={pcStyles.features}>
        {item.features.slice(0, 4).map((f) => (
          <View key={f} style={pcStyles.featureRow}>
            <Text style={[pcStyles.check, { color: item.color }]}>✓</Text>
            <Text style={pcStyles.featureText}>{f}</Text>
          </View>
        ))}
        {item.features.length > 4 && (
          <Text style={[pcStyles.more, { color: item.color }]}>
            +{item.features.length - 4} more features
          </Text>
        )}
      </View>
      <View style={[pcStyles.selectBtn, { backgroundColor: item.color + "22", borderColor: item.color }]}>
        <Text style={[pcStyles.selectBtnText, { color: item.color }]}>Select Plan →</Text>
      </View>
    </Pressable>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    backgroundColor: "#111118",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A35",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  badgeText: { color: "#0A0A0F", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  nameBlock: { flex: 1, paddingRight: 12 },
  name: { color: "#F5F5F5", fontSize: 16, fontWeight: "800" },
  desc: { color: "#9CA3AF", fontSize: 12, marginTop: 3 },
  priceBlock: { alignItems: "flex-end" },
  price: { fontSize: 24, fontWeight: "900" },
  period: { color: "#6B7280", fontSize: 10, textAlign: "right" },
  features: { gap: 5, marginBottom: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  check: { fontSize: 12, fontWeight: "700", width: 14 },
  featureText: { color: "#9CA3AF", fontSize: 12, flex: 1 },
  more: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  selectBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  selectBtnText: { fontSize: 13, fontWeight: "700" },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#F5F5F5", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "#6B7280", fontSize: 11 },
  memberBadge: {
    borderWidth: 1,
    borderColor: "#2A2A35",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  memberBadgeActive: { borderColor: "#FFD700", backgroundColor: "#FFD70011" },
  memberBadgeText: { color: "#6B7280", fontSize: 10, fontWeight: "800" },

  membershipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFD70011",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFD70033",
  },
  membershipBannerText: { color: "#FFD700", fontSize: 13, fontWeight: "600" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#C41E3A" },
  tabText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#F5F5F5" },

  sectionTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 12, marginTop: 4 },

  securityNote: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#111118",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2A2A35",
    alignItems: "flex-start",
  },
  securityIcon: { fontSize: 16 },
  securityText: { color: "#6B7280", fontSize: 12, lineHeight: 18, flex: 1 },

  orderSummary: {
    backgroundColor: "#111118",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  orderLabel: { color: "#6B7280", fontSize: 11, fontWeight: "700", marginBottom: 6, letterSpacing: 1 },
  orderName: { color: "#F5F5F5", fontSize: 18, fontWeight: "800" },
  orderDesc: { color: "#9CA3AF", fontSize: 13, marginTop: 4 },
  orderPeriod: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  orderPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A35",
  },
  orderPriceLabel: { color: "#9CA3AF", fontSize: 14, fontWeight: "600" },
  orderPrice: { fontSize: 24, fontWeight: "900" },

  cardForm: {
    backgroundColor: "#111118",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  cardFormTitle: { color: "#F5F5F5", fontSize: 15, fontWeight: "700", marginBottom: 14 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#0A0A0F",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
    color: "#F5F5F5",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardRow: { flexDirection: "row", gap: 12 },
  stripeNote: {
    alignItems: "center",
    marginTop: 8,
  },
  stripeNoteText: { color: "#6B7280", fontSize: 11 },

  payBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  payBtnText: { color: "#F5F5F5", fontSize: 17, fontWeight: "800" },
  changeBtn: { alignItems: "center", paddingVertical: 12 },
  changeBtnText: { color: "#6B7280", fontSize: 14 },

  paymentRecord: {
    backgroundColor: "#111118",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  paymentRecordHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  paymentName: { color: "#F5F5F5", fontSize: 14, fontWeight: "700", flex: 1 },
  paymentAmount: { fontSize: 16, fontWeight: "800" },
  paymentReceipt: { color: "#6B7280", fontSize: 11, marginBottom: 8 },
  paymentFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentDate: { color: "#9CA3AF", fontSize: 12 },
  paymentStatus: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  paymentStatusText: { fontSize: 11, fontWeight: "700" },

  emptyState: { alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "#6B7280", fontSize: 13 },
  emptyLink: { color: "#C41E3A", fontSize: 14, fontWeight: "700" },
});
