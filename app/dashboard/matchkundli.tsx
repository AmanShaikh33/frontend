import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { apiMatchKundli } from "../../api/api"; // ADJUST this path to match where your api.ts actually lives

type PickerMode = "boyDate" | "boyTime" | "girlDate" | "girlTime" | null;

export default function MatchKundliScreen() {
  const router = useRouter();

  const [boyName, setBoyName] = useState("");
  const [girlName, setGirlName] = useState("");
  const [boyDOB, setBoyDOB] = useState(new Date());
  const [girlDOB, setGirlDOB] = useState(new Date());
  const [boyTime, setBoyTime] = useState(new Date());
  const [girlTime, setGirlTime] = useState(new Date());
  const [boyUnknownTime, setBoyUnknownTime] = useState(false);
  const [girlUnknownTime, setGirlUnknownTime] = useState(false);

  // NEW: birth place text inputs (were previously just placeholders with no state)
  const [boyPlace, setBoyPlace] = useState("");
  const [girlPlace, setGirlPlace] = useState("");

  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [isPickerVisible, setPickerVisible] = useState(false);

  // NEW: loading + result state for the match API call
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const showPicker = (mode: PickerMode) => {
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const hidePicker = () => {
    setPickerVisible(false);
    setPickerMode(null);
  };

  const handleConfirm = (date: Date) => {
    if (pickerMode === "boyDate") setBoyDOB(date);
    if (pickerMode === "boyTime") setBoyTime(date);
    if (pickerMode === "girlDate") setGirlDOB(date);
    if (pickerMode === "girlTime") setGirlTime(date);
    hidePicker();
  };

  // Helper to format a Date -> "YYYY-MM-DD"
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Helper to format a Date -> "HH:mm" (24-hour, matches backend expectation)
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleMatchHoroscope = async () => {
    // Basic validation before calling the API
    if (!boyName.trim() || !girlName.trim()) {
      Alert.alert("Missing info", "Please enter both names.");
      return;
    }
    if (!boyPlace.trim() || !girlPlace.trim()) {
      Alert.alert("Missing info", "Please enter both birth places.");
      return;
    }

    const boyPayload = {
      name: boyName,
      dob: formatDate(boyDOB),
      tob: formatTime(boyTime),
      unknownTime: boyUnknownTime,
      placeName: boyPlace,
    };

    const girlPayload = {
      name: girlName,
      dob: formatDate(girlDOB),
      tob: formatTime(girlTime),
      unknownTime: girlUnknownTime,
      placeName: girlPlace,
    };

    setIsMatching(true);
    setMatchResult(null);

    try {
      const result = await apiMatchKundli(boyPayload, girlPayload);
      setMatchResult(result);
    } catch (error: any) {
      Alert.alert(
        "Matching failed",
        error?.error || error?.message || "Something went wrong while matching. Please try again."
      );
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <View style={styles.container}>
    
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kundli Matching</Text>
      </View>

      
      <View style={styles.tabWrapper}>
        <View style={styles.tabActive}>
          <Text style={styles.tabText}>New Matching</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Boy&apos;s Details</Text>

          <Text style={styles.label}>Name</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#604f70" />
            <TextInput
              value={boyName}
              onChangeText={setBoyName}
              placeholder="Enter name"
              placeholderTextColor="#9e8b4e"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => showPicker("boyDate")}
          >
            <Ionicons name="calendar-outline" size={18} color="#604f70" />
            <Text style={styles.pickerText}>{boyDOB.toDateString()}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Birth Time</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => showPicker("boyTime")}
          >
            <Ionicons name="time-outline" size={18} color="#604f70" />
            <Text style={styles.pickerText}>
              {boyTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Switch value={boyUnknownTime} onValueChange={setBoyUnknownTime} />
            <Text style={styles.switchText}>
              Don&apos;t know my exact time of birth
            </Text>
          </View>

          <Text style={styles.note}>
            Note: Without time of birth, predictions are ~80% accurate
          </Text>

          <Text style={styles.label}>Birth Place</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color="#604f70" />
            <TextInput
              value={boyPlace}
              onChangeText={setBoyPlace}
              placeholder="New Delhi, India"
              placeholderTextColor="#9e8b4e"
              style={styles.input}
            />
          </View>
        </View>

        {/* Girl Details */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={styles.cardTitle}>Girl&apos;s Details</Text>

          <Text style={styles.label}>Name</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#604f70" />
            <TextInput
              value={girlName}
              onChangeText={setGirlName}
              placeholder="Enter name"
              placeholderTextColor="#9e8b4e"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => showPicker("girlDate")}
          >
            <Ionicons name="calendar-outline" size={18} color="#604f70" />
            <Text style={styles.pickerText}>{girlDOB.toDateString()}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Birth Time</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => showPicker("girlTime")}
          >
            <Ionicons name="time-outline" size={18} color="#604f70" />
            <Text style={styles.pickerText}>
              {girlTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Switch value={girlUnknownTime} onValueChange={setGirlUnknownTime} />
            <Text style={styles.switchText}>
              Don&apos;t know my exact time of birth
            </Text>
          </View>

          <Text style={styles.note}>
            Note: Without time of birth, predictions are ~80% accurate
          </Text>

          <Text style={styles.label}>Birth Place</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color="#604f70" />
            <TextInput
              value={girlPlace}
              onChangeText={setGirlPlace}
              placeholder="New Delhi, India"
              placeholderTextColor="#9e8b4e"
              style={styles.input}
            />
          </View>
        </View>

        {/* NEW: Result card, shown after a successful match */}
        {matchResult && (
          <View style={[styles.card, { marginBottom: 120 }]}>
            <Text style={styles.cardTitle}>Match Result</Text>
            <Text style={styles.resultScore}>
              {matchResult.totalScore} / {matchResult.maxScore}
            </Text>
            <Text style={styles.resultVerdict}>{matchResult.verdict}</Text>

            {matchResult.warnings?.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {matchResult.warnings.map((w: string, i: number) => (
                  <Text key={i} style={styles.note}>
                    ⚠️ {w}
                  </Text>
                ))}
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              {Object.entries(matchResult.koota || {}).map(([key, value]: any) => (
                <View key={key} style={styles.kootaRow}>
                  <Text style={styles.kootaLabel}>{key}</Text>
                  <Text style={styles.kootaScore}>
                    {value.score} / {value.max}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!matchResult && <View style={{ marginBottom: 120 }} />}
      </ScrollView>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, isMatching && { opacity: 0.7 }]}
        onPress={handleMatchHoroscope}
        disabled={isMatching}
      >
        {isMatching ? (
          <ActivityIndicator color="#2d1e3f" />
        ) : (
          <Text style={styles.submitText}>Match Horoscope</Text>
        )}
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={pickerMode?.includes("Date") ? "date" : "time"}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2d1e3f",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#e0c878",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 24,
  },

  tabWrapper: {
    margin: 16,
    backgroundColor: "#604f70",
    borderRadius: 12,
    overflow: "hidden",
  },
  tabActive: {
    paddingVertical: 12,
    backgroundColor: "#e0c878",
  },
  tabText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#2d1e3f",
  },

  content: { paddingHorizontal: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cardTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#2d1e3f",
    marginBottom: 12,
  },

  label: { color: "#555", marginBottom: 4 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0c878",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 8, paddingVertical: 8 },

  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0c878",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  pickerText: { marginLeft: 8 },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  switchText: { marginLeft: 8, color: "#555" },

  note: { fontSize: 12, color: "#888", marginBottom: 12 },

  submitBtn: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 32,
    backgroundColor: "#e0c878",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#2d1e3f",
  },

  // NEW styles for the result card
  resultScore: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "800",
    color: "#2d1e3f",
  },
  resultVerdict: {
    textAlign: "center",
    fontSize: 16,
    color: "#604f70",
    marginTop: 4,
    marginBottom: 8,
  },
  kootaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  kootaLabel: {
    textTransform: "capitalize",
    color: "#555",
  },
  kootaScore: {
    fontWeight: "700",
    color: "#2d1e3f",
  },
});