# Player Management

## Features

- Create, edit, soft-delete players
- Avatar upload (camera or gallery)
- Visual identification for games

## Player Form

### Fields
- **Full name** (required, max 255 chars)
- **Nickname** (required, max 100 chars)
- **Avatar** (optional, image file)

### Validation
- Name and nickname required
- Nickname must be unique (per active players)
- Image: max 5MB, formats: JPG, PNG, WebP

## Avatar Handling

- Upload from device camera or gallery
- Convert to base64 or binary for storage
- Store in PostgreSQL as BYTEA
- Display as data URI: `data:image/jpeg;base64,...`
- Never required for player creation

## Player List

- Grid or list view
- Show avatar, name, nickname
- Edit and delete actions
- Soft-deleted players hidden by default
- Filter/search capability

## API Integration

- `POST /api/players` - Create
- `PUT /api/players/:id` - Update
- `DELETE /api/players/:id` - Soft delete
- Image sent as base64 in request body

## Tournament Lock

- Players cannot be edited/deleted when tournament is Active
- Show warning if attempting to modify locked players
