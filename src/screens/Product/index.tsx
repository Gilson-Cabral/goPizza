import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, TouchableOpacity, ScrollView, Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ProductNavigationProps } from '@src/@types/navigation';

import { ButtonBack } from '@components/ButtonBack';
import { InputPrice } from '@components/InputPrice';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { Photo } from '@components/Photo'; 
import { ProductProps } from '@components/ProductCard';

import { 
    Container,
    Header, 
    Title, 
    DeleteLabel,
    Upload,
    PickImageButton,
    Form,
    Label,
    InputGroup,
    InputGroupHeader,
    MaxCharacters
} from './styles';

type PizzaResponse = ProductProps & {
    photo_path: string;
    price_sizes: {
      p: string;
      m: string;
      g: string;
    }
}

export function Product(){
    // Estado para armazenar a imagem selecionada (link de exibição)
    const [image, setImage] = useState('');

    // Estado para armazenar os dados do produtos
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priceSizeP, setPriceSizeP] = useState('');
    const [priceSizeM, setPriceSizeM] = useState('');
    const [priceSizeG, setPriceSizeG] = useState('');

    // Armazena a referencia da foto (local que está salva)
    const [photoPath, setPhotoPath] = useState('');

    const navigation = useNavigation();

    // Acessar o que vem pela rota
    const route = useRoute();
    const { id } = route.params as ProductNavigationProps;
    // Teste para ver se recebe o ID de uma tela para outra
    //console.log("Id do  Produto =>", id);

    // Estado para armazenar o progresso ao cadastrar os produtos
    const [isLoading, setIsLoading] = useState(false);

    // Função para acessar o album de fotos e selecionar a imagem
    async function handlePickerImage() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status === 'granted') {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              aspect: [4, 4]
            });
      
            if (!result.cancelled) {
              setImage(result.uri);
            }
        }
    }

    // Função que válida o cadastro do produto | trim() não permite cadastrar usando espaço 
    async function handleAdd() {
        if(!name.trim()){
            return Alert.alert('Cadastro', 'Informe o nome da pizza.')
        }

        if(!description.trim()){
            return Alert.alert('Cadastro', 'Informe a descrição da pizza.')
        }

        if(!image){
            return Alert.alert('Cadastro', 'Selecione a imagem da pizza.')
        }

        if(!priceSizeP || !priceSizeM || !priceSizeG){
            return Alert.alert('Cadastro', 'Informe o preço de todos os tamanhos da pizza.')
        }

        setIsLoading(true);

        // Salva o link da imagem
        const fileName = new Date().getTime();
        const reference = storage().ref(`/pizzas/${fileName}.png`);

        // Pega a referencia da imagem para fazer upload e salva a url da imagem
        await reference.putFile(image);
        const photo_url = await reference.getDownloadURL();

        // Salva no banco de dados
        firestore()
        .collection('pizzas')
        .add({
            name,
            name_insentive: name.toLocaleLowerCase().trim(), // Salva o nome do produto em minusculo e sem espaço para facilitar na busca
            description,
            price_sizes: {
                p: priceSizeP,
                m: priceSizeM,
                g: priceSizeG
            },
            photo_url,
            photo_path: reference.fullPath // pasta que a imagem ta salva
        })
        //.then(() => Alert.alert('Cadastro', 'Pizza cadastrada com sucesso!'))
        .then(() => navigation.navigate('home'))
        .catch(() => {
            setIsLoading(false);
            Alert.alert('Cadastro', 'Não foi possível cadastrar a pizza.');
        });
    }

    // Função para voltar para a pagina anterior
    function handleGoBack() {
       navigation.goBack();
    }

    // Função para deletar a pizza
    function handleDelete() {
        firestore()
          .collection('pizzas')
          .doc(id)
          .delete()
          .then(() => {
            storage()
              .ref(photoPath)
              .delete()
              .then(() => navigation.navigate('home'));
        });
    }

    // Busca as informações do carregamento da interface
    useEffect(() => {
        if (id) {
            firestore()
            .collection('pizzas')
            .doc(id)
            .get()
            .then(response => {
              const product = response.data() as PizzaResponse;
    
              setName(product.name);
              setImage(product.photo_url);
              setDescription(product.description);
              setPriceSizeP(product.price_sizes.p);
              setPriceSizeM(product.price_sizes.m);
              setPriceSizeG(product.price_sizes.g);
              setPhotoPath(product.photo_path);
            })
        }
    }, [id])

    return(
        <Container behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar style="light" translucent backgroundColor="#B83341" />
            <ScrollView showsVerticalScrollIndicator={false}>
            <Header>
                <ButtonBack onPress={handleGoBack} />
                
                <Title>Cadastrar</Title>

                {
                    id ?
                    <TouchableOpacity onPress={handleDelete}>
                        <DeleteLabel>Deletar</DeleteLabel>
                    </TouchableOpacity>
                    : <View style={{ width: 20 }} />
                }
            </Header>

            <Upload>
                <Photo uri={image} />
                
                {
                 !id &&
                 <PickImageButton
                    title="Carregar"
                    type="secondary"
                    onPress={handlePickerImage}
                 />
                }
            </Upload>

            <Form>
                <InputGroup>
                    <Label>Nome</Label>
                    <Input 
                        onChangeText={setName} 
                        value={name} 
                    />
                </InputGroup>

                <InputGroup>
                    <InputGroupHeader>
                        <Label>Descrição</Label>
                        <MaxCharacters>0 de 60 caracteres</MaxCharacters>
                    </InputGroupHeader> 

                    <Input 
                        multiline
                        maxLength={60}
                        style={{height: 80}}
                        onChangeText={setDescription} 
                        value={description}
                    />   
                </InputGroup>

                <InputGroup>
                    <Label>Tamanhos e preços</Label>

                    <InputPrice 
                        size="P"
                        onChangeText={setPriceSizeP} 
                        value={priceSizeP} 
                    />

                    <InputPrice 
                        size="M"
                        onChangeText={setPriceSizeM} 
                        value={priceSizeM} 
                    />

                    <InputPrice 
                        size="G"
                        onChangeText={setPriceSizeG} 
                        value={priceSizeG} 
                    />

                </InputGroup>

                {
                 !id &&
                 <Button
                    title="Cadastrar Pizza"
                    isLoading={isLoading}
                    onPress={handleAdd}
                  />
                }
                
            </Form> 
            </ScrollView>
        </Container>
    )
}