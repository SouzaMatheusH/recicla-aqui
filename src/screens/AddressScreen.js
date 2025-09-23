import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const AddressScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Container da logo no canto superior esquerdo (sem texto) */}
      <View style={styles.logoContainer}></View>

      {/* Container para os campos de entrada */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>CEP</Text>
        <TextInput
          style={styles.input}
          placeholder="00000-000"
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Rua</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Rua das Flores"
        />
        
        <Text style={styles.inputLabel}>Numero</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 123"
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Cidade</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: São Paulo"
        />

        <Text style={styles.inputLabel}>Estado</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: SP"
        />
      </View>
      
      {/* Botão de Concluir */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => { /* Lógica de conclusão do cadastro aqui */ }}
        >
          <Text style={styles.finishButtonText}>Concluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  inputContainer: {
    width: '100%',
    marginTop: 50,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  finishButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#fff',
  },
  finishButtonText: {
    color: '#1E1E1E',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddressScreen;