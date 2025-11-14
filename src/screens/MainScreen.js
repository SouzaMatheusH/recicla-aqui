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
} from 'react-native';

// Importações Essenciais para o Mapa e Localização
import MapView, { Marker, Polyline } from 'react-native-maps'; 
import * as Location from 'expo-location'; 

// Importações do Firebase
import { db } from '../firebaseConfig'; 
import { collection, onSnapshot } from 'firebase/firestore'; 

// ⚠️ AQUI ESTÁ O SEGREDO ⚠️
// Você deve substituir este placeholder pela sua CHAVE DE API REAL do Google Maps
// com as APIs 'Directions' e 'Maps JavaScript' ativadas e cobrança configurada.
const GOOGLE_MAPS_API_KEY = "AIzaSyDJhg6HK-fVaB1v_QJa27jQvWgjSAqJ8Og";

// Função utilitária para decodificar a polilinha (Necessária para a API do Google)
const decodePolyline = (t) => {
    let index = 0,
        lat = 0,
        lng = 0,
        coordinates = [];

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


const MainScreen = () => {
  const [initialRegion, setInitialRegion] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState([]); 
  const [userLocation, setUserLocation] = useState(null); 
  const [selectedPoint, setSelectedPoint] = useState(null); 
  // Alterado para array vazio para melhor manipulação
  const [routeCoordinates, setRouteCoordinates] = useState([]);


  // --- FUNÇÕES DE LÓGICA DE MAPA E DADOS (Mantidas as mesmas) ---

  const calculatePointsCenter = (pointsArray) => {
    if (pointsArray.length === 0) {
        return { latitude: -23.5505, longitude: -46.6333 };
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
        locationCoords = { 
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude 
        };
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
            fetchedPoints.push({
                id: doc.id,
                ...data,
            });
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
        const userRegion = await getLocationRegion();
        const unsubscribe = fetchPoints(userRegion);
        return unsubscribe;
    };
    
    const unsubscribe = initializeMapAndPoints();
    
    return () => {
        if (unsubscribe) unsubscribe.then(u => u()).catch(() => {});
    };
  }, []); 

  // --- FUNÇÃO DE INTERAÇÃO (Traçar Rota) ---

  // NOVO: Função para obter a rota real via API do Google
  const getRoute = async (origin, destination) => {
    // ⚠️ ALERTA: Verifica se o placeholder foi substituído
    if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
        Alert.alert("Erro de API", "Por favor, substitua 'YOUR_GOOGLE_MAPS_API_KEY_HERE' pela sua chave real do Google Maps para que a rota funcione.");
        return null;
    }

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    // Constrói a URL da API de Rotas do Google
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const json = await response.json();
        
        // Log de depuração crucial
        console.log("Resposta da API de Rotas (Status):", json.status);
        
        if (json.status === "OK" && json.routes && json.routes.length > 0) {
            // A polilinha é retornada codificada. Usamos a função auxiliar para decodificar.
            const encodedPolyline = json.routes[0].overview_polyline.points;
            return decodePolyline(encodedPolyline);
        } else if (json.status === "ZERO_RESULTS" || json.status === "NOT_FOUND") {
            Alert.alert("Rota Não Encontrada", "Não foi possível traçar uma rota de direção entre os dois pontos.");
            return null;
        } else if (json.status === "REQUEST_DENIED" || json.status === "INVALID_REQUEST") {
            // Este é o erro mais comum relacionado à chave de API ou APIs não habilitadas
            Alert.alert("Erro de API", `A requisição foi negada. Verifique se sua CHAVE de API é válida e se a 'Directions API' está ativada.`);
            console.error("Erro detalhado da API:", json.error_message);
            return null;
        } else {
             Alert.alert("Erro Desconhecido", "Ocorreu um erro ao processar a rota. Verifique o console para mais detalhes.");
             return null;
        }

    } catch (error) {
        console.error("Erro ao buscar rota da API (Network ou CORS):", error);
        Alert.alert("Erro de Rede", "Falha na conexão ao buscar a rota. Verifique sua chave de API e conexão.");
        return null;
    }
  };

  // NOVO: Função para selecionar o ponto e TRAÇAR a rota REAL no mapa
  const handleSelectPoint = async (point) => {
    if (!userLocation) {
        Alert.alert(
            "Localização Necessária", 
            "Não foi possível obter sua localização atual. Conceda as permissões para traçar rotas."
        );
        return;
    }
    
    // 1. Limpa a rota anterior e define o ponto selecionado
    setRouteCoordinates([]);
    setSelectedPoint(point);
    
    // 2. Busca a rota real (async)
    const routeCoords = await getRoute(userLocation, point);
    
    if (routeCoords && routeCoords.length > 0) {
        setRouteCoordinates(routeCoords);
        
        // 3. Ajusta o zoom do mapa para a rota
        const latitudes = routeCoords.map(coord => coord.latitude);
        const longitudes = routeCoords.map(coord => coord.longitude);

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
        // Fallback: Se a rota falhou, centraliza entre origem e destino
        setRouteCoordinates([]); // Garante que a linha reta de fallback não é desenhada
        
        setInitialRegion({
            latitude: (userLocation.latitude + point.latitude) / 2,
            longitude: (userLocation.longitude + point.longitude) / 2,
            latitudeDelta: Math.abs(userLocation.latitude - point.latitude) * 1.5,
            longitudeDelta: Math.abs(userLocation.longitude - point.longitude) * 1.5,
        });
    }
  };


  // Função chamada para iniciar a navegação (abre app externo)
  const handleStartNavigation = () => {
    if (!selectedPoint || !userLocation) {
        Alert.alert("Erro", "Selecione um ponto e garanta que sua localização está disponível.");
        return;
    }
    
    // URL do Google Maps com a origem e o destino para navegação real
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
  const renderItem = ({ item }) => (
    <TouchableOpacity 
        style={[
            styles.listItem, 
            selectedPoint && selectedPoint.id === item.id && styles.listItemActive 
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
        <Text style={styles.pointDistance}>Horário: {item.workingHours || "Não informado"}</Text>
        
        {/* Renderiza o botão de INICIAR NAVEGAÇÃO APENAS se este for o item selecionado */}
        {selectedPoint && selectedPoint.id === item.id && (
            <TouchableOpacity 
                style={styles.startNavigationButton} 
                onPress={handleStartNavigation}
            >
                <Text style={styles.startNavigationButtonText}>Iniciar Navegação no Maps</Text>
            </TouchableOpacity>
        )}

        {/* REMOVIDO: A seção que exibia o texto "Toque para Traçar Rota" nos cards não selecionados */}
      </View>
    </TouchableOpacity>
  );


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
            {/* Mapeia os pontos de coleta */}
            {points.map(point => (
                <Marker
                    key={point.id}
                    coordinate={{ 
                        latitude: point.latitude, 
                        longitude: point.longitude 
                    }}
                    title={point.name}
                    description={point.address}
                    pinColor={selectedPoint && selectedPoint.id === point.id ? '#FF0000' : '#00A86B'} // Vermelho se selecionado
                />
            ))}

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
            <Text style={styles.infoText}>Toque em um ponto da lista para traçar a rota</Text>
        </View>
      </View>
      
      {/* 2. LISTA DE LOCALIZAÇÕES (2/3 da tela) */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Pontos de Coleta Próximos ({points.length} encontrados)</Text>
        {
            !userLocation && (
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ Permissão de localização não concedida. Não é possível traçar rotas.</Text>
                </View>
            )
        }
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
    marginBottom: 10,
    color: '#1E1E1E',
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
  pointDistance: { 
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  // Estilo para o botão que APENAS informa que a rota será traçada no mapa
  directionsButton: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 15,
      alignSelf: 'flex-start',
  },
  directionsButtonText: {
      color: '#666',
      fontSize: 14,
      fontStyle: 'italic',
  },
  // Novo estilo para o botão que INICIA a navegação no app externo
  startNavigationButton: {
      marginTop: 10,
      backgroundColor: '#007AFF', // Azul
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
      alignSelf: 'stretch', // Ocupa a largura total do card
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