// screens/AIChatScreen.js — Upgraded: grant context, suggested prompts, copy on long-press
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
  Clipboard, Alert,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { chat } from "../services/aiService";
import AppHeader from "../components/AppHeader";

const COLORS = {
  bg: "#1A1A2E", card: "#16213E", cardBorder: "#2A2A44",
  accent: "#E2B96F", text: "#FFFFFF", muted: "#A0A0B0",
  green: "#2ecc71", blue: "#3498db",
};

const SUGGESTED_PROMPTS = [
  "What types of grants am I most likely to qualify for?",
  "How do I write a strong executive summary?",
  "What's the difference between a nonprofit grant and a business grant?",
  "Help me explain my project in 100 words for a grant",
  "What goes in a budget narrative?",
  "How do I find my DUNS/UEI number for federal grants?",
];

function TypingIndicator() {
  return (
    <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
      <Text style={styles.typingDots}>● ● ●</Text>
    </View>
  );
}

function buildSystemPrompt(grantContext) {
  let base = "You are a helpful grant writing assistant for small businesses and nonprofits. " +
    "Provide clear, concise, and actionable advice about grant applications, eligibility, deadlines, and funding strategies. " +
    "Keep responses under 200 words unless asked for longer content.";

  if (grantContext.length > 0) {
    const grantList = grantContext.map(g => `- ${g.name} (${g.amount > 0 ? "$" + g.amount.toLocaleString() : "varies"})`).join("\n");
    base += `\n\nThe user has saved these grants:\n${grantList}\nReference them when relevant to give personalized advice.`;
  }
  return base;
}

const AIChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([{
    id: "0",
    text: "Hello! I'm your AI grant assistant. I can help with proposals, eligibility questions, and finding the right funding. What would you like to know?",
    sender: "ai",
  }]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [grantContext, setGrantContext] = useState([]);
  const [useContext, setUseContext]    = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const listRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Load saved grants for context
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDocs(query(collection(db, "grants"), where("savedBy", "array-contains", uid)))
      .then(snap => setGrantContext(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 8)))
      .catch(() => {});
  }, []);

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), text, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);
    scrollToBottom();

    const systemPrompt = {
      role: "system",
      content: buildSystemPrompt(useContext ? grantContext : []),
    };

    const history = [
      systemPrompt,
      ...messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: text },
    ];

    try {
      const aiText = await chat(history, "mistral-small-latest");
      setMessages(prev => [...prev, { id: `${Date.now()}-ai`, text: aiText, sender: "ai" }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-err`,
        text: "Sorry, I couldn't reach the assistant. Check your connection and Mistral API key.",
        sender: "ai",
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleLongPress = (text) => {
    Clipboard.setString(text);
    Alert.alert("Copied", "Message copied to clipboard.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="AI Assistant" navigation={navigation} />

      {/* Context toggle */}
      {grantContext.length > 0 && (
        <TouchableOpacity style={styles.contextToggle} onPress={() => setUseContext(v => !v)}>
          <View style={[styles.contextDot, useContext && styles.contextDotActive]} />
          <Text style={styles.contextToggleText}>
            {useContext ? "Grant context ON" : "Grant context OFF"} ({grantContext.length} saved)
          </Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={scrollToBottom}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => handleLongPress(item.text)}
              style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.aiBubble]}
            >
              <Text style={[styles.bubbleText, item.sender === "user" ? styles.userBubbleText : styles.aiBubbleText]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
          ListHeaderComponent={showSuggestions && messages.length <= 1 ? (
            <View style={styles.suggestionsBox}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              {SUGGESTED_PROMPTS.map((p, i) => (
                <TouchableOpacity key={i} style={styles.suggestion} onPress={() => handleSend(p)}>
                  <Text style={styles.suggestionText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about grants, proposals, eligibility..."
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            editable={!loading}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={loading}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.bg },
  keyboardContainer: { flex: 1 },

  contextToggle: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, gap: 8 },
  contextDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.muted },
  contextDotActive: { backgroundColor: COLORS.green },
  contextToggleText: { color: COLORS.muted, fontSize: 12 },

  chatList:   { padding: 16, paddingBottom: 8 },
  bubble:     { maxWidth: "80%", padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble: { backgroundColor: "#3498db", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble:   { backgroundColor: COLORS.card, alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.cardBorder },
  bubbleText:     { fontSize: 15, lineHeight: 21 },
  userBubbleText: { color: "#fff" },
  aiBubbleText:   { color: COLORS.text },

  typingBubble: { paddingVertical: 10, paddingHorizontal: 16 },
  typingDots:   { fontSize: 12, color: COLORS.muted, letterSpacing: 4 },

  suggestionsBox:   { marginBottom: 16, gap: 8 },
  suggestionsTitle: { color: COLORS.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 },
  suggestion:       { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  suggestionText:   { color: COLORS.text, fontSize: 13 },

  inputRow: { flexDirection: "row", padding: 12, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, gap: 8, alignItems: "flex-end" },
  textInput: { flex: 1, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.text, maxHeight: 100 },
  sendBtn:        { backgroundColor: COLORS.accent, justifyContent: "center", paddingHorizontal: 16, borderRadius: 10, height: 44 },
  sendBtnDisabled: { backgroundColor: "#555" },
  sendText:       { color: COLORS.bg, fontWeight: "700" },
});

export default AIChatScreen;
