import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Checkbox from "expo-checkbox";

export default function FreeKundliScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthTime, setBirthTime] = useState(new Date());
  const [birthPlace, setBirthPlace] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const showPicker = (mode: "date" | "time") => {
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const hidePicker = () => {
    setPickerVisible(false);
    setPickerMode(null);
  };

  const handleConfirm = (selectedDate: Date) => {
    if (pickerMode === "date") setBirthDate(selectedDate);
    if (pickerMode === "time") setBirthTime(selectedDate);
    hidePicker();
  };

  const handleSubmit = () => {
    console.log({
      name,
      gender,
      birthDate,
      birthTime,
      birthPlace,
      unknownTime,
    });
  };

  const isFormValid = name.trim().length > 0 && birthPlace.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#2d1e3f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Free Kundli</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Enter your birth details to generate an accurate, personalized Kundli.
        </Text>

        <View style={styles.card}>
          {/* Name */}
          <Text style={styles.label}>Enter Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color="#8a7f6a" />
            <TextInput
              placeholder="Your Name"
              placeholderTextColor="#a89f8c"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* Gender */}
          <Text style={styles.label}>Select Gender</Text>
          <View style={styles.genderRow}>
            {["male", "female", "other"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={g === "male" ? "male" : g === "female" ? "female" : "person"}
                  size={22}
                  color={gender === g ? "#e0c878" : "#8a7f6a"}
                />
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Birth Date */}
          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity onPress={() => showPicker("date")} style={styles.inputContainer} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color="#8a7f6a" />
            <Text style={styles.dateText}>{birthDate.toDateString()}</Text>
          </TouchableOpacity>

          {/* Birth Time */}
          {!unknownTime && (
            <>
              <Text style={styles.label}>Birth Time</Text>
              <TouchableOpacity onPress={() => showPicker("time")} style={styles.inputContainer} activeOpacity={0.85}>
                <Ionicons name="time-outline" size={18} color="#8a7f6a" />
                <Text style={styles.dateText}>
                  {birthTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Unknown Time */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUnknownTime(!unknownTime)}
            activeOpacity={0.85}
          >
            <Checkbox
              value={unknownTime}
              onValueChange={setUnknownTime}
              color={unknownTime ? "#e0672c" : undefined}
            />
            <Text style={styles.checkboxText}>I don't know my birth time</Text>
          </TouchableOpacity>

          {/* Birth Place */}
          <Text style={styles.label}>Place of Birth</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={18} color="#8a7f6a" />
            <TextInput
              placeholder="City, Country"
              placeholderTextColor="#a89f8c"
              value={birthPlace}
              onChangeText={setBirthPlace}
              style={styles.input}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <Text style={[styles.submitText, !isFormValid && styles.submitTextDisabled]}>
            Generate Kundli
          </Text>
        </TouchableOpacity>
      </View>

      {/* DateTime Picker */}
      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={pickerMode === "date" ? "date" : "time"}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f5f0",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2d1e3f",
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backBtn: {
    backgroundColor: "#e0c878",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fdf6ec",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },

  introText: {
    color: "#8a7f6a",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 19,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee0bd",
    padding: 18,
  },

  label: {
    color: "#2d1e3f",
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 13,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 18,
    backgroundColor: "#f7f5f0",
  },

  input: {
    flex: 1,
    marginLeft: 8,
    color: "#2d1e3f",
  },

  dateText: {
    marginLeft: 8,
    color: "#2d1e3f",
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 8,
  },

  genderBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#eee0bd",
    backgroundColor: "#f7f5f0",
  },

  genderBtnActive: {
    backgroundColor: "#2d1e3f",
    borderColor: "#2d1e3f",
  },

  genderText: {
    marginTop: 6,
    fontWeight: "600",
    color: "#8a7f6a",
    fontSize: 12,
  },

  genderTextActive: {
    color: "#e0c878",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  checkboxText: {
    marginLeft: 8,
    color: "#5c5347",
    fontSize: 13,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "#f7f5f0",
    borderTopWidth: 1,
    borderTopColor: "#eee0bd",
  },

  submitBtn: {
    backgroundColor: "#e0672c",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
  },

  submitBtnDisabled: {
    backgroundColor: "#d8cdb8",
  },

  submitText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#fff",
    fontSize: 16,
  },

  submitTextDisabled: {
    color: "#fff",
  },
});