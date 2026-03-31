# Creating a new API module

The backend uses **Clean Architecture**: routes stay thin, business rules live in **use cases**, persistence behind **repository interfaces** registered in **tsyringe**.

Use an existing module as reference — e.g. `backend/src/routes/films.ts` with `RegisterFilmUseCase` and `IFilmRepository`.

## 1. Domain

- **Entity** (if new aggregate): `backend/src/domain/entities/`
- **Repository interface**: `backend/src/domain/repositories/IThingRepository.ts` (methods return domain types, not raw DB rows)

## 2. Application

- **Use case(s)**: `backend/src/application/use-cases/...` — inject repository interfaces via constructor; no Express types here.

## 3. Infrastructure

- **Drizzle implementation**: `backend/src/infrastructure/repositories/DrizzleThingRepository.ts`
- **Register in DI**: `backend/src/infrastructure/container.ts`

  ```typescript
  container.registerSingleton<IThingRepository>(IThingRepository as symbol, DrizzleThingRepository);
  ```

- If you add tables: `backend/src/db/schema/`, then migrations or `db:push` per [DOCKER_AND_DATABASE.md](../DOCKER_AND_DATABASE.md).

## 4. HTTP layer

- **Router**: `backend/src/routes/things.ts` — `Router()`, Zod validation for params/body, `container.resolve<>()`, call use case or repository as appropriate.
- **Mount** in `backend/src/app.ts`:

  ```typescript
  import { thingsRouter } from './routes/things.js';
  // ...
  apiRouter.use('/things', thingsRouter);
  ```

- **Swagger**: JSDoc `@swagger` blocks on handlers (same style as `films.ts` / `reviews.ts`) so `/api-docs` stays accurate.

## 5. Cross-cutting

- **Auth**: reuse `authenticate`, `optionalAuth` from `backend/src/middleware/auth.js` as needed.
- **Errors**: throw or forward with `ApiError` / `next(err)` consistent with existing routes.

## 6. Tests

- **Unit**: use case with mocked repository.
- **Integration**: `backend/src/__tests__/integration/<feature>.test.ts` hitting `/api/v1/...` with supertest.

## 7. Frontend (if needed)

- Typed client in `frontend/src/lib/api/`
- Hooks with TanStack Query in `frontend/src/hooks/`

## Checklist

- [ ] Interface + Drizzle implementation + `container.register`
- [ ] Router mounted under `/api/v1`
- [ ] Swagger annotations
- [ ] Integration tests for new endpoints
- [ ] No business logic left only in the route handler
