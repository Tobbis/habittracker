import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { getFirestore, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import UserContext from '../utils/UserContext';

export default function ViewHabitScreen({ route, navigation }) {
  const { habitId } = route.params || {};
  const { userId } = useContext(UserContext);
  const [habit, setHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    if (userId && habitId) fetchHabit();
  }, [userId, habitId]);

  const fetchHabit = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', userId, 'habits', habitId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setHabit({ id: snap.id, ...snap.data() });
      else Alert.alert('Not found', 'Habit not found');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const markDone = async () => {
    if (!habit) return;
    try {
      const docRef = doc(db, 'users', userId, 'habits', habitId);
      const currentDate = new Date().toISOString();
      await updateDoc(docRef, { streak: increment(1), lastPerformed: currentDate });
      Alert.alert('Done', 'Marked as done.');
      fetchHabit();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not mark done');
    }
  };

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color="#1e90ff" /></View>
  );

  if (!habit) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{habit.name}</Text>
      <Text style={styles.meta}>Streak: {habit.streak}</Text>
      <Text style={styles.meta}>Missed allowed: {habit.missedDaysAllowed}</Text>
      <Text style={styles.meta}>Recorded days: {habit.numDaysRecord}</Text>
      <Text style={styles.sectionTitle}>Notes</Text>
      <Text style={styles.notes}>{habit.notes || 'No notes'}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={markDone}>
        <Text style={styles.primaryButtonText}>Mark done</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  meta: { color: '#333', marginBottom: 6 },
  sectionTitle: { marginTop: 12, fontWeight: 'bold' },
  notes: { marginTop: 6, color: '#444' },
  primaryButton: { marginTop: 24, backgroundColor: '#1e90ff', padding: 12, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: { marginTop: 12, alignItems: 'center' },
  secondaryButtonText: { color: 'red' },
});
