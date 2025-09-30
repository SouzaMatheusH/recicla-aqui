import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
// 1. Importa as funcionalidades do Firestore e Auth
// IMPORTANTE: 'collection' foi adicionado para a sintaxe correta.
import { doc, setDoc, collection } from 'firebase/firestore'; 
import { db, auth } from '../firebaseConfig'; 

const AddressScreen = ({ navigation }) => {
  // Estados para capturar os inputs do endereço
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false); 

  // Função para salvar os dados no Firestore e finalizar o cadastro
  const handleFinishRegistration = async () => {
    // Verifica se o usuário está logado
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erro", "Sessão expirada. Tente logar ou cadastrar novamente.");
      navigation.replace('Login'); 
      return;
    }

    if (!cep || !street || !number || !city || !state) {
      Alert.alert("Atenção", "Preencha todos os campos de endereço para continuar.");
      return;
    }

    setLoading(true);

    try {
      // CORREÇÃO: Usando collection(db, "users") para criar a referência da coleção.
      // doc() agora recebe a referência da coleção e o ID do documento (user.uid).
      await setDoc(doc(collection(db, "users"), user.uid), {
        cep: cep,
        street: street,
        number: number,
        city: city,
        state: state,
        email: user.email, 
        uid: user.uid,
      }, { merge: true }); 

      Alert.alert("Sucesso!", "Cadastro concluído. Bem-vindo(a) ao ReciclAqui!");
      
      // Navegação: Redireciona para a tela principal, substituindo o histórico
      navigation.replace('Main'); 

    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      Alert.alert("Erro", `Falha ao finalizar o cadastro. Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            value={cep}
            onChangeText={setCep}
            maxLength={9}
          />

          <Text style={styles.inputLabel}>Rua</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Rua das Flores"
            value={street}
            onChangeText={setStreet}
          />
          
          <Text style={styles.inputLabel}>Numero</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 123"
            keyboardType="numeric"
            value={number}
            onChangeText={setNumber}
          />

          <Text style={styles.inputLabel}>Cidade</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: São Paulo"
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.inputLabel}>Estado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: SP"
            value={state}
            onChangeText={setState}
          />
        </View>
        
        {/* Botão de Concluir */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishRegistration}
            disabled={loading}
          >
            <Text style={styles.finishButtonText}>
              {loading ? 'Salvando...' : 'Concluir'}
            </Text>
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