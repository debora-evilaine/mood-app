
-----

#  *Guia Completo do Projeto MoodFlow*


-----

##  1. Primeiros Passos

Este é um projeto [Expo](https://expo.dev) que utiliza o [Expo Router](https://docs.expo.dev/router/introduction) para roteamento baseado em arquivos.

### 1.1. Instalar Dependências

Instale todas as dependências do projeto, seguidas pelos pacotes específicos necessários para o **Banco de Dados (SQLite)** e componentes de UI (`SVG`, `LinearGradient`):

```bash
# 1. Instala todas as dependências listadas no package.json
npm install

# 2. Instala pacotes cruciais que o Expo não instala por padrão:
npx expo install expo-sqlite react-native-svg expo-linear-gradient react-native-safe-area-context
```

### 1.2. Iniciar o Aplicativo

Sempre inicie o servidor limpando o cache para garantir que todas as configurações do Metro sejam carregadas corretamente:

```bash
npx expo start --clear
```

Na saída do terminal, você encontrará opções para abrir o aplicativo em emuladores ou no **Web Browser** (pressionando `w`).

-----

##  2. Configuração do Banco de Dados (SQLite Web)

O projeto utiliza **SQLite** (via `expo-sqlite`) para persistência local de dados. Para que ele funcione no ambiente **Web** (navegador), é obrigatória a configuração do bundler Metro.

### 2.1. Ajuste do `metro.config.js` (Crítico)

Verifique o arquivo **`metro.config.js`** na raiz do projeto e garanta que ele contenha a regra para resolver a extensão `.wasm` (necessária para o SQLite no ambiente web):

```javascript

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);


config.resolver.assetExts.push('wasm');

module.exports = config;
```


### 2.2. Inicialização do Serviço de Dados

Toda a lógica de persistência (CRUD) é centralizada na classe `DatabaseService`. O método `init()` deve ser chamado **uma única vez** no início da aplicação para criar as tabelas e inserir os dados iniciais (`statusHumor` e `configuracao` global).

-----

##  3. Estrutura do Projeto e a base de Dados

### 3.1. Arquivos de Lógica Essenciais

| Path | Descrição |
| :--- | :--- |
| **`app/index.js`** | O ponto de entrada (rota `/`) que carrega o componente `HomeScreen`. |
| **`src/services/database.service.ts`** | Contém a classe `DatabaseService` com todas as operações **CRUD** (`createMoodEntry`, `getAllMoodEntries`, etc.). |
| **`src/screens/`** | Pasta para outras telas do aplicativo. |

### 3.2. Modelo de Dados (Relacionamentos N:N)

O modelo de banco de dados foi construído para suportar múltiplos humores e tags por registro, utilizando as seguintes tabelas e relacionamentos:

| Tabela | Chave Estrangeira (FK) | Relacionamento | Finalidade |
| :--- | :--- | :--- | :--- |
| **`registroHumor`** | N/A | 1:N (para as tabelas N:N) | Armazena o registro principal, texto e data/hora. |
| **`statusHumor`** | N/A | 1:N (para `registroStatus`) | Armazena os tipos de humor disponíveis (ex: Feliz, Triste). |
| **`tag`** | N/A | 1:N (para `registroTag`) | Armazena as tags ou categorias. |
| **`registroStatus`** | `idRegistroHumor`, `idStatusHumor` | **N:N** (Tabela Associativa) | Permite que um registro tenha **MUITOS** humores. |
| **`registroTag`** | `idRegistroHumor`, `idTag` | **N:N** (Tabela Associativa) | Permite que um registro tenha **MUITAS** tags. |
| **`configuracao`** | N/A | Global (1:1 conceitual) | Armazena configurações únicas do aplicativo (lembretes, tema). |

-----
## 5\. Recursos de Aprendizagem
  - [Expo Router documentation](https://docs.expo.dev/router/introduction): Guia de roteamento baseado em arquivos.
  - [Expo documentation](https://docs.expo.dev/): Documentação oficial do Expo.
 
