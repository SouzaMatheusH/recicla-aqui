import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const RegisterScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Container da logo no canto superior esquerdo, sem o texto */}
      <View style={styles.logoContainer}>
        {/* Deixando este espaço para uma futura imagem, se desejar */}
      </View>

      {/* Container para os campos de entrada */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome de usuário"
        />

        <Text style={styles.inputLabel}>Telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu telefone"
          keyboardType="phone-pad"
        />
        
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu e-mail"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>Confirmar email</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirme seu e-mail"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          secureTextEntry
        />
        
        <Text style={styles.inputLabel}>Confirmar senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirme sua senha"
          secureTextEntry
        />
      </View>
      
      {/* Botão de Continuar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => { navigation.navigate('Address') }}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
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
  continueButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#fff',
  },
  continueButtonText: {
    color: '#1E1E1E',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;