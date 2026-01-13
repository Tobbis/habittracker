import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, increment } from 'firebase/firestore';
import UserContext from '../utils/UserContext';

export default function HabitScreen({ navigation }) {
  const { userId } = useContext(UserContext);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabit, setNewHabit] = useState('');
  const [missedDaysAllowed, setMissedDaysAllowed] = useState('0');
  const [notes, setNotes] = useState('');
  const [clickedHabitId, setClickedHabitId] = useState(null); // State to track clicked habit
  const db = getFirestore();

  useEffect(() => {
    if (userId) fetchHabits();
  }, [userId]);

  

  const fetchHabits = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users', userId, 'habits'));
      const habitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(habitsData);
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
    const lastPerformedDate = item.lastPerformed ? new Date(item.lastPerformed) : null;
    const isPerformedToday = lastPerformedDate ? isToday(lastPerformedDate) : false;
    const daysAgo = lastPerformedDate ? Math.floor((Date.now() - lastPerformedDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
      <View style={[styles.card, isPerformedToday && styles.clickedCard]}>
        <TouchableOpacity
          style={styles.cardContentTouchable}
          onPress={() => navigation.navigate('ViewHabit', { habitId: item.id })}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardText}>
              <Text style={styles.habitName}>{item.name}</Text>
              <Text style={styles.habitSub}>{isPerformedToday ? 'Done today' : (daysAgo === 0 ? 'Today' : (daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`))}</Text>
            </View>

            <TouchableOpacity
              style={[styles.doneButton, isPerformedToday && styles.doneButtonDisabled]}
              onPress={() => performHabit(item.id, item.lastPerformed)}
              disabled={isPerformedToday}
            >
              <Image source={require('../assets/ht_loggo_tiny.png')} style={styles.doneImage} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
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
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateHabit')}>
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
  clickedCard: {
    borderColor: '#bde4ff',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    flex: 1,
    marginRight: 12,
  },
  cardContent: {
    padding: 12,
    alignItems: 'flex-start',
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 4,
  },
  habitSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
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
  card: {
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    padding: 6,
    elevation: 1,
  },
  cardContentTouchable: {
    flex: 1,
  },
  doneButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
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