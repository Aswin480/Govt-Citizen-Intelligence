-- Grant permissions to myuser for Django migrations
GRANT CREATE ON SCHEMA public TO myuser;
GRANT USAGE ON SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myuser;

-- Verify the grants were applied
SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee='myuser';
