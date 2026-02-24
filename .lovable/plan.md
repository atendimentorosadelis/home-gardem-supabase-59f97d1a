
## Substituir logos por versoes otimizadas

O logo atual (`logo-home-garden.png` e `logo-home-garden-light.png`) tem **2.2MB** e e o principal responsavel pela queda no Lighthouse. Voce enviou novos logos otimizados que serao usados para substituir os atuais.

### O que sera feito

1. **Copiar os novos logos para o projeto**
   - `logo_tema_claro-2.png` vai substituir `src/assets/logo-home-garden-light.png`
   - `logo_tema_escuro-2.png` vai substituir `src/assets/logo-home-garden.png`

2. **Atualizar 3 arquivos que importam os logos**
   - `src/components/Logo.tsx` - header do site
   - `src/components/layout/Footer.tsx` - rodape
   - `src/components/dashboard/DashboardSidebar.tsx` - painel admin

   Os imports continuam iguais, so os arquivos de imagem mudam.

### Resultado esperado

- Reducao de ~2MB no peso da pagina
- Melhoria significativa no LCP e FCP do Lighthouse
- Visual do logo atualizado com o novo design colorido
