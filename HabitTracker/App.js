import React, { useState, useContext, useEffect } from "react";
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "./config/firebaseConfig";
import HabitScreen from "./screens/HabitScreen";
import CreateHabit from "./screens/CreateHabit";
import ViewHabitScreen from "./screens/ViewHabitScreen";
import SignupScreen from "./screens/SignupScreen";
import UserContext from "./utils/UserContext"; // Import UserContext

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUserId } = useContext(UserContext);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUserId(userCredential.user.uid);
      try {
        await SecureStore.setItemAsync('email', email);
        await SecureStore.setItemAsync('password', password);
      } catch (e) {
        console.log('SecureStore save failed', e.message);
      }
      navigation.navigate("Habit");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("./assets/habits.png")} style={styles.image} />
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createStackNavigator();

export default function App() {
  const [userId, setUserId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    const tryAutoLogin = async () => {
      try {
        const email = await SecureStore.getItemAsync('email');
        const password = await SecureStore.getItemAsync('password');
        if (email && password) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (mounted) setUserId(userCredential.user.uid);
          } catch (err) {
            console.log('Auto-login failed:', err.message);
          }
        }
      } catch (err) {
        console.log('SecureStore read failed:', err.message);
      }
      if (mounted) setCheckingAuth(false);
    };
    tryAutoLogin();
    return () => { mounted = false };
  }, []);

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      <NavigationContainer>
      <Stack.Navigator initialRouteName={userId ? "Habit" : "Login"}>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} // Hide header for Login screen
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen} 
            options={{ headerShown: false }} // Hide header for Signup screen
          />
          <Stack.Screen 
            name="Habit" 
            component={HabitScreen} 
            options={{ headerShown: false }} // Hide header for Habit screen
          />
          <Stack.Screen 
            name="CreateHabit"
            component={CreateHabit}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ViewHabit"
            component={ViewHabitScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  image: {
    width: '80%',
    height: undefined,
    aspectRatio: 1, // Maintain aspect ratio
    marginBottom: 20,
  },
  input: {
    width: "80%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 15, // Rounded corners
    padding: 8,
    marginVertical: 10,
    zIndex: 1, // Ensure TextInput is on top
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  button: {
    width: "50%",
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  link: {
    color: "blue",
    marginTop: 10,
  },
});