import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator // Adicionado para indicar carregamento
} from 'react-native';
// Importações do Firebase Authentication
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Importa o objeto de autenticação

const LoginScreen = ({ navigation }) => {
  // Estados para capturar os inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Estado para controle de carregamento

  // Função para lidar com o login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha e-mail e senha para continuar.");
      return;
    }
    
    setLoading(true);

    try {
      // Tenta fazer o login no Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Sucesso: Redireciona para a tela principal
      // Usamos 'replace' para que o usuário não volte para a tela de login ao apertar Voltar
      navigation.replace('Main'); 

    } catch (error) {
      // Falha: Trata e exibe o erro do Firebase
      let errorMessage = "Erro desconhecido. Tente novamente.";
      if (error.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "E-mail ou senha incorretos.";
      }
      
      Alert.alert("Erro no Login", errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Container para o texto "Logo" (Se a logo estiver aqui, ajuste o layout) */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Logo</Text>
      </View>

      {/* Container para os campos de entrada */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu e-mail"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail} // Captura o valor
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword} // Captura o valor
        />
        
        {/* Link para esqueci a senha */}
        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>
      
      {/* Container para os botões */}
      <View style={styles.buttonContainer}>
        {/* Botão de Entrar */}
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleLogin} // Chama a função de login
          disabled={loading} // Desabilita o botão durante o carregamento
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, styles.loginButtonText]}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Botão de Sign up */}
        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.signupButtonText]}>Criar Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
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
  forgotPassword: {
    color: '#007AFF',
    textAlign: 'left',
    fontSize: 14,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', // Para centralizar o ActivityIndicator
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  loginButton: {
    backgroundColor: '#1E1E1E',
    marginRight: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#fff',
    marginLeft: 10,
  },
  signupButtonText: {
    color: '#1E1E1E',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;