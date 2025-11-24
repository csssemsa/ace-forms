# ACE Forms - Sistema de Visitas Domiciliares

Sistema web para digitalização de fichas de visita domiciliar e territorial para Agentes de Combate a Endemias (ACE) do Ministério da Saúde.

## 📋 Sobre o Projeto

O ACE Forms é uma aplicação web desenvolvida para modernizar e facilitar o registro de visitas domiciliares realizadas por Agentes de Combate a Endemias. O sistema permite:

- ✅ Cadastro e gerenciamento de profissionais
- ✅ Cadastro rápido de cidadãos
- ✅ Registro de visitas domiciliares e controle vetorial
- ✅ Visualização de visitas em mapa interativo com geocodificação
- ✅ Cálculo automático de rotas e distâncias
- ✅ Histórico completo de visitas por cidadão
- ✅ Filtros por data, profissional e microárea
- ✅ Armazenamento local (localStorage) para funcionamento offline

## 🚀 Tecnologias Utilizadas

- **React 18** + **TypeScript** - Framework e tipagem
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **React Hook Form** - Gerenciamento de formulários
- **Leaflet** - Mapas interativos
- **Lucide React** - Ícones
- **Nominatim (OpenStreetMap)** - Geocodificação de endereços
- **OSRM** - Cálculo de rotas

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/SEU-USUARIO/ace-forms.git
cd ace-forms
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

## 🔑 Acesso ao Sistema

### Credenciais Padrão

- **Administrador**
  - CPF: `987.654.321-12`
  - Senha: `admin123`

### Funcionalidades por Perfil

**Administrador:**
- Cadastrar e gerenciar profissionais
- Visualizar todas as visitas no mapa
- Resetar senhas de profissionais
- Acesso completo ao sistema

**Profissional (ACE):**
- Cadastrar cidadãos
- Registrar visitas domiciliares
- Registrar controle vetorial
- Visualizar próprias visitas no mapa
- Consultar histórico de visitas

## 📱 Funcionalidades Principais

### 1. Gerenciamento de Profissionais
- Cadastro com CPF, CNS e microárea
- Edição de dados (exceto CPF)
- Reset de senha
- Listagem e busca

### 2. Cadastro de Cidadãos
- Busca por nome ou CPF
- Cadastro rápido com endereço completo
- Validação de CPF
- Histórico de visitas

### 3. Registro de Visitas
- **Visita Domiciliar**: Registro completo de visita com pendências e observações
- **Controle Vetorial**: Registro de ações de controle de vetores
- Geocodificação automática de endereços
- Associação com cidadão

### 4. Mapa de Visitas
- Visualização geográfica de todas as visitas
- Marcadores diferenciados (azul: domiciliar, dourado: vetorial)
- Cálculo de rota real seguindo vias
- Estatísticas: distância total, média por visita, tempo estimado
- Filtros por data e profissional
- Cache de geocodificação para performance

## 🗂️ Estrutura do Projeto

```
ace-forms/
├── src/
│   ├── components/
│   │   ├── App.tsx                    # Componente principal
│   │   ├── LoginForm.tsx              # Tela de login
│   │   ├── ProfessionalList.tsx       # Gestão de profissionais
│   │   ├── ProfessionalForm.tsx       # Cadastro de profissionais
│   │   ├── CitizenManagement.tsx      # Busca e cadastro de cidadãos
│   │   ├── VisitationForm.tsx         # Formulário de visitas
│   │   └── VisitMap.tsx               # Mapa interativo
│   ├── services/
│   │   ├── visitService.ts            # Gerenciamento de visitas
│   │   ├── geocodingService.ts        # Geocodificação
│   │   ├── routeCalculationService.ts # Cálculo de rotas
│   │   └── routingService.ts          # Integração OSRM
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🌍 APIs Externas Utilizadas

- **Nominatim (OpenStreetMap)**: Geocodificação de endereços brasileiros
- **OSRM**: Cálculo de rotas reais seguindo vias

## 💾 Armazenamento de Dados

O sistema utiliza `localStorage` do navegador para armazenar:
- Usuários e credenciais
- Registros de visitas
- Cache de geocodificação
- Dados de cidadãos

> ⚠️ **Nota**: Para ambiente de produção, recomenda-se implementar backend com banco de dados real e autenticação segura.

## 🔒 Segurança

> ⚠️ **IMPORTANTE**: Esta é uma versão de demonstração/protótipo. Para uso em produção:
> - Implementar backend com API REST
> - Usar banco de dados (PostgreSQL, MongoDB, etc.)
> - Implementar autenticação JWT ou OAuth
> - Hash de senhas (bcrypt)
> - HTTPS obrigatório
> - Validação de dados no backend

## 📝 Roadmap

- [ ] Backend com Node.js/Express
- [ ] Banco de dados PostgreSQL
- [ ] Autenticação JWT
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sincronização offline
- [ ] Aplicativo mobile (React Native)
- [ ] Dashboard de estatísticas
- [ ] Notificações push

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👤 Autor

Desenvolvido para modernização dos processos de trabalho dos Agentes de Combate a Endemias.

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para o SUS**
