# AGENTS.md

You must follow these conventions when generating or modifying code in this repo. They come from how the owner writes code in their other projects. When in doubt, read the nearest existing file and match it.

## 1. Stack

- **Monorepo:** npm workspaces. `apps/api` (backend), `apps/web` (frontend), `packages/*` (shared, only when really needed).
- **Language:** TypeScript everywhere. No `any` unless there is no reasonable alternative.
- **Backend:** NestJS 12 (ESM), PostgreSQL, Prisma 7 with the `@prisma/adapter-pg` driver adapter, `class-validator` DTOs.
- **Frontend:** React 19 + Vite. When a feature needs them, use Redux Toolkit (state + API calls), React Router (`createBrowserRouter`), Axios (one shared instance) and Tailwind CSS. Do not introduce alternatives (Zustand, React Query, fetch wrappers, CSS modules, etc.).
- **Tooling:** Jest for tests (both apps), ESLint (root `eslint.config.mjs`) and Prettier (root `.prettierrc`). Run `npm run lint`, `npm run format` and `npm test` from the root before finishing a task.
- **Cache:** Redis via `ioredis`, wrapped by the global `RedisService` in `src/infra/redis`. `GET /api/health` pings Postgres and Redis (200 / 503).
- **Database:** Postgres and Redis run in Docker (`npm run db:up`). Schema changes go through `prisma/schema.prisma` + `npm run db:migrate`, never hand-written SQL.

## 2. Code Formatting

This is the most important section. Code must look compact and deliberate: tight inside a function, clearly separated between functions.

### Vertical spacing

1. **No blank lines inside a function, method or component body.** Related statements stay together, top to bottom.
2. **Exactly one blank line between separate functions, methods, components, constants groups and class members.** This is what makes each block easy to spot.
3. In a React component, the hooks/state/handlers form one tight group. Leave one blank line before `return (`.
4. In JSX, a blank line may separate large sibling regions of a page (sidebar, main panel, preview). Never between small elements.
5. Never leave a blank line right after an opening `{` or right before a closing `}`.

```ts
// ❌ Avoid: spread out inside, nothing separating the functions
export const getUser = (id: string) => {

  const user = users.find((u) => u.id === id);

  return user;
};
export const getUserName = (id: string) => {
  return getUser(id)?.name;
};

// ✅ Prefer: tight inside, one blank line between
export const getUser = (id: string) => {
  const user = users.find((u) => u.id === id);
  return user;
};

export const getUserName = (id: string) => getUser(id)?.name;
```

### Line length and wrapping

1. If a statement, call, object or JSX element fits on one line (Prettier `printWidth` is 100), keep it on one line.
2. Do not break short parameter lists, objects or conditions across lines by hand.
3. Only when a line is genuinely too long, split it logically and let Prettier decide the final shape.
4. Short single-statement guards stay on one line without braces: `if (!user) throw new NotFoundException('User not found');`

```ts
// ❌ Avoid
const user = {
  id: '1',
  name: 'Suraj',
};
const getUser = (
  id: string,
) => users.find(
  (u) => u.id === id,
);

// ✅ Prefer
const user = { id: '1', name: 'Suraj' };
const getUser = (id: string) => users.find((u) => u.id === id);
```

### Control flow

1. Prefer early returns and guard clauses over nested `if/else`.
2. Avoid nested ternaries and deeply nested callbacks. Extract a small named helper instead.
3. Destructure in the parameter list when it reads well: `async login({ email, password }: LoginDto)`.

```ts
// ✅ The shape used throughout the codebase
async validate(token?: string) {
  if (!token) return { authenticated: false as const };
  const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) return { authenticated: false as const };
  return { authenticated: true as const, user };
}
```

### Comments

1. No comments on obvious code. Never narrate what each line does.
2. A comment explains **why**: a business rule, a security reason, a non-obvious edge case. Keep it to one line where possible, placed directly above the code it explains.
   - `// Compared against when the email is unknown, so login takes the same time either way`
   - `// Upload first, so the db never points at an object that doesn't exist`
