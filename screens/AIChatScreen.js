// screens/AIChatScreen.js
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { chat } from "../services/aiService"; // ✅ Reuses shared Mistral client
import AppHeader from "../components/AppHeader";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "You are a helpful grant writing assistant for small businesses. " +
    "Provide clear, concise, and actionable advice about grant applications, " +
    "eligibility requirements, deadlines, and funding strategies. " +
    "Keep responses under 150 words.",
};

const INITIAL_MESSAGE = {
  id: "0",
  text: "Hello! I'm your AI grant assistant. Ask me anything about your application status or matching strategy.",
  sender: "ai",
};

// ── Typing indicator bubble ───────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
      <Text style={styles.typingDots}>● ● ●</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
const AIChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    // Small delay lets FlatList finish rendering the new item first
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), text: input.trim(), sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    // ✅ Fixed: build the full conversation history so the AI retains context
    // across turns — only include role + content (strip UI-only 'id'/'sender' fields)
    const history = [
      SYSTEM_PROMPT,
      ...messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: userMsg.text },
    ];

    try {
      // ✅ Fixed: reuses chat() which calls /v1/chat/completions correctly
      const aiText = await chat(history, "mistral-small-latest");
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-ai`, text: aiText, sender: "ai" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          text: "Sorry, I couldn't reach the assistant. Please try again.",
          sender: "ai",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="AI Assistant" navigation={navigation} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Text style={styles.title}>AI Funding Assistant</Text>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={scrollToBottom}  // ✅ auto-scroll on new content
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {/* ✅ Fixed: separate text color per sender — white on blue, dark on grey */}
              <Text
                style={[
                  styles.bubbleText,
                  item.sender === "user" ? styles.userBubbleText : styles.aiBubbleText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a question..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
          />
          {/* ✅ Fixed: disabled + dimmed while loading to prevent double-sends */}
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={handleSend}
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
  container:  { flex: 1, backgroundColor: "#f8f9fa" },
  keyboardContainer: { flex: 1 },
  title:      { fontSize: 20, fontWeight: "bold", textAlign: "center", marginVertical: 10, color: "#333" },
  chatList:   { padding: 16, paddingBottom: 8 },

  bubble:     { maxWidth: "80%", padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble: { backgroundColor: "#3498db", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble:   { backgroundColor: "#e0e0e0", alignSelf: "flex-start", borderBottomLeftRadius: 4 },

  // ✅ Fixed: distinct colors per sender
  bubbleText:     { fontSize: 15, lineHeight: 21 },
  userBubbleText: { color: "#fff"  },
  aiBubbleText:   { color: "#333" },

  // ── Typing indicator
  typingBubble: { paddingVertical: 10, paddingHorizontal: 16 },
  typingDots:   { fontSize: 12, color: "#999", letterSpacing: 4 },

  // ── Input row
  inputRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    color: "#333",
  },
  sendBtn:         { backgroundColor: "#2ecc71", justifyContent: "center", paddingHorizontal: 16, borderRadius: 8, height: 44 },
  sendBtnDisabled: { backgroundColor: "#95a5a6" },
  sendText:        { color: "#fff", fontWeight: "bold" },
});

export default AIChatScreen;
