import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Alert, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import happyEmoji from '@assets/happy.png';

import { useAuth } from '@hooks/auth';
import { Search } from '@components/Search';
import { ProductCard, ProductProps } from '@components/ProductCard';

import { 
    Container, 
    Header,
    GreetingEmoji,
    GreetingText, 
    Greeting,
    Title,
    MenuHeader,
    MenuItemsNumber,
    NewProductButton
} from './styles';

export function Home() {
    // Armazena no estado as pizzas
    const [pizzas, setPizzas] = useState<ProductProps[]>([]);
    // Armazena a busca no estado
    const [search, setSearch] = useState('');

    const { COLORS } = useTheme();

    // Importação para usar a navegação de páginas
    const navigation = useNavigation();

    // Deslogar usuário
    const { user, signOut } = useAuth();

    // Função para pesquisar as pizzas
    function fetchPizzas(value: string){
        const formattedValue = value.toLocaleLowerCase().trim();

        firestore()
        .collection('pizzas')
        .orderBy('name_insentive')
        .startAt(formattedValue)
        .endAt(`${formattedValue}\uf8ff`)
        .get()
        .then(response => {
        const data = response.docs.map(doc => {
          return {
            id: doc.id,
            ...doc.data(),
          }
        }) as ProductProps[];

        // Exibe as pizzas cadastradas
        //console.log(data);
        setPizzas(data);
      })
      .catch(() => Alert.alert('Consulta', 'Não foi possível realizar a consulta'));
    }

    // Função que busca as pizzas
    function handleSearch() {
        fetchPizzas(search);
    }

    // Função que limpa o estado do search
    function handleSearchClear() {
        setSearch('');
        fetchPizzas('');
    }

    // Função que redireciona o usuário para a página com o id do produto
    function handleOpen(id: string) {
        //Condição que verifica se é admin e redireciona o usuário
        const route = user?.isAdmin ? 'product' : 'order';
        navigation.navigate(route, { id });
    }

    // Função para cadastrar o produto
    function handleAdd() {
        navigation.navigate('product', {});
    }

    // Carrega a consulta
    useFocusEffect(
        useCallback(() => {
        fetchPizzas('');
        }, [])
    );

    return (
        <Container>
            <Header>
                <Greeting>
                    <GreetingEmoji source={happyEmoji} />
                    <GreetingText>Olá, Admin!</GreetingText>
                </Greeting>

                <TouchableOpacity>
                    <MaterialIcons 
                        name="logout" 
                        color={COLORS.TITLE} 
                        size={24} 
                        onPress={signOut}
                    />
                </TouchableOpacity>
            </Header>

            <Search 
                onChangeText={setSearch}
                value={search}
                onSearch={handleSearch} 
                onClear={handleSearchClear} 
            />

            <MenuHeader>
                <Title>Cardápio</Title>
                <MenuItemsNumber>{pizzas.length} pizzas</MenuItemsNumber>
            </MenuHeader>

            <FlatList
                data={pizzas}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                <ProductCard
                    data={item}
                    onPress={() => handleOpen(item.id)}
                />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                paddingTop: 20,
                paddingBottom: 125,
                marginHorizontal: 24
                }}
            />

            {
                user?.isAdmin &&
                <NewProductButton
                    title="Cadastrar Pizza"
                    type="secondary"
                    onPress={handleAdd}
                />
            }
        </Container>
    )
}