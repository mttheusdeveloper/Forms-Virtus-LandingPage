-- Virtus · Migração para a tabela já existente
-- Execute no SQL Editor depois de habilitar Anonymous Sign-Ins.

alter table public.briefing_responses
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete set null;

create unique index if not exists briefing_responses_user_once_idx
  on public.briefing_responses (user_id) where user_id is not null;

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

alter table public.briefing_responses drop constraint if exists briefing_company_name_length;
alter table public.briefing_responses add constraint briefing_company_name_length check (char_length(company_name) between 1 and 200);
alter table public.briefing_responses drop constraint if exists briefing_payload_size;
alter table public.briefing_responses add constraint briefing_payload_size check (
  char_length(domain) <= 255
  and char_length(main_objective) <= 5000
  and char_length(target_audience) <= 5000
  and char_length(products_services) <= 5000
  and char_length(products_description) <= 10000
  and octet_length(design_references::text) <= 50000
  and (final_notes is null or char_length(final_notes) <= 10000)
);
alter table public.briefing_responses drop constraint if exists briefing_safe_links;
alter table public.briefing_responses add constraint briefing_safe_links check (
  (identity_guide_link is null or identity_guide_link ~* '^https?://')
  and (image_link is null or image_link ~* '^https?://')
  and (video_link is null or video_link ~* '^https?://')
);

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

update storage.buckets set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/postscript', 'application/octet-stream',
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
where id = 'briefing-files';

drop policy if exists "briefing_public_upload_only" on storage.objects;
drop policy if exists "briefing_owner_upload_only" on storage.objects;
drop policy if exists "briefing_owner_read_only" on storage.objects;

create policy "briefing_owner_upload_only"
  on storage.objects for insert to authenticated
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
  on storage.objects for select to authenticated
  using (
    bucket_id = 'briefing-files'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

notify pgrst, 'reload schema';
