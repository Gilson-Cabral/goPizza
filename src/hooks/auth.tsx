import React, { 
  createContext, 
  useContext,
  useState, 
  useEffect,
  ReactNode 
} from 'react';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  isAdmin: boolean;
}

type AuthContextData = {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  isLogging: boolean;
  user: User | null;
}

type AuthProviderProps = {
  children: ReactNode;
}

// nome da coleção no async storage
const USER_COLLECTION = '@gopizza:users';

export const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  async function signIn(email: string, password: string) {
    if (!email || !password) {
      return Alert.alert('Login', 'Informe o e-mail e a senha.');
    }

    setIsLogging(true);

    auth()
      .signInWithEmailAndPassword(email, password)
      .then(account => {
      //console.log(account);
      firestore()
          .collection('users')
          .doc(account.user.uid)
          .get()
          .then(async (profile) => {
            const { name, isAdmin } = profile.data() as User;

            if (profile.exists) {
              const userData = {
                id: account.user.uid,
                name,
                isAdmin
              };

              // Mostra o usuário autenticado
              //console.log(userData);

              // armazena no async storage
              await AsyncStorage.setItem(USER_COLLECTION, JSON.stringify(userData));
              setUser(userData);
            }  
          }) 
          .catch(() => Alert.alert('Login', 'Não foi possível buscar os dados de perfil do usuário.')); 
    })
    .catch(error => {
      const { code } = error;

      if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        return Alert.alert('Login', 'E-mail e/ou senha inválida.');
      } else {
        return Alert.alert('Login', 'Não foi possível realizar o login.');
      }
    })
    .finally(() => setIsLogging(false));
  }

  // Função para carregar os dados do usuário quando ele voltar na aplicação
  async function loadUserStorageData(){
    setIsLogging(true);

    const storedUser = await AsyncStorage.getItem(USER_COLLECTION);

    if(storedUser) {
      const userData = JSON.parse(storedUser) as User;
      // Busca no stora as informações do usuário
      console.log(userData);
      setUser(userData);
    }

    setIsLogging(false);
  }

  // Sair da aplicação
  async function signOut() {
    await auth().signOut();
    // Deleta os dados do usuário
    await AsyncStorage.removeItem(USER_COLLECTION);
    // Seta o usuário como nulo
    setUser(null);
  }

  // Recuperar senha
  async function forgotPassword(email: string) {
    if(!email) {
      return Alert.alert('Redefinir senha', 'Informe o e-mail.');
    }

    auth()
    .sendPasswordResetEmail(email)
    .then(() => Alert.alert('Redefinir senha', 'Enviamos um link para o redefinir sua senha.'))
    .catch(() => Alert.alert('Redefiner senha', 'Não foi possível enviar o e-mail para redefinir sua senha.'))
  }

  // Chama a função que recupera os dados do usuário
  useEffect(() => {
    loadUserStorageData();
  },[]);

  return(
      <AuthContext.Provider value={{
        user,
        signIn,
        signOut,
        isLogging,
        forgotPassword
      }}>
          {children}
      </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth };