import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AdminScreen = ({ navigation }) => {
  const [pendingPoints, setPendingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // 1. Verifica Permissão de Admin e Carrega a Fila
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Acesso Negado", "Você não está logado.");
      navigation.replace('Login');
      return;
    }

    const checkAdminAndFetch = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        const userIsAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
        setIsAdmin(userIsAdmin);

        if (!userIsAdmin) {
          Alert.alert("Acesso Não Autorizado", "Esta tela é restrita a administradores.");
          navigation.goBack();
          return;
        }
        
        // Se for admin, configura o listener para a fila de pendentes
        const pointsRef = collection(db, 'pending_points');
        const unsubscribe = onSnapshot(pointsRef, (snapshot) => {
          const fetchedPoints = [];
          snapshot.forEach((doc) => {
            fetchedPoints.push({ id: doc.id, ...doc.data() });
          });
          setPendingPoints(fetchedPoints);
          setLoading(false);
        }, (error) => {
          console.error("Erro ao carregar pontos pendentes:", error);
          Alert.alert("Erro", "Falha ao carregar a fila de moderação.");
          setLoading(false);
        });

        return unsubscribe;

      } catch (error) {
        console.error("Erro na inicialização da AdminScreen:", error);
        Alert.alert("Erro", "Falha ao verificar as permissões.");
        setLoading(false);
      }
    };
    
    // O useEffect só vai retornar a função de limpeza se a verificação inicial não falhar
    const cleanup = checkAdminAndFetch();
    return () => { if (cleanup) cleanup.then(f => f()).catch(() => {}); };
  }, []);

  // 2. Função de Moderação (Aprovação Manual)
  const handleApprove = async (point) => {
    setProcessingId(point.id);

    try {
      // 2.1. Monta o objeto para a coleção principal (points)
      // Remove o ID do documento da fila pendente, pois o Firestore cria um novo ID
      const { id, status, ...dataToApprove } = point; 

      const activePointData = {
          ...dataToApprove,
          approvedAt: serverTimestamp(), 
      };

      // 2.2. MOVIMENTO 1: Adiciona o documento à coleção de pontos ativos ('points')
      await addDoc(collection(db, "points"), activePointData);

      // 2.3. MOVIMENTO 2: Exclui o documento da fila de pendentes ('pending_points')
      const pendingDocRef = doc(db, 'pending_points', id);
      await deleteDoc(pendingDocRef);

      Alert.alert("Sucesso", `Ponto de coleta "${point.name}" aprovado e adicionado ao mapa!`);

    } catch (error) {
      console.error("Erro ao aprovar ponto:", error);
      Alert.alert("Erro", `Falha ao aprovar o ponto: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Função de Moderação (Rejeição Manual)
  const handleReject = async (pointId) => {
    Alert.alert(
        "Confirmação",
        "Tem certeza que deseja rejeitar e remover este ponto da fila?",
        [
            {
                text: "Cancelar",
                style: "cancel"
            },
            { 
                text: "Rejeitar", 
                style: "destructive", 
                onPress: async () => {
                    setProcessingId(pointId);
                    try {
                        await deleteDoc(doc(db, 'pending_points', pointId));
                        Alert.alert("Sucesso", "Ponto rejeitado e removido da fila.");
                    } catch (error) {
                        console.error("Erro ao rejeitar ponto:", error);
                        Alert.alert("Erro", `Falha ao rejeitar o ponto: ${error.message}`);
                    } finally {
                        setProcessingId(null);
                    }
                }
            }
        ]
    );
  };

  // 4. Componente de Item da Lista (Rendering)
  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.pointName}>{item.name}</Text>
      <Text style={styles.detailText}>Endereço: {item.address}</Text>
      <Text style={styles.detailText}>Horário: {item.workingHours}</Text>
      <Text style={styles.detailText}>Tipos: {item.wasteTypes ? item.wasteTypes.join(', ') : 'N/A'}</Text>
      <Text style={styles.contributorText}>Sugerido por: {item.contributorEmail}</Text>
      <Text style={styles.contributorText}>Coordenadas: {item.latitude}, {item.longitude}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApprove(item)}
          disabled={processingId === item.id || loading}
        >
          {processingId === item.id ? (
              <ActivityIndicator color="#fff" />
          ) : (
              <Text style={styles.approveButtonText}>Aprovar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item.id)}
          disabled={processingId === item.id || loading}
        >
          <Text style={styles.rejectButtonText}>Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E1E1E" />
      </View>
    );
  }

  // A renderização só acontece se isAdmin for true, caso contrário, o checkAdminAndFetch
  // já teria redirecionado ou exibido um alerta
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fila de Moderação ({pendingPoints.length} pendente{pendingPoints.length !== 1 ? 's' : ''})</Text>
      
      <FlatList
        data={pendingPoints}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
            <Text style={styles.emptyListText}>🎉 Nenhuma sugestão pendente!</Text>
        )}
      />
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    color: '#1E1E1E',
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#F7C300', // Amarelo para pendente
    elevation: 2,
  },
  pointName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  contributorText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#00A86B', // Verde
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 5,
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#E53935', // Vermelho
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 5,
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  }
});

export default AdminScreen;