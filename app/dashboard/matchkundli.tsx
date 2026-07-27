import React, { useState, useMemo, useRef } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { apiMatchKundli } from "../../api/api";

type PickerMode = "boyTime" | "girlTime" | null;
type DobTarget = "boy" | "girl" | null;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => CURRENT_YEAR - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function DobPickerModal({
  visible,
  initialDate,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const [day, setDay] = useState(initialDate.getDate());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [year, setYear] = useState(initialDate.getFullYear());

  const yearListRef = useRef<FlatList>(null);
  const monthListRef = useRef<FlatList>(null);
  const dayListRef = useRef<FlatList>(null);

  const maxDay = daysInMonth(month, year);
  const validDay = Math.min(day, maxDay);

  const ITEM_HEIGHT = 44;

  const renderColumn = (
    data: (number | string)[],
    selectedIndex: number,
    onSelect: (index: number) => void,
    listRef: React.RefObject<FlatList>,
    formatLabel: (item: number | string) => string
  ) => (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => String(item)}
      showsVerticalScrollIndicator={false}
      style={styles.wheelColumn}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialScrollIndex={Math.max(0, selectedIndex - 2)}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={[
            styles.wheelItem,
            index === selectedIndex && styles.wheelItemSelected,
          ]}
          onPress={() => onSelect(index)}
        >
          <Text
            style={[
              styles.wheelItemText,
              index === selectedIndex && styles.wheelItemTextSelected,
            ]}
          >
            {formatLabel(item)}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Date of Birth</Text>
          <Text style={styles.modalSubtitle}>
            Tap directly on the year to jump quickly.
          </Text>

          <View style={styles.wheelRow}>
            {renderColumn(
              DAYS.slice(0, maxDay),
              validDay - 1,
              (index) => setDay(index + 1),
              dayListRef,
              (item) => String(item)
            )}
            {renderColumn(
              MONTHS,
              month,
              (index) => setMonth(index),
              monthListRef,
              (item) => String(item).slice(0, 3)
            )}
            {renderColumn(
              YEARS,
              YEARS.indexOf(year),
              (index) => setYear(YEARS[index]),
              yearListRef,
              (item) => String(item)
            )}
          </View>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => onConfirm(new Date(year, month, validDay))}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MatchKundliScreen() {
  const router = useRouter();

  const [boyName, setBoyName] = useState("");
  const [girlName, setGirlName] = useState("");
  const [boyDOB, setBoyDOB] = useState(new Date(1998, 0, 1));
  const [girlDOB, setGirlDOB] = useState(new Date(1999, 0, 1));
  const [boyTime, setBoyTime] = useState(new Date());
  const [girlTime, setGirlTime] = useState(new Date());
  const [boyUnknownTime, setBoyUnknownTime] = useState(false);
  const [girlUnknownTime, setGirlUnknownTime] = useState(false);

  const [boyPlace, setBoyPlace] = useState("");
  const [girlPlace, setGirlPlace] = useState("");

  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const [dobTarget, setDobTarget] = useState<DobTarget>(null);

  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const showTimePicker = (mode: PickerMode) => {
    setPickerMode(mode);
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
    setPickerMode(null);
  };

  const handleTimeConfirm = (date: Date) => {
    if (pickerMode === "boyTime") setBoyTime(date);
    if (pickerMode === "girlTime") setGirlTime(date);
    hideTimePicker();
  };

  const handleDobConfirm = (date: Date) => {
    if (dobTarget === "boy") setBoyDOB(date);
    if (dobTarget === "girl") setGirlDOB(date);
    setDobTarget(null);
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleMatchHoroscope = async () => {
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

  const scorePercent = matchResult
    ? Math.round((matchResult.totalScore / matchResult.maxScore) * 100)
    : 0;

  const scoreColor = useMemo(() => {
    if (scorePercent >= 66) return "#2f9e44";
    if (scorePercent >= 50) return "#e0a800";
    return "#d9480f";
  }, [scorePercent]);

  const renderPersonCard = (
    title: string,
    icon: string,
    name: string,
    setName: (v: string) => void,
    dob: Date,
    onPressDob: () => void,
    time: Date,
    onPressTime: () => void,
    unknownTime: boolean,
    setUnknownTime: (v: boolean) => void,
    place: string,
    setPlace: (v: string) => void
  ) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardIconBadge}>
          <Ionicons name={icon as any} size={18} color="#2d1e3f" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <Text style={styles.label}>Name</Text>
      <View style={styles.inputRow}>
        <Ionicons name="person-outline" size={18} color="#8a7f6a" />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          placeholderTextColor="#a89f8c"
          style={styles.input}
        />
      </View>

      <View style={styles.rowSplit}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={onPressDob} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color="#8a7f6a" />
            <Text style={styles.pickerText}>{formatDateDisplay(dob)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.halfField}>
          <Text style={styles.label}>Birth Time</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={onPressTime} activeOpacity={0.85}>
            <Ionicons name="time-outline" size={18} color="#8a7f6a" />
            <Text style={styles.pickerText}>
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.switchRow}>
        <Switch
          value={unknownTime}
          onValueChange={setUnknownTime}
          trackColor={{ false: "#eee0bd", true: "#2d1e3f" }}
          thumbColor="#fff"
        />
        <Text style={styles.switchText}>Don&apos;t know exact time of birth</Text>
      </View>
      <Text style={styles.note}>Without time of birth, results are approximate</Text>

      <Text style={styles.label}>Birth Place</Text>
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={18} color="#8a7f6a" />
        <TextInput
          value={place}
          onChangeText={setPlace}
          placeholder="e.g. Pune, India"
          placeholderTextColor="#a89f8c"
          style={styles.input}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#2d1e3f" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Kundli Matching</Text>
          <Text style={styles.headerSubtitle}>Vedic compatibility check</Text>
        </View>
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.tabActive}>
          <Ionicons name="sparkles-outline" size={16} color="#e0c878" />
          <Text style={styles.tabText}>New Matching</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderPersonCard(
          "Boy's Details", "man-outline",
          boyName, setBoyName,
          boyDOB, () => setDobTarget("boy"),
          boyTime, () => showTimePicker("boyTime"),
          boyUnknownTime, setBoyUnknownTime,
          boyPlace, setBoyPlace
        )}

        {renderPersonCard(
          "Girl's Details", "woman-outline",
          girlName, setGirlName,
          girlDOB, () => setDobTarget("girl"),
          girlTime, () => showTimePicker("girlTime"),
          girlUnknownTime, setGirlUnknownTime,
          girlPlace, setGirlPlace
        )}

        {matchResult && (
          <View style={[styles.card, styles.resultCard]}>
            <Text style={styles.cardTitle}>Match Result</Text>

            <View style={styles.scoreCircleWrap}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreCircleText, { color: scoreColor }]}>
                  {matchResult.totalScore}
                </Text>
                <Text style={styles.scoreCircleMax}>/ {matchResult.maxScore}</Text>
              </View>
            </View>
            <Text style={[styles.resultVerdict, { color: scoreColor }]}>
              {matchResult.verdict}
            </Text>

            {matchResult.warnings?.length > 0 && (
              <View style={styles.warningBox}>
                {matchResult.warnings.map((w: string, i: number) => (
                  <Text key={i} style={styles.warningText}>Warning: {w}</Text>
                ))}
              </View>
            )}

            <View style={styles.kootaList}>
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

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isMatching && { opacity: 0.7 }]}
          onPress={handleMatchHoroscope}
          disabled={isMatching}
          activeOpacity={0.85}
        >
          {isMatching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="heart" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Match Horoscope</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={hideTimePicker}
      />

      <DobPickerModal
        visible={dobTarget !== null}
        initialDate={dobTarget === "boy" ? boyDOB : girlDOB}
        onConfirm={handleDobConfirm}
        onCancel={() => setDobTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5f0" },

  header: {
    flexDirection: "row",
    alignItems: "center",
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

  headerTitle: { color: "#fdf6ec", fontSize: 17, fontWeight: "700" },
  headerSubtitle: { color: "#b7a9c9", fontSize: 12, marginTop: 2 },

  tabWrapper: {
    margin: 16,
    marginBottom: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee0bd",
  },
  tabActive: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#2d1e3f",
  },
  tabText: { fontWeight: "700", color: "#e0c878" },

  content: { paddingHorizontal: 16, paddingTop: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee0bd",
  },

  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  cardIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f7f5f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#2d1e3f" },

  label: { color: "#8a7f6a", marginBottom: 6, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee0bd",
    backgroundColor: "#f7f5f0",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 10, color: "#2d1e3f" },

  rowSplit: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },

  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#eee0bd",
    backgroundColor: "#f7f5f0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  pickerText: { color: "#2d1e3f", fontWeight: "500" },

  switchRow: { flexDirection: "row", alignItems: "center", marginTop: 2, marginBottom: 4, gap: 8 },
  switchText: { color: "#5c5347", fontSize: 13 },
  note: { fontSize: 11, color: "#a89f8c", marginBottom: 14, marginLeft: 2 },

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
    flexDirection: "row",
    backgroundColor: "#e0672c",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  resultCard: { alignItems: "center" },
  scoreCircleWrap: { marginVertical: 12 },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdfcf9",
  },
  scoreCircleText: { fontSize: 30, fontWeight: "800" },
  scoreCircleMax: { fontSize: 12, color: "#a89f8c", marginTop: -2 },
  resultVerdict: { fontSize: 15, fontWeight: "700", marginBottom: 12 },

  warningBox: { backgroundColor: "#fff6e0", borderRadius: 10, padding: 10, width: "100%", marginBottom: 12 },
  warningText: { fontSize: 12, color: "#8a6d1f" },

  kootaList: { width: "100%" },
  kootaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f2efe8",
  },
  kootaLabel: { textTransform: "capitalize", color: "#5c5347", fontWeight: "500" },
  kootaScore: { fontWeight: "700", color: "#2d1e3f" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,14,30,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", maxWidth: 400 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#2d1e3f", textAlign: "center" },
  modalSubtitle: { fontSize: 11, color: "#8a7f6a", textAlign: "center", marginTop: 4, marginBottom: 14 },
  wheelRow: { flexDirection: "row", height: 220, gap: 4 },
  wheelColumn: { flex: 1 },
  wheelItem: { height: 44, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  wheelItemSelected: { backgroundColor: "#f7f5f0" },
  wheelItemText: { fontSize: 15, color: "#a89f8c" },
  wheelItemTextSelected: { color: "#2d1e3f", fontWeight: "700" },
  modalButtonRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 24, alignItems: "center", backgroundColor: "#f2efe8" },
  modalCancelText: { color: "#5c5347", fontWeight: "700" },
  modalConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 24, alignItems: "center", backgroundColor: "#e0672c" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});