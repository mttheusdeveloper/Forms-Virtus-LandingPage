-- Virtus · Instalação segura do formulário de briefing
-- Antes de usar: habilite Anonymous Sign-Ins em Authentication > Providers > Anonymous.

create extension if not exists pgcrypto;

create table if not exists public.briefing_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  company_name text not null check (char_length(company_name) between 1 and 200),
  domain_status text not null check (domain_status in ('Sim', 'Não')),
  domain text not null check (char_length(domain) between 1 and 255),
  main_objective text not null check (char_length(main_objective) between 1 and 5000),
  target_audience text not null check (char_length(target_audience) between 1 and 5000),
  products_services text not null check (char_length(products_services) between 1 and 5000),
  products_description text not null check (char_length(products_description) between 1 and 10000),
  mission_vision_values text check (mission_vision_values is null or char_length(mission_vision_values) <= 5000),
  address text check (address is null or char_length(address) <= 1000),
  contact_info text check (contact_info is null or char_length(contact_info) <= 1000),
  phones text check (phones is null or char_length(phones) <= 500),
  emails text check (emails is null or char_length(emails) <= 1000),
  business_hours text check (business_hours is null or char_length(business_hours) <= 1000),
  company_notes text check (company_notes is null or char_length(company_notes) <= 10000),
  design_references jsonb not null check (
    jsonb_typeof(design_references) = 'array'
    and jsonb_array_length(design_references) = 5
    and octet_length(design_references::text) <= 50000
  ),
  visual_identity_status text not null check (visual_identity_status in ('Sim', 'Não', 'Em desenvolvimento')),
  identity_guide_link text check (identity_guide_link is null or identity_guide_link ~* '^https?://'),
  identity_guide_files text[] not null default '{}',
  image_link text check (image_link is null or image_link ~* '^https?://'),
  image_files text[] not null default '{}',
  video_link text check (video_link is null or video_link ~* '^https?://'),
  video_files text[] not null default '{}',
  desired_deadline text not null check (desired_deadline in ('15 dias', '30 dias', '45 dias', '60 dias')),
  final_notes text check (final_notes is null or char_length(final_notes) <= 10000),
  status text not null default 'novo' check (status in ('novo', 'em_análise', 'contatado', 'concluído', 'arquivado')),
  submitted_at timestamptz not null default now()
);

create index if not exists briefing_responses_submitted_at_idx on public.briefing_responses (submitted_at desc);
create unique index if not exists briefing_responses_user_once_idx on public.briefing_responses (user_id) where user_id is not null;

alter table public.briefing_responses enable row level security;
alter table public.briefing_responses force row level security;
revoke all on table public.briefing_responses from anon, authenticated;

grant insert (
  id, company_name, domain_status, domain, main_objective, target_audience,
  products_services, products_description, mission_vision_values, address,
  contact_info, phones, emails, business_hours, company_notes, design_references,
  visual_identity_status, identity_guide_link, identity_guide_files, image_link,
  image_files, video_link, video_files, desired_deadline, final_notes
) on table public.briefing_responses to authenticated;
grant select (id, user_id) on table public.briefing_responses to authenticated;

drop policy if exists "briefing_public_insert_only" on public.briefing_responses;
drop policy if exists "briefing_authenticated_insert_only" on public.briefing_responses;
create policy "briefing_authenticated_insert_only"
  on public.briefing_responses
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false)
    and status = 'novo'
  );

drop policy if exists "briefing_owner_identity_lookup" on public.briefing_responses;
create policy "briefing_owner_identity_lookup"
  on public.briefing_responses
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Bucket privado: 100 MB por arquivo; leitura somente pelo proprietário da sessão.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'briefing-files', 'briefing-files', false, 104857600,
  array[
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/postscript', 'application/octet-stream',
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "briefing_public_upload_only" on storage.objects;
drop policy if exists "briefing_owner_upload_only" on storage.objects;
drop policy if exists "briefing_owner_read_only" on storage.objects;

create policy "briefing_owner_upload_only"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'briefing-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] in ('identity-guide', 'images', 'videos')
    and lower(storage.extension(name)) in ('pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'zip', 'mp4', 'mov', 'webm')
    and exists (
      select 1 from public.briefing_responses response
      where response.id::text = (storage.foldername(name))[2]
        and response.user_id = (select auth.uid())
    )
  );

create policy "briefing_owner_read_only"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'briefing-files'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Somente id/user_id da própria resposta podem ser consultados para autorizar o upload.
-- O conteúdo do briefing não tem grant de SELECT para visitantes.
-- Sem UPDATE/DELETE no Storage para visitantes.
notify pgrst, 'reload schema';
