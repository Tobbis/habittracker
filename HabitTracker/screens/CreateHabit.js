import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import UserContext from '../utils/UserContext';

export default function CreateHabit({ navigation }) {
  const { userId } = useContext(UserContext);
  const [name, setName] = useState('');
  const [missedDaysAllowed, setMissedDaysAllowed] = useState(0);
  const [notes, setNotes] = useState('');
  const db = getFirestore();

  const createHabit = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    if (!userId) {
      Alert.alert('Not signed in', 'Please sign in and try again.');
      return;
    }

    try {
      const habitRef = doc(collection(db, 'users', userId, 'habits'));
      const currentDate = new Date().toISOString();
      await setDoc(habitRef, {
        name: name.trim(),
        streak: 0,
        missedDaysAllowed: Number(missedDaysAllowed),
        numDaysRecord: 0,
        notes: notes.trim(),
        lastPerformed: currentDate,
      });
      Alert.alert('Habit created', `${name} was added.`);
      navigation.goBack();
    } catch (err) {
      console.error('Error creating habit:', err);
      Alert.alert('Error', 'Could not create habit.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Habit</Text>

        <Text style={styles.label}>Habit name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Daily journaling"
          value={name}
          onChangeText={setName}
          autoFocus
          accessibilityLabel="Habit name"
        />

        <Text style={styles.label}>Missed days allowed</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setMissedDaysAllowed(Math.max(0, missedDaysAllowed - 1))}
            accessibilityLabel="Decrease missed days"
          >
            <Text style={styles.stepperText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{missedDaysAllowed}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setMissedDaysAllowed(missedDaysAllowed + 1)}
            accessibilityLabel="Increase missed days"
          >
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Short note about the habit"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{name || 'Habit preview'}</Text>
          <Text style={styles.previewSub}>Streak: 0 • Missed allowed: {missedDaysAllowed}</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !name.trim() && styles.disabledButton]}
          onPress={createHabit}
          disabled={!name.trim()}
        >
          <Text style={styles.primaryButtonText}>Create habit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    fontSize: 20,
  },
  stepperValue: {
    marginHorizontal: 12,
    fontSize: 18,
    minWidth: 20,
    textAlign: 'center',
  },
  previewCard: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f6f9ff',
    borderWidth: 1,
    borderColor: '#e6eefc',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewSub: {
    color: '#666',
    marginTop: 6,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9fc7ff',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'red',
  },
});
