# KeyToHeart

KeyToHeart is an e‑commerce platform for ordering strawberry bouquets and flowers. The site is built with [Next.js](https://nextjs.org/), uses Supabase for storage and Prisma for database access.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Create a `.env.local` file in the project root with your configuration. At minimum you need your Supabase credentials and database connection string:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_URL=<your-supabase-url>
   DATABASE_URL=<postgres-connection-string>
   JWT_SECRET=<jwt-secret>
   ADMIN_PASSWORD=<admin-login-password>
   TELEGRAM_BOT_TOKEN=<telegram-bot-token>
   TELEGRAM_CHAT_ID=<telegram-chat-id>
   SMS_RU_API_ID=<sms-ru-api-id>
   NEXT_PUBLIC_YANDEX_MAPS_API_KEY=<yandex-maps-api-key>
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   BASE_URL=http://localhost:3000
   NEXT_PUBLIC_YM_ID=<yandex-metrica-id>
   CORPORATE_TELEGRAM_BOT_TOKEN=<optional>
   CORPORATE_TELEGRAM_CHAT_ID=<optional>
   ```

   Other environment variables used by various features are listed above. Adjust them according to your deployment.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   The site will be available at [http://localhost:3000](http://localhost:3000).

## Build and lint

To create a production build:

```bash
npm run build
```

Linting can be executed with:

```bash
npm run lint
```

(Currently no automated tests are provided.)

## Scripts

The `scripts` directory contains utilities used during development. The most common one is `exportSlugMap.ts`, which prints a map of category and subcategory slugs from Supabase.

Run it with [ts-node](https://typestrong.org/ts-node/):

```bash
npx ts-node scripts/exportSlugMap.ts
```

Feel free to add any additional scripts to this directory.

