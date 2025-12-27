import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
} from "react-native";
import AstrologerComponent from "../../components/astrologercomponents";

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [filteredAstrologers, setFilteredAstrologers] = useState<any[]>([]);

  const astrologers = [
    {
      id: "1",
      name: "Chavishka",
      skills: "Tarot, Numerology",
      languages: "English, Hindi",
      experience: "5 Years",
      price: 18,
      orders: 2560,
      status: "online",
    },
    {
      id: "2",
      name: "Dhaksha",
      skills: "Vedic, Nadi, Numerology",
      languages: "English, Hindi",
      experience: "6 Years",
      price: 19,
      orders: 4454,
      status: "busy",
      waitTime: "4m",
    },
    {
      id: "3",
      name: "AjitTt",
      skills: "Vedic, Nadi, Numerology",
      languages: "English, Hindi",
      experience: "15 Years",
      price: 13,
      oldPrice: 26,
      orders: 36687,
      status: "online",
    },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!searchText.trim()) {
        setFilteredAstrologers(astrologers);
      } else {
        const filtered = astrologers.filter((a) =>
          a.name.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredAstrologers(filtered);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search astrologer..."
        placeholderTextColor="#c9b78d"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Results */}
      {filteredAstrologers.length > 0 ? (
        <FlatList
          data={filteredAstrologers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AstrologerComponent
              name={item.name}
              skills={item.skills}
              languages={item.languages}
              experience={item.experience}
              price={item.price}
              oldPrice={item.oldPrice}
              orders={item.orders}
              status={item.status}
              waitTime={item.waitTime}
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        searchText.length > 0 && (
          <Text style={styles.emptyText}>No astrologer found</Text>
        )
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d1e3f",
    padding: 16,
    paddingTop: 50,
  },

  searchInput: {
    backgroundColor: "#604f70",
    color: "#e0c878",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },

  emptyText: {
    textAlign: "center",
    color: "#c9b78d",
    fontSize: 18,
    marginTop: 24,
  },
});
