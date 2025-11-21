import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'; 

// 2. Importe o arquivo da sua imagem
import logoImage from '../assets/logo.png';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Container para a Imagem do Logo */}
      <View style={styles.logoContainer}>
        {/* 3. Substituído o componente <Text> pelo <Image> */}
        <Image
          source={logoImage}
          style={styles.logoImage} // Usando novo estilo para a imagem
          resizeMode="contain"
        />
      </View>

      {/* Container para os botões */}
      <View style={styles.buttonContainer}>
        {/* Botão de Entrar (Login) */}
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.buttonText, styles.loginButtonText]}>Entrar</Text>
        </TouchableOpacity>

        {/* Botão de Cadastrar */}
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.buttonText, styles.registerButtonText]}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Fundo branco
  },
  logoContainer: {
    marginBottom: 50,
    // Note que não precisamos mais de `logoText`
  },
  // Novo estilo para definir as dimensões da imagem (AUMENTADO)
  logoImage: {
    width: 640, // AUMENTADO de 250
    height: 240, // AUMENTADO de 100
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15, // Espaço entre os botões
    borderWidth: 1, // Borda para os botões
  },
  loginButton: {
    backgroundColor: '#1E1E1E', // Cor de fundo escuro
    borderColor: '#1E1E1E',
  },
  loginButtonText: {
    color: '#fff', // Cor do texto branco
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#fff', // Fundo branco
    borderColor: '#1E1E1E',
  },
  registerButtonText: {
    color: '#1E1E1E', // Cor do texto escuro
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;