# Supabase Migration

Supabase is now wired as an incremental target platform.

## Environment

Backend:

```env
DATABASE_PROVIDER=mongo
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Use `DATABASE_PROVIDER=mongo` while the existing Mongoose routes are active. Switch to `supabase` only after the route group you need has been migrated to the Supabase repositories.

## Schema

Run `supabase/schema.sql` in the Supabase SQL editor to create the first platform tables and indexes.

## Migration Order

1. Auth/profile mirror
2. Videos and playlists
3. Progress, notes, and bookmarks
4. AI history/cache
5. Community messages and activity
6. Certificates and analytics

The current code keeps MongoDB working while exposing Supabase health/config so each route group can be migrated without downtime.
