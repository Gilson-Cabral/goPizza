import React from 'react';

import { Image, Placeholder, PlaceholderTitle } from './styles';

type Props = {
    uri: string | null;
}

// Função que verifica se existe foto para ser carregada 
export function Photo({ uri }: Props) {
    if (uri) {
        return <Image source={{ uri }} />
    }

    return (
        <Placeholder>
            <PlaceholderTitle>Nenhuma foto{'\n'} carregada</PlaceholderTitle>
        </Placeholder>
    )
}