3. Short `/** ... */` doc comments are fine on public service methods whose behaviour isn't obvious from the name.
4. No decorative section banners, no `TODO`s, no commented-out code.

### Style details

- Single quotes, semicolons, trailing commas (enforced by Prettier).
- `const` arrow functions for helpers and small utilities; `export default function` for React components.
- Constants and fixed messages at the top of the file in `UPPER_SNAKE_CASE`: `const EMAIL_TAKEN = 'Email is already registered';`
- Small pure helpers live as `const` arrows at module level, above the class or component that uses them.
- Use `void` for promises you intentionally don't await: `void dispatch(loadUsers());`
- Type-only imports use `type`: `import type { Request } from 'express';`

## 3. Backend (`apps/api`)

### Structure

```text
src/
├── main.ts                    bootstrap only (see Configuration below)
├── app.module.ts              imports infra modules, then feature modules
├── generated/prisma/          Prisma client (generated, gitignored, never edit)
├── infra/                     connections and external services, no routes
│   └── prisma/
│       ├── prisma.module.ts     @Global, exports PrismaService
│       └── prisma.service.ts    extends PrismaClient
├── modules/                   one folder per feature, each owns its routes
│   └── <feature>/
│       ├── <feature>.module.ts
│       ├── <feature>.controller.ts
│       ├── <feature>.service.ts
│       ├── <feature>.service.spec.ts
│       └── dto/
│           └── create-<thing>.dto.ts
└── lib/                       framework-free helpers shared by several modules
```

- New external integrations (Redis, mail, S3, etc.) go in `infra/<name>/` as a module + service. A service that wraps a client usually `extends` it (`class PrismaService extends PrismaClient`) and closes it in `onModuleDestroy`.
- Feature code goes in `modules/<feature>/`. In `app.module.ts`, list infra modules first, then feature modules.

### Rules

1. **ESM:** relative imports end in `.js` (`import { AuthService } from './auth.service.js';`). Use `import.meta.dirname`, not `__dirname`.
2. **Controllers are thin:** take the DTO / params, call one service method, return the result. Private helpers in a controller only deal with HTTP concerns (cookies, headers).
3. **Services hold the logic:** Prisma queries, rules and thrown Nest exceptions (`NotFoundException`, `ConflictException`, `UnauthorizedException`, etc.) with a clear, user-readable message.
4. **Dependency injection:** `constructor(private readonly prisma: PrismaService, private readonly users: UsersService) {}`. Use short, meaningful names (`prisma`, `auth`, `profiles`), not `prismaService`.
5. **Config:** read env through `ConfigService`, using `config.getOrThrow<string>('NAME')` for required values. Add every new variable to `apps/api/.env.example`.
6. **Prisma:** inject `PrismaService`, never create a new client. Use `select` to return only the fields the client needs (never return password hashes). Handle unique conflicts (`P2002`) where they can happen.
7. **DTOs:** one class per request body in `dto/`, validated with `class-validator`; trim/normalise with `@Transform` where useful.
8. **Responses:** return plain objects. For actions with no data, return `{ message: '...' }`.
9. **Logging:** `private readonly logger = new Logger(XxxService.name);` Do not use `console.log`.
10. **Naming:** files are kebab-case with a role suffix (`users.service.ts`, `create-user.dto.ts`). Classes are `UsersService`, `UsersController`, `CreateUserDto`. Route paths are plural nouns (`@Controller('users')`) with kebab-case actions (`@Post('verify-otp')`).
11. **Status codes:** `POST` actions that don't create anything (login, logout, verify) get `@HttpCode(HttpStatus.OK)`.
12. **Auth:** protected routes use `@UseGuards(AuthGuard)`. The user id always comes from `req.user`, never from the body or params.

