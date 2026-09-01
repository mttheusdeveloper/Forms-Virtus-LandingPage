-- Virtus · Migração: gravação via service role, sem Anonymous Sign-Ins
--
-- Execute este script no SQL Editor do projeto Supabase zjesctppqtkmqjnqxycf
-- (o mesmo onde briefing_schema.sql / security_hardening.sql já rodaram).
--
-- Contexto: o formulário de briefing agora grava pelo backend (Vercel
-- Functions) usando a service role key, em vez do navegador se autenticar
-- anonimamente. Isso evita precisar habilitar "Anonymous Sign-Ins" no
-- projeto Supabase, configuração que é global ao projeto e afetaria outras
-- aplicações conectadas a este mesmo projeto.
--
-- Este script remove o acesso direto que o navegador tinha (via anon key)
-- à tabela e ao bucket de arquivos — só a service role (usada pelo
-- backend) continua podendo ler/gravar, o que é mais restritivo do que
-- antes.

drop policy if exists "briefing_authenticated_insert_only" on public.briefing_responses;
drop policy if exists "briefing_owner_identity_lookup" on public.briefing_responses;

revoke insert, select, update, delete on table public.briefing_responses from anon, authenticated;

drop policy if exists "briefing_owner_upload_only" on storage.objects;
drop policy if exists "briefing_owner_read_only" on storage.objects;

-- Nenhuma policy pública é necessária a partir daqui: a service role
-- ignora Row Level Security, e mais ninguém tem grant nesta tabela/bucket.
notify pgrst, 'reload schema';
