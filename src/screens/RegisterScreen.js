import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator // Adicionado para indicar carregamento
} from 'react-native';
// Importações do Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig'; 

const RegisterScreen = ({ navigation }) => {
  // Estados para capturar os inputs do usuário
  const [user, setUser] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // Estado para controle de carregamento

  // Função para lidar com o cadastro
  const handleSignUp = async () => {
    // 1. Validações Locais
    if (password !== confirmPassword) {
      Alert.alert("Erro de Senha", "As senhas não coincidem.");
      return;
    }
    if (email !== confirmEmail) {
      Alert.alert("Erro de E-mail", "Os e-mails não coincidem.");
      return;
    }
    if (!user || !phone || !email || !password) {
        Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
        return;
    }

    setLoading(true);

    try {
        // 2. CRIAÇÃO NO FIREBASE AUTHENTICATION
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // 3. SALVAMENTO DE DADOS ADICIONAIS NO FIRESTORE
        await setDoc(doc(db, "users", newUser.uid), {
            username: user,
            phone: phone,
            email: newUser.email,
            uid: newUser.uid,
            // Outros campos iniciais, se houver
        });
        
        // 4. Sucesso e Navegação
        Alert.alert("Sucesso", "Usuário cadastrado! Prossiga com o endereço.");
        navigation.navigate('Address'); 

    } catch (error) {
        // Trata erros do Firebase Auth (ex: e-mail em uso, senha fraca) ou Firestore
        console.error("Erro no Cadastro:", error);
        Alert.alert("Erro no Cadastro", error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}> 
      <View style={styles.container}>
        {/* Container da logo no canto superior esquerdo (sem o texto) */}
        <View style={styles.logoContainer}>
          {/* Deixando este espaço para uma futura imagem, se desejar */}
        </View>

        {/* Container para os campos de entrada */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Usuário</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            value={user} 
            onChangeText={setUser}
          />

          <Text style={styles.inputLabel}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu telefone"
            keyboardType="phone-pad"
            value={phone} 
            onChangeText={setPhone}
          />
          
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu e-mail"
            keyboardType="email-address"
            value={email} 
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Confirmar email</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirme seu e-mail"
            keyboardType="email-address"
            value={confirmEmail} 
            onChangeText={setConfirmEmail}
          />

          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            secureTextEntry
            value={password} 
            onChangeText={setPassword}
          />
          
          <Text style={styles.inputLabel}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirme sua senha"
            secureTextEntry
            value={confirmPassword} 
            onChangeText={setConfirmPassword}
          />
        </View>
        
        {/* Botão de Continuar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleSignUp}
            disabled={loading} // Desabilita enquanto carrega
          >
            {loading ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <Text style={styles.continueButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Estilos
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20, 
  },
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
    justifyContent: 'center', // Para centralizar o ActivityIndicator
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