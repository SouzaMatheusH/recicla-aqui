import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';

// Importações Essenciais para o Mapa e Localização
import MapView, { Marker, Polyline } from 'react-native-maps'; 
import * as Location from 'expo-location'; 
// Importa Constants para acessar as chaves injetadas do ambiente
import Constants from 'expo-constants'; 

// Importações do Firebase
import { db, auth } from '../firebaseConfig'; 
import { collection, onSnapshot, doc, getDoc, serverTimestamp } from 'firebase/firestore'; 

// --- FUNÇÕES AUXILIARES ---

// 📐 NOVO: Função para calcular a distância Haversine em Km
const haversineDistance = (coords1, coords2) => {
    // Raio da Terra em quilômetros
    const R = 6371; 
    
    // Converte graus para radianos
    const toRad = (x) => (x * Math.PI) / 180;
    
    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Distância em km, arredondada para 1 casa decimal
    const distance = R * c; 
    
    return distance.toFixed(1);
};

// Função utilitária para decodificar a polilinha (Do Google Directions API)
const decodePolyline = (t) => { 
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
          b = t.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
          b = t.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      coordinates.push({ latitude: (lat / 1e5), longitude: (lng / 1e5) });
  }
  return coordinates;
};

// 🔑 FUNÇÃO DE ACESSO RESILIENTE: Não deve ser executada no top-level.
const getMapsApiKey = () => {
    // Tenta expoConfig (estrutura moderna) e faz fallback para manifest (compatibilidade)
    const extra = Constants.expoConfig?.extra || Constants.manifest?.extra; 
    return extra?.GOOGLE_MAPS_API_KEY || ''; 
};


const MainScreen = ({ navigation }) => {
  const [initialRegion, setInitialRegion] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState([]); 
  const [userLocation, setUserLocation] = useState(null); 
  const [selectedPoint, setSelectedPoint] = useState(null); 
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); 

  // --- FUNÇÕES DE LÓGICA DE MAPA ---

  // Checa se o usuário logado é administrador
  const checkAdminStatus = async (user) => {
    if (!user) return false;
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        // A chave 'isAdmin' deve estar presente e ser true no Firestore
        return userDoc.exists() && userDoc.data().isAdmin === true;
    } catch (error) {
        console.error("Erro ao checar status de admin:", error);
        return false;
    }
  };

  const calculatePointsCenter = (pointsArray) => {
    if (pointsArray.length === 0) {
        return { latitude: -23.5505, longitude: -46.6333 }; // Default São Paulo
    }
    const avgLat = pointsArray.reduce((sum, p) => sum + p.latitude, 0) / pointsArray.length;
    const avgLon = pointsArray.reduce((sum, p) => sum + p.longitude, 0) / pointsArray.length;
    return { latitude: avgLat, longitude: avgLon };
  };

  const getLocationRegion = async () => {
    let region = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 };
    let locationCoords = null;
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        locationCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        region.latitude = locationCoords.latitude;
        region.longitude = locationCoords.longitude;
      } else {
        console.warn('Permissão de localização negada. Usando fallback.');
      }
    } catch (error) {
      console.error("Erro ao obter localização:", error);
    } 
    
    setUserLocation(locationCoords);
    return region;
  };
  
  const fetchPoints = (initialCoordinates) => {
    const pointsRef = collection(db, 'points'); 
    
    const unsubscribe = onSnapshot(pointsRef, (snapshot) => {
      const fetchedPoints = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            fetchedPoints.push({ id: doc.id, ...data });
        }
      });
      
      setPoints(fetchedPoints);
      
      let finalRegion = initialCoordinates;
      if (!initialCoordinates.latitude && fetchedPoints.length > 0) {
        const center = calculatePointsCenter(fetchedPoints);
        finalRegion = {
            ...initialCoordinates,
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
        };
      }
      
      setInitialRegion(finalRegion);
      setLoading(false); 
      
    }, (error) => {
      console.error("Erro ao carregar pontos do Firestore:", error);
      Alert.alert("Erro", "Falha ao carregar pontos de descarte do servidor.");
      setLoading(false); 
    });
    
    return unsubscribe;
  };

  useEffect(() => {
    const initializeMapAndPoints = async () => {
        // Checa a autenticação para permissão de Admin
        const user = auth.currentUser;
        if (user) {
            const admin = await checkAdminStatus(user);
            setIsAdmin(admin); // Define o status de admin
        }

        const userRegion = await getLocationRegion();
        const unsubscribe = fetchPoints(userRegion); 
        return unsubscribe;
    };
    
    const cleanup = initializeMapAndPoints();
    return () => {
        if (cleanup) cleanup.then(u => u()).catch(() => {});
    };
  }, []); 


  // --- FUNÇÕES DE ROTA E NAVEGAÇÃO ---

  const getRoute = async (origin, destination) => {
    // CHAVE DE API OBTIDA AQUI (dentro da função), EVITANDO CRASH NO BOOT
    const GOOGLE_MAPS_API_KEY = getMapsApiKey(); 

    // Verifica se a chave de API foi carregada (retorna undefined se não houver)
    if (!GOOGLE_MAPS_API_KEY) {
        Alert.alert("Erro de API", "Chave do Google Maps não carregada. Verifique .env e app.config.js.");
        return null;
    }

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    // A chave é usada aqui na URL, lida da constante que está sendo populada de forma segura
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.status === "OK" && json.routes && json.routes.length > 0) {
            const encodedPolyline = json.routes[0].overview_polyline.points;
            return decodePolyline(encodedPolyline);
        } else if (json.status === "REQUEST_DENIED") {
            // Este alerta aponta para o problema de permissão no Google Cloud.
            Alert.alert("Erro de API", `A requisição foi negada. Verifique suas permissões no Google Cloud.`);
            return null;
        } else {
             Alert.alert("Rota Não Encontrada", "Não foi possível traçar uma rota de direção entre os dois pontos.");
             return null;
        }

    } catch (error) {
        console.error("Erro ao buscar rota:", error);
        return null;
    }
  };

  const handleSelectPoint = async (point) => {
    if (!userLocation) {
        Alert.alert("Localização Necessária", "Conceda as permissões para traçar rotas.");
        return;
    }
    
    setRouteCoordinates([]);
    setSelectedPoint(point);
    
    const routeCoords = await getRoute(userLocation, point);
    
    if (routeCoords && routeCoords.length > 0) {
        setRouteCoordinates(routeCoords);
        
        // Ajusta o zoom do mapa para a rota
        const latitudes = routeCoords.map(coord => coord.latitude);
        const longitudes = routeCoordinates.map(coord => coord.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        setInitialRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2,
            latitudeDelta: (maxLat - minLat) * 1.5,
            longitudeDelta: (maxLon - minLon) * 1.5,
        });
    } else {
        setRouteCoordinates([]);
        // Fallback: centraliza entre origem e destino
        setInitialRegion({
            latitude: (userLocation.latitude + point.latitude) / 2,
            longitude: (userLocation.longitude + point.longitude) / 2,
            latitudeDelta: Math.abs(userLocation.latitude - point.latitude) * 1.5,
            longitudeDelta: Math.abs(userLocation.longitude - point.longitude) * 1.5,
        });
    }
  };


  const handleStartNavigation = () => {
    if (!selectedPoint || !userLocation) {
        Alert.alert("Erro", "Selecione um ponto e garanta que sua localização está disponível.");
        return;
    }
    
    const destinationLat = selectedPoint.latitude;
    const destinationLon = selectedPoint.longitude;
    const originLat = userLocation.latitude;
    const originLon = userLocation.longitude;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destinationLat},${destinationLon}&travelmode=driving`;
    
    Linking.openURL(url).catch(err => {
      console.error("Erro ao tentar abrir o Google Maps:", err);
      Alert.alert("Erro", "Não foi possível abrir o aplicativo de mapas.");
    });
  };

  const handleIndicarPonto = () => {
    navigation.navigate('IndicarPonto');
  };

  const handleAdmin = () => {
    navigation.navigate('Admin');
  };

  // --- COMPONENTES DE RENDERIZAÇÃO ---

  if (loading || !initialRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E1E1E" />
        <Text style={styles.loadingText}>Carregando mapa e localização...</Text>
      </View>
    );
  }

  // Componente de item da lista
  const renderItem = ({ item }) => {
    // 1. Calcula a distância (usa as coordenadas do item e do usuário)
    const distance = userLocation 
      ? haversineDistance(userLocation, { latitude: item.latitude, longitude: item.longitude })
      : null;
    
    // 2. Define o texto de exibição
    const distanceText = distance 
      ? `${distance} km` 
      : 'Localização Desconhecida';

    const isItemSelected = selectedPoint && selectedPoint.id === item.id;

    return (
      <TouchableOpacity 
          style={[
              styles.listItem, 
              isItemSelected && styles.listItemActive 
          ]}
          onPress={() => handleSelectPoint(item)} 
          disabled={!userLocation}
      >
        <View>
          <Text style={styles.pointName}>{item.name || "Ponto de Coleta"}</Text>
          <Text style={styles.pointAddress}>{item.address || "Endereço não informado"}</Text>
          
          {item.wasteTypes && Array.isArray(item.wasteTypes) && (
             <Text style={styles.wasteTypesText}>Tipos: {item.wasteTypes.join(', ')}</Text>
          )}

          {/* 📍 NOVO: Indicador de Distância */}
          <Text style={styles.distanceIndicator}>Distância: {distanceText}</Text>
          
          <Text style={styles.pointDistance}>Horário: {item.workingHours || "Não informado"}</Text>
          
          {/* Renderiza o botão de INICIAR NAVEGAÇÃO APENAS se este for o item selecionado */}
          {isItemSelected && (
              <TouchableOpacity 
                  style={styles.startNavigationButton} 
                  onPress={handleStartNavigation}
              >
                  <Text style={styles.startNavigationButtonText}>Iniciar Navegação no Maps</Text>
              </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* 1. MAPA (1/3 da tela) */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={initialRegion} 
          showsUserLocation={true}
          loadingEnabled={true}
        >
            {/* CORREÇÃO APLICADA: Renderiza apenas o ponto selecionado ou todos os pontos */}
            {selectedPoint
                ? // Se houver um ponto selecionado, renderiza APENAS ele
                  <Marker
                    key={selectedPoint.id}
                    coordinate={{ 
                        latitude: selectedPoint.latitude, 
                        longitude: selectedPoint.longitude 
                    }}
                    title={selectedPoint.name}
                    description={selectedPoint.address}
                    pinColor={'#FF0000'} // Vermelho para destacar
                  />
                : // Caso contrário, renderiza todos os pontos
                points.map(point => (
                    <Marker
                        key={point.id}
                        coordinate={{ 
                            latitude: point.latitude, 
                            longitude: point.longitude 
                        }}
                        title={point.name}
                        description={point.address}
                        pinColor={'#00A86B'} // Cor padrão
                    />
                ))
            }
            
            {/* Desenha a ROTA (Polyline) se houver coordenadas */}
            {routeCoordinates && routeCoordinates.length > 0 && (
                <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#007AFF" // Azul
                    strokeWidth={4}
                />
            )}
        </MapView>
        {/* Mensagem informativa no mapa */}
        <View style={styles.mapInfoBox}>
            <Text style={styles.infoText}>
                {selectedPoint 
                    ? `Ponto Selecionado: ${selectedPoint.name}` 
                    : "Toque em um ponto da lista para traçar a rota"
                }
            </Text>
        </View>
      </View>
      
      {/* 2. LISTA DE LOCALIZAÇÕES (2/3 da tela) */}
      <View style={styles.listContainer}>
        {/* TÍTULO CORRIGIDO: Sempre mostra a contagem total de pontos */}
        <Text style={styles.listTitle}>Pontos de Coleta Próximos ({points.length} encontrados)</Text>
        
        <View style={styles.buttonRow}>
            {/* BOTÃO ADMIN (Só aparece se isAdmin for true) */}
            {isAdmin && (
                <TouchableOpacity style={styles.adminButton} onPress={handleAdmin}>
                    <Text style={styles.adminButtonText}>Fila de Moderação</Text>
                </TouchableOpacity>
            )}

            {/* LÓGICA DO BOTÃO: Limpar Seleção vs. Indicar Ponto */}
            {selectedPoint ? (
                 <TouchableOpacity 
                    style={[styles.indicateButton, styles.clearSelectionButton]} 
                    onPress={() => {
                        setSelectedPoint(null); // Limpa a seleção
                        setRouteCoordinates([]); // Remove a rota
                    }}
                >
                    <Text style={styles.indicateButtonText}>Limpar Seleção</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.indicateButton} onPress={handleIndicarPonto}>
                    <Text style={styles.indicateButtonText}>Indique um Ponto de Coleta</Text>
                </TouchableOpacity>
            )}
        </View>
        
        {
            !userLocation && (
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ Permissão de localização não concedida. Não é possível traçar rotas. Recarregue o app para tentar novamente.</Text>
                </View>
            )
        }

        {/* A lista (FlatList) SEMPRE renderiza a lista COMPLETA de pontos */}
        <FlatList
          data={points} 
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={() => (
            <Text style={styles.emptyListText}>Nenhum ponto de coleta encontrado.</Text>
          )}
        />
      </View>
    </View>
  );
};

// ---

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#fff',
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
  
  // ESTILOS PARA O MAPA (1/3 da tela)
  mapContainer: {
    flex: 1.2, 
    position: 'relative',
    backgroundColor: '#ccc',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapInfoBox: {
    position: 'absolute',
    top: 5,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 10, 
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  
  // ESTILOS PARA A LISTA (2/3 da tela)
  listContainer: {
    flex: 2.8, 
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: '#f9f9f9',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5, 
    color: '#1E1E1E',
  },
  
  // ESTILOS PARA LINHA DE BOTÕES
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 15,
    marginTop: 5,
    justifyContent: 'space-between',
    gap: 10,
  },
  adminButton: {
    flex: 1,
    backgroundColor: '#F7C300', // Amarelo para admin/moderação
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#1E1E1E',
    fontSize: 14,
    fontWeight: 'bold',
  },
  indicateButton: {
    flex: 1,
    backgroundColor: '#1E1E1E', 
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  indicateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearSelectionButton: { // Novo estilo para diferenciar o botão de limpar
    backgroundColor: '#666',
  },
  warningBox: {
      backgroundColor: '#FFFBEA', 
      padding: 10,
      borderRadius: 5,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#F7C300',
  },
  warningText: {
      fontSize: 12,
      color: '#A0522D',
      fontWeight: '600',
  },
  listItem: {
    padding: 15,
    borderWidth: 1, 
    borderColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemActive: { 
      borderColor: '#007AFF',
      borderWidth: 2,
  },
  pointName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  pointAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  wasteTypesText: {
    fontSize: 12,
    color: '#007AFF', 
    fontWeight: '600',
    marginTop: 5,
  },
  // 📍 NOVO ESTILO para o indicador de Distância
  distanceIndicator: { 
    fontSize: 14,
    color: '#1E1E1E',
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5, // Adiciona um pequeno espaço
  },
  pointDistance: { 
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  startNavigationButton: {
      marginTop: 10,
      backgroundColor: '#007AFF', 
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
      alignSelf: 'stretch', 
      alignItems: 'center',
  },
  startNavigationButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#999',
  }
});

export default MainScreen;