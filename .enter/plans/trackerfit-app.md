# Plano: Gestão de usuários e aprovação de vínculos

## Contexto
O TrackerFit já possui contas `atleta` e `treinador` e a tabela `athlete_trainer_links`, mas o fluxo está incompleto: o cadastro de Lucas retorna “usuário já existe” sem tornar claro que a conta já pode entrar; o convite do atleta não envia e-mail (não há serviço transacional configurado); e não existe uma gestão clara de usuários/solicitações dentro de **Equipe**.

O objetivo é transformar **Equipe** no centro de gestão de acesso: mostrar o estado do vínculo, permitir convite atleta→treinador, permitir solicitação treinador→atleta, e exigir aprovação do atleta antes de liberar dados.

## Fluxo recomendado
- Cadastro continua criando imediatamente uma conta autenticada — o e-mail existente deve retornar mensagem explícita de que a conta já existe e orientar o usuário a entrar.
- Atleta: em `Equipe`, informa o e-mail de um treinador cadastrado; cria/atualiza um vínculo pendente. O treinador vê a solicitação no próprio painel e aceita ou recusa.
- Treinador: em `Equipe`, informa o e-mail de um atleta cadastrado; uma backend function/RPC segura localiza o atleta e cria uma solicitação pendente com `trainer_id` já preenchido. O atleta vê uma notificação/cartão dentro de `Equipe` e aprova ou recusa.
- Somente `status = 'aceito'` libera acesso aos dados do treino através de `can_access_athlete`; solicitações pendentes/recusadas nunca liberam plano, histórico ou métricas.
- A tela `Equipe` mostra gestão contínua: solicitações pendentes, vínculos ativos, recusados e ação de revogar/cancelar.
- Convites são notificações internas; não prometer entrega de e-mail até configurar serviço transacional.

## Arquivos e recursos críticos
- `src/pages/Auth.tsx`: tratar “usuário já existe” e orientar login, sem duplicar contas.
- `src/pages/Equipe.tsx`: painel unificado com formulários e aprovar/recusar/revogar.
- `src/hooks/use-active-athlete.tsx`: somente carrega atletas com vínculo aceito.
- `src/components/app-shell.tsx`: permitir que treinador sem plano acesse `/equipe`.
- `src/lib/db.ts`: acessor RPC genérico já existente.
- `supabase/migrations/*`: constraint de status, RPC segura e políticas RLS.

## Implementation checklist
- [ ] Ajustar o tratamento de cadastro para distinguir e-mail já existente e orientar o usuário para login.
- [ ] Criar/confirmar RPC security-definer `request_trainer_access(target_email)` que só aceita chamadas de treinador, localiza perfil atleta e cria solicitação pendente sem expor consulta global de perfis.
- [ ] Atualizar `Equipe` para atleta enviar convite a treinador e listar status pendente/aceito/recusado.
- [ ] Atualizar `Equipe` para treinador solicitar acesso a atleta por e-mail e visualizar suas solicitações de saída sem permitir autoaprovação.
- [ ] Atualizar `Equipe` para atleta aprovar ou recusar solicitações recebidas do treinador.
- [ ] Manter `useActiveAthlete` limitado a vínculos aceitos e impedir acesso aos dados durante pendência.
- [ ] Adicionar gestão de vínculo ativo: revogar/cancelar com estado visível para ambos.
- [ ] Validar RLS das tabelas e da consulta de perfis pendentes; não alterar arquivos gerados de integração.

## Verification checklist
- [ ] Lucas consegue entrar com a conta existente; não tenta criar segunda conta e recebe orientação clara.
- [ ] Atleta envia convite para Lucas; Lucas vê a solicitação em `Equipe` e consegue aceitar ou recusar.
- [ ] Treinador solicita acesso pelo e-mail do atleta; atleta vê a solicitação em `Equipe` e consegue aprovar ou recusar.
- [ ] Conta pendente não aparece como atleta ativo e não acessa plano/histórico/métricas.
- [ ] Após aprovação, o treinador passa a selecionar o atleta e visualizar os dados compartilhados.
- [ ] Recusa e revogação removem o acesso imediatamente, mantendo status legível.
- [ ] E-mail não existente retorna erro amigável; e-mails já cadastrados não criam duplicata.
- [ ] `supabase_get_table_schema` confirma RLS e políticas da tabela de vínculos; lint/build passam.
