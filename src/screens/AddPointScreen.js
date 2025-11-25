import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'; 
import * as Location from 'expo-location'; 
import Constants from 'expo-constants'; // Importa Constants

// 🔑 FUNÇÃO DE ACESSO RESILIENTE: O acesso aos extras é feito de forma segura.
const getMapsApiKey = () => {
  // Tenta Constants.expoConfig.extra (estrutura moderna) e faz fallback para 
  // Constants.manifest.extra (compatibilidade), garantindo que o app não quebre 
  // em diferentes ambientes Expo.
  const extra = Constants.expoConfig?.extra || Constants.manifest?.extra; 
  return extra?.GOOGLE_MAPS_API_KEY || ''; 
};

// Tipos de resíduos que o ponto pode aceitar (com chave e label)
const WASTE_TYPES = [
    { key: 'battery', label: 'Pilhas/Baterias' },
    { key: 'metal', label: 'Metal' },
    { key: 'plastic', label: 'Plástico' },
    { key: 'glass', label: 'Vidro' },
    { key: 'paper', label: 'Papel/Papelão' },
];

const AddPointScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [selectedWasteTypes, setSelectedWasteTypes] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [coords, setCoords] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoading, setUserLoading] = useState(true);


  // --- Efeito para checar o status do Admin ---
  useEffect(() => {
    const checkAdminStatus = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    setIsAdmin(userDoc.data().isAdmin === true); 
                }
            } catch (error) {
                console.error("Erro ao checar status de admin:", error);
            }
        }
        setUserLoading(false);
    };
    checkAdminStatus();
  }, []);
  
  // --- Lógica de Geocodificação (USANDO CHAVE DE FORMA RESILIENTE) ---
  const geocodeAddress = async (addr) => {
    // 🚨 Acesso à chave de API MOVIDO para dentro do escopo da função
    const apiKey = getMapsApiKey(); 
    
    if (!apiKey) {
        Alert.alert("Erro de API", "Chave do Google Maps não carregada. Verifique seu .env e app.json.");
        return null;
    }
    
    const encodedAddress = encodeURIComponent(addr);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=br&key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const json = await response.json();
        
        console.log("Resposta da Geocodificação (Status):", json.status);
        if (json.error_message) {
             console.error("Mensagem de Erro da API:", json.error_message);
        }
        
        if (json.status === "OK" && json.results.length > 0) {
            const location = json.results[0].geometry.location;
            return { 
                latitude: location.lat, 
                longitude: location.lng 
            };
        } else if (json.status === "REQUEST_DENIED") {
             // Tratamento específico para REQUEST_DENIED
             Alert.alert("Erro de Chave / API", "A requisição de Geocodificação foi negada. Verifique as configurações de faturamento e restrições da chave.");
             return null;
        } else {
            Alert.alert(
                "Endereço Não Encontrado", 
                "Não conseguimos localizar este endereço. Por favor, seja mais específico."
            );
            return null;
        }
    } catch (error) {
        console.error("Erro na requisição de Geocodificação (Rede):", error);
        Alert.alert("Erro de Rede", "Falha ao comunicar com a API de Mapas.");
        return null;
    }
  };


  // --- Lógica para obter localização atual (via GPS) ---
  const handleGetLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permissão Negada", "Conceda acesso à localização para preenchimento automático.");
        setUseCurrentLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      setCoords({ 
          latitude: location.coords.latitude, 
          longitude: location.coords.longitude 
      });
      setUseCurrentLocation(true);
      Alert.alert("Sucesso", "Localização atual obtida! Finalize o cadastro.");
      
    } catch (error) {
      console.error("Erro ao obter localização GPS:", error);
      Alert.alert("Erro de Localização", "Não foi possível obter sua localização. Tente indicar o endereço.");
      setUseCurrentLocation(false);
    } finally {
      setLoading(false);
    }
  };


  // --- Lógica de Submissão Principal ---
  const handleAddPoint = async () => {
    const user = auth.currentUser;
    if (!user) {
        Alert.alert("Erro", "Você precisa estar logado para indicar um ponto.");
        navigation.navigate('Login'); 
        return;
    }

    if (!name || !address || !workingHours) {
      Alert.alert("Atenção", "Preencha o Nome, Endereço e Horário de Funcionamento.");
      return;
    }
    
    const finalWasteTypes = Object.keys(selectedWasteTypes).filter(key => selectedWasteTypes[key]);

    if (finalWasteTypes.length === 0) {
        Alert.alert("Atenção", "Selecione pelo menos um tipo de resíduo aceito.");
        return;
    }

    setLoading(true);

    let finalCoords = coords;

    // Se o usuário NÃO usou a localização atual, tentamos a Geocodificação
    if (!useCurrentLocation) {
        finalCoords = await geocodeAddress(address);
    }
    
    if (!finalCoords) {
        setLoading(false);
        return; 
    }

    try {
      const pointData = {
        name: name,
        address: address,
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
        wasteTypes: finalWasteTypes,
        workingHours: workingHours,
        contributorId: user.uid, 
        contributorEmail: user.email,
        createdAt: serverTimestamp(),
      };
      
      // CHECAGEM DE ADMIN: Se for admin, salva direto. Se não, salva na fila de moderação.
      if (isAdmin) {
          await addDoc(collection(db, "points"), pointData);
          Alert.alert("Sucesso (Admin)", "Ponto adicionado diretamente ao mapa.");
      } else {
          await addDoc(collection(db, "pending_points"), {
              ...pointData,
              status: 'pending',
          });
          Alert.alert(
              "Sugestão Recebida", 
              "Sua sugestão foi salva para revisão pendente. O administrador irá avaliá-la."
          );
      }
      
      navigation.goBack(); 

    } catch (error) {
      console.error("Erro ao processar ponto:", error);
      Alert.alert("Erro", `Falha ao processar o ponto. Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Componente de Item de Tipo de Resíduo ---
  const renderWasteTypeSwitch = ({ key, label }) => (
    <View key={key} style={styles.wasteTypeItem}>
      <Text style={styles.wasteTypeLabel}>{label}</Text>
      <Switch
        value={selectedWasteTypes[key] || false}
        onValueChange={value => setSelectedWasteTypes(prev => ({ ...prev, [key]: value }))}
        trackColor={{ false: "#ccc", true: "#00A86B" }}
        thumbColor={selectedWasteTypes[key] ? "#00A86B" : "#f4f3f4"}
      />
    </View>
  );

  if (userLoading) {
      return (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E1E1E" />
              <Text style={styles.loadingText}>Verificando permissões...</Text>
          </View>
      );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Indique um Ponto de Coleta</Text>
        <Text style={styles.subtitle}>
            {isAdmin ? 
                "Modo Admin: O ponto será adicionado diretamente ao mapa." :
                "Modo Usuário: Sua sugestão será enviada para moderação."
            }
        </Text>

        <Text style={styles.inputLabel}>Nome do Local *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Farmácia X, Mercado Central..."
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Endereço Completo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, Número, Bairro, Cidade, CEP"
          value={address}
          onChangeText={setAddress}
          editable={!useCurrentLocation} 
        />
        
        {useCurrentLocation && (
            <Text style={styles.locationMessage}>
                Coordenadas obtidas via GPS.
            </Text>
        )}


        <Text style={styles.inputLabel}>Horário de Funcionamento *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Seg a Sex, 9h às 18h"
          value={workingHours}
          onChangeText={setWorkingHours}
        />

        {/* --- Seção de Localização (Agora opcional) --- */}
        <Text style={styles.sectionTitle}>Opção: Usar Localização Atual (GPS)</Text>
        <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation} disabled={loading}>
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.locationButtonText}>
                    {useCurrentLocation ? 'Localização GPS Obtida!' : 'Usar Minha Localização Agora'}
                </Text>
            )}
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
            Se você não usar o GPS, a Latitude e Longitude serão buscadas automaticamente pelo endereço acima.
        </Text>

        {/* --- Seção de Tipos de Resíduo --- */}
        <Text style={styles.sectionTitle}>Tipos de Resíduo Aceitos *</Text>
        <View style={styles.wasteTypesContainer}>
            {WASTE_TYPES.map(renderWasteTypeSwitch)}
        </View>
        
        {/* Botão de Concluir */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPoint}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Adicionar Ponto</Text>
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
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1E1E1E',
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#fff',
  },
  locationButton: {
    backgroundColor: '#00A86B', 
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  wasteTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 5,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  wasteTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%', 
    paddingVertical: 8,
  },
  wasteTypeLabel: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  addButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E', 
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationMessage: {
      color: '#00A86B',
      fontSize: 12,
      marginBottom: 10,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default AddPointScreen;