import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator, 
  Image // Adicionado 'Image'
} from 'react-native';

// Importações da imagem
import logoImage from '../assets/logo.png'; // Importado o arquivo da imagem

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
      {/* Container para a Imagem do Logo - Ajustado para ser centralizado */}
      <View style={styles.logoContainer}>
        <Image 
          source={logoImage} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
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
  // ESTILOS AJUSTADOS PARA CENTRALIZAR A IMAGEM
  logoContainer: {
    width: '100%', // Garante que o container ocupe toda a largura
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    marginBottom: 50, // Espaço após o logo
    // Removidas as propriedades 'position', 'top' e 'left'
  },
  logoImage: {
    width: 200, // Ajuste a largura conforme sua preferência
    height: 80, // Ajuste a altura conforme sua preferência
  },
  // FIM DOS ESTILOS AJUSTADOS
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    // Removido o 'marginTop' que compensava o logo em posição absoluta
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
    justifyContent: 'center', 
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