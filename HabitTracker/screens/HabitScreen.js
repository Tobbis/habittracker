import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, increment } from 'firebase/firestore';
import UserContext from '../utils/UserContext';

export default function HabitScreen() {
  const { userId } = useContext(UserContext);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabit, setNewHabit] = useState('');
  const [missedDaysAllowed, setMissedDaysAllowed] = useState('0');
  const [notes, setNotes] = useState('');
  const [clickedHabitId, setClickedHabitId] = useState(null); // State to track clicked habit
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users', userId, 'habits'));
      const habitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(habitsData);
      //console.log('Habits: ', habitsData); // Log fetched habits
    } catch (error) {
      console.error('Error fetching habits: ', error);
    }
    setLoading(false);
  };

  const addHabit = async () => {
    if (newHabit.trim() === '') return;
    try {
      const habitRef = doc(collection(db, 'users', userId, 'habits'));
      const currentDate = new Date().toISOString(); // Get current date in ISO format
      await setDoc(habitRef, {
        name: newHabit,
        streak: 0,
        missedDaysAllowed: parseInt(missedDaysAllowed),
        numDaysRecord: 0,
        notes: notes,
        lastPerformed: currentDate, // Set lastPerformed to current date
      });
      setNewHabit('');
      setMissedDaysAllowed('0');
      setNotes('');
      setModalVisible(false);
      fetchHabits();
    } catch (error) {
      console.error('Error adding habit: ', error);
    }
  };

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
  };

  const performHabit = async (habitId, lastPerformed) => {
    const lastPerformedDate = new Date(lastPerformed);
    if (isToday(lastPerformedDate)) {
      return; // Do not update streak if the habit was already performed today
    }

    try {
      const habitRef = doc(db, 'users', userId, 'habits', habitId);
      const currentDate = new Date().toISOString(); // Get current date in ISO format
      await updateDoc(habitRef, {
        streak: increment(1),
        lastPerformed: currentDate, // Update lastPerformed to current date
      });
      setClickedHabitId(habitId); // Set the clicked habit ID
      fetchHabits();
    } catch (error) {
      console.error('Error performing habit: ', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const lastPerformedDate = new Date(item.lastPerformed);
    const isPerformedToday = isToday(lastPerformedDate);

    return (
      <TouchableOpacity onPress={() => performHabit(item.id, item.lastPerformed)} style={[styles.card, isPerformedToday && styles.clickedCard]}>
        <View style={styles.cardContent}>
          <Text style={styles.habitName}>{item.name}</Text>
          <Text style={styles.habitStreak}>Streak: {item.streak}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={{ color: '#fff', fontSize: 30 }}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            <TextInput
              style={styles.input}
              placeholder="Habit Name"
              value={newHabit}
              onChangeText={setNewHabit}
            />
            <TextInput
              style={styles.input}
              placeholder="Missed Days Allowed"
              keyboardType="numeric"
              value={missedDaysAllowed}
              onChangeText={setMissedDaysAllowed}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity onPress={addHabit}>
              <Text style={{ color: '#1e90ff', textAlign: 'center', marginTop: 10 }}>Add Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    justifyContent: 'center',
    paddingBottom: 80,
  },
  card: {
    flex: 1,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  clickedCard: {
    backgroundColor: 'lightgreen', // Change background color when clicked
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  habitStreak: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#1e90ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 15,
  },
});