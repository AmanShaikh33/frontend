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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Free Kundli</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <Text style={styles.label}>Enter Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#604f70" />
          <TextInput
            placeholder="Your Name"
            placeholderTextColor="#9e8b4e"
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
              style={[
                styles.genderBtn,
                gender === g && styles.genderBtnActive,
              ]}
              onPress={() => setGender(g)}
            >
              <Ionicons
                name={
                  g === "male"
                    ? "male"
                    : g === "female"
                    ? "female"
                    : "person"
                }
                size={24}
                color={gender === g ? "#2d1e3f" : "#604f70"}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === g && styles.genderTextActive,
                ]}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Birth Date */}
        <Text style={styles.label}>Birth Date</Text>
        <TouchableOpacity
          onPress={() => showPicker("date")}
          style={styles.inputContainer}
        >
          <Ionicons name="calendar-outline" size={18} color="#604f70" />
          <Text style={styles.dateText}>
            {birthDate.toDateString()}
          </Text>
        </TouchableOpacity>

        {/* Birth Time */}
        {!unknownTime && (
          <>
            <Text style={styles.label}>Birth Time</Text>
            <TouchableOpacity
              onPress={() => showPicker("time")}
              style={styles.inputContainer}
            >
              <Ionicons name="time-outline" size={18} color="#604f70" />
              <Text style={styles.dateText}>
                {birthTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Unknown Time */}
        <View style={styles.checkboxRow}>
          <Checkbox
            value={unknownTime}
            onValueChange={setUnknownTime}
            color={unknownTime ? "#e0c878" : undefined}
          />
          <Text style={styles.checkboxText}>
            I don’t know my birth time
          </Text>
        </View>

        {/* Birth Place */}
        <Text style={styles.label}>Place of Birth</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={18} color="#604f70" />
          <TextInput
            placeholder="City, Country"
            placeholderTextColor="#9e8b4e"
            value={birthPlace}
            onChangeText={setBirthPlace}
            style={styles.input}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitBtn}
      >
        <Text style={styles.submitText}>Generate Kundli</Text>
      </TouchableOpacity>

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
    backgroundColor: "#fff",
  },

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

  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  label: {
    color: "#2d1e3f",
    marginBottom: 6,
    fontWeight: "600",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0c878",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    marginLeft: 8,
    color: "#000",
  },

  dateText: {
    marginLeft: 8,
    color: "#000",
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  genderBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0c878",
    backgroundColor: "#fff",
  },

  genderBtnActive: {
    backgroundColor: "#e0c878",
  },

  genderText: {
    marginTop: 6,
    fontWeight: "600",
    color: "#604f70",
  },

  genderTextActive: {
    color: "#2d1e3f",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  checkboxText: {
    marginLeft: 8,
    color: "#555",
  },

  submitBtn: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#e0c878",
    padding: 18,
    paddingBottom: 32,
  },

  submitText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#2d1e3f",
    fontSize: 16,
  },
});
