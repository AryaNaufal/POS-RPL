# POS RPL Starter Kit

This is a Next.js project bootstrapped with `create-next-app`, and pre-configured with Supabase and Uploadthing for a Point of Sales (POS) system foundation.

## Tech Stack

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.io/) - Backend-as-a-Service (Database, Auth)
- [Uploadthing](https://uploadthing.com/) - File Uploads
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework

## Getting Started

Follow these steps to get the project running locally.

### 1. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your credentials for Supabase and Uploadthing.

```bash
cp .env.local.example .env.local
```

You will need to create a Supabase project and an Uploadthing application to get the required keys.

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anon key.
- `UPLOADTHING_SECRET`: Your Uploadthing secret key.
- `UPLOADTHING_APP_ID`: Your Uploadthing app ID.

### 3. Run Supabase Migrations

To set up the initial database schema, you need to run the SQL scripts located in the `supabase/migrations` directory in order. You can do this by copying the content of each file and running it in the Supabase SQL editor for your project.

1.  `0000_initial_schema.sql`
2.  `0001_create_profiles_table.sql`

### 4. Run the Development Server

Once the setup is complete, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Main application routes (App Router).
- `src/components`: Shared React components.
- `src/lib`: Utility functions and service clients (e.g., Supabase).
- `src/app/api`: API routes.
- `supabase/migrations`: Database migration scripts.

## API Endpoints

### User Registration

- **Endpoint**: `POST /api/users`
- **Description**: Registers a new user.
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "data": "OK"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Email already registered):
    ```json
    {
      "error": "Email sudah terdaftar"
    }
    ```
  - `400 Bad Request` (Missing fields):
    ```json
    {
      "error": "Name, email, and password are required"
    }
    ```

### User Login

- **Endpoint**: `POST /api/login`
- **Description**: Authenticates a user and starts a session.
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "data": "OK"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Missing fields):
  - `401 Unauthorized` (Invalid credentials):
    ```json
    {
      "error": "Email atau Password salah"
    }
    ```

## Testing

You can test the endpoints using `curl` or any API client.

### Registration Tests

#### Test 1: Successful Registration

```bash
curl -X POST http://localhost:3000/api/users \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}'
```
**Expected Response:** `{"data":"OK"}`

#### Test 2: Duplicate Email

Run the same command again.

**Expected Response:** `{"error":"Email sudah terdaftar"}`

#### Test 3: Missing Fields

```bash
curl -X POST http://localhost:3000/api/users \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User"
}'
```
**Expected Response:** `{"error":"Name, email, and password are required"}`

### Login Tests

First, make sure you have successfully registered a user (e.g., `test@example.com` with `password123`).

#### Test 1: Successful Login

```bash
curl -X POST http://localhost:3000/api/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "password123"
}'
```
**Expected Response:** `{"data":"OK"}`

#### Test 2: Invalid Password

```bash
curl -X POST http://localhost:3000/api/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "wrongpassword"
}'
```
**Expected Response:** `{"error":"Email atau Password salah"}`

#### Test 3: Missing Password

```bash
curl -X POST http://localhost:3000/api/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com"
}'
```
**Expected Response:** `{"error":"Email atau Password salah"}`


## Known Issues

- **Dependency Vulnerabilities**: The project currently has known vulnerabilities related to the `uploadthing` package dependencies. We are using the latest versions with `--legacy-peer-deps` to ensure functionality, which results in a non-clean `npm audit`. This is a temporary measure until the upstream packages are updated.