### Configuration

**Environment.** Every variable lives in `apps/api/.env` (gitignored) and is documented in `apps/api/.env.example`. Required values are read with `getOrThrow`, so the app fails at startup instead of at the first request:

```env
PORT=3000
WEB_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://spotify:spotify@localhost:5432/spotify?schema=public"
REDIS_URL="redis://localhost:6380"
```

**Cloud-ready rule:** every connection (Postgres, Redis, any future service) is configured by **one** URL env variable. Deploying must only require changing those URLs. Never split a connection into host/port/password variables, never hard-code hosts, and never branch on "local vs cloud" in code. TLS comes from the URL itself (`?sslmode=require` for Postgres, `rediss://` for Redis).

**`main.ts`.** Bootstrap only. Global prefix, CORS, global pipes, then listen. No business logic here:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

**`app.module.ts`.** `ConfigModule` first (global), then infra, then features. One short comment per group is allowed:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // infra: connections, no routes
    PrismaModule,
    // features: /api/auth, /api/users
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
```

**Modules that need config** register asynchronously and inject `ConfigService`. Never read `process.env` inside a module or service:

```ts
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.getOrThrow('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
```

**Prisma.** `prisma.config.ts` points at `prisma/schema.prisma` and reads `DATABASE_URL`. The client is generated into `src/generated/prisma` (ESM, `.js` imports). In the schema:

- Models are singular PascalCase (`User`, `Playlist`), fields camelCase.
- Every model has `id`, `createdAt DateTime @default(now())` and, if it can change, `updatedAt DateTime @updatedAt`.
- Relations are declared on both sides, with `onDelete: Cascade` where the child can't exist without the parent.
- Add `@unique` / `@@index` for anything looked up or filtered on.
- After editing the schema run `npm run db:migrate` with a descriptive name (`add-playlists`), and commit the migration folder.

**Infra services** wrap one client, read their config in the constructor, and clean up on shutdown:

```ts
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService) {
    super(config.getOrThrow<string>('REDIS_URL'));
    this.on('error', (error) => this.logger.error(`Redis error: ${error.message}`));
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
```

### Writing style

The formatting rules in section 2 apply here too. This is how each kind of backend file should look.

**Service:** constants and helpers above the class, guard clauses, one blank line between methods, none inside:

```ts
const EMAIL_TAKEN = 'Email is already registered';

const USER_SELECT = { id: true, name: true, email: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create({ name, email }: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ConflictException(EMAIL_TAKEN);
    return this.prisma.user.create({ data: { name, email }, select: USER_SELECT });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }
}
```

**Controller:** one line per handler body where possible. Decorators stacked above the method:

```ts
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
```

**DTO:** decorators stacked per field, one blank line between fields, a comment only for a non-obvious rule:

```ts
export class CreateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 30)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  // bcrypt only uses the first 72 bytes of a password
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
```

**Error handling:** let Nest exceptions propagate. Catch only to translate a known error, and rethrow everything else:

```ts
try {
  return await this.prisma.user.create({ data });
} catch (error) {
  // Two requests with the same email can race past the existence check
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    throw new ConflictException(EMAIL_TAKEN);
  throw error;
}
```

**Non-critical side effects** (cache, cleanup) must not break the request. Swallow or log them inline:

```ts
await this.redis.del(`user:${id}`).catch(() => null);
```

## 4. Frontend (`apps/web`)

### Structure

The project separates **state**, **pages** and **UI**:

```text
src/
├── store/                     Redux Toolkit: the ONLY place that calls the API
│   ├── index.ts                 configureStore, RootState, AppDispatch, useAppDispatch, useAppSelector
│   └── <feature>/
│       ├── <feature>Slice.ts      state, reducers, how each thunk updates the state
│       └── <feature>Thunks.ts     one createAsyncThunk per API call
├── features/                  pages + components that read the store or dispatch thunks (flat, one folder per feature)
│   └── <feature>/
│       ├── <Feature>Page.tsx
│       └── useXxx.ts
├── components/                reusable UI only: props in, markup out
│   ├── ui/                      generic primitives: Button, Input, FormMessage, PageLoader
│   └── <feature>/               presentational blocks for one area
├── types/                     all types, one file per feature; shared ones in index.ts
├── layouts/Layout.tsx         app shell wrapping every route (<Outlet />)
├── lib/api.ts                 the single Axios instance (baseURL '/api', withCredentials)
├── utils/helpers.ts           pure helpers (getErrorMessage, formatters)
├── App.tsx                    all routes, via createBrowserRouter
└── main.tsx                   <Provider store={store}><App /></Provider>
```

### Where does it go?

| If the code... | Put it in |
|---|---|
| Calls the API | a thunk in `store/<feature>/<feature>Thunks.ts` |
| Is state shared across pages, or loading/error of an API call | `store/<feature>/<feature>Slice.ts` |
| Is a page, or dispatches thunks / reads the store | `features/<feature>/` |
| Is state only one component cares about (input values, open/closed) | `useState` in that component |
| Only renders props | `components/<feature>/` or `components/ui/` |
| Is a type or interface | `types/<feature>.ts` |
| Is a pure helper | `utils/helpers.ts` |

**Import direction:** `features → store, components, types, utils`. `store → lib, types, utils`. `components → components/ui, types, utils`. Components never import from `features/`, `store/` or `lib/`.

### Rules

1. Register every route in `App.tsx`. Each route points to a `XxxPage.tsx` in its feature folder. No page UI in `App.tsx` or `Layout.tsx`.
2. Do not create `components/`, `pages/`, `services/` or `types/` subfolders inside a feature.
3. Always use `useAppDispatch` / `useAppSelector`, never plain `useDispatch` / `useSelector`. Select with a short param: `useAppSelector((s) => s.auth)`.
4. Thunks catch errors and `return rejectWithValue(getErrorMessage(err));` so the slice stores a readable message. Slices track `loading` and `error` for their thunks.
5. Components: a `XxxProps` interface directly above the component, props destructured in the signature. Extend native props with `ComponentProps<'button'>` for primitives.
6. Handlers are named `handleXxx` (`handleSubmit`, `handleChange`); callback props are named `onXxx`.
7. Styling with Tailwind classes inline in `className`. No separate CSS files per component.
8. In dev, the Vite proxy sends `/api` to the backend, so the frontend always calls relative `/api/...` URLs.

```tsx
// ✅ Reference shape for a feature component
export default function LoginForm() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState<LoginPayload>({ email: '', password: '' });
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void dispatch(loginUser(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
      <FormMessage message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
```

## 5. Testing

- Backend unit tests sit next to the code as `<name>.service.spec.ts`; e2e tests live in `apps/api/test/*.e2e-spec.ts`.
- Jest runs in native ESM mode in the API: `import { jest } from '@jest/globals';` before using `jest.fn()`.
- Mock dependencies with `{ provide: PrismaService, useValue: { user: users } }` in `Test.createTestingModule`, and call `jest.resetAllMocks()` in `beforeEach`.
- Frontend tests are `*.test.tsx` next to the component, using Testing Library (`screen`, `userEvent`) and testing what the user sees, not implementation details.

## 6. General Rules

1. Inspect the existing structure before creating files. Reuse existing components, helpers, services and types.
2. Do not create files, folders, abstractions or wrapper functions that aren't needed yet.
3. Keep each function focused on one job, but don't split simple logic across many files.
4. Never duplicate API configuration, Prisma clients or env parsing.
5. Do not change project configuration (tsconfig, eslint, prettier, jest, vite) unless the task requires it.
6. Do not break or remove existing functionality while adding features.

**Final rule:** write code the way an experienced developer writes production code: compact, clear and consistent with the files around it.