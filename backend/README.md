# Finger Sync Backend

Node.js backend for mapping fingerprint device users to your user database.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your MySQL credentials in `db.js` if needed.
3. Ensure the following table exists in your MySQL database:

```sql
CREATE TABLE `device_user_mapping` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `device_user_id` INT NOT NULL,
  `fingerprint_data` TEXT,
  `user_id` BIGINT(20) UNSIGNED,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_user_id_unique` (`device_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

4. Start the server:
   ```bash
   node index.js
   ```

## API Endpoints

### Users
- `GET /users?q=search` — List/search users by name or email

### Device Users
- `GET /device-users` — List all device user mappings
- `POST /device-users/import` — Import device user data (JSON array)
- `POST /device-users/map` — Map a device_user_id to a user_id
- `GET /device-users/export` — Export all mapped device users as JSON

## Example Import Payload
```json
[
  { "device_user_id": 1, "fingerprint_data": "..." },
  { "device_user_id": 2, "fingerprint_data": "..." }
]
```

## Example Map Payload
```json
{ "device_user_id": 1, "user_id": 123 }
``` 