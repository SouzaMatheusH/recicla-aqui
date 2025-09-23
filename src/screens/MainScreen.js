import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MainScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa de Pontos de Coleta</Text>
      <Text style={styles.text}>
        (Aqui será exibido o mapa com os pontos de descarte)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MainScreen;