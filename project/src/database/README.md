# Fitness Shop Database (MySQL + Docker)

## Start

```bash
docker compose up -d
```

## Stop

```bash
docker compose down
```

## Access

- MySQL host: `127.0.0.1`
- MySQL port: `3306`
- Database: `fitness_shop`
- User: `fitness_user`
- Password: `fitness_pass`
- Root password: `rootpass`
- phpMyAdmin: `http://localhost:8081`

## Notes

- The schema is initialized from `database/schema.sql`.
- On first start, 3 demo products are inserted.
- If you change `schema.sql`, remove volume `db_data` to re-initialize:

```bash
docker compose down -v
```
