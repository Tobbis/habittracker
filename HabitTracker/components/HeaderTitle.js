import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HeaderTitle({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
