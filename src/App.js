import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importe suas telas
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import Address from './screens/AddressScreen';
import MainScreen from './screens/MainScreen';
import AddPointScreen from './screens/AddPointScreen';
import AdminScreen from './screens/AdminScreen'; // NOVO IMPORT

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Início' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Cadastro' }}
        />
        <Stack.Screen
          name="Address"
          component={Address}
          options={{ title: 'Endereço' }}
        />
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ title: 'ReciclAqui' }}
        />
        <Stack.Screen
          name="IndicarPonto" 
          component={AddPointScreen}
          options={{ title: 'Indicar Ponto de Coleta' }}
        />
        <Stack.Screen // NOVA ROTA
          name="Admin" 
          component={AdminScreen}
          options={{ title: 'Moderação de Pontos' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;