import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
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
  const [pickerMode, setPickerMode] = useState(null);

  const showPicker = (mode: string) => {
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
    console.log({ name, gender, birthDate, birthTime, birthPlace, unknownTime });
    // API Call or Navigation
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-[#2d1e3f] pt-[40px]">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e0c878" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#e0c878] ml-[110px]">Free Kundli</Text>
      </View>

      <ScrollView className="px-4 py-6">
        {/* Name */}
        <Text className="text-[#2d1e3f] mb-2 font-semibold">Enter Name</Text>
        <View className="flex-row items-center border border-[#e0c878] rounded-lg px-3 mb-6 bg-white shadow">
          <Ionicons name="person-outline" size={18} color="#604f70" />
          <TextInput
            placeholder="Your Name"
            placeholderTextColor="#9e8b4e"
            value={name}
            onChangeText={setName}
            className="flex-1 ml-2 py-2 text-black"
          />
        </View>

        {/* Gender */}
        <Text className="text-[#2d1e3f] mb-2 font-semibold">Select Gender</Text>
        <View className="flex-row justify-between mb-6">
          {["male", "female", "other"].map((g) => (
            <TouchableOpacity
              key={g}
              className={`flex-1 items-center py-3 mx-1 rounded-xl ${
                gender === g ? "bg-[#e0c878]" : "bg-white"
              } border border-[#e0c878]`}
              onPress={() => setGender(g)}
            >
              <Ionicons
                name={g === "male" ? "male" : g === "female" ? "female" : "person"}
                size={24}
                color={gender === g ? "#2d1e3f" : "#604f70"}
              />
              <Text className={`${gender === g ? "text-[#2d1e3f]" : "text-[#604f70]"} font-semibold`}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Birth Date */}
        <Text className="text-[#2d1e3f] mb-2 font-semibold">Birth Date</Text>
        <TouchableOpacity
          onPress={() => showPicker("date")}
          className="flex-row items-center border border-[#e0c878] rounded-lg px-3 py-3 mb-6 bg-white shadow"
        >
          <Ionicons name="calendar-outline" size={18} color="#604f70" />
          <Text className="ml-2 text-black">{birthDate.toDateString()}</Text>
        </TouchableOpacity>

        {/* Birth Time */}
        {!unknownTime && (
          <>
            <Text className="text-[#2d1e3f] mb-2 font-semibold">Birth Time</Text>
            <TouchableOpacity
              onPress={() => showPicker("time")}
              className="flex-row items-center border border-[#e0c878] rounded-lg px-3 py-3 mb-4 bg-white shadow"
            >
              <Ionicons name="time-outline" size={18} color="#604f70" />
              <Text className="ml-2 text-black">
                {birthTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Unknown Time Checkbox */}
        <View className="flex-row items-center mb-6">
          <Checkbox
            value={unknownTime}
            onValueChange={setUnknownTime}
            color={unknownTime ? "#e0c878" : undefined}
          />
          <Text className="ml-2 text-gray-700">I don’t know my birth time</Text>
        </View>

        {/* Birth Place */}
        <Text className="text-[#2d1e3f] mb-2 font-semibold">Place of Birth</Text>
        <View className="flex-row items-center border border-[#e0c878] rounded-lg px-3 mb-10 bg-white shadow">
          <Ionicons name="location-outline" size={18} color="#604f70" />
          <TextInput
            placeholder="City, Country"
            placeholderTextColor="#9e8b4e"
            value={birthPlace}
            onChangeText={setBirthPlace}
            className="flex-1 ml-2 py-2 text-black"
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="absolute bottom-0 left-0 right-0 bg-[#e0c878] p-4 pb-[35px]"
      >
        <Text className="text-center font-bold text-[#2d1e3f] text-lg">Generate Kundli</Text>
      </TouchableOpacity>

      {/* Date & Time Picker Modal */}
      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={pickerMode === "date" ? "date" : "time"}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
      />
    </View>
  );
}
