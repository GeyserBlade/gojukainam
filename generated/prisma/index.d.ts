
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Club
 * 
 */
export type Club = $Result.DefaultSelection<Prisma.$ClubPayload>
/**
 * Model Event
 * 
 */
export type Event = $Result.DefaultSelection<Prisma.$EventPayload>
/**
 * Model Division
 * 
 */
export type Division = $Result.DefaultSelection<Prisma.$DivisionPayload>
/**
 * Model WeightClass
 * 
 */
export type WeightClass = $Result.DefaultSelection<Prisma.$WeightClassPayload>
/**
 * Model Athlete
 * 
 */
export type Athlete = $Result.DefaultSelection<Prisma.$AthletePayload>
/**
 * Model Entry
 * 
 */
export type Entry = $Result.DefaultSelection<Prisma.$EntryPayload>
/**
 * Model Team
 * 
 */
export type Team = $Result.DefaultSelection<Prisma.$TeamPayload>
/**
 * Model TeamMember
 * 
 */
export type TeamMember = $Result.DefaultSelection<Prisma.$TeamMemberPayload>
/**
 * Model Invoice
 * 
 */
export type Invoice = $Result.DefaultSelection<Prisma.$InvoicePayload>
/**
 * Model AuditLog
 * 
 */
export type AuditLog = $Result.DefaultSelection<Prisma.$AuditLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  CLUB_MANAGER: 'CLUB_MANAGER',
  COACH: 'COACH',
  ATHLETE: 'ATHLETE'
};

export type Role = (typeof Role)[keyof typeof Role]


export const Gender: {
  Male: 'Male',
  Female: 'Female'
};

export type Gender = (typeof Gender)[keyof typeof Gender]


export const EntryType: {
  KATA: 'KATA',
  KUMITE: 'KUMITE',
  TEAM_KATA: 'TEAM_KATA',
  TEAM_KUMITE: 'TEAM_KUMITE',
  BUNKAI: 'BUNKAI'
};

export type EntryType = (typeof EntryType)[keyof typeof EntryType]


export const EntryStatus: {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED'
};

export type EntryStatus = (typeof EntryStatus)[keyof typeof EntryStatus]


export const TeamStatus: {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED'
};

export type TeamStatus = (typeof TeamStatus)[keyof typeof TeamStatus]


export const InvoiceStatus: {
  DUE: 'DUE',
  SENT: 'SENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
};

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type Gender = $Enums.Gender

export const Gender: typeof $Enums.Gender

export type EntryType = $Enums.EntryType

export const EntryType: typeof $Enums.EntryType

export type EntryStatus = $Enums.EntryStatus

export const EntryStatus: typeof $Enums.EntryStatus

export type TeamStatus = $Enums.TeamStatus

export const TeamStatus: typeof $Enums.TeamStatus

export type InvoiceStatus = $Enums.InvoiceStatus

export const InvoiceStatus: typeof $Enums.InvoiceStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.club`: Exposes CRUD operations for the **Club** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Clubs
    * const clubs = await prisma.club.findMany()
    * ```
    */
  get club(): Prisma.ClubDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.event`: Exposes CRUD operations for the **Event** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Events
    * const events = await prisma.event.findMany()
    * ```
    */
  get event(): Prisma.EventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.division`: Exposes CRUD operations for the **Division** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Divisions
    * const divisions = await prisma.division.findMany()
    * ```
    */
  get division(): Prisma.DivisionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.weightClass`: Exposes CRUD operations for the **WeightClass** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WeightClasses
    * const weightClasses = await prisma.weightClass.findMany()
    * ```
    */
  get weightClass(): Prisma.WeightClassDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.athlete`: Exposes CRUD operations for the **Athlete** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Athletes
    * const athletes = await prisma.athlete.findMany()
    * ```
    */
  get athlete(): Prisma.AthleteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.entry`: Exposes CRUD operations for the **Entry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Entries
    * const entries = await prisma.entry.findMany()
    * ```
    */
  get entry(): Prisma.EntryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.team`: Exposes CRUD operations for the **Team** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Teams
    * const teams = await prisma.team.findMany()
    * ```
    */
  get team(): Prisma.TeamDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.teamMember`: Exposes CRUD operations for the **TeamMember** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TeamMembers
    * const teamMembers = await prisma.teamMember.findMany()
    * ```
    */
  get teamMember(): Prisma.TeamMemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.invoice`: Exposes CRUD operations for the **Invoice** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Invoices
    * const invoices = await prisma.invoice.findMany()
    * ```
    */
  get invoice(): Prisma.InvoiceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditLog`: Exposes CRUD operations for the **AuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditLogs
    * const auditLogs = await prisma.auditLog.findMany()
    * ```
    */
  get auditLog(): Prisma.AuditLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.15.0
   * Query Engine version: 85179d7826409ee107a6ba334b5e305ae3fba9fb
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Club: 'Club',
    Event: 'Event',
    Division: 'Division',
    WeightClass: 'WeightClass',
    Athlete: 'Athlete',
    Entry: 'Entry',
    Team: 'Team',
    TeamMember: 'TeamMember',
    Invoice: 'Invoice',
    AuditLog: 'AuditLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "club" | "event" | "division" | "weightClass" | "athlete" | "entry" | "team" | "teamMember" | "invoice" | "auditLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Club: {
        payload: Prisma.$ClubPayload<ExtArgs>
        fields: Prisma.ClubFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ClubFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ClubFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>
          }
          findFirst: {
            args: Prisma.ClubFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ClubFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>
          }
          findMany: {
            args: Prisma.ClubFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>[]
          }
          create: {
            args: Prisma.ClubCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>
          }
          createMany: {
            args: Prisma.ClubCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ClubCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>[]
          }
          delete: {
            args: Prisma.ClubDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>
          }
          update: {
            args: Prisma.ClubUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>
          }
          deleteMany: {
            args: Prisma.ClubDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ClubUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ClubUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>[]
          }
          upsert: {
            args: Prisma.ClubUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClubPayload>
          }
          aggregate: {
            args: Prisma.ClubAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateClub>
          }
          groupBy: {
            args: Prisma.ClubGroupByArgs<ExtArgs>
            result: $Utils.Optional<ClubGroupByOutputType>[]
          }
          count: {
            args: Prisma.ClubCountArgs<ExtArgs>
            result: $Utils.Optional<ClubCountAggregateOutputType> | number
          }
        }
      }
      Event: {
        payload: Prisma.$EventPayload<ExtArgs>
        fields: Prisma.EventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          findFirst: {
            args: Prisma.EventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          findMany: {
            args: Prisma.EventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>[]
          }
          create: {
            args: Prisma.EventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          createMany: {
            args: Prisma.EventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>[]
          }
          delete: {
            args: Prisma.EventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          update: {
            args: Prisma.EventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          deleteMany: {
            args: Prisma.EventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>[]
          }
          upsert: {
            args: Prisma.EventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventPayload>
          }
          aggregate: {
            args: Prisma.EventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEvent>
          }
          groupBy: {
            args: Prisma.EventGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventCountArgs<ExtArgs>
            result: $Utils.Optional<EventCountAggregateOutputType> | number
          }
        }
      }
      Division: {
        payload: Prisma.$DivisionPayload<ExtArgs>
        fields: Prisma.DivisionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DivisionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DivisionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>
          }
          findFirst: {
            args: Prisma.DivisionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DivisionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>
          }
          findMany: {
            args: Prisma.DivisionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>[]
          }
          create: {
            args: Prisma.DivisionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>
          }
          createMany: {
            args: Prisma.DivisionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DivisionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>[]
          }
          delete: {
            args: Prisma.DivisionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>
          }
          update: {
            args: Prisma.DivisionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>
          }
          deleteMany: {
            args: Prisma.DivisionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DivisionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DivisionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>[]
          }
          upsert: {
            args: Prisma.DivisionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DivisionPayload>
          }
          aggregate: {
            args: Prisma.DivisionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDivision>
          }
          groupBy: {
            args: Prisma.DivisionGroupByArgs<ExtArgs>
            result: $Utils.Optional<DivisionGroupByOutputType>[]
          }
          count: {
            args: Prisma.DivisionCountArgs<ExtArgs>
            result: $Utils.Optional<DivisionCountAggregateOutputType> | number
          }
        }
      }
      WeightClass: {
        payload: Prisma.$WeightClassPayload<ExtArgs>
        fields: Prisma.WeightClassFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WeightClassFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WeightClassFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>
          }
          findFirst: {
            args: Prisma.WeightClassFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WeightClassFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>
          }
          findMany: {
            args: Prisma.WeightClassFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>[]
          }
          create: {
            args: Prisma.WeightClassCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>
          }
          createMany: {
            args: Prisma.WeightClassCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WeightClassCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>[]
          }
          delete: {
            args: Prisma.WeightClassDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>
          }
          update: {
            args: Prisma.WeightClassUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>
          }
          deleteMany: {
            args: Prisma.WeightClassDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WeightClassUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WeightClassUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>[]
          }
          upsert: {
            args: Prisma.WeightClassUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WeightClassPayload>
          }
          aggregate: {
            args: Prisma.WeightClassAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWeightClass>
          }
          groupBy: {
            args: Prisma.WeightClassGroupByArgs<ExtArgs>
            result: $Utils.Optional<WeightClassGroupByOutputType>[]
          }
          count: {
            args: Prisma.WeightClassCountArgs<ExtArgs>
            result: $Utils.Optional<WeightClassCountAggregateOutputType> | number
          }
        }
      }
      Athlete: {
        payload: Prisma.$AthletePayload<ExtArgs>
        fields: Prisma.AthleteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AthleteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AthleteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>
          }
          findFirst: {
            args: Prisma.AthleteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AthleteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>
          }
          findMany: {
            args: Prisma.AthleteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>[]
          }
          create: {
            args: Prisma.AthleteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>
          }
          createMany: {
            args: Prisma.AthleteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AthleteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>[]
          }
          delete: {
            args: Prisma.AthleteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>
          }
          update: {
            args: Prisma.AthleteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>
          }
          deleteMany: {
            args: Prisma.AthleteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AthleteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AthleteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>[]
          }
          upsert: {
            args: Prisma.AthleteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AthletePayload>
          }
          aggregate: {
            args: Prisma.AthleteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAthlete>
          }
          groupBy: {
            args: Prisma.AthleteGroupByArgs<ExtArgs>
            result: $Utils.Optional<AthleteGroupByOutputType>[]
          }
          count: {
            args: Prisma.AthleteCountArgs<ExtArgs>
            result: $Utils.Optional<AthleteCountAggregateOutputType> | number
          }
        }
      }
      Entry: {
        payload: Prisma.$EntryPayload<ExtArgs>
        fields: Prisma.EntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>
          }
          findFirst: {
            args: Prisma.EntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>
          }
          findMany: {
            args: Prisma.EntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>[]
          }
          create: {
            args: Prisma.EntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>
          }
          createMany: {
            args: Prisma.EntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>[]
          }
          delete: {
            args: Prisma.EntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>
          }
          update: {
            args: Prisma.EntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>
          }
          deleteMany: {
            args: Prisma.EntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EntryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>[]
          }
          upsert: {
            args: Prisma.EntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EntryPayload>
          }
          aggregate: {
            args: Prisma.EntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEntry>
          }
          groupBy: {
            args: Prisma.EntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<EntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.EntryCountArgs<ExtArgs>
            result: $Utils.Optional<EntryCountAggregateOutputType> | number
          }
        }
      }
      Team: {
        payload: Prisma.$TeamPayload<ExtArgs>
        fields: Prisma.TeamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          findFirst: {
            args: Prisma.TeamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          findMany: {
            args: Prisma.TeamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          create: {
            args: Prisma.TeamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          createMany: {
            args: Prisma.TeamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          delete: {
            args: Prisma.TeamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          update: {
            args: Prisma.TeamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          deleteMany: {
            args: Prisma.TeamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TeamUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>[]
          }
          upsert: {
            args: Prisma.TeamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamPayload>
          }
          aggregate: {
            args: Prisma.TeamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeam>
          }
          groupBy: {
            args: Prisma.TeamGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeamGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeamCountArgs<ExtArgs>
            result: $Utils.Optional<TeamCountAggregateOutputType> | number
          }
        }
      }
      TeamMember: {
        payload: Prisma.$TeamMemberPayload<ExtArgs>
        fields: Prisma.TeamMemberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TeamMemberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TeamMemberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>
          }
          findFirst: {
            args: Prisma.TeamMemberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TeamMemberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>
          }
          findMany: {
            args: Prisma.TeamMemberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>[]
          }
          create: {
            args: Prisma.TeamMemberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>
          }
          createMany: {
            args: Prisma.TeamMemberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TeamMemberCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>[]
          }
          delete: {
            args: Prisma.TeamMemberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>
          }
          update: {
            args: Prisma.TeamMemberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>
          }
          deleteMany: {
            args: Prisma.TeamMemberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TeamMemberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TeamMemberUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>[]
          }
          upsert: {
            args: Prisma.TeamMemberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TeamMemberPayload>
          }
          aggregate: {
            args: Prisma.TeamMemberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeamMember>
          }
          groupBy: {
            args: Prisma.TeamMemberGroupByArgs<ExtArgs>
            result: $Utils.Optional<TeamMemberGroupByOutputType>[]
          }
          count: {
            args: Prisma.TeamMemberCountArgs<ExtArgs>
            result: $Utils.Optional<TeamMemberCountAggregateOutputType> | number
          }
        }
      }
      Invoice: {
        payload: Prisma.$InvoicePayload<ExtArgs>
        fields: Prisma.InvoiceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvoiceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvoiceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findFirst: {
            args: Prisma.InvoiceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvoiceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findMany: {
            args: Prisma.InvoiceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          create: {
            args: Prisma.InvoiceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          createMany: {
            args: Prisma.InvoiceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvoiceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          delete: {
            args: Prisma.InvoiceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          update: {
            args: Prisma.InvoiceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          deleteMany: {
            args: Prisma.InvoiceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvoiceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InvoiceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          upsert: {
            args: Prisma.InvoiceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          aggregate: {
            args: Prisma.InvoiceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoice>
          }
          groupBy: {
            args: Prisma.InvoiceGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoiceGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvoiceCountArgs<ExtArgs>
            result: $Utils.Optional<InvoiceCountAggregateOutputType> | number
          }
        }
      }
      AuditLog: {
        payload: Prisma.$AuditLogPayload<ExtArgs>
        fields: Prisma.AuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findFirst: {
            args: Prisma.AuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findMany: {
            args: Prisma.AuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          create: {
            args: Prisma.AuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          createMany: {
            args: Prisma.AuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          delete: {
            args: Prisma.AuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          update: {
            args: Prisma.AuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          deleteMany: {
            args: Prisma.AuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          upsert: {
            args: Prisma.AuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          aggregate: {
            args: Prisma.AuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditLog>
          }
          groupBy: {
            args: Prisma.AuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<AuditLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    club?: ClubOmit
    event?: EventOmit
    division?: DivisionOmit
    weightClass?: WeightClassOmit
    athlete?: AthleteOmit
    entry?: EntryOmit
    team?: TeamOmit
    teamMember?: TeamMemberOmit
    invoice?: InvoiceOmit
    auditLog?: AuditLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    AuditLogs: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    AuditLogs?: boolean | UserCountOutputTypeCountAuditLogsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAuditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditLogWhereInput
  }


  /**
   * Count Type ClubCountOutputType
   */

  export type ClubCountOutputType = {
    users: number
    athletes: number
    teams: number
    entries: number
    invoices: number
  }

  export type ClubCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | ClubCountOutputTypeCountUsersArgs
    athletes?: boolean | ClubCountOutputTypeCountAthletesArgs
    teams?: boolean | ClubCountOutputTypeCountTeamsArgs
    entries?: boolean | ClubCountOutputTypeCountEntriesArgs
    invoices?: boolean | ClubCountOutputTypeCountInvoicesArgs
  }

  // Custom InputTypes
  /**
   * ClubCountOutputType without action
   */
  export type ClubCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClubCountOutputType
     */
    select?: ClubCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ClubCountOutputType without action
   */
  export type ClubCountOutputTypeCountUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * ClubCountOutputType without action
   */
  export type ClubCountOutputTypeCountAthletesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AthleteWhereInput
  }

  /**
   * ClubCountOutputType without action
   */
  export type ClubCountOutputTypeCountTeamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
  }

  /**
   * ClubCountOutputType without action
   */
  export type ClubCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
  }

  /**
   * ClubCountOutputType without action
   */
  export type ClubCountOutputTypeCountInvoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
  }


  /**
   * Count Type EventCountOutputType
   */

  export type EventCountOutputType = {
    divisions: number
    weightClasses: number
    entries: number
    teams: number
    invoices: number
  }

  export type EventCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    divisions?: boolean | EventCountOutputTypeCountDivisionsArgs
    weightClasses?: boolean | EventCountOutputTypeCountWeightClassesArgs
    entries?: boolean | EventCountOutputTypeCountEntriesArgs
    teams?: boolean | EventCountOutputTypeCountTeamsArgs
    invoices?: boolean | EventCountOutputTypeCountInvoicesArgs
  }

  // Custom InputTypes
  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventCountOutputType
     */
    select?: EventCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountDivisionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DivisionWhereInput
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountWeightClassesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WeightClassWhereInput
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountTeamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
  }

  /**
   * EventCountOutputType without action
   */
  export type EventCountOutputTypeCountInvoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
  }


  /**
   * Count Type DivisionCountOutputType
   */

  export type DivisionCountOutputType = {
    entries: number
    teams: number
    weightClasses: number
  }

  export type DivisionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    entries?: boolean | DivisionCountOutputTypeCountEntriesArgs
    teams?: boolean | DivisionCountOutputTypeCountTeamsArgs
    weightClasses?: boolean | DivisionCountOutputTypeCountWeightClassesArgs
  }

  // Custom InputTypes
  /**
   * DivisionCountOutputType without action
   */
  export type DivisionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DivisionCountOutputType
     */
    select?: DivisionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DivisionCountOutputType without action
   */
  export type DivisionCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
  }

  /**
   * DivisionCountOutputType without action
   */
  export type DivisionCountOutputTypeCountTeamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
  }

  /**
   * DivisionCountOutputType without action
   */
  export type DivisionCountOutputTypeCountWeightClassesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WeightClassWhereInput
  }


  /**
   * Count Type WeightClassCountOutputType
   */

  export type WeightClassCountOutputType = {
    entries: number
  }

  export type WeightClassCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    entries?: boolean | WeightClassCountOutputTypeCountEntriesArgs
  }

  // Custom InputTypes
  /**
   * WeightClassCountOutputType without action
   */
  export type WeightClassCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClassCountOutputType
     */
    select?: WeightClassCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WeightClassCountOutputType without action
   */
  export type WeightClassCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
  }


  /**
   * Count Type AthleteCountOutputType
   */

  export type AthleteCountOutputType = {
    entries: number
    teamMembers: number
  }

  export type AthleteCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    entries?: boolean | AthleteCountOutputTypeCountEntriesArgs
    teamMembers?: boolean | AthleteCountOutputTypeCountTeamMembersArgs
  }

  // Custom InputTypes
  /**
   * AthleteCountOutputType without action
   */
  export type AthleteCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AthleteCountOutputType
     */
    select?: AthleteCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AthleteCountOutputType without action
   */
  export type AthleteCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
  }

  /**
   * AthleteCountOutputType without action
   */
  export type AthleteCountOutputTypeCountTeamMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamMemberWhereInput
  }


  /**
   * Count Type TeamCountOutputType
   */

  export type TeamCountOutputType = {
    members: number
    entries: number
  }

  export type TeamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    members?: boolean | TeamCountOutputTypeCountMembersArgs
    entries?: boolean | TeamCountOutputTypeCountEntriesArgs
  }

  // Custom InputTypes
  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamCountOutputType
     */
    select?: TeamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeCountMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamMemberWhereInput
  }

  /**
   * TeamCountOutputType without action
   */
  export type TeamCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    role: $Enums.Role | null
    clubId: string | null
    passwordHash: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    role: $Enums.Role | null
    clubId: string | null
    passwordHash: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    role: number
    clubId: number
    passwordHash: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    role?: true
    clubId?: true
    passwordHash?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    role?: true
    clubId?: true
    passwordHash?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    role?: true
    clubId?: true
    passwordHash?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string | null
    email: string
    role: $Enums.Role
    clubId: string | null
    passwordHash: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    role?: boolean
    clubId?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | User$clubArgs<ExtArgs>
    AuditLogs?: boolean | User$AuditLogsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    role?: boolean
    clubId?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | User$clubArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    role?: boolean
    clubId?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | User$clubArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    role?: boolean
    clubId?: boolean
    passwordHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "role" | "clubId" | "passwordHash" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | User$clubArgs<ExtArgs>
    AuditLogs?: boolean | User$AuditLogsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | User$clubArgs<ExtArgs>
  }
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | User$clubArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      club: Prisma.$ClubPayload<ExtArgs> | null
      AuditLogs: Prisma.$AuditLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string | null
      email: string
      role: $Enums.Role
      clubId: string | null
      passwordHash: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    club<T extends User$clubArgs<ExtArgs> = {}>(args?: Subset<T, User$clubArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    AuditLogs<T extends User$AuditLogsArgs<ExtArgs> = {}>(args?: Subset<T, User$AuditLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly clubId: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.club
   */
  export type User$clubArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    where?: ClubWhereInput
  }

  /**
   * User.AuditLogs
   */
  export type User$AuditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    where?: AuditLogWhereInput
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    cursor?: AuditLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Club
   */

  export type AggregateClub = {
    _count: ClubCountAggregateOutputType | null
    _min: ClubMinAggregateOutputType | null
    _max: ClubMaxAggregateOutputType | null
  }

  export type ClubMinAggregateOutputType = {
    id: string | null
    name: string | null
    region: string | null
    contactName: string | null
    email: string | null
    phone: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ClubMaxAggregateOutputType = {
    id: string | null
    name: string | null
    region: string | null
    contactName: string | null
    email: string | null
    phone: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ClubCountAggregateOutputType = {
    id: number
    name: number
    region: number
    contactName: number
    email: number
    phone: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ClubMinAggregateInputType = {
    id?: true
    name?: true
    region?: true
    contactName?: true
    email?: true
    phone?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ClubMaxAggregateInputType = {
    id?: true
    name?: true
    region?: true
    contactName?: true
    email?: true
    phone?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ClubCountAggregateInputType = {
    id?: true
    name?: true
    region?: true
    contactName?: true
    email?: true
    phone?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ClubAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Club to aggregate.
     */
    where?: ClubWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clubs to fetch.
     */
    orderBy?: ClubOrderByWithRelationInput | ClubOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ClubWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clubs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clubs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Clubs
    **/
    _count?: true | ClubCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ClubMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ClubMaxAggregateInputType
  }

  export type GetClubAggregateType<T extends ClubAggregateArgs> = {
        [P in keyof T & keyof AggregateClub]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateClub[P]>
      : GetScalarType<T[P], AggregateClub[P]>
  }




  export type ClubGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ClubWhereInput
    orderBy?: ClubOrderByWithAggregationInput | ClubOrderByWithAggregationInput[]
    by: ClubScalarFieldEnum[] | ClubScalarFieldEnum
    having?: ClubScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ClubCountAggregateInputType | true
    _min?: ClubMinAggregateInputType
    _max?: ClubMaxAggregateInputType
  }

  export type ClubGroupByOutputType = {
    id: string
    name: string
    region: string | null
    contactName: string
    email: string
    phone: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: ClubCountAggregateOutputType | null
    _min: ClubMinAggregateOutputType | null
    _max: ClubMaxAggregateOutputType | null
  }

  type GetClubGroupByPayload<T extends ClubGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ClubGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ClubGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ClubGroupByOutputType[P]>
            : GetScalarType<T[P], ClubGroupByOutputType[P]>
        }
      >
    >


  export type ClubSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    region?: boolean
    contactName?: boolean
    email?: boolean
    phone?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    users?: boolean | Club$usersArgs<ExtArgs>
    athletes?: boolean | Club$athletesArgs<ExtArgs>
    teams?: boolean | Club$teamsArgs<ExtArgs>
    entries?: boolean | Club$entriesArgs<ExtArgs>
    invoices?: boolean | Club$invoicesArgs<ExtArgs>
    _count?: boolean | ClubCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["club"]>

  export type ClubSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    region?: boolean
    contactName?: boolean
    email?: boolean
    phone?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["club"]>

  export type ClubSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    region?: boolean
    contactName?: boolean
    email?: boolean
    phone?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["club"]>

  export type ClubSelectScalar = {
    id?: boolean
    name?: boolean
    region?: boolean
    contactName?: boolean
    email?: boolean
    phone?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ClubOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "region" | "contactName" | "email" | "phone" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["club"]>
  export type ClubInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | Club$usersArgs<ExtArgs>
    athletes?: boolean | Club$athletesArgs<ExtArgs>
    teams?: boolean | Club$teamsArgs<ExtArgs>
    entries?: boolean | Club$entriesArgs<ExtArgs>
    invoices?: boolean | Club$invoicesArgs<ExtArgs>
    _count?: boolean | ClubCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ClubIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ClubIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ClubPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Club"
    objects: {
      users: Prisma.$UserPayload<ExtArgs>[]
      athletes: Prisma.$AthletePayload<ExtArgs>[]
      teams: Prisma.$TeamPayload<ExtArgs>[]
      entries: Prisma.$EntryPayload<ExtArgs>[]
      invoices: Prisma.$InvoicePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      region: string | null
      contactName: string
      email: string
      phone: string | null
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["club"]>
    composites: {}
  }

  type ClubGetPayload<S extends boolean | null | undefined | ClubDefaultArgs> = $Result.GetResult<Prisma.$ClubPayload, S>

  type ClubCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ClubFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ClubCountAggregateInputType | true
    }

  export interface ClubDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Club'], meta: { name: 'Club' } }
    /**
     * Find zero or one Club that matches the filter.
     * @param {ClubFindUniqueArgs} args - Arguments to find a Club
     * @example
     * // Get one Club
     * const club = await prisma.club.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClubFindUniqueArgs>(args: SelectSubset<T, ClubFindUniqueArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Club that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClubFindUniqueOrThrowArgs} args - Arguments to find a Club
     * @example
     * // Get one Club
     * const club = await prisma.club.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClubFindUniqueOrThrowArgs>(args: SelectSubset<T, ClubFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Club that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubFindFirstArgs} args - Arguments to find a Club
     * @example
     * // Get one Club
     * const club = await prisma.club.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClubFindFirstArgs>(args?: SelectSubset<T, ClubFindFirstArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Club that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubFindFirstOrThrowArgs} args - Arguments to find a Club
     * @example
     * // Get one Club
     * const club = await prisma.club.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClubFindFirstOrThrowArgs>(args?: SelectSubset<T, ClubFindFirstOrThrowArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Clubs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Clubs
     * const clubs = await prisma.club.findMany()
     * 
     * // Get first 10 Clubs
     * const clubs = await prisma.club.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const clubWithIdOnly = await prisma.club.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ClubFindManyArgs>(args?: SelectSubset<T, ClubFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Club.
     * @param {ClubCreateArgs} args - Arguments to create a Club.
     * @example
     * // Create one Club
     * const Club = await prisma.club.create({
     *   data: {
     *     // ... data to create a Club
     *   }
     * })
     * 
     */
    create<T extends ClubCreateArgs>(args: SelectSubset<T, ClubCreateArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Clubs.
     * @param {ClubCreateManyArgs} args - Arguments to create many Clubs.
     * @example
     * // Create many Clubs
     * const club = await prisma.club.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ClubCreateManyArgs>(args?: SelectSubset<T, ClubCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Clubs and returns the data saved in the database.
     * @param {ClubCreateManyAndReturnArgs} args - Arguments to create many Clubs.
     * @example
     * // Create many Clubs
     * const club = await prisma.club.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Clubs and only return the `id`
     * const clubWithIdOnly = await prisma.club.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ClubCreateManyAndReturnArgs>(args?: SelectSubset<T, ClubCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Club.
     * @param {ClubDeleteArgs} args - Arguments to delete one Club.
     * @example
     * // Delete one Club
     * const Club = await prisma.club.delete({
     *   where: {
     *     // ... filter to delete one Club
     *   }
     * })
     * 
     */
    delete<T extends ClubDeleteArgs>(args: SelectSubset<T, ClubDeleteArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Club.
     * @param {ClubUpdateArgs} args - Arguments to update one Club.
     * @example
     * // Update one Club
     * const club = await prisma.club.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ClubUpdateArgs>(args: SelectSubset<T, ClubUpdateArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Clubs.
     * @param {ClubDeleteManyArgs} args - Arguments to filter Clubs to delete.
     * @example
     * // Delete a few Clubs
     * const { count } = await prisma.club.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ClubDeleteManyArgs>(args?: SelectSubset<T, ClubDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Clubs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Clubs
     * const club = await prisma.club.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ClubUpdateManyArgs>(args: SelectSubset<T, ClubUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Clubs and returns the data updated in the database.
     * @param {ClubUpdateManyAndReturnArgs} args - Arguments to update many Clubs.
     * @example
     * // Update many Clubs
     * const club = await prisma.club.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Clubs and only return the `id`
     * const clubWithIdOnly = await prisma.club.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ClubUpdateManyAndReturnArgs>(args: SelectSubset<T, ClubUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Club.
     * @param {ClubUpsertArgs} args - Arguments to update or create a Club.
     * @example
     * // Update or create a Club
     * const club = await prisma.club.upsert({
     *   create: {
     *     // ... data to create a Club
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Club we want to update
     *   }
     * })
     */
    upsert<T extends ClubUpsertArgs>(args: SelectSubset<T, ClubUpsertArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Clubs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubCountArgs} args - Arguments to filter Clubs to count.
     * @example
     * // Count the number of Clubs
     * const count = await prisma.club.count({
     *   where: {
     *     // ... the filter for the Clubs we want to count
     *   }
     * })
    **/
    count<T extends ClubCountArgs>(
      args?: Subset<T, ClubCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClubCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Club.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ClubAggregateArgs>(args: Subset<T, ClubAggregateArgs>): Prisma.PrismaPromise<GetClubAggregateType<T>>

    /**
     * Group by Club.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClubGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ClubGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClubGroupByArgs['orderBy'] }
        : { orderBy?: ClubGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ClubGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetClubGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Club model
   */
  readonly fields: ClubFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Club.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClubClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    users<T extends Club$usersArgs<ExtArgs> = {}>(args?: Subset<T, Club$usersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    athletes<T extends Club$athletesArgs<ExtArgs> = {}>(args?: Subset<T, Club$athletesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    teams<T extends Club$teamsArgs<ExtArgs> = {}>(args?: Subset<T, Club$teamsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    entries<T extends Club$entriesArgs<ExtArgs> = {}>(args?: Subset<T, Club$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    invoices<T extends Club$invoicesArgs<ExtArgs> = {}>(args?: Subset<T, Club$invoicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Club model
   */
  interface ClubFieldRefs {
    readonly id: FieldRef<"Club", 'String'>
    readonly name: FieldRef<"Club", 'String'>
    readonly region: FieldRef<"Club", 'String'>
    readonly contactName: FieldRef<"Club", 'String'>
    readonly email: FieldRef<"Club", 'String'>
    readonly phone: FieldRef<"Club", 'String'>
    readonly notes: FieldRef<"Club", 'String'>
    readonly createdAt: FieldRef<"Club", 'DateTime'>
    readonly updatedAt: FieldRef<"Club", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Club findUnique
   */
  export type ClubFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * Filter, which Club to fetch.
     */
    where: ClubWhereUniqueInput
  }

  /**
   * Club findUniqueOrThrow
   */
  export type ClubFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * Filter, which Club to fetch.
     */
    where: ClubWhereUniqueInput
  }

  /**
   * Club findFirst
   */
  export type ClubFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * Filter, which Club to fetch.
     */
    where?: ClubWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clubs to fetch.
     */
    orderBy?: ClubOrderByWithRelationInput | ClubOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Clubs.
     */
    cursor?: ClubWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clubs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clubs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Clubs.
     */
    distinct?: ClubScalarFieldEnum | ClubScalarFieldEnum[]
  }

  /**
   * Club findFirstOrThrow
   */
  export type ClubFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * Filter, which Club to fetch.
     */
    where?: ClubWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clubs to fetch.
     */
    orderBy?: ClubOrderByWithRelationInput | ClubOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Clubs.
     */
    cursor?: ClubWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clubs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clubs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Clubs.
     */
    distinct?: ClubScalarFieldEnum | ClubScalarFieldEnum[]
  }

  /**
   * Club findMany
   */
  export type ClubFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * Filter, which Clubs to fetch.
     */
    where?: ClubWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clubs to fetch.
     */
    orderBy?: ClubOrderByWithRelationInput | ClubOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Clubs.
     */
    cursor?: ClubWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clubs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clubs.
     */
    skip?: number
    distinct?: ClubScalarFieldEnum | ClubScalarFieldEnum[]
  }

  /**
   * Club create
   */
  export type ClubCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * The data needed to create a Club.
     */
    data: XOR<ClubCreateInput, ClubUncheckedCreateInput>
  }

  /**
   * Club createMany
   */
  export type ClubCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Clubs.
     */
    data: ClubCreateManyInput | ClubCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Club createManyAndReturn
   */
  export type ClubCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * The data used to create many Clubs.
     */
    data: ClubCreateManyInput | ClubCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Club update
   */
  export type ClubUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * The data needed to update a Club.
     */
    data: XOR<ClubUpdateInput, ClubUncheckedUpdateInput>
    /**
     * Choose, which Club to update.
     */
    where: ClubWhereUniqueInput
  }

  /**
   * Club updateMany
   */
  export type ClubUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Clubs.
     */
    data: XOR<ClubUpdateManyMutationInput, ClubUncheckedUpdateManyInput>
    /**
     * Filter which Clubs to update
     */
    where?: ClubWhereInput
    /**
     * Limit how many Clubs to update.
     */
    limit?: number
  }

  /**
   * Club updateManyAndReturn
   */
  export type ClubUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * The data used to update Clubs.
     */
    data: XOR<ClubUpdateManyMutationInput, ClubUncheckedUpdateManyInput>
    /**
     * Filter which Clubs to update
     */
    where?: ClubWhereInput
    /**
     * Limit how many Clubs to update.
     */
    limit?: number
  }

  /**
   * Club upsert
   */
  export type ClubUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * The filter to search for the Club to update in case it exists.
     */
    where: ClubWhereUniqueInput
    /**
     * In case the Club found by the `where` argument doesn't exist, create a new Club with this data.
     */
    create: XOR<ClubCreateInput, ClubUncheckedCreateInput>
    /**
     * In case the Club was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClubUpdateInput, ClubUncheckedUpdateInput>
  }

  /**
   * Club delete
   */
  export type ClubDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
    /**
     * Filter which Club to delete.
     */
    where: ClubWhereUniqueInput
  }

  /**
   * Club deleteMany
   */
  export type ClubDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Clubs to delete
     */
    where?: ClubWhereInput
    /**
     * Limit how many Clubs to delete.
     */
    limit?: number
  }

  /**
   * Club.users
   */
  export type Club$usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Club.athletes
   */
  export type Club$athletesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    where?: AthleteWhereInput
    orderBy?: AthleteOrderByWithRelationInput | AthleteOrderByWithRelationInput[]
    cursor?: AthleteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AthleteScalarFieldEnum | AthleteScalarFieldEnum[]
  }

  /**
   * Club.teams
   */
  export type Club$teamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    cursor?: TeamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Club.entries
   */
  export type Club$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    cursor?: EntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Club.invoices
   */
  export type Club$invoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    cursor?: InvoiceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Club without action
   */
  export type ClubDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Club
     */
    select?: ClubSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Club
     */
    omit?: ClubOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClubInclude<ExtArgs> | null
  }


  /**
   * Model Event
   */

  export type AggregateEvent = {
    _count: EventCountAggregateOutputType | null
    _min: EventMinAggregateOutputType | null
    _max: EventMaxAggregateOutputType | null
  }

  export type EventMinAggregateOutputType = {
    id: string | null
    name: string | null
    venue: string | null
    city: string | null
    country: string | null
    startDate: Date | null
    regOpen: Date | null
    regClose: Date | null
    configJson: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EventMaxAggregateOutputType = {
    id: string | null
    name: string | null
    venue: string | null
    city: string | null
    country: string | null
    startDate: Date | null
    regOpen: Date | null
    regClose: Date | null
    configJson: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EventCountAggregateOutputType = {
    id: number
    name: number
    venue: number
    city: number
    country: number
    startDate: number
    regOpen: number
    regClose: number
    configJson: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EventMinAggregateInputType = {
    id?: true
    name?: true
    venue?: true
    city?: true
    country?: true
    startDate?: true
    regOpen?: true
    regClose?: true
    configJson?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EventMaxAggregateInputType = {
    id?: true
    name?: true
    venue?: true
    city?: true
    country?: true
    startDate?: true
    regOpen?: true
    regClose?: true
    configJson?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EventCountAggregateInputType = {
    id?: true
    name?: true
    venue?: true
    city?: true
    country?: true
    startDate?: true
    regOpen?: true
    regClose?: true
    configJson?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Event to aggregate.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Events
    **/
    _count?: true | EventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventMaxAggregateInputType
  }

  export type GetEventAggregateType<T extends EventAggregateArgs> = {
        [P in keyof T & keyof AggregateEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEvent[P]>
      : GetScalarType<T[P], AggregateEvent[P]>
  }




  export type EventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventWhereInput
    orderBy?: EventOrderByWithAggregationInput | EventOrderByWithAggregationInput[]
    by: EventScalarFieldEnum[] | EventScalarFieldEnum
    having?: EventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventCountAggregateInputType | true
    _min?: EventMinAggregateInputType
    _max?: EventMaxAggregateInputType
  }

  export type EventGroupByOutputType = {
    id: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date
    regOpen: Date
    regClose: Date
    configJson: string
    createdAt: Date
    updatedAt: Date
    _count: EventCountAggregateOutputType | null
    _min: EventMinAggregateOutputType | null
    _max: EventMaxAggregateOutputType | null
  }

  type GetEventGroupByPayload<T extends EventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventGroupByOutputType[P]>
            : GetScalarType<T[P], EventGroupByOutputType[P]>
        }
      >
    >


  export type EventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    venue?: boolean
    city?: boolean
    country?: boolean
    startDate?: boolean
    regOpen?: boolean
    regClose?: boolean
    configJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    divisions?: boolean | Event$divisionsArgs<ExtArgs>
    weightClasses?: boolean | Event$weightClassesArgs<ExtArgs>
    entries?: boolean | Event$entriesArgs<ExtArgs>
    teams?: boolean | Event$teamsArgs<ExtArgs>
    invoices?: boolean | Event$invoicesArgs<ExtArgs>
    _count?: boolean | EventCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["event"]>

  export type EventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    venue?: boolean
    city?: boolean
    country?: boolean
    startDate?: boolean
    regOpen?: boolean
    regClose?: boolean
    configJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["event"]>

  export type EventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    venue?: boolean
    city?: boolean
    country?: boolean
    startDate?: boolean
    regOpen?: boolean
    regClose?: boolean
    configJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["event"]>

  export type EventSelectScalar = {
    id?: boolean
    name?: boolean
    venue?: boolean
    city?: boolean
    country?: boolean
    startDate?: boolean
    regOpen?: boolean
    regClose?: boolean
    configJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "venue" | "city" | "country" | "startDate" | "regOpen" | "regClose" | "configJson" | "createdAt" | "updatedAt", ExtArgs["result"]["event"]>
  export type EventInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    divisions?: boolean | Event$divisionsArgs<ExtArgs>
    weightClasses?: boolean | Event$weightClassesArgs<ExtArgs>
    entries?: boolean | Event$entriesArgs<ExtArgs>
    teams?: boolean | Event$teamsArgs<ExtArgs>
    invoices?: boolean | Event$invoicesArgs<ExtArgs>
    _count?: boolean | EventCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EventIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type EventIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $EventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Event"
    objects: {
      divisions: Prisma.$DivisionPayload<ExtArgs>[]
      weightClasses: Prisma.$WeightClassPayload<ExtArgs>[]
      entries: Prisma.$EntryPayload<ExtArgs>[]
      teams: Prisma.$TeamPayload<ExtArgs>[]
      invoices: Prisma.$InvoicePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      venue: string
      city: string
      country: string
      startDate: Date
      regOpen: Date
      regClose: Date
      /**
       * JSON string of your YAML config (persisted snapshot)
       */
      configJson: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["event"]>
    composites: {}
  }

  type EventGetPayload<S extends boolean | null | undefined | EventDefaultArgs> = $Result.GetResult<Prisma.$EventPayload, S>

  type EventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventCountAggregateInputType | true
    }

  export interface EventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Event'], meta: { name: 'Event' } }
    /**
     * Find zero or one Event that matches the filter.
     * @param {EventFindUniqueArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventFindUniqueArgs>(args: SelectSubset<T, EventFindUniqueArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Event that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventFindUniqueOrThrowArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventFindUniqueOrThrowArgs>(args: SelectSubset<T, EventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Event that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventFindFirstArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventFindFirstArgs>(args?: SelectSubset<T, EventFindFirstArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Event that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventFindFirstOrThrowArgs} args - Arguments to find a Event
     * @example
     * // Get one Event
     * const event = await prisma.event.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventFindFirstOrThrowArgs>(args?: SelectSubset<T, EventFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Events that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Events
     * const events = await prisma.event.findMany()
     * 
     * // Get first 10 Events
     * const events = await prisma.event.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventWithIdOnly = await prisma.event.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventFindManyArgs>(args?: SelectSubset<T, EventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Event.
     * @param {EventCreateArgs} args - Arguments to create a Event.
     * @example
     * // Create one Event
     * const Event = await prisma.event.create({
     *   data: {
     *     // ... data to create a Event
     *   }
     * })
     * 
     */
    create<T extends EventCreateArgs>(args: SelectSubset<T, EventCreateArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Events.
     * @param {EventCreateManyArgs} args - Arguments to create many Events.
     * @example
     * // Create many Events
     * const event = await prisma.event.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventCreateManyArgs>(args?: SelectSubset<T, EventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Events and returns the data saved in the database.
     * @param {EventCreateManyAndReturnArgs} args - Arguments to create many Events.
     * @example
     * // Create many Events
     * const event = await prisma.event.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Events and only return the `id`
     * const eventWithIdOnly = await prisma.event.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventCreateManyAndReturnArgs>(args?: SelectSubset<T, EventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Event.
     * @param {EventDeleteArgs} args - Arguments to delete one Event.
     * @example
     * // Delete one Event
     * const Event = await prisma.event.delete({
     *   where: {
     *     // ... filter to delete one Event
     *   }
     * })
     * 
     */
    delete<T extends EventDeleteArgs>(args: SelectSubset<T, EventDeleteArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Event.
     * @param {EventUpdateArgs} args - Arguments to update one Event.
     * @example
     * // Update one Event
     * const event = await prisma.event.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventUpdateArgs>(args: SelectSubset<T, EventUpdateArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Events.
     * @param {EventDeleteManyArgs} args - Arguments to filter Events to delete.
     * @example
     * // Delete a few Events
     * const { count } = await prisma.event.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventDeleteManyArgs>(args?: SelectSubset<T, EventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Events
     * const event = await prisma.event.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventUpdateManyArgs>(args: SelectSubset<T, EventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Events and returns the data updated in the database.
     * @param {EventUpdateManyAndReturnArgs} args - Arguments to update many Events.
     * @example
     * // Update many Events
     * const event = await prisma.event.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Events and only return the `id`
     * const eventWithIdOnly = await prisma.event.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventUpdateManyAndReturnArgs>(args: SelectSubset<T, EventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Event.
     * @param {EventUpsertArgs} args - Arguments to update or create a Event.
     * @example
     * // Update or create a Event
     * const event = await prisma.event.upsert({
     *   create: {
     *     // ... data to create a Event
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Event we want to update
     *   }
     * })
     */
    upsert<T extends EventUpsertArgs>(args: SelectSubset<T, EventUpsertArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventCountArgs} args - Arguments to filter Events to count.
     * @example
     * // Count the number of Events
     * const count = await prisma.event.count({
     *   where: {
     *     // ... the filter for the Events we want to count
     *   }
     * })
    **/
    count<T extends EventCountArgs>(
      args?: Subset<T, EventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Event.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventAggregateArgs>(args: Subset<T, EventAggregateArgs>): Prisma.PrismaPromise<GetEventAggregateType<T>>

    /**
     * Group by Event.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventGroupByArgs['orderBy'] }
        : { orderBy?: EventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Event model
   */
  readonly fields: EventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Event.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    divisions<T extends Event$divisionsArgs<ExtArgs> = {}>(args?: Subset<T, Event$divisionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    weightClasses<T extends Event$weightClassesArgs<ExtArgs> = {}>(args?: Subset<T, Event$weightClassesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    entries<T extends Event$entriesArgs<ExtArgs> = {}>(args?: Subset<T, Event$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    teams<T extends Event$teamsArgs<ExtArgs> = {}>(args?: Subset<T, Event$teamsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    invoices<T extends Event$invoicesArgs<ExtArgs> = {}>(args?: Subset<T, Event$invoicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Event model
   */
  interface EventFieldRefs {
    readonly id: FieldRef<"Event", 'String'>
    readonly name: FieldRef<"Event", 'String'>
    readonly venue: FieldRef<"Event", 'String'>
    readonly city: FieldRef<"Event", 'String'>
    readonly country: FieldRef<"Event", 'String'>
    readonly startDate: FieldRef<"Event", 'DateTime'>
    readonly regOpen: FieldRef<"Event", 'DateTime'>
    readonly regClose: FieldRef<"Event", 'DateTime'>
    readonly configJson: FieldRef<"Event", 'String'>
    readonly createdAt: FieldRef<"Event", 'DateTime'>
    readonly updatedAt: FieldRef<"Event", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Event findUnique
   */
  export type EventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event findUniqueOrThrow
   */
  export type EventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event findFirst
   */
  export type EventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Events.
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Events.
     */
    distinct?: EventScalarFieldEnum | EventScalarFieldEnum[]
  }

  /**
   * Event findFirstOrThrow
   */
  export type EventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Event to fetch.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Events.
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Events.
     */
    distinct?: EventScalarFieldEnum | EventScalarFieldEnum[]
  }

  /**
   * Event findMany
   */
  export type EventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter, which Events to fetch.
     */
    where?: EventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Events to fetch.
     */
    orderBy?: EventOrderByWithRelationInput | EventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Events.
     */
    cursor?: EventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Events.
     */
    skip?: number
    distinct?: EventScalarFieldEnum | EventScalarFieldEnum[]
  }

  /**
   * Event create
   */
  export type EventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * The data needed to create a Event.
     */
    data: XOR<EventCreateInput, EventUncheckedCreateInput>
  }

  /**
   * Event createMany
   */
  export type EventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Events.
     */
    data: EventCreateManyInput | EventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Event createManyAndReturn
   */
  export type EventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * The data used to create many Events.
     */
    data: EventCreateManyInput | EventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Event update
   */
  export type EventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * The data needed to update a Event.
     */
    data: XOR<EventUpdateInput, EventUncheckedUpdateInput>
    /**
     * Choose, which Event to update.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event updateMany
   */
  export type EventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Events.
     */
    data: XOR<EventUpdateManyMutationInput, EventUncheckedUpdateManyInput>
    /**
     * Filter which Events to update
     */
    where?: EventWhereInput
    /**
     * Limit how many Events to update.
     */
    limit?: number
  }

  /**
   * Event updateManyAndReturn
   */
  export type EventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * The data used to update Events.
     */
    data: XOR<EventUpdateManyMutationInput, EventUncheckedUpdateManyInput>
    /**
     * Filter which Events to update
     */
    where?: EventWhereInput
    /**
     * Limit how many Events to update.
     */
    limit?: number
  }

  /**
   * Event upsert
   */
  export type EventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * The filter to search for the Event to update in case it exists.
     */
    where: EventWhereUniqueInput
    /**
     * In case the Event found by the `where` argument doesn't exist, create a new Event with this data.
     */
    create: XOR<EventCreateInput, EventUncheckedCreateInput>
    /**
     * In case the Event was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventUpdateInput, EventUncheckedUpdateInput>
  }

  /**
   * Event delete
   */
  export type EventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
    /**
     * Filter which Event to delete.
     */
    where: EventWhereUniqueInput
  }

  /**
   * Event deleteMany
   */
  export type EventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Events to delete
     */
    where?: EventWhereInput
    /**
     * Limit how many Events to delete.
     */
    limit?: number
  }

  /**
   * Event.divisions
   */
  export type Event$divisionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    where?: DivisionWhereInput
    orderBy?: DivisionOrderByWithRelationInput | DivisionOrderByWithRelationInput[]
    cursor?: DivisionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DivisionScalarFieldEnum | DivisionScalarFieldEnum[]
  }

  /**
   * Event.weightClasses
   */
  export type Event$weightClassesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    where?: WeightClassWhereInput
    orderBy?: WeightClassOrderByWithRelationInput | WeightClassOrderByWithRelationInput[]
    cursor?: WeightClassWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WeightClassScalarFieldEnum | WeightClassScalarFieldEnum[]
  }

  /**
   * Event.entries
   */
  export type Event$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    cursor?: EntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Event.teams
   */
  export type Event$teamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    cursor?: TeamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Event.invoices
   */
  export type Event$invoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    cursor?: InvoiceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Event without action
   */
  export type EventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event
     */
    select?: EventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Event
     */
    omit?: EventOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EventInclude<ExtArgs> | null
  }


  /**
   * Model Division
   */

  export type AggregateDivision = {
    _count: DivisionCountAggregateOutputType | null
    _avg: DivisionAvgAggregateOutputType | null
    _sum: DivisionSumAggregateOutputType | null
    _min: DivisionMinAggregateOutputType | null
    _max: DivisionMaxAggregateOutputType | null
  }

  export type DivisionAvgAggregateOutputType = {
    minAge: number | null
    maxAge: number | null
  }

  export type DivisionSumAggregateOutputType = {
    minAge: number | null
    maxAge: number | null
  }

  export type DivisionMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    key: string | null
    name: string | null
    minAge: number | null
    maxAge: number | null
    gender: $Enums.Gender | null
    notes: string | null
  }

  export type DivisionMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    key: string | null
    name: string | null
    minAge: number | null
    maxAge: number | null
    gender: $Enums.Gender | null
    notes: string | null
  }

  export type DivisionCountAggregateOutputType = {
    id: number
    eventId: number
    key: number
    name: number
    minAge: number
    maxAge: number
    gender: number
    notes: number
    _all: number
  }


  export type DivisionAvgAggregateInputType = {
    minAge?: true
    maxAge?: true
  }

  export type DivisionSumAggregateInputType = {
    minAge?: true
    maxAge?: true
  }

  export type DivisionMinAggregateInputType = {
    id?: true
    eventId?: true
    key?: true
    name?: true
    minAge?: true
    maxAge?: true
    gender?: true
    notes?: true
  }

  export type DivisionMaxAggregateInputType = {
    id?: true
    eventId?: true
    key?: true
    name?: true
    minAge?: true
    maxAge?: true
    gender?: true
    notes?: true
  }

  export type DivisionCountAggregateInputType = {
    id?: true
    eventId?: true
    key?: true
    name?: true
    minAge?: true
    maxAge?: true
    gender?: true
    notes?: true
    _all?: true
  }

  export type DivisionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Division to aggregate.
     */
    where?: DivisionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Divisions to fetch.
     */
    orderBy?: DivisionOrderByWithRelationInput | DivisionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DivisionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Divisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Divisions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Divisions
    **/
    _count?: true | DivisionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DivisionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DivisionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DivisionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DivisionMaxAggregateInputType
  }

  export type GetDivisionAggregateType<T extends DivisionAggregateArgs> = {
        [P in keyof T & keyof AggregateDivision]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDivision[P]>
      : GetScalarType<T[P], AggregateDivision[P]>
  }




  export type DivisionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DivisionWhereInput
    orderBy?: DivisionOrderByWithAggregationInput | DivisionOrderByWithAggregationInput[]
    by: DivisionScalarFieldEnum[] | DivisionScalarFieldEnum
    having?: DivisionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DivisionCountAggregateInputType | true
    _avg?: DivisionAvgAggregateInputType
    _sum?: DivisionSumAggregateInputType
    _min?: DivisionMinAggregateInputType
    _max?: DivisionMaxAggregateInputType
  }

  export type DivisionGroupByOutputType = {
    id: string
    eventId: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes: string | null
    _count: DivisionCountAggregateOutputType | null
    _avg: DivisionAvgAggregateOutputType | null
    _sum: DivisionSumAggregateOutputType | null
    _min: DivisionMinAggregateOutputType | null
    _max: DivisionMaxAggregateOutputType | null
  }

  type GetDivisionGroupByPayload<T extends DivisionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DivisionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DivisionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DivisionGroupByOutputType[P]>
            : GetScalarType<T[P], DivisionGroupByOutputType[P]>
        }
      >
    >


  export type DivisionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    key?: boolean
    name?: boolean
    minAge?: boolean
    maxAge?: boolean
    gender?: boolean
    notes?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    entries?: boolean | Division$entriesArgs<ExtArgs>
    teams?: boolean | Division$teamsArgs<ExtArgs>
    weightClasses?: boolean | Division$weightClassesArgs<ExtArgs>
    _count?: boolean | DivisionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["division"]>

  export type DivisionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    key?: boolean
    name?: boolean
    minAge?: boolean
    maxAge?: boolean
    gender?: boolean
    notes?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["division"]>

  export type DivisionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    key?: boolean
    name?: boolean
    minAge?: boolean
    maxAge?: boolean
    gender?: boolean
    notes?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["division"]>

  export type DivisionSelectScalar = {
    id?: boolean
    eventId?: boolean
    key?: boolean
    name?: boolean
    minAge?: boolean
    maxAge?: boolean
    gender?: boolean
    notes?: boolean
  }

  export type DivisionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "key" | "name" | "minAge" | "maxAge" | "gender" | "notes", ExtArgs["result"]["division"]>
  export type DivisionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    entries?: boolean | Division$entriesArgs<ExtArgs>
    teams?: boolean | Division$teamsArgs<ExtArgs>
    weightClasses?: boolean | Division$weightClassesArgs<ExtArgs>
    _count?: boolean | DivisionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DivisionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type DivisionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
  }

  export type $DivisionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Division"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
      entries: Prisma.$EntryPayload<ExtArgs>[]
      teams: Prisma.$TeamPayload<ExtArgs>[]
      weightClasses: Prisma.$WeightClassPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      key: string
      name: string
      minAge: number
      maxAge: number
      gender: $Enums.Gender
      notes: string | null
    }, ExtArgs["result"]["division"]>
    composites: {}
  }

  type DivisionGetPayload<S extends boolean | null | undefined | DivisionDefaultArgs> = $Result.GetResult<Prisma.$DivisionPayload, S>

  type DivisionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DivisionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DivisionCountAggregateInputType | true
    }

  export interface DivisionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Division'], meta: { name: 'Division' } }
    /**
     * Find zero or one Division that matches the filter.
     * @param {DivisionFindUniqueArgs} args - Arguments to find a Division
     * @example
     * // Get one Division
     * const division = await prisma.division.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DivisionFindUniqueArgs>(args: SelectSubset<T, DivisionFindUniqueArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Division that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DivisionFindUniqueOrThrowArgs} args - Arguments to find a Division
     * @example
     * // Get one Division
     * const division = await prisma.division.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DivisionFindUniqueOrThrowArgs>(args: SelectSubset<T, DivisionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Division that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionFindFirstArgs} args - Arguments to find a Division
     * @example
     * // Get one Division
     * const division = await prisma.division.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DivisionFindFirstArgs>(args?: SelectSubset<T, DivisionFindFirstArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Division that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionFindFirstOrThrowArgs} args - Arguments to find a Division
     * @example
     * // Get one Division
     * const division = await prisma.division.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DivisionFindFirstOrThrowArgs>(args?: SelectSubset<T, DivisionFindFirstOrThrowArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Divisions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Divisions
     * const divisions = await prisma.division.findMany()
     * 
     * // Get first 10 Divisions
     * const divisions = await prisma.division.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const divisionWithIdOnly = await prisma.division.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DivisionFindManyArgs>(args?: SelectSubset<T, DivisionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Division.
     * @param {DivisionCreateArgs} args - Arguments to create a Division.
     * @example
     * // Create one Division
     * const Division = await prisma.division.create({
     *   data: {
     *     // ... data to create a Division
     *   }
     * })
     * 
     */
    create<T extends DivisionCreateArgs>(args: SelectSubset<T, DivisionCreateArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Divisions.
     * @param {DivisionCreateManyArgs} args - Arguments to create many Divisions.
     * @example
     * // Create many Divisions
     * const division = await prisma.division.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DivisionCreateManyArgs>(args?: SelectSubset<T, DivisionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Divisions and returns the data saved in the database.
     * @param {DivisionCreateManyAndReturnArgs} args - Arguments to create many Divisions.
     * @example
     * // Create many Divisions
     * const division = await prisma.division.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Divisions and only return the `id`
     * const divisionWithIdOnly = await prisma.division.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DivisionCreateManyAndReturnArgs>(args?: SelectSubset<T, DivisionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Division.
     * @param {DivisionDeleteArgs} args - Arguments to delete one Division.
     * @example
     * // Delete one Division
     * const Division = await prisma.division.delete({
     *   where: {
     *     // ... filter to delete one Division
     *   }
     * })
     * 
     */
    delete<T extends DivisionDeleteArgs>(args: SelectSubset<T, DivisionDeleteArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Division.
     * @param {DivisionUpdateArgs} args - Arguments to update one Division.
     * @example
     * // Update one Division
     * const division = await prisma.division.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DivisionUpdateArgs>(args: SelectSubset<T, DivisionUpdateArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Divisions.
     * @param {DivisionDeleteManyArgs} args - Arguments to filter Divisions to delete.
     * @example
     * // Delete a few Divisions
     * const { count } = await prisma.division.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DivisionDeleteManyArgs>(args?: SelectSubset<T, DivisionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Divisions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Divisions
     * const division = await prisma.division.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DivisionUpdateManyArgs>(args: SelectSubset<T, DivisionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Divisions and returns the data updated in the database.
     * @param {DivisionUpdateManyAndReturnArgs} args - Arguments to update many Divisions.
     * @example
     * // Update many Divisions
     * const division = await prisma.division.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Divisions and only return the `id`
     * const divisionWithIdOnly = await prisma.division.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DivisionUpdateManyAndReturnArgs>(args: SelectSubset<T, DivisionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Division.
     * @param {DivisionUpsertArgs} args - Arguments to update or create a Division.
     * @example
     * // Update or create a Division
     * const division = await prisma.division.upsert({
     *   create: {
     *     // ... data to create a Division
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Division we want to update
     *   }
     * })
     */
    upsert<T extends DivisionUpsertArgs>(args: SelectSubset<T, DivisionUpsertArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Divisions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionCountArgs} args - Arguments to filter Divisions to count.
     * @example
     * // Count the number of Divisions
     * const count = await prisma.division.count({
     *   where: {
     *     // ... the filter for the Divisions we want to count
     *   }
     * })
    **/
    count<T extends DivisionCountArgs>(
      args?: Subset<T, DivisionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DivisionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Division.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DivisionAggregateArgs>(args: Subset<T, DivisionAggregateArgs>): Prisma.PrismaPromise<GetDivisionAggregateType<T>>

    /**
     * Group by Division.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DivisionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DivisionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DivisionGroupByArgs['orderBy'] }
        : { orderBy?: DivisionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DivisionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDivisionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Division model
   */
  readonly fields: DivisionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Division.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DivisionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    entries<T extends Division$entriesArgs<ExtArgs> = {}>(args?: Subset<T, Division$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    teams<T extends Division$teamsArgs<ExtArgs> = {}>(args?: Subset<T, Division$teamsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    weightClasses<T extends Division$weightClassesArgs<ExtArgs> = {}>(args?: Subset<T, Division$weightClassesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Division model
   */
  interface DivisionFieldRefs {
    readonly id: FieldRef<"Division", 'String'>
    readonly eventId: FieldRef<"Division", 'String'>
    readonly key: FieldRef<"Division", 'String'>
    readonly name: FieldRef<"Division", 'String'>
    readonly minAge: FieldRef<"Division", 'Int'>
    readonly maxAge: FieldRef<"Division", 'Int'>
    readonly gender: FieldRef<"Division", 'Gender'>
    readonly notes: FieldRef<"Division", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Division findUnique
   */
  export type DivisionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * Filter, which Division to fetch.
     */
    where: DivisionWhereUniqueInput
  }

  /**
   * Division findUniqueOrThrow
   */
  export type DivisionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * Filter, which Division to fetch.
     */
    where: DivisionWhereUniqueInput
  }

  /**
   * Division findFirst
   */
  export type DivisionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * Filter, which Division to fetch.
     */
    where?: DivisionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Divisions to fetch.
     */
    orderBy?: DivisionOrderByWithRelationInput | DivisionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Divisions.
     */
    cursor?: DivisionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Divisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Divisions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Divisions.
     */
    distinct?: DivisionScalarFieldEnum | DivisionScalarFieldEnum[]
  }

  /**
   * Division findFirstOrThrow
   */
  export type DivisionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * Filter, which Division to fetch.
     */
    where?: DivisionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Divisions to fetch.
     */
    orderBy?: DivisionOrderByWithRelationInput | DivisionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Divisions.
     */
    cursor?: DivisionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Divisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Divisions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Divisions.
     */
    distinct?: DivisionScalarFieldEnum | DivisionScalarFieldEnum[]
  }

  /**
   * Division findMany
   */
  export type DivisionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * Filter, which Divisions to fetch.
     */
    where?: DivisionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Divisions to fetch.
     */
    orderBy?: DivisionOrderByWithRelationInput | DivisionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Divisions.
     */
    cursor?: DivisionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Divisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Divisions.
     */
    skip?: number
    distinct?: DivisionScalarFieldEnum | DivisionScalarFieldEnum[]
  }

  /**
   * Division create
   */
  export type DivisionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * The data needed to create a Division.
     */
    data: XOR<DivisionCreateInput, DivisionUncheckedCreateInput>
  }

  /**
   * Division createMany
   */
  export type DivisionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Divisions.
     */
    data: DivisionCreateManyInput | DivisionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Division createManyAndReturn
   */
  export type DivisionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * The data used to create many Divisions.
     */
    data: DivisionCreateManyInput | DivisionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Division update
   */
  export type DivisionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * The data needed to update a Division.
     */
    data: XOR<DivisionUpdateInput, DivisionUncheckedUpdateInput>
    /**
     * Choose, which Division to update.
     */
    where: DivisionWhereUniqueInput
  }

  /**
   * Division updateMany
   */
  export type DivisionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Divisions.
     */
    data: XOR<DivisionUpdateManyMutationInput, DivisionUncheckedUpdateManyInput>
    /**
     * Filter which Divisions to update
     */
    where?: DivisionWhereInput
    /**
     * Limit how many Divisions to update.
     */
    limit?: number
  }

  /**
   * Division updateManyAndReturn
   */
  export type DivisionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * The data used to update Divisions.
     */
    data: XOR<DivisionUpdateManyMutationInput, DivisionUncheckedUpdateManyInput>
    /**
     * Filter which Divisions to update
     */
    where?: DivisionWhereInput
    /**
     * Limit how many Divisions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Division upsert
   */
  export type DivisionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * The filter to search for the Division to update in case it exists.
     */
    where: DivisionWhereUniqueInput
    /**
     * In case the Division found by the `where` argument doesn't exist, create a new Division with this data.
     */
    create: XOR<DivisionCreateInput, DivisionUncheckedCreateInput>
    /**
     * In case the Division was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DivisionUpdateInput, DivisionUncheckedUpdateInput>
  }

  /**
   * Division delete
   */
  export type DivisionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    /**
     * Filter which Division to delete.
     */
    where: DivisionWhereUniqueInput
  }

  /**
   * Division deleteMany
   */
  export type DivisionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Divisions to delete
     */
    where?: DivisionWhereInput
    /**
     * Limit how many Divisions to delete.
     */
    limit?: number
  }

  /**
   * Division.entries
   */
  export type Division$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    cursor?: EntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Division.teams
   */
  export type Division$teamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    cursor?: TeamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Division.weightClasses
   */
  export type Division$weightClassesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    where?: WeightClassWhereInput
    orderBy?: WeightClassOrderByWithRelationInput | WeightClassOrderByWithRelationInput[]
    cursor?: WeightClassWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WeightClassScalarFieldEnum | WeightClassScalarFieldEnum[]
  }

  /**
   * Division without action
   */
  export type DivisionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
  }


  /**
   * Model WeightClass
   */

  export type AggregateWeightClass = {
    _count: WeightClassCountAggregateOutputType | null
    _avg: WeightClassAvgAggregateOutputType | null
    _sum: WeightClassSumAggregateOutputType | null
    _min: WeightClassMinAggregateOutputType | null
    _max: WeightClassMaxAggregateOutputType | null
  }

  export type WeightClassAvgAggregateOutputType = {
    minKg: number | null
    maxKg: number | null
  }

  export type WeightClassSumAggregateOutputType = {
    minKg: number | null
    maxKg: number | null
  }

  export type WeightClassMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    divisionId: string | null
    gender: $Enums.Gender | null
    name: string | null
    minKg: number | null
    maxKg: number | null
  }

  export type WeightClassMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    divisionId: string | null
    gender: $Enums.Gender | null
    name: string | null
    minKg: number | null
    maxKg: number | null
  }

  export type WeightClassCountAggregateOutputType = {
    id: number
    eventId: number
    divisionId: number
    gender: number
    name: number
    minKg: number
    maxKg: number
    _all: number
  }


  export type WeightClassAvgAggregateInputType = {
    minKg?: true
    maxKg?: true
  }

  export type WeightClassSumAggregateInputType = {
    minKg?: true
    maxKg?: true
  }

  export type WeightClassMinAggregateInputType = {
    id?: true
    eventId?: true
    divisionId?: true
    gender?: true
    name?: true
    minKg?: true
    maxKg?: true
  }

  export type WeightClassMaxAggregateInputType = {
    id?: true
    eventId?: true
    divisionId?: true
    gender?: true
    name?: true
    minKg?: true
    maxKg?: true
  }

  export type WeightClassCountAggregateInputType = {
    id?: true
    eventId?: true
    divisionId?: true
    gender?: true
    name?: true
    minKg?: true
    maxKg?: true
    _all?: true
  }

  export type WeightClassAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WeightClass to aggregate.
     */
    where?: WeightClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeightClasses to fetch.
     */
    orderBy?: WeightClassOrderByWithRelationInput | WeightClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WeightClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeightClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeightClasses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WeightClasses
    **/
    _count?: true | WeightClassCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WeightClassAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WeightClassSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WeightClassMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WeightClassMaxAggregateInputType
  }

  export type GetWeightClassAggregateType<T extends WeightClassAggregateArgs> = {
        [P in keyof T & keyof AggregateWeightClass]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWeightClass[P]>
      : GetScalarType<T[P], AggregateWeightClass[P]>
  }




  export type WeightClassGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WeightClassWhereInput
    orderBy?: WeightClassOrderByWithAggregationInput | WeightClassOrderByWithAggregationInput[]
    by: WeightClassScalarFieldEnum[] | WeightClassScalarFieldEnum
    having?: WeightClassScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WeightClassCountAggregateInputType | true
    _avg?: WeightClassAvgAggregateInputType
    _sum?: WeightClassSumAggregateInputType
    _min?: WeightClassMinAggregateInputType
    _max?: WeightClassMaxAggregateInputType
  }

  export type WeightClassGroupByOutputType = {
    id: string
    eventId: string
    divisionId: string | null
    gender: $Enums.Gender
    name: string
    minKg: number | null
    maxKg: number | null
    _count: WeightClassCountAggregateOutputType | null
    _avg: WeightClassAvgAggregateOutputType | null
    _sum: WeightClassSumAggregateOutputType | null
    _min: WeightClassMinAggregateOutputType | null
    _max: WeightClassMaxAggregateOutputType | null
  }

  type GetWeightClassGroupByPayload<T extends WeightClassGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WeightClassGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WeightClassGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WeightClassGroupByOutputType[P]>
            : GetScalarType<T[P], WeightClassGroupByOutputType[P]>
        }
      >
    >


  export type WeightClassSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    divisionId?: boolean
    gender?: boolean
    name?: boolean
    minKg?: boolean
    maxKg?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    division?: boolean | WeightClass$divisionArgs<ExtArgs>
    entries?: boolean | WeightClass$entriesArgs<ExtArgs>
    _count?: boolean | WeightClassCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["weightClass"]>

  export type WeightClassSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    divisionId?: boolean
    gender?: boolean
    name?: boolean
    minKg?: boolean
    maxKg?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    division?: boolean | WeightClass$divisionArgs<ExtArgs>
  }, ExtArgs["result"]["weightClass"]>

  export type WeightClassSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    divisionId?: boolean
    gender?: boolean
    name?: boolean
    minKg?: boolean
    maxKg?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    division?: boolean | WeightClass$divisionArgs<ExtArgs>
  }, ExtArgs["result"]["weightClass"]>

  export type WeightClassSelectScalar = {
    id?: boolean
    eventId?: boolean
    divisionId?: boolean
    gender?: boolean
    name?: boolean
    minKg?: boolean
    maxKg?: boolean
  }

  export type WeightClassOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "divisionId" | "gender" | "name" | "minKg" | "maxKg", ExtArgs["result"]["weightClass"]>
  export type WeightClassInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    division?: boolean | WeightClass$divisionArgs<ExtArgs>
    entries?: boolean | WeightClass$entriesArgs<ExtArgs>
    _count?: boolean | WeightClassCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WeightClassIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    division?: boolean | WeightClass$divisionArgs<ExtArgs>
  }
  export type WeightClassIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    division?: boolean | WeightClass$divisionArgs<ExtArgs>
  }

  export type $WeightClassPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WeightClass"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
      division: Prisma.$DivisionPayload<ExtArgs> | null
      entries: Prisma.$EntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      divisionId: string | null
      gender: $Enums.Gender
      name: string
      minKg: number | null
      maxKg: number | null
    }, ExtArgs["result"]["weightClass"]>
    composites: {}
  }

  type WeightClassGetPayload<S extends boolean | null | undefined | WeightClassDefaultArgs> = $Result.GetResult<Prisma.$WeightClassPayload, S>

  type WeightClassCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WeightClassFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WeightClassCountAggregateInputType | true
    }

  export interface WeightClassDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WeightClass'], meta: { name: 'WeightClass' } }
    /**
     * Find zero or one WeightClass that matches the filter.
     * @param {WeightClassFindUniqueArgs} args - Arguments to find a WeightClass
     * @example
     * // Get one WeightClass
     * const weightClass = await prisma.weightClass.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WeightClassFindUniqueArgs>(args: SelectSubset<T, WeightClassFindUniqueArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WeightClass that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WeightClassFindUniqueOrThrowArgs} args - Arguments to find a WeightClass
     * @example
     * // Get one WeightClass
     * const weightClass = await prisma.weightClass.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WeightClassFindUniqueOrThrowArgs>(args: SelectSubset<T, WeightClassFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WeightClass that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassFindFirstArgs} args - Arguments to find a WeightClass
     * @example
     * // Get one WeightClass
     * const weightClass = await prisma.weightClass.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WeightClassFindFirstArgs>(args?: SelectSubset<T, WeightClassFindFirstArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WeightClass that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassFindFirstOrThrowArgs} args - Arguments to find a WeightClass
     * @example
     * // Get one WeightClass
     * const weightClass = await prisma.weightClass.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WeightClassFindFirstOrThrowArgs>(args?: SelectSubset<T, WeightClassFindFirstOrThrowArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WeightClasses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WeightClasses
     * const weightClasses = await prisma.weightClass.findMany()
     * 
     * // Get first 10 WeightClasses
     * const weightClasses = await prisma.weightClass.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const weightClassWithIdOnly = await prisma.weightClass.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WeightClassFindManyArgs>(args?: SelectSubset<T, WeightClassFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WeightClass.
     * @param {WeightClassCreateArgs} args - Arguments to create a WeightClass.
     * @example
     * // Create one WeightClass
     * const WeightClass = await prisma.weightClass.create({
     *   data: {
     *     // ... data to create a WeightClass
     *   }
     * })
     * 
     */
    create<T extends WeightClassCreateArgs>(args: SelectSubset<T, WeightClassCreateArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WeightClasses.
     * @param {WeightClassCreateManyArgs} args - Arguments to create many WeightClasses.
     * @example
     * // Create many WeightClasses
     * const weightClass = await prisma.weightClass.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WeightClassCreateManyArgs>(args?: SelectSubset<T, WeightClassCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WeightClasses and returns the data saved in the database.
     * @param {WeightClassCreateManyAndReturnArgs} args - Arguments to create many WeightClasses.
     * @example
     * // Create many WeightClasses
     * const weightClass = await prisma.weightClass.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WeightClasses and only return the `id`
     * const weightClassWithIdOnly = await prisma.weightClass.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WeightClassCreateManyAndReturnArgs>(args?: SelectSubset<T, WeightClassCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WeightClass.
     * @param {WeightClassDeleteArgs} args - Arguments to delete one WeightClass.
     * @example
     * // Delete one WeightClass
     * const WeightClass = await prisma.weightClass.delete({
     *   where: {
     *     // ... filter to delete one WeightClass
     *   }
     * })
     * 
     */
    delete<T extends WeightClassDeleteArgs>(args: SelectSubset<T, WeightClassDeleteArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WeightClass.
     * @param {WeightClassUpdateArgs} args - Arguments to update one WeightClass.
     * @example
     * // Update one WeightClass
     * const weightClass = await prisma.weightClass.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WeightClassUpdateArgs>(args: SelectSubset<T, WeightClassUpdateArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WeightClasses.
     * @param {WeightClassDeleteManyArgs} args - Arguments to filter WeightClasses to delete.
     * @example
     * // Delete a few WeightClasses
     * const { count } = await prisma.weightClass.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WeightClassDeleteManyArgs>(args?: SelectSubset<T, WeightClassDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WeightClasses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WeightClasses
     * const weightClass = await prisma.weightClass.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WeightClassUpdateManyArgs>(args: SelectSubset<T, WeightClassUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WeightClasses and returns the data updated in the database.
     * @param {WeightClassUpdateManyAndReturnArgs} args - Arguments to update many WeightClasses.
     * @example
     * // Update many WeightClasses
     * const weightClass = await prisma.weightClass.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WeightClasses and only return the `id`
     * const weightClassWithIdOnly = await prisma.weightClass.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WeightClassUpdateManyAndReturnArgs>(args: SelectSubset<T, WeightClassUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WeightClass.
     * @param {WeightClassUpsertArgs} args - Arguments to update or create a WeightClass.
     * @example
     * // Update or create a WeightClass
     * const weightClass = await prisma.weightClass.upsert({
     *   create: {
     *     // ... data to create a WeightClass
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WeightClass we want to update
     *   }
     * })
     */
    upsert<T extends WeightClassUpsertArgs>(args: SelectSubset<T, WeightClassUpsertArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WeightClasses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassCountArgs} args - Arguments to filter WeightClasses to count.
     * @example
     * // Count the number of WeightClasses
     * const count = await prisma.weightClass.count({
     *   where: {
     *     // ... the filter for the WeightClasses we want to count
     *   }
     * })
    **/
    count<T extends WeightClassCountArgs>(
      args?: Subset<T, WeightClassCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WeightClassCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WeightClass.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WeightClassAggregateArgs>(args: Subset<T, WeightClassAggregateArgs>): Prisma.PrismaPromise<GetWeightClassAggregateType<T>>

    /**
     * Group by WeightClass.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WeightClassGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WeightClassGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WeightClassGroupByArgs['orderBy'] }
        : { orderBy?: WeightClassGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WeightClassGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWeightClassGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WeightClass model
   */
  readonly fields: WeightClassFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WeightClass.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WeightClassClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    division<T extends WeightClass$divisionArgs<ExtArgs> = {}>(args?: Subset<T, WeightClass$divisionArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    entries<T extends WeightClass$entriesArgs<ExtArgs> = {}>(args?: Subset<T, WeightClass$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WeightClass model
   */
  interface WeightClassFieldRefs {
    readonly id: FieldRef<"WeightClass", 'String'>
    readonly eventId: FieldRef<"WeightClass", 'String'>
    readonly divisionId: FieldRef<"WeightClass", 'String'>
    readonly gender: FieldRef<"WeightClass", 'Gender'>
    readonly name: FieldRef<"WeightClass", 'String'>
    readonly minKg: FieldRef<"WeightClass", 'Float'>
    readonly maxKg: FieldRef<"WeightClass", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * WeightClass findUnique
   */
  export type WeightClassFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * Filter, which WeightClass to fetch.
     */
    where: WeightClassWhereUniqueInput
  }

  /**
   * WeightClass findUniqueOrThrow
   */
  export type WeightClassFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * Filter, which WeightClass to fetch.
     */
    where: WeightClassWhereUniqueInput
  }

  /**
   * WeightClass findFirst
   */
  export type WeightClassFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * Filter, which WeightClass to fetch.
     */
    where?: WeightClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeightClasses to fetch.
     */
    orderBy?: WeightClassOrderByWithRelationInput | WeightClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WeightClasses.
     */
    cursor?: WeightClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeightClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeightClasses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WeightClasses.
     */
    distinct?: WeightClassScalarFieldEnum | WeightClassScalarFieldEnum[]
  }

  /**
   * WeightClass findFirstOrThrow
   */
  export type WeightClassFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * Filter, which WeightClass to fetch.
     */
    where?: WeightClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeightClasses to fetch.
     */
    orderBy?: WeightClassOrderByWithRelationInput | WeightClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WeightClasses.
     */
    cursor?: WeightClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeightClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeightClasses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WeightClasses.
     */
    distinct?: WeightClassScalarFieldEnum | WeightClassScalarFieldEnum[]
  }

  /**
   * WeightClass findMany
   */
  export type WeightClassFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * Filter, which WeightClasses to fetch.
     */
    where?: WeightClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WeightClasses to fetch.
     */
    orderBy?: WeightClassOrderByWithRelationInput | WeightClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WeightClasses.
     */
    cursor?: WeightClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WeightClasses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WeightClasses.
     */
    skip?: number
    distinct?: WeightClassScalarFieldEnum | WeightClassScalarFieldEnum[]
  }

  /**
   * WeightClass create
   */
  export type WeightClassCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * The data needed to create a WeightClass.
     */
    data: XOR<WeightClassCreateInput, WeightClassUncheckedCreateInput>
  }

  /**
   * WeightClass createMany
   */
  export type WeightClassCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WeightClasses.
     */
    data: WeightClassCreateManyInput | WeightClassCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WeightClass createManyAndReturn
   */
  export type WeightClassCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * The data used to create many WeightClasses.
     */
    data: WeightClassCreateManyInput | WeightClassCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WeightClass update
   */
  export type WeightClassUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * The data needed to update a WeightClass.
     */
    data: XOR<WeightClassUpdateInput, WeightClassUncheckedUpdateInput>
    /**
     * Choose, which WeightClass to update.
     */
    where: WeightClassWhereUniqueInput
  }

  /**
   * WeightClass updateMany
   */
  export type WeightClassUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WeightClasses.
     */
    data: XOR<WeightClassUpdateManyMutationInput, WeightClassUncheckedUpdateManyInput>
    /**
     * Filter which WeightClasses to update
     */
    where?: WeightClassWhereInput
    /**
     * Limit how many WeightClasses to update.
     */
    limit?: number
  }

  /**
   * WeightClass updateManyAndReturn
   */
  export type WeightClassUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * The data used to update WeightClasses.
     */
    data: XOR<WeightClassUpdateManyMutationInput, WeightClassUncheckedUpdateManyInput>
    /**
     * Filter which WeightClasses to update
     */
    where?: WeightClassWhereInput
    /**
     * Limit how many WeightClasses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WeightClass upsert
   */
  export type WeightClassUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * The filter to search for the WeightClass to update in case it exists.
     */
    where: WeightClassWhereUniqueInput
    /**
     * In case the WeightClass found by the `where` argument doesn't exist, create a new WeightClass with this data.
     */
    create: XOR<WeightClassCreateInput, WeightClassUncheckedCreateInput>
    /**
     * In case the WeightClass was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WeightClassUpdateInput, WeightClassUncheckedUpdateInput>
  }

  /**
   * WeightClass delete
   */
  export type WeightClassDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    /**
     * Filter which WeightClass to delete.
     */
    where: WeightClassWhereUniqueInput
  }

  /**
   * WeightClass deleteMany
   */
  export type WeightClassDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WeightClasses to delete
     */
    where?: WeightClassWhereInput
    /**
     * Limit how many WeightClasses to delete.
     */
    limit?: number
  }

  /**
   * WeightClass.division
   */
  export type WeightClass$divisionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Division
     */
    select?: DivisionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Division
     */
    omit?: DivisionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DivisionInclude<ExtArgs> | null
    where?: DivisionWhereInput
  }

  /**
   * WeightClass.entries
   */
  export type WeightClass$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    cursor?: EntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * WeightClass without action
   */
  export type WeightClassDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
  }


  /**
   * Model Athlete
   */

  export type AggregateAthlete = {
    _count: AthleteCountAggregateOutputType | null
    _avg: AthleteAvgAggregateOutputType | null
    _sum: AthleteSumAggregateOutputType | null
    _min: AthleteMinAggregateOutputType | null
    _max: AthleteMaxAggregateOutputType | null
  }

  export type AthleteAvgAggregateOutputType = {
    weightKg: number | null
  }

  export type AthleteSumAggregateOutputType = {
    weightKg: number | null
  }

  export type AthleteMinAggregateOutputType = {
    id: string | null
    clubId: string | null
    firstName: string | null
    lastName: string | null
    dob: Date | null
    gender: $Enums.Gender | null
    nationality: string | null
    idType: string | null
    idNumber: string | null
    beltRank: string | null
    weightKg: number | null
    medicalNotes: string | null
    emergencyName: string | null
    emergencyPhone: string | null
    guardianName: string | null
    guardianPhone: string | null
    photoUrl: string | null
    waiverUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AthleteMaxAggregateOutputType = {
    id: string | null
    clubId: string | null
    firstName: string | null
    lastName: string | null
    dob: Date | null
    gender: $Enums.Gender | null
    nationality: string | null
    idType: string | null
    idNumber: string | null
    beltRank: string | null
    weightKg: number | null
    medicalNotes: string | null
    emergencyName: string | null
    emergencyPhone: string | null
    guardianName: string | null
    guardianPhone: string | null
    photoUrl: string | null
    waiverUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AthleteCountAggregateOutputType = {
    id: number
    clubId: number
    firstName: number
    lastName: number
    dob: number
    gender: number
    nationality: number
    idType: number
    idNumber: number
    beltRank: number
    weightKg: number
    medicalNotes: number
    emergencyName: number
    emergencyPhone: number
    guardianName: number
    guardianPhone: number
    photoUrl: number
    waiverUrl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AthleteAvgAggregateInputType = {
    weightKg?: true
  }

  export type AthleteSumAggregateInputType = {
    weightKg?: true
  }

  export type AthleteMinAggregateInputType = {
    id?: true
    clubId?: true
    firstName?: true
    lastName?: true
    dob?: true
    gender?: true
    nationality?: true
    idType?: true
    idNumber?: true
    beltRank?: true
    weightKg?: true
    medicalNotes?: true
    emergencyName?: true
    emergencyPhone?: true
    guardianName?: true
    guardianPhone?: true
    photoUrl?: true
    waiverUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AthleteMaxAggregateInputType = {
    id?: true
    clubId?: true
    firstName?: true
    lastName?: true
    dob?: true
    gender?: true
    nationality?: true
    idType?: true
    idNumber?: true
    beltRank?: true
    weightKg?: true
    medicalNotes?: true
    emergencyName?: true
    emergencyPhone?: true
    guardianName?: true
    guardianPhone?: true
    photoUrl?: true
    waiverUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AthleteCountAggregateInputType = {
    id?: true
    clubId?: true
    firstName?: true
    lastName?: true
    dob?: true
    gender?: true
    nationality?: true
    idType?: true
    idNumber?: true
    beltRank?: true
    weightKg?: true
    medicalNotes?: true
    emergencyName?: true
    emergencyPhone?: true
    guardianName?: true
    guardianPhone?: true
    photoUrl?: true
    waiverUrl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AthleteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Athlete to aggregate.
     */
    where?: AthleteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Athletes to fetch.
     */
    orderBy?: AthleteOrderByWithRelationInput | AthleteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AthleteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Athletes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Athletes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Athletes
    **/
    _count?: true | AthleteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AthleteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AthleteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AthleteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AthleteMaxAggregateInputType
  }

  export type GetAthleteAggregateType<T extends AthleteAggregateArgs> = {
        [P in keyof T & keyof AggregateAthlete]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAthlete[P]>
      : GetScalarType<T[P], AggregateAthlete[P]>
  }




  export type AthleteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AthleteWhereInput
    orderBy?: AthleteOrderByWithAggregationInput | AthleteOrderByWithAggregationInput[]
    by: AthleteScalarFieldEnum[] | AthleteScalarFieldEnum
    having?: AthleteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AthleteCountAggregateInputType | true
    _avg?: AthleteAvgAggregateInputType
    _sum?: AthleteSumAggregateInputType
    _min?: AthleteMinAggregateInputType
    _max?: AthleteMaxAggregateInputType
  }

  export type AthleteGroupByOutputType = {
    id: string
    clubId: string
    firstName: string
    lastName: string
    dob: Date
    gender: $Enums.Gender
    nationality: string
    idType: string | null
    idNumber: string | null
    beltRank: string | null
    weightKg: number | null
    medicalNotes: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName: string | null
    guardianPhone: string | null
    photoUrl: string | null
    waiverUrl: string | null
    createdAt: Date
    updatedAt: Date
    _count: AthleteCountAggregateOutputType | null
    _avg: AthleteAvgAggregateOutputType | null
    _sum: AthleteSumAggregateOutputType | null
    _min: AthleteMinAggregateOutputType | null
    _max: AthleteMaxAggregateOutputType | null
  }

  type GetAthleteGroupByPayload<T extends AthleteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AthleteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AthleteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AthleteGroupByOutputType[P]>
            : GetScalarType<T[P], AthleteGroupByOutputType[P]>
        }
      >
    >


  export type AthleteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clubId?: boolean
    firstName?: boolean
    lastName?: boolean
    dob?: boolean
    gender?: boolean
    nationality?: boolean
    idType?: boolean
    idNumber?: boolean
    beltRank?: boolean
    weightKg?: boolean
    medicalNotes?: boolean
    emergencyName?: boolean
    emergencyPhone?: boolean
    guardianName?: boolean
    guardianPhone?: boolean
    photoUrl?: boolean
    waiverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | ClubDefaultArgs<ExtArgs>
    entries?: boolean | Athlete$entriesArgs<ExtArgs>
    teamMembers?: boolean | Athlete$teamMembersArgs<ExtArgs>
    _count?: boolean | AthleteCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["athlete"]>

  export type AthleteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clubId?: boolean
    firstName?: boolean
    lastName?: boolean
    dob?: boolean
    gender?: boolean
    nationality?: boolean
    idType?: boolean
    idNumber?: boolean
    beltRank?: boolean
    weightKg?: boolean
    medicalNotes?: boolean
    emergencyName?: boolean
    emergencyPhone?: boolean
    guardianName?: boolean
    guardianPhone?: boolean
    photoUrl?: boolean
    waiverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | ClubDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["athlete"]>

  export type AthleteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clubId?: boolean
    firstName?: boolean
    lastName?: boolean
    dob?: boolean
    gender?: boolean
    nationality?: boolean
    idType?: boolean
    idNumber?: boolean
    beltRank?: boolean
    weightKg?: boolean
    medicalNotes?: boolean
    emergencyName?: boolean
    emergencyPhone?: boolean
    guardianName?: boolean
    guardianPhone?: boolean
    photoUrl?: boolean
    waiverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | ClubDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["athlete"]>

  export type AthleteSelectScalar = {
    id?: boolean
    clubId?: boolean
    firstName?: boolean
    lastName?: boolean
    dob?: boolean
    gender?: boolean
    nationality?: boolean
    idType?: boolean
    idNumber?: boolean
    beltRank?: boolean
    weightKg?: boolean
    medicalNotes?: boolean
    emergencyName?: boolean
    emergencyPhone?: boolean
    guardianName?: boolean
    guardianPhone?: boolean
    photoUrl?: boolean
    waiverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AthleteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clubId" | "firstName" | "lastName" | "dob" | "gender" | "nationality" | "idType" | "idNumber" | "beltRank" | "weightKg" | "medicalNotes" | "emergencyName" | "emergencyPhone" | "guardianName" | "guardianPhone" | "photoUrl" | "waiverUrl" | "createdAt" | "updatedAt", ExtArgs["result"]["athlete"]>
  export type AthleteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | ClubDefaultArgs<ExtArgs>
    entries?: boolean | Athlete$entriesArgs<ExtArgs>
    teamMembers?: boolean | Athlete$teamMembersArgs<ExtArgs>
    _count?: boolean | AthleteCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AthleteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | ClubDefaultArgs<ExtArgs>
  }
  export type AthleteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | ClubDefaultArgs<ExtArgs>
  }

  export type $AthletePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Athlete"
    objects: {
      club: Prisma.$ClubPayload<ExtArgs>
      entries: Prisma.$EntryPayload<ExtArgs>[]
      teamMembers: Prisma.$TeamMemberPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clubId: string
      firstName: string
      lastName: string
      dob: Date
      gender: $Enums.Gender
      nationality: string
      idType: string | null
      idNumber: string | null
      beltRank: string | null
      weightKg: number | null
      medicalNotes: string | null
      emergencyName: string
      emergencyPhone: string
      guardianName: string | null
      guardianPhone: string | null
      photoUrl: string | null
      waiverUrl: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["athlete"]>
    composites: {}
  }

  type AthleteGetPayload<S extends boolean | null | undefined | AthleteDefaultArgs> = $Result.GetResult<Prisma.$AthletePayload, S>

  type AthleteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AthleteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AthleteCountAggregateInputType | true
    }

  export interface AthleteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Athlete'], meta: { name: 'Athlete' } }
    /**
     * Find zero or one Athlete that matches the filter.
     * @param {AthleteFindUniqueArgs} args - Arguments to find a Athlete
     * @example
     * // Get one Athlete
     * const athlete = await prisma.athlete.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AthleteFindUniqueArgs>(args: SelectSubset<T, AthleteFindUniqueArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Athlete that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AthleteFindUniqueOrThrowArgs} args - Arguments to find a Athlete
     * @example
     * // Get one Athlete
     * const athlete = await prisma.athlete.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AthleteFindUniqueOrThrowArgs>(args: SelectSubset<T, AthleteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Athlete that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteFindFirstArgs} args - Arguments to find a Athlete
     * @example
     * // Get one Athlete
     * const athlete = await prisma.athlete.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AthleteFindFirstArgs>(args?: SelectSubset<T, AthleteFindFirstArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Athlete that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteFindFirstOrThrowArgs} args - Arguments to find a Athlete
     * @example
     * // Get one Athlete
     * const athlete = await prisma.athlete.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AthleteFindFirstOrThrowArgs>(args?: SelectSubset<T, AthleteFindFirstOrThrowArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Athletes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Athletes
     * const athletes = await prisma.athlete.findMany()
     * 
     * // Get first 10 Athletes
     * const athletes = await prisma.athlete.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const athleteWithIdOnly = await prisma.athlete.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AthleteFindManyArgs>(args?: SelectSubset<T, AthleteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Athlete.
     * @param {AthleteCreateArgs} args - Arguments to create a Athlete.
     * @example
     * // Create one Athlete
     * const Athlete = await prisma.athlete.create({
     *   data: {
     *     // ... data to create a Athlete
     *   }
     * })
     * 
     */
    create<T extends AthleteCreateArgs>(args: SelectSubset<T, AthleteCreateArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Athletes.
     * @param {AthleteCreateManyArgs} args - Arguments to create many Athletes.
     * @example
     * // Create many Athletes
     * const athlete = await prisma.athlete.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AthleteCreateManyArgs>(args?: SelectSubset<T, AthleteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Athletes and returns the data saved in the database.
     * @param {AthleteCreateManyAndReturnArgs} args - Arguments to create many Athletes.
     * @example
     * // Create many Athletes
     * const athlete = await prisma.athlete.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Athletes and only return the `id`
     * const athleteWithIdOnly = await prisma.athlete.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AthleteCreateManyAndReturnArgs>(args?: SelectSubset<T, AthleteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Athlete.
     * @param {AthleteDeleteArgs} args - Arguments to delete one Athlete.
     * @example
     * // Delete one Athlete
     * const Athlete = await prisma.athlete.delete({
     *   where: {
     *     // ... filter to delete one Athlete
     *   }
     * })
     * 
     */
    delete<T extends AthleteDeleteArgs>(args: SelectSubset<T, AthleteDeleteArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Athlete.
     * @param {AthleteUpdateArgs} args - Arguments to update one Athlete.
     * @example
     * // Update one Athlete
     * const athlete = await prisma.athlete.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AthleteUpdateArgs>(args: SelectSubset<T, AthleteUpdateArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Athletes.
     * @param {AthleteDeleteManyArgs} args - Arguments to filter Athletes to delete.
     * @example
     * // Delete a few Athletes
     * const { count } = await prisma.athlete.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AthleteDeleteManyArgs>(args?: SelectSubset<T, AthleteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Athletes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Athletes
     * const athlete = await prisma.athlete.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AthleteUpdateManyArgs>(args: SelectSubset<T, AthleteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Athletes and returns the data updated in the database.
     * @param {AthleteUpdateManyAndReturnArgs} args - Arguments to update many Athletes.
     * @example
     * // Update many Athletes
     * const athlete = await prisma.athlete.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Athletes and only return the `id`
     * const athleteWithIdOnly = await prisma.athlete.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AthleteUpdateManyAndReturnArgs>(args: SelectSubset<T, AthleteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Athlete.
     * @param {AthleteUpsertArgs} args - Arguments to update or create a Athlete.
     * @example
     * // Update or create a Athlete
     * const athlete = await prisma.athlete.upsert({
     *   create: {
     *     // ... data to create a Athlete
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Athlete we want to update
     *   }
     * })
     */
    upsert<T extends AthleteUpsertArgs>(args: SelectSubset<T, AthleteUpsertArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Athletes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteCountArgs} args - Arguments to filter Athletes to count.
     * @example
     * // Count the number of Athletes
     * const count = await prisma.athlete.count({
     *   where: {
     *     // ... the filter for the Athletes we want to count
     *   }
     * })
    **/
    count<T extends AthleteCountArgs>(
      args?: Subset<T, AthleteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AthleteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Athlete.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AthleteAggregateArgs>(args: Subset<T, AthleteAggregateArgs>): Prisma.PrismaPromise<GetAthleteAggregateType<T>>

    /**
     * Group by Athlete.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AthleteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AthleteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AthleteGroupByArgs['orderBy'] }
        : { orderBy?: AthleteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AthleteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAthleteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Athlete model
   */
  readonly fields: AthleteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Athlete.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AthleteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    club<T extends ClubDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ClubDefaultArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    entries<T extends Athlete$entriesArgs<ExtArgs> = {}>(args?: Subset<T, Athlete$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    teamMembers<T extends Athlete$teamMembersArgs<ExtArgs> = {}>(args?: Subset<T, Athlete$teamMembersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Athlete model
   */
  interface AthleteFieldRefs {
    readonly id: FieldRef<"Athlete", 'String'>
    readonly clubId: FieldRef<"Athlete", 'String'>
    readonly firstName: FieldRef<"Athlete", 'String'>
    readonly lastName: FieldRef<"Athlete", 'String'>
    readonly dob: FieldRef<"Athlete", 'DateTime'>
    readonly gender: FieldRef<"Athlete", 'Gender'>
    readonly nationality: FieldRef<"Athlete", 'String'>
    readonly idType: FieldRef<"Athlete", 'String'>
    readonly idNumber: FieldRef<"Athlete", 'String'>
    readonly beltRank: FieldRef<"Athlete", 'String'>
    readonly weightKg: FieldRef<"Athlete", 'Float'>
    readonly medicalNotes: FieldRef<"Athlete", 'String'>
    readonly emergencyName: FieldRef<"Athlete", 'String'>
    readonly emergencyPhone: FieldRef<"Athlete", 'String'>
    readonly guardianName: FieldRef<"Athlete", 'String'>
    readonly guardianPhone: FieldRef<"Athlete", 'String'>
    readonly photoUrl: FieldRef<"Athlete", 'String'>
    readonly waiverUrl: FieldRef<"Athlete", 'String'>
    readonly createdAt: FieldRef<"Athlete", 'DateTime'>
    readonly updatedAt: FieldRef<"Athlete", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Athlete findUnique
   */
  export type AthleteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * Filter, which Athlete to fetch.
     */
    where: AthleteWhereUniqueInput
  }

  /**
   * Athlete findUniqueOrThrow
   */
  export type AthleteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * Filter, which Athlete to fetch.
     */
    where: AthleteWhereUniqueInput
  }

  /**
   * Athlete findFirst
   */
  export type AthleteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * Filter, which Athlete to fetch.
     */
    where?: AthleteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Athletes to fetch.
     */
    orderBy?: AthleteOrderByWithRelationInput | AthleteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Athletes.
     */
    cursor?: AthleteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Athletes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Athletes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Athletes.
     */
    distinct?: AthleteScalarFieldEnum | AthleteScalarFieldEnum[]
  }

  /**
   * Athlete findFirstOrThrow
   */
  export type AthleteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * Filter, which Athlete to fetch.
     */
    where?: AthleteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Athletes to fetch.
     */
    orderBy?: AthleteOrderByWithRelationInput | AthleteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Athletes.
     */
    cursor?: AthleteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Athletes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Athletes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Athletes.
     */
    distinct?: AthleteScalarFieldEnum | AthleteScalarFieldEnum[]
  }

  /**
   * Athlete findMany
   */
  export type AthleteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * Filter, which Athletes to fetch.
     */
    where?: AthleteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Athletes to fetch.
     */
    orderBy?: AthleteOrderByWithRelationInput | AthleteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Athletes.
     */
    cursor?: AthleteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Athletes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Athletes.
     */
    skip?: number
    distinct?: AthleteScalarFieldEnum | AthleteScalarFieldEnum[]
  }

  /**
   * Athlete create
   */
  export type AthleteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * The data needed to create a Athlete.
     */
    data: XOR<AthleteCreateInput, AthleteUncheckedCreateInput>
  }

  /**
   * Athlete createMany
   */
  export type AthleteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Athletes.
     */
    data: AthleteCreateManyInput | AthleteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Athlete createManyAndReturn
   */
  export type AthleteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * The data used to create many Athletes.
     */
    data: AthleteCreateManyInput | AthleteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Athlete update
   */
  export type AthleteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * The data needed to update a Athlete.
     */
    data: XOR<AthleteUpdateInput, AthleteUncheckedUpdateInput>
    /**
     * Choose, which Athlete to update.
     */
    where: AthleteWhereUniqueInput
  }

  /**
   * Athlete updateMany
   */
  export type AthleteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Athletes.
     */
    data: XOR<AthleteUpdateManyMutationInput, AthleteUncheckedUpdateManyInput>
    /**
     * Filter which Athletes to update
     */
    where?: AthleteWhereInput
    /**
     * Limit how many Athletes to update.
     */
    limit?: number
  }

  /**
   * Athlete updateManyAndReturn
   */
  export type AthleteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * The data used to update Athletes.
     */
    data: XOR<AthleteUpdateManyMutationInput, AthleteUncheckedUpdateManyInput>
    /**
     * Filter which Athletes to update
     */
    where?: AthleteWhereInput
    /**
     * Limit how many Athletes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Athlete upsert
   */
  export type AthleteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * The filter to search for the Athlete to update in case it exists.
     */
    where: AthleteWhereUniqueInput
    /**
     * In case the Athlete found by the `where` argument doesn't exist, create a new Athlete with this data.
     */
    create: XOR<AthleteCreateInput, AthleteUncheckedCreateInput>
    /**
     * In case the Athlete was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AthleteUpdateInput, AthleteUncheckedUpdateInput>
  }

  /**
   * Athlete delete
   */
  export type AthleteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    /**
     * Filter which Athlete to delete.
     */
    where: AthleteWhereUniqueInput
  }

  /**
   * Athlete deleteMany
   */
  export type AthleteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Athletes to delete
     */
    where?: AthleteWhereInput
    /**
     * Limit how many Athletes to delete.
     */
    limit?: number
  }

  /**
   * Athlete.entries
   */
  export type Athlete$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    cursor?: EntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Athlete.teamMembers
   */
  export type Athlete$teamMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    where?: TeamMemberWhereInput
    orderBy?: TeamMemberOrderByWithRelationInput | TeamMemberOrderByWithRelationInput[]
    cursor?: TeamMemberWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamMemberScalarFieldEnum | TeamMemberScalarFieldEnum[]
  }

  /**
   * Athlete without action
   */
  export type AthleteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
  }


  /**
   * Model Entry
   */

  export type AggregateEntry = {
    _count: EntryCountAggregateOutputType | null
    _avg: EntryAvgAggregateOutputType | null
    _sum: EntrySumAggregateOutputType | null
    _min: EntryMinAggregateOutputType | null
    _max: EntryMaxAggregateOutputType | null
  }

  export type EntryAvgAggregateOutputType = {
    feeCents: number | null
  }

  export type EntrySumAggregateOutputType = {
    feeCents: number | null
  }

  export type EntryMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    clubId: string | null
    athleteId: string | null
    teamId: string | null
    entryType: $Enums.EntryType | null
    divisionId: string | null
    weightClassId: string | null
    status: $Enums.EntryStatus | null
    feeCents: number | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EntryMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    clubId: string | null
    athleteId: string | null
    teamId: string | null
    entryType: $Enums.EntryType | null
    divisionId: string | null
    weightClassId: string | null
    status: $Enums.EntryStatus | null
    feeCents: number | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EntryCountAggregateOutputType = {
    id: number
    eventId: number
    clubId: number
    athleteId: number
    teamId: number
    entryType: number
    divisionId: number
    weightClassId: number
    status: number
    feeCents: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EntryAvgAggregateInputType = {
    feeCents?: true
  }

  export type EntrySumAggregateInputType = {
    feeCents?: true
  }

  export type EntryMinAggregateInputType = {
    id?: true
    eventId?: true
    clubId?: true
    athleteId?: true
    teamId?: true
    entryType?: true
    divisionId?: true
    weightClassId?: true
    status?: true
    feeCents?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EntryMaxAggregateInputType = {
    id?: true
    eventId?: true
    clubId?: true
    athleteId?: true
    teamId?: true
    entryType?: true
    divisionId?: true
    weightClassId?: true
    status?: true
    feeCents?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EntryCountAggregateInputType = {
    id?: true
    eventId?: true
    clubId?: true
    athleteId?: true
    teamId?: true
    entryType?: true
    divisionId?: true
    weightClassId?: true
    status?: true
    feeCents?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Entry to aggregate.
     */
    where?: EntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Entries to fetch.
     */
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Entries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Entries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Entries
    **/
    _count?: true | EntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EntryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EntrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EntryMaxAggregateInputType
  }

  export type GetEntryAggregateType<T extends EntryAggregateArgs> = {
        [P in keyof T & keyof AggregateEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEntry[P]>
      : GetScalarType<T[P], AggregateEntry[P]>
  }




  export type EntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithAggregationInput | EntryOrderByWithAggregationInput[]
    by: EntryScalarFieldEnum[] | EntryScalarFieldEnum
    having?: EntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EntryCountAggregateInputType | true
    _avg?: EntryAvgAggregateInputType
    _sum?: EntrySumAggregateInputType
    _min?: EntryMinAggregateInputType
    _max?: EntryMaxAggregateInputType
  }

  export type EntryGroupByOutputType = {
    id: string
    eventId: string
    clubId: string
    athleteId: string | null
    teamId: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId: string | null
    status: $Enums.EntryStatus
    feeCents: number
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: EntryCountAggregateOutputType | null
    _avg: EntryAvgAggregateOutputType | null
    _sum: EntrySumAggregateOutputType | null
    _min: EntryMinAggregateOutputType | null
    _max: EntryMaxAggregateOutputType | null
  }

  type GetEntryGroupByPayload<T extends EntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EntryGroupByOutputType[P]>
            : GetScalarType<T[P], EntryGroupByOutputType[P]>
        }
      >
    >


  export type EntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    athleteId?: boolean
    teamId?: boolean
    entryType?: boolean
    divisionId?: boolean
    weightClassId?: boolean
    status?: boolean
    feeCents?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    athlete?: boolean | Entry$athleteArgs<ExtArgs>
    team?: boolean | Entry$teamArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    weightClass?: boolean | Entry$weightClassArgs<ExtArgs>
  }, ExtArgs["result"]["entry"]>

  export type EntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    athleteId?: boolean
    teamId?: boolean
    entryType?: boolean
    divisionId?: boolean
    weightClassId?: boolean
    status?: boolean
    feeCents?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    athlete?: boolean | Entry$athleteArgs<ExtArgs>
    team?: boolean | Entry$teamArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    weightClass?: boolean | Entry$weightClassArgs<ExtArgs>
  }, ExtArgs["result"]["entry"]>

  export type EntrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    athleteId?: boolean
    teamId?: boolean
    entryType?: boolean
    divisionId?: boolean
    weightClassId?: boolean
    status?: boolean
    feeCents?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    athlete?: boolean | Entry$athleteArgs<ExtArgs>
    team?: boolean | Entry$teamArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    weightClass?: boolean | Entry$weightClassArgs<ExtArgs>
  }, ExtArgs["result"]["entry"]>

  export type EntrySelectScalar = {
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    athleteId?: boolean
    teamId?: boolean
    entryType?: boolean
    divisionId?: boolean
    weightClassId?: boolean
    status?: boolean
    feeCents?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EntryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "clubId" | "athleteId" | "teamId" | "entryType" | "divisionId" | "weightClassId" | "status" | "feeCents" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["entry"]>
  export type EntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    athlete?: boolean | Entry$athleteArgs<ExtArgs>
    team?: boolean | Entry$teamArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    weightClass?: boolean | Entry$weightClassArgs<ExtArgs>
  }
  export type EntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    athlete?: boolean | Entry$athleteArgs<ExtArgs>
    team?: boolean | Entry$teamArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    weightClass?: boolean | Entry$weightClassArgs<ExtArgs>
  }
  export type EntryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    athlete?: boolean | Entry$athleteArgs<ExtArgs>
    team?: boolean | Entry$teamArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    weightClass?: boolean | Entry$weightClassArgs<ExtArgs>
  }

  export type $EntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Entry"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
      club: Prisma.$ClubPayload<ExtArgs>
      athlete: Prisma.$AthletePayload<ExtArgs> | null
      team: Prisma.$TeamPayload<ExtArgs> | null
      division: Prisma.$DivisionPayload<ExtArgs>
      weightClass: Prisma.$WeightClassPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      clubId: string
      athleteId: string | null
      teamId: string | null
      entryType: $Enums.EntryType
      divisionId: string
      weightClassId: string | null
      status: $Enums.EntryStatus
      feeCents: number
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["entry"]>
    composites: {}
  }

  type EntryGetPayload<S extends boolean | null | undefined | EntryDefaultArgs> = $Result.GetResult<Prisma.$EntryPayload, S>

  type EntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EntryCountAggregateInputType | true
    }

  export interface EntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Entry'], meta: { name: 'Entry' } }
    /**
     * Find zero or one Entry that matches the filter.
     * @param {EntryFindUniqueArgs} args - Arguments to find a Entry
     * @example
     * // Get one Entry
     * const entry = await prisma.entry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EntryFindUniqueArgs>(args: SelectSubset<T, EntryFindUniqueArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Entry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EntryFindUniqueOrThrowArgs} args - Arguments to find a Entry
     * @example
     * // Get one Entry
     * const entry = await prisma.entry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EntryFindUniqueOrThrowArgs>(args: SelectSubset<T, EntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Entry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryFindFirstArgs} args - Arguments to find a Entry
     * @example
     * // Get one Entry
     * const entry = await prisma.entry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EntryFindFirstArgs>(args?: SelectSubset<T, EntryFindFirstArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Entry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryFindFirstOrThrowArgs} args - Arguments to find a Entry
     * @example
     * // Get one Entry
     * const entry = await prisma.entry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EntryFindFirstOrThrowArgs>(args?: SelectSubset<T, EntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Entries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Entries
     * const entries = await prisma.entry.findMany()
     * 
     * // Get first 10 Entries
     * const entries = await prisma.entry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const entryWithIdOnly = await prisma.entry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EntryFindManyArgs>(args?: SelectSubset<T, EntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Entry.
     * @param {EntryCreateArgs} args - Arguments to create a Entry.
     * @example
     * // Create one Entry
     * const Entry = await prisma.entry.create({
     *   data: {
     *     // ... data to create a Entry
     *   }
     * })
     * 
     */
    create<T extends EntryCreateArgs>(args: SelectSubset<T, EntryCreateArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Entries.
     * @param {EntryCreateManyArgs} args - Arguments to create many Entries.
     * @example
     * // Create many Entries
     * const entry = await prisma.entry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EntryCreateManyArgs>(args?: SelectSubset<T, EntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Entries and returns the data saved in the database.
     * @param {EntryCreateManyAndReturnArgs} args - Arguments to create many Entries.
     * @example
     * // Create many Entries
     * const entry = await prisma.entry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Entries and only return the `id`
     * const entryWithIdOnly = await prisma.entry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EntryCreateManyAndReturnArgs>(args?: SelectSubset<T, EntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Entry.
     * @param {EntryDeleteArgs} args - Arguments to delete one Entry.
     * @example
     * // Delete one Entry
     * const Entry = await prisma.entry.delete({
     *   where: {
     *     // ... filter to delete one Entry
     *   }
     * })
     * 
     */
    delete<T extends EntryDeleteArgs>(args: SelectSubset<T, EntryDeleteArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Entry.
     * @param {EntryUpdateArgs} args - Arguments to update one Entry.
     * @example
     * // Update one Entry
     * const entry = await prisma.entry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EntryUpdateArgs>(args: SelectSubset<T, EntryUpdateArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Entries.
     * @param {EntryDeleteManyArgs} args - Arguments to filter Entries to delete.
     * @example
     * // Delete a few Entries
     * const { count } = await prisma.entry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EntryDeleteManyArgs>(args?: SelectSubset<T, EntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Entries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Entries
     * const entry = await prisma.entry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EntryUpdateManyArgs>(args: SelectSubset<T, EntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Entries and returns the data updated in the database.
     * @param {EntryUpdateManyAndReturnArgs} args - Arguments to update many Entries.
     * @example
     * // Update many Entries
     * const entry = await prisma.entry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Entries and only return the `id`
     * const entryWithIdOnly = await prisma.entry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EntryUpdateManyAndReturnArgs>(args: SelectSubset<T, EntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Entry.
     * @param {EntryUpsertArgs} args - Arguments to update or create a Entry.
     * @example
     * // Update or create a Entry
     * const entry = await prisma.entry.upsert({
     *   create: {
     *     // ... data to create a Entry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Entry we want to update
     *   }
     * })
     */
    upsert<T extends EntryUpsertArgs>(args: SelectSubset<T, EntryUpsertArgs<ExtArgs>>): Prisma__EntryClient<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Entries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryCountArgs} args - Arguments to filter Entries to count.
     * @example
     * // Count the number of Entries
     * const count = await prisma.entry.count({
     *   where: {
     *     // ... the filter for the Entries we want to count
     *   }
     * })
    **/
    count<T extends EntryCountArgs>(
      args?: Subset<T, EntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Entry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EntryAggregateArgs>(args: Subset<T, EntryAggregateArgs>): Prisma.PrismaPromise<GetEntryAggregateType<T>>

    /**
     * Group by Entry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EntryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EntryGroupByArgs['orderBy'] }
        : { orderBy?: EntryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Entry model
   */
  readonly fields: EntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Entry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    club<T extends ClubDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ClubDefaultArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    athlete<T extends Entry$athleteArgs<ExtArgs> = {}>(args?: Subset<T, Entry$athleteArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    team<T extends Entry$teamArgs<ExtArgs> = {}>(args?: Subset<T, Entry$teamArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    division<T extends DivisionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DivisionDefaultArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    weightClass<T extends Entry$weightClassArgs<ExtArgs> = {}>(args?: Subset<T, Entry$weightClassArgs<ExtArgs>>): Prisma__WeightClassClient<$Result.GetResult<Prisma.$WeightClassPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Entry model
   */
  interface EntryFieldRefs {
    readonly id: FieldRef<"Entry", 'String'>
    readonly eventId: FieldRef<"Entry", 'String'>
    readonly clubId: FieldRef<"Entry", 'String'>
    readonly athleteId: FieldRef<"Entry", 'String'>
    readonly teamId: FieldRef<"Entry", 'String'>
    readonly entryType: FieldRef<"Entry", 'EntryType'>
    readonly divisionId: FieldRef<"Entry", 'String'>
    readonly weightClassId: FieldRef<"Entry", 'String'>
    readonly status: FieldRef<"Entry", 'EntryStatus'>
    readonly feeCents: FieldRef<"Entry", 'Int'>
    readonly notes: FieldRef<"Entry", 'String'>
    readonly createdAt: FieldRef<"Entry", 'DateTime'>
    readonly updatedAt: FieldRef<"Entry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Entry findUnique
   */
  export type EntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * Filter, which Entry to fetch.
     */
    where: EntryWhereUniqueInput
  }

  /**
   * Entry findUniqueOrThrow
   */
  export type EntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * Filter, which Entry to fetch.
     */
    where: EntryWhereUniqueInput
  }

  /**
   * Entry findFirst
   */
  export type EntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * Filter, which Entry to fetch.
     */
    where?: EntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Entries to fetch.
     */
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Entries.
     */
    cursor?: EntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Entries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Entries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Entries.
     */
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Entry findFirstOrThrow
   */
  export type EntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * Filter, which Entry to fetch.
     */
    where?: EntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Entries to fetch.
     */
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Entries.
     */
    cursor?: EntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Entries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Entries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Entries.
     */
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Entry findMany
   */
  export type EntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * Filter, which Entries to fetch.
     */
    where?: EntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Entries to fetch.
     */
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Entries.
     */
    cursor?: EntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Entries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Entries.
     */
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Entry create
   */
  export type EntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * The data needed to create a Entry.
     */
    data: XOR<EntryCreateInput, EntryUncheckedCreateInput>
  }

  /**
   * Entry createMany
   */
  export type EntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Entries.
     */
    data: EntryCreateManyInput | EntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Entry createManyAndReturn
   */
  export type EntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * The data used to create many Entries.
     */
    data: EntryCreateManyInput | EntryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Entry update
   */
  export type EntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * The data needed to update a Entry.
     */
    data: XOR<EntryUpdateInput, EntryUncheckedUpdateInput>
    /**
     * Choose, which Entry to update.
     */
    where: EntryWhereUniqueInput
  }

  /**
   * Entry updateMany
   */
  export type EntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Entries.
     */
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyInput>
    /**
     * Filter which Entries to update
     */
    where?: EntryWhereInput
    /**
     * Limit how many Entries to update.
     */
    limit?: number
  }

  /**
   * Entry updateManyAndReturn
   */
  export type EntryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * The data used to update Entries.
     */
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyInput>
    /**
     * Filter which Entries to update
     */
    where?: EntryWhereInput
    /**
     * Limit how many Entries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Entry upsert
   */
  export type EntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * The filter to search for the Entry to update in case it exists.
     */
    where: EntryWhereUniqueInput
    /**
     * In case the Entry found by the `where` argument doesn't exist, create a new Entry with this data.
     */
    create: XOR<EntryCreateInput, EntryUncheckedCreateInput>
    /**
     * In case the Entry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EntryUpdateInput, EntryUncheckedUpdateInput>
  }

  /**
   * Entry delete
   */
  export type EntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    /**
     * Filter which Entry to delete.
     */
    where: EntryWhereUniqueInput
  }

  /**
   * Entry deleteMany
   */
  export type EntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Entries to delete
     */
    where?: EntryWhereInput
    /**
     * Limit how many Entries to delete.
     */
    limit?: number
  }

  /**
   * Entry.athlete
   */
  export type Entry$athleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Athlete
     */
    select?: AthleteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Athlete
     */
    omit?: AthleteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AthleteInclude<ExtArgs> | null
    where?: AthleteWhereInput
  }

  /**
   * Entry.team
   */
  export type Entry$teamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    where?: TeamWhereInput
  }

  /**
   * Entry.weightClass
   */
  export type Entry$weightClassArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WeightClass
     */
    select?: WeightClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WeightClass
     */
    omit?: WeightClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WeightClassInclude<ExtArgs> | null
    where?: WeightClassWhereInput
  }

  /**
   * Entry without action
   */
  export type EntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
  }


  /**
   * Model Team
   */

  export type AggregateTeam = {
    _count: TeamCountAggregateOutputType | null
    _min: TeamMinAggregateOutputType | null
    _max: TeamMaxAggregateOutputType | null
  }

  export type TeamMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    clubId: string | null
    name: string | null
    teamType: $Enums.EntryType | null
    divisionId: string | null
    status: $Enums.TeamStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TeamMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    clubId: string | null
    name: string | null
    teamType: $Enums.EntryType | null
    divisionId: string | null
    status: $Enums.TeamStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TeamCountAggregateOutputType = {
    id: number
    eventId: number
    clubId: number
    name: number
    teamType: number
    divisionId: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TeamMinAggregateInputType = {
    id?: true
    eventId?: true
    clubId?: true
    name?: true
    teamType?: true
    divisionId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TeamMaxAggregateInputType = {
    id?: true
    eventId?: true
    clubId?: true
    name?: true
    teamType?: true
    divisionId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TeamCountAggregateInputType = {
    id?: true
    eventId?: true
    clubId?: true
    name?: true
    teamType?: true
    divisionId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TeamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Team to aggregate.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Teams
    **/
    _count?: true | TeamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeamMaxAggregateInputType
  }

  export type GetTeamAggregateType<T extends TeamAggregateArgs> = {
        [P in keyof T & keyof AggregateTeam]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeam[P]>
      : GetScalarType<T[P], AggregateTeam[P]>
  }




  export type TeamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamWhereInput
    orderBy?: TeamOrderByWithAggregationInput | TeamOrderByWithAggregationInput[]
    by: TeamScalarFieldEnum[] | TeamScalarFieldEnum
    having?: TeamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeamCountAggregateInputType | true
    _min?: TeamMinAggregateInputType
    _max?: TeamMaxAggregateInputType
  }

  export type TeamGroupByOutputType = {
    id: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status: $Enums.TeamStatus
    createdAt: Date
    updatedAt: Date
    _count: TeamCountAggregateOutputType | null
    _min: TeamMinAggregateOutputType | null
    _max: TeamMaxAggregateOutputType | null
  }

  type GetTeamGroupByPayload<T extends TeamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeamGroupByOutputType[P]>
            : GetScalarType<T[P], TeamGroupByOutputType[P]>
        }
      >
    >


  export type TeamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    name?: boolean
    teamType?: boolean
    divisionId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    members?: boolean | Team$membersArgs<ExtArgs>
    entries?: boolean | Team$entriesArgs<ExtArgs>
    _count?: boolean | TeamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    name?: boolean
    teamType?: boolean
    divisionId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    name?: boolean
    teamType?: boolean
    divisionId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["team"]>

  export type TeamSelectScalar = {
    id?: boolean
    eventId?: boolean
    clubId?: boolean
    name?: boolean
    teamType?: boolean
    divisionId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TeamOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "clubId" | "name" | "teamType" | "divisionId" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["team"]>
  export type TeamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
    members?: boolean | Team$membersArgs<ExtArgs>
    entries?: boolean | Team$entriesArgs<ExtArgs>
    _count?: boolean | TeamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TeamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
  }
  export type TeamIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | EventDefaultArgs<ExtArgs>
    club?: boolean | ClubDefaultArgs<ExtArgs>
    division?: boolean | DivisionDefaultArgs<ExtArgs>
  }

  export type $TeamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Team"
    objects: {
      event: Prisma.$EventPayload<ExtArgs>
      club: Prisma.$ClubPayload<ExtArgs>
      division: Prisma.$DivisionPayload<ExtArgs>
      members: Prisma.$TeamMemberPayload<ExtArgs>[]
      entries: Prisma.$EntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      clubId: string
      name: string
      teamType: $Enums.EntryType
      divisionId: string
      status: $Enums.TeamStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["team"]>
    composites: {}
  }

  type TeamGetPayload<S extends boolean | null | undefined | TeamDefaultArgs> = $Result.GetResult<Prisma.$TeamPayload, S>

  type TeamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeamFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeamCountAggregateInputType | true
    }

  export interface TeamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Team'], meta: { name: 'Team' } }
    /**
     * Find zero or one Team that matches the filter.
     * @param {TeamFindUniqueArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeamFindUniqueArgs>(args: SelectSubset<T, TeamFindUniqueArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Team that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeamFindUniqueOrThrowArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeamFindUniqueOrThrowArgs>(args: SelectSubset<T, TeamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindFirstArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeamFindFirstArgs>(args?: SelectSubset<T, TeamFindFirstArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindFirstOrThrowArgs} args - Arguments to find a Team
     * @example
     * // Get one Team
     * const team = await prisma.team.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeamFindFirstOrThrowArgs>(args?: SelectSubset<T, TeamFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Teams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Teams
     * const teams = await prisma.team.findMany()
     * 
     * // Get first 10 Teams
     * const teams = await prisma.team.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teamWithIdOnly = await prisma.team.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeamFindManyArgs>(args?: SelectSubset<T, TeamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Team.
     * @param {TeamCreateArgs} args - Arguments to create a Team.
     * @example
     * // Create one Team
     * const Team = await prisma.team.create({
     *   data: {
     *     // ... data to create a Team
     *   }
     * })
     * 
     */
    create<T extends TeamCreateArgs>(args: SelectSubset<T, TeamCreateArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Teams.
     * @param {TeamCreateManyArgs} args - Arguments to create many Teams.
     * @example
     * // Create many Teams
     * const team = await prisma.team.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeamCreateManyArgs>(args?: SelectSubset<T, TeamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Teams and returns the data saved in the database.
     * @param {TeamCreateManyAndReturnArgs} args - Arguments to create many Teams.
     * @example
     * // Create many Teams
     * const team = await prisma.team.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Teams and only return the `id`
     * const teamWithIdOnly = await prisma.team.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeamCreateManyAndReturnArgs>(args?: SelectSubset<T, TeamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Team.
     * @param {TeamDeleteArgs} args - Arguments to delete one Team.
     * @example
     * // Delete one Team
     * const Team = await prisma.team.delete({
     *   where: {
     *     // ... filter to delete one Team
     *   }
     * })
     * 
     */
    delete<T extends TeamDeleteArgs>(args: SelectSubset<T, TeamDeleteArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Team.
     * @param {TeamUpdateArgs} args - Arguments to update one Team.
     * @example
     * // Update one Team
     * const team = await prisma.team.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeamUpdateArgs>(args: SelectSubset<T, TeamUpdateArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Teams.
     * @param {TeamDeleteManyArgs} args - Arguments to filter Teams to delete.
     * @example
     * // Delete a few Teams
     * const { count } = await prisma.team.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeamDeleteManyArgs>(args?: SelectSubset<T, TeamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Teams
     * const team = await prisma.team.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeamUpdateManyArgs>(args: SelectSubset<T, TeamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Teams and returns the data updated in the database.
     * @param {TeamUpdateManyAndReturnArgs} args - Arguments to update many Teams.
     * @example
     * // Update many Teams
     * const team = await prisma.team.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Teams and only return the `id`
     * const teamWithIdOnly = await prisma.team.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TeamUpdateManyAndReturnArgs>(args: SelectSubset<T, TeamUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Team.
     * @param {TeamUpsertArgs} args - Arguments to update or create a Team.
     * @example
     * // Update or create a Team
     * const team = await prisma.team.upsert({
     *   create: {
     *     // ... data to create a Team
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Team we want to update
     *   }
     * })
     */
    upsert<T extends TeamUpsertArgs>(args: SelectSubset<T, TeamUpsertArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Teams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamCountArgs} args - Arguments to filter Teams to count.
     * @example
     * // Count the number of Teams
     * const count = await prisma.team.count({
     *   where: {
     *     // ... the filter for the Teams we want to count
     *   }
     * })
    **/
    count<T extends TeamCountArgs>(
      args?: Subset<T, TeamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Team.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeamAggregateArgs>(args: Subset<T, TeamAggregateArgs>): Prisma.PrismaPromise<GetTeamAggregateType<T>>

    /**
     * Group by Team.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeamGroupByArgs['orderBy'] }
        : { orderBy?: TeamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Team model
   */
  readonly fields: TeamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Team.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    club<T extends ClubDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ClubDefaultArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    division<T extends DivisionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DivisionDefaultArgs<ExtArgs>>): Prisma__DivisionClient<$Result.GetResult<Prisma.$DivisionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    members<T extends Team$membersArgs<ExtArgs> = {}>(args?: Subset<T, Team$membersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    entries<T extends Team$entriesArgs<ExtArgs> = {}>(args?: Subset<T, Team$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Team model
   */
  interface TeamFieldRefs {
    readonly id: FieldRef<"Team", 'String'>
    readonly eventId: FieldRef<"Team", 'String'>
    readonly clubId: FieldRef<"Team", 'String'>
    readonly name: FieldRef<"Team", 'String'>
    readonly teamType: FieldRef<"Team", 'EntryType'>
    readonly divisionId: FieldRef<"Team", 'String'>
    readonly status: FieldRef<"Team", 'TeamStatus'>
    readonly createdAt: FieldRef<"Team", 'DateTime'>
    readonly updatedAt: FieldRef<"Team", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Team findUnique
   */
  export type TeamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team findUniqueOrThrow
   */
  export type TeamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team findFirst
   */
  export type TeamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teams.
     */
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team findFirstOrThrow
   */
  export type TeamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Team to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Teams.
     */
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team findMany
   */
  export type TeamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter, which Teams to fetch.
     */
    where?: TeamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Teams to fetch.
     */
    orderBy?: TeamOrderByWithRelationInput | TeamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Teams.
     */
    cursor?: TeamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Teams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Teams.
     */
    skip?: number
    distinct?: TeamScalarFieldEnum | TeamScalarFieldEnum[]
  }

  /**
   * Team create
   */
  export type TeamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The data needed to create a Team.
     */
    data: XOR<TeamCreateInput, TeamUncheckedCreateInput>
  }

  /**
   * Team createMany
   */
  export type TeamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Teams.
     */
    data: TeamCreateManyInput | TeamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Team createManyAndReturn
   */
  export type TeamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * The data used to create many Teams.
     */
    data: TeamCreateManyInput | TeamCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Team update
   */
  export type TeamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The data needed to update a Team.
     */
    data: XOR<TeamUpdateInput, TeamUncheckedUpdateInput>
    /**
     * Choose, which Team to update.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team updateMany
   */
  export type TeamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Teams.
     */
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyInput>
    /**
     * Filter which Teams to update
     */
    where?: TeamWhereInput
    /**
     * Limit how many Teams to update.
     */
    limit?: number
  }

  /**
   * Team updateManyAndReturn
   */
  export type TeamUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * The data used to update Teams.
     */
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyInput>
    /**
     * Filter which Teams to update
     */
    where?: TeamWhereInput
    /**
     * Limit how many Teams to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Team upsert
   */
  export type TeamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * The filter to search for the Team to update in case it exists.
     */
    where: TeamWhereUniqueInput
    /**
     * In case the Team found by the `where` argument doesn't exist, create a new Team with this data.
     */
    create: XOR<TeamCreateInput, TeamUncheckedCreateInput>
    /**
     * In case the Team was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeamUpdateInput, TeamUncheckedUpdateInput>
  }

  /**
   * Team delete
   */
  export type TeamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
    /**
     * Filter which Team to delete.
     */
    where: TeamWhereUniqueInput
  }

  /**
   * Team deleteMany
   */
  export type TeamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Teams to delete
     */
    where?: TeamWhereInput
    /**
     * Limit how many Teams to delete.
     */
    limit?: number
  }

  /**
   * Team.members
   */
  export type Team$membersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    where?: TeamMemberWhereInput
    orderBy?: TeamMemberOrderByWithRelationInput | TeamMemberOrderByWithRelationInput[]
    cursor?: TeamMemberWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TeamMemberScalarFieldEnum | TeamMemberScalarFieldEnum[]
  }

  /**
   * Team.entries
   */
  export type Team$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Entry
     */
    select?: EntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Entry
     */
    omit?: EntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EntryInclude<ExtArgs> | null
    where?: EntryWhereInput
    orderBy?: EntryOrderByWithRelationInput | EntryOrderByWithRelationInput[]
    cursor?: EntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EntryScalarFieldEnum | EntryScalarFieldEnum[]
  }

  /**
   * Team without action
   */
  export type TeamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Team
     */
    select?: TeamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Team
     */
    omit?: TeamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamInclude<ExtArgs> | null
  }


  /**
   * Model TeamMember
   */

  export type AggregateTeamMember = {
    _count: TeamMemberCountAggregateOutputType | null
    _min: TeamMemberMinAggregateOutputType | null
    _max: TeamMemberMaxAggregateOutputType | null
  }

  export type TeamMemberMinAggregateOutputType = {
    id: string | null
    teamId: string | null
    athleteId: string | null
    isReserve: boolean | null
  }

  export type TeamMemberMaxAggregateOutputType = {
    id: string | null
    teamId: string | null
    athleteId: string | null
    isReserve: boolean | null
  }

  export type TeamMemberCountAggregateOutputType = {
    id: number
    teamId: number
    athleteId: number
    isReserve: number
    _all: number
  }


  export type TeamMemberMinAggregateInputType = {
    id?: true
    teamId?: true
    athleteId?: true
    isReserve?: true
  }

  export type TeamMemberMaxAggregateInputType = {
    id?: true
    teamId?: true
    athleteId?: true
    isReserve?: true
  }

  export type TeamMemberCountAggregateInputType = {
    id?: true
    teamId?: true
    athleteId?: true
    isReserve?: true
    _all?: true
  }

  export type TeamMemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeamMember to aggregate.
     */
    where?: TeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamMembers to fetch.
     */
    orderBy?: TeamMemberOrderByWithRelationInput | TeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TeamMembers
    **/
    _count?: true | TeamMemberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TeamMemberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TeamMemberMaxAggregateInputType
  }

  export type GetTeamMemberAggregateType<T extends TeamMemberAggregateArgs> = {
        [P in keyof T & keyof AggregateTeamMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeamMember[P]>
      : GetScalarType<T[P], AggregateTeamMember[P]>
  }




  export type TeamMemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TeamMemberWhereInput
    orderBy?: TeamMemberOrderByWithAggregationInput | TeamMemberOrderByWithAggregationInput[]
    by: TeamMemberScalarFieldEnum[] | TeamMemberScalarFieldEnum
    having?: TeamMemberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TeamMemberCountAggregateInputType | true
    _min?: TeamMemberMinAggregateInputType
    _max?: TeamMemberMaxAggregateInputType
  }

  export type TeamMemberGroupByOutputType = {
    id: string
    teamId: string
    athleteId: string
    isReserve: boolean
    _count: TeamMemberCountAggregateOutputType | null
    _min: TeamMemberMinAggregateOutputType | null
    _max: TeamMemberMaxAggregateOutputType | null
  }

  type GetTeamMemberGroupByPayload<T extends TeamMemberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TeamMemberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TeamMemberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TeamMemberGroupByOutputType[P]>
            : GetScalarType<T[P], TeamMemberGroupByOutputType[P]>
        }
      >
    >


  export type TeamMemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    teamId?: boolean
    athleteId?: boolean
    isReserve?: boolean
    team?: boolean | TeamDefaultArgs<ExtArgs>
    athlete?: boolean | AthleteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teamMember"]>

  export type TeamMemberSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    teamId?: boolean
    athleteId?: boolean
    isReserve?: boolean
    team?: boolean | TeamDefaultArgs<ExtArgs>
    athlete?: boolean | AthleteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teamMember"]>

  export type TeamMemberSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    teamId?: boolean
    athleteId?: boolean
    isReserve?: boolean
    team?: boolean | TeamDefaultArgs<ExtArgs>
    athlete?: boolean | AthleteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["teamMember"]>

  export type TeamMemberSelectScalar = {
    id?: boolean
    teamId?: boolean
    athleteId?: boolean
    isReserve?: boolean
  }

  export type TeamMemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "teamId" | "athleteId" | "isReserve", ExtArgs["result"]["teamMember"]>
  export type TeamMemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | TeamDefaultArgs<ExtArgs>
    athlete?: boolean | AthleteDefaultArgs<ExtArgs>
  }
  export type TeamMemberIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | TeamDefaultArgs<ExtArgs>
    athlete?: boolean | AthleteDefaultArgs<ExtArgs>
  }
  export type TeamMemberIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    team?: boolean | TeamDefaultArgs<ExtArgs>
    athlete?: boolean | AthleteDefaultArgs<ExtArgs>
  }

  export type $TeamMemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TeamMember"
    objects: {
      team: Prisma.$TeamPayload<ExtArgs>
      athlete: Prisma.$AthletePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      teamId: string
      athleteId: string
      isReserve: boolean
    }, ExtArgs["result"]["teamMember"]>
    composites: {}
  }

  type TeamMemberGetPayload<S extends boolean | null | undefined | TeamMemberDefaultArgs> = $Result.GetResult<Prisma.$TeamMemberPayload, S>

  type TeamMemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TeamMemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TeamMemberCountAggregateInputType | true
    }

  export interface TeamMemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TeamMember'], meta: { name: 'TeamMember' } }
    /**
     * Find zero or one TeamMember that matches the filter.
     * @param {TeamMemberFindUniqueArgs} args - Arguments to find a TeamMember
     * @example
     * // Get one TeamMember
     * const teamMember = await prisma.teamMember.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TeamMemberFindUniqueArgs>(args: SelectSubset<T, TeamMemberFindUniqueArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TeamMember that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TeamMemberFindUniqueOrThrowArgs} args - Arguments to find a TeamMember
     * @example
     * // Get one TeamMember
     * const teamMember = await prisma.teamMember.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TeamMemberFindUniqueOrThrowArgs>(args: SelectSubset<T, TeamMemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeamMember that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberFindFirstArgs} args - Arguments to find a TeamMember
     * @example
     * // Get one TeamMember
     * const teamMember = await prisma.teamMember.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TeamMemberFindFirstArgs>(args?: SelectSubset<T, TeamMemberFindFirstArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TeamMember that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberFindFirstOrThrowArgs} args - Arguments to find a TeamMember
     * @example
     * // Get one TeamMember
     * const teamMember = await prisma.teamMember.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TeamMemberFindFirstOrThrowArgs>(args?: SelectSubset<T, TeamMemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TeamMembers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TeamMembers
     * const teamMembers = await prisma.teamMember.findMany()
     * 
     * // Get first 10 TeamMembers
     * const teamMembers = await prisma.teamMember.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const teamMemberWithIdOnly = await prisma.teamMember.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TeamMemberFindManyArgs>(args?: SelectSubset<T, TeamMemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TeamMember.
     * @param {TeamMemberCreateArgs} args - Arguments to create a TeamMember.
     * @example
     * // Create one TeamMember
     * const TeamMember = await prisma.teamMember.create({
     *   data: {
     *     // ... data to create a TeamMember
     *   }
     * })
     * 
     */
    create<T extends TeamMemberCreateArgs>(args: SelectSubset<T, TeamMemberCreateArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TeamMembers.
     * @param {TeamMemberCreateManyArgs} args - Arguments to create many TeamMembers.
     * @example
     * // Create many TeamMembers
     * const teamMember = await prisma.teamMember.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TeamMemberCreateManyArgs>(args?: SelectSubset<T, TeamMemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TeamMembers and returns the data saved in the database.
     * @param {TeamMemberCreateManyAndReturnArgs} args - Arguments to create many TeamMembers.
     * @example
     * // Create many TeamMembers
     * const teamMember = await prisma.teamMember.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TeamMembers and only return the `id`
     * const teamMemberWithIdOnly = await prisma.teamMember.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TeamMemberCreateManyAndReturnArgs>(args?: SelectSubset<T, TeamMemberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TeamMember.
     * @param {TeamMemberDeleteArgs} args - Arguments to delete one TeamMember.
     * @example
     * // Delete one TeamMember
     * const TeamMember = await prisma.teamMember.delete({
     *   where: {
     *     // ... filter to delete one TeamMember
     *   }
     * })
     * 
     */
    delete<T extends TeamMemberDeleteArgs>(args: SelectSubset<T, TeamMemberDeleteArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TeamMember.
     * @param {TeamMemberUpdateArgs} args - Arguments to update one TeamMember.
     * @example
     * // Update one TeamMember
     * const teamMember = await prisma.teamMember.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TeamMemberUpdateArgs>(args: SelectSubset<T, TeamMemberUpdateArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TeamMembers.
     * @param {TeamMemberDeleteManyArgs} args - Arguments to filter TeamMembers to delete.
     * @example
     * // Delete a few TeamMembers
     * const { count } = await prisma.teamMember.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TeamMemberDeleteManyArgs>(args?: SelectSubset<T, TeamMemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeamMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TeamMembers
     * const teamMember = await prisma.teamMember.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TeamMemberUpdateManyArgs>(args: SelectSubset<T, TeamMemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TeamMembers and returns the data updated in the database.
     * @param {TeamMemberUpdateManyAndReturnArgs} args - Arguments to update many TeamMembers.
     * @example
     * // Update many TeamMembers
     * const teamMember = await prisma.teamMember.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TeamMembers and only return the `id`
     * const teamMemberWithIdOnly = await prisma.teamMember.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TeamMemberUpdateManyAndReturnArgs>(args: SelectSubset<T, TeamMemberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TeamMember.
     * @param {TeamMemberUpsertArgs} args - Arguments to update or create a TeamMember.
     * @example
     * // Update or create a TeamMember
     * const teamMember = await prisma.teamMember.upsert({
     *   create: {
     *     // ... data to create a TeamMember
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TeamMember we want to update
     *   }
     * })
     */
    upsert<T extends TeamMemberUpsertArgs>(args: SelectSubset<T, TeamMemberUpsertArgs<ExtArgs>>): Prisma__TeamMemberClient<$Result.GetResult<Prisma.$TeamMemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TeamMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberCountArgs} args - Arguments to filter TeamMembers to count.
     * @example
     * // Count the number of TeamMembers
     * const count = await prisma.teamMember.count({
     *   where: {
     *     // ... the filter for the TeamMembers we want to count
     *   }
     * })
    **/
    count<T extends TeamMemberCountArgs>(
      args?: Subset<T, TeamMemberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TeamMemberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TeamMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TeamMemberAggregateArgs>(args: Subset<T, TeamMemberAggregateArgs>): Prisma.PrismaPromise<GetTeamMemberAggregateType<T>>

    /**
     * Group by TeamMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TeamMemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TeamMemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TeamMemberGroupByArgs['orderBy'] }
        : { orderBy?: TeamMemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TeamMemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeamMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TeamMember model
   */
  readonly fields: TeamMemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TeamMember.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TeamMemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    team<T extends TeamDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TeamDefaultArgs<ExtArgs>>): Prisma__TeamClient<$Result.GetResult<Prisma.$TeamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    athlete<T extends AthleteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AthleteDefaultArgs<ExtArgs>>): Prisma__AthleteClient<$Result.GetResult<Prisma.$AthletePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TeamMember model
   */
  interface TeamMemberFieldRefs {
    readonly id: FieldRef<"TeamMember", 'String'>
    readonly teamId: FieldRef<"TeamMember", 'String'>
    readonly athleteId: FieldRef<"TeamMember", 'String'>
    readonly isReserve: FieldRef<"TeamMember", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * TeamMember findUnique
   */
  export type TeamMemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which TeamMember to fetch.
     */
    where: TeamMemberWhereUniqueInput
  }

  /**
   * TeamMember findUniqueOrThrow
   */
  export type TeamMemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which TeamMember to fetch.
     */
    where: TeamMemberWhereUniqueInput
  }

  /**
   * TeamMember findFirst
   */
  export type TeamMemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which TeamMember to fetch.
     */
    where?: TeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamMembers to fetch.
     */
    orderBy?: TeamMemberOrderByWithRelationInput | TeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeamMembers.
     */
    cursor?: TeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeamMembers.
     */
    distinct?: TeamMemberScalarFieldEnum | TeamMemberScalarFieldEnum[]
  }

  /**
   * TeamMember findFirstOrThrow
   */
  export type TeamMemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which TeamMember to fetch.
     */
    where?: TeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamMembers to fetch.
     */
    orderBy?: TeamMemberOrderByWithRelationInput | TeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TeamMembers.
     */
    cursor?: TeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TeamMembers.
     */
    distinct?: TeamMemberScalarFieldEnum | TeamMemberScalarFieldEnum[]
  }

  /**
   * TeamMember findMany
   */
  export type TeamMemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * Filter, which TeamMembers to fetch.
     */
    where?: TeamMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TeamMembers to fetch.
     */
    orderBy?: TeamMemberOrderByWithRelationInput | TeamMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TeamMembers.
     */
    cursor?: TeamMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TeamMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TeamMembers.
     */
    skip?: number
    distinct?: TeamMemberScalarFieldEnum | TeamMemberScalarFieldEnum[]
  }

  /**
   * TeamMember create
   */
  export type TeamMemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * The data needed to create a TeamMember.
     */
    data: XOR<TeamMemberCreateInput, TeamMemberUncheckedCreateInput>
  }

  /**
   * TeamMember createMany
   */
  export type TeamMemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TeamMembers.
     */
    data: TeamMemberCreateManyInput | TeamMemberCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TeamMember createManyAndReturn
   */
  export type TeamMemberCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * The data used to create many TeamMembers.
     */
    data: TeamMemberCreateManyInput | TeamMemberCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TeamMember update
   */
  export type TeamMemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * The data needed to update a TeamMember.
     */
    data: XOR<TeamMemberUpdateInput, TeamMemberUncheckedUpdateInput>
    /**
     * Choose, which TeamMember to update.
     */
    where: TeamMemberWhereUniqueInput
  }

  /**
   * TeamMember updateMany
   */
  export type TeamMemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TeamMembers.
     */
    data: XOR<TeamMemberUpdateManyMutationInput, TeamMemberUncheckedUpdateManyInput>
    /**
     * Filter which TeamMembers to update
     */
    where?: TeamMemberWhereInput
    /**
     * Limit how many TeamMembers to update.
     */
    limit?: number
  }

  /**
   * TeamMember updateManyAndReturn
   */
  export type TeamMemberUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * The data used to update TeamMembers.
     */
    data: XOR<TeamMemberUpdateManyMutationInput, TeamMemberUncheckedUpdateManyInput>
    /**
     * Filter which TeamMembers to update
     */
    where?: TeamMemberWhereInput
    /**
     * Limit how many TeamMembers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TeamMember upsert
   */
  export type TeamMemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * The filter to search for the TeamMember to update in case it exists.
     */
    where: TeamMemberWhereUniqueInput
    /**
     * In case the TeamMember found by the `where` argument doesn't exist, create a new TeamMember with this data.
     */
    create: XOR<TeamMemberCreateInput, TeamMemberUncheckedCreateInput>
    /**
     * In case the TeamMember was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TeamMemberUpdateInput, TeamMemberUncheckedUpdateInput>
  }

  /**
   * TeamMember delete
   */
  export type TeamMemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
    /**
     * Filter which TeamMember to delete.
     */
    where: TeamMemberWhereUniqueInput
  }

  /**
   * TeamMember deleteMany
   */
  export type TeamMemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TeamMembers to delete
     */
    where?: TeamMemberWhereInput
    /**
     * Limit how many TeamMembers to delete.
     */
    limit?: number
  }

  /**
   * TeamMember without action
   */
  export type TeamMemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TeamMember
     */
    select?: TeamMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TeamMember
     */
    omit?: TeamMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TeamMemberInclude<ExtArgs> | null
  }


  /**
   * Model Invoice
   */

  export type AggregateInvoice = {
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  export type InvoiceAvgAggregateOutputType = {
    totalCents: number | null
  }

  export type InvoiceSumAggregateOutputType = {
    totalCents: number | null
  }

  export type InvoiceMinAggregateOutputType = {
    id: string | null
    clubId: string | null
    eventId: string | null
    totalCents: number | null
    status: $Enums.InvoiceStatus | null
    pdfUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceMaxAggregateOutputType = {
    id: string | null
    clubId: string | null
    eventId: string | null
    totalCents: number | null
    status: $Enums.InvoiceStatus | null
    pdfUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceCountAggregateOutputType = {
    id: number
    clubId: number
    eventId: number
    totalCents: number
    status: number
    pdfUrl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InvoiceAvgAggregateInputType = {
    totalCents?: true
  }

  export type InvoiceSumAggregateInputType = {
    totalCents?: true
  }

  export type InvoiceMinAggregateInputType = {
    id?: true
    clubId?: true
    eventId?: true
    totalCents?: true
    status?: true
    pdfUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceMaxAggregateInputType = {
    id?: true
    clubId?: true
    eventId?: true
    totalCents?: true
    status?: true
    pdfUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceCountAggregateInputType = {
    id?: true
    clubId?: true
    eventId?: true
    totalCents?: true
    status?: true
    pdfUrl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InvoiceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoice to aggregate.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Invoices
    **/
    _count?: true | InvoiceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoiceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoiceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoiceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoiceMaxAggregateInputType
  }

  export type GetInvoiceAggregateType<T extends InvoiceAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoice[P]>
      : GetScalarType<T[P], AggregateInvoice[P]>
  }




  export type InvoiceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithAggregationInput | InvoiceOrderByWithAggregationInput[]
    by: InvoiceScalarFieldEnum[] | InvoiceScalarFieldEnum
    having?: InvoiceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoiceCountAggregateInputType | true
    _avg?: InvoiceAvgAggregateInputType
    _sum?: InvoiceSumAggregateInputType
    _min?: InvoiceMinAggregateInputType
    _max?: InvoiceMaxAggregateInputType
  }

  export type InvoiceGroupByOutputType = {
    id: string
    clubId: string
    eventId: string
    totalCents: number
    status: $Enums.InvoiceStatus
    pdfUrl: string | null
    createdAt: Date
    updatedAt: Date
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  type GetInvoiceGroupByPayload<T extends InvoiceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoiceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoiceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
            : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
        }
      >
    >


  export type InvoiceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clubId?: boolean
    eventId?: boolean
    totalCents?: boolean
    status?: boolean
    pdfUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | ClubDefaultArgs<ExtArgs>
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clubId?: boolean
    eventId?: boolean
    totalCents?: boolean
    status?: boolean
    pdfUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | ClubDefaultArgs<ExtArgs>
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    clubId?: boolean
    eventId?: boolean
    totalCents?: boolean
    status?: boolean
    pdfUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    club?: boolean | ClubDefaultArgs<ExtArgs>
    event?: boolean | EventDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectScalar = {
    id?: boolean
    clubId?: boolean
    eventId?: boolean
    totalCents?: boolean
    status?: boolean
    pdfUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InvoiceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "clubId" | "eventId" | "totalCents" | "status" | "pdfUrl" | "createdAt" | "updatedAt", ExtArgs["result"]["invoice"]>
  export type InvoiceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | ClubDefaultArgs<ExtArgs>
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type InvoiceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | ClubDefaultArgs<ExtArgs>
    event?: boolean | EventDefaultArgs<ExtArgs>
  }
  export type InvoiceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    club?: boolean | ClubDefaultArgs<ExtArgs>
    event?: boolean | EventDefaultArgs<ExtArgs>
  }

  export type $InvoicePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Invoice"
    objects: {
      club: Prisma.$ClubPayload<ExtArgs>
      event: Prisma.$EventPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      clubId: string
      eventId: string
      totalCents: number
      status: $Enums.InvoiceStatus
      pdfUrl: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["invoice"]>
    composites: {}
  }

  type InvoiceGetPayload<S extends boolean | null | undefined | InvoiceDefaultArgs> = $Result.GetResult<Prisma.$InvoicePayload, S>

  type InvoiceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InvoiceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InvoiceCountAggregateInputType | true
    }

  export interface InvoiceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Invoice'], meta: { name: 'Invoice' } }
    /**
     * Find zero or one Invoice that matches the filter.
     * @param {InvoiceFindUniqueArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvoiceFindUniqueArgs>(args: SelectSubset<T, InvoiceFindUniqueArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Invoice that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InvoiceFindUniqueOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvoiceFindUniqueOrThrowArgs>(args: SelectSubset<T, InvoiceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoice that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvoiceFindFirstArgs>(args?: SelectSubset<T, InvoiceFindFirstArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoice that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvoiceFindFirstOrThrowArgs>(args?: SelectSubset<T, InvoiceFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Invoices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Invoices
     * const invoices = await prisma.invoice.findMany()
     * 
     * // Get first 10 Invoices
     * const invoices = await prisma.invoice.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoiceWithIdOnly = await prisma.invoice.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvoiceFindManyArgs>(args?: SelectSubset<T, InvoiceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Invoice.
     * @param {InvoiceCreateArgs} args - Arguments to create a Invoice.
     * @example
     * // Create one Invoice
     * const Invoice = await prisma.invoice.create({
     *   data: {
     *     // ... data to create a Invoice
     *   }
     * })
     * 
     */
    create<T extends InvoiceCreateArgs>(args: SelectSubset<T, InvoiceCreateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Invoices.
     * @param {InvoiceCreateManyArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvoiceCreateManyArgs>(args?: SelectSubset<T, InvoiceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Invoices and returns the data saved in the database.
     * @param {InvoiceCreateManyAndReturnArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvoiceCreateManyAndReturnArgs>(args?: SelectSubset<T, InvoiceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Invoice.
     * @param {InvoiceDeleteArgs} args - Arguments to delete one Invoice.
     * @example
     * // Delete one Invoice
     * const Invoice = await prisma.invoice.delete({
     *   where: {
     *     // ... filter to delete one Invoice
     *   }
     * })
     * 
     */
    delete<T extends InvoiceDeleteArgs>(args: SelectSubset<T, InvoiceDeleteArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Invoice.
     * @param {InvoiceUpdateArgs} args - Arguments to update one Invoice.
     * @example
     * // Update one Invoice
     * const invoice = await prisma.invoice.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvoiceUpdateArgs>(args: SelectSubset<T, InvoiceUpdateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Invoices.
     * @param {InvoiceDeleteManyArgs} args - Arguments to filter Invoices to delete.
     * @example
     * // Delete a few Invoices
     * const { count } = await prisma.invoice.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvoiceDeleteManyArgs>(args?: SelectSubset<T, InvoiceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvoiceUpdateManyArgs>(args: SelectSubset<T, InvoiceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices and returns the data updated in the database.
     * @param {InvoiceUpdateManyAndReturnArgs} args - Arguments to update many Invoices.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InvoiceUpdateManyAndReturnArgs>(args: SelectSubset<T, InvoiceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Invoice.
     * @param {InvoiceUpsertArgs} args - Arguments to update or create a Invoice.
     * @example
     * // Update or create a Invoice
     * const invoice = await prisma.invoice.upsert({
     *   create: {
     *     // ... data to create a Invoice
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Invoice we want to update
     *   }
     * })
     */
    upsert<T extends InvoiceUpsertArgs>(args: SelectSubset<T, InvoiceUpsertArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceCountArgs} args - Arguments to filter Invoices to count.
     * @example
     * // Count the number of Invoices
     * const count = await prisma.invoice.count({
     *   where: {
     *     // ... the filter for the Invoices we want to count
     *   }
     * })
    **/
    count<T extends InvoiceCountArgs>(
      args?: Subset<T, InvoiceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoiceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InvoiceAggregateArgs>(args: Subset<T, InvoiceAggregateArgs>): Prisma.PrismaPromise<GetInvoiceAggregateType<T>>

    /**
     * Group by Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InvoiceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvoiceGroupByArgs['orderBy'] }
        : { orderBy?: InvoiceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InvoiceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoiceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Invoice model
   */
  readonly fields: InvoiceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Invoice.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvoiceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    club<T extends ClubDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ClubDefaultArgs<ExtArgs>>): Prisma__ClubClient<$Result.GetResult<Prisma.$ClubPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    event<T extends EventDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EventDefaultArgs<ExtArgs>>): Prisma__EventClient<$Result.GetResult<Prisma.$EventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Invoice model
   */
  interface InvoiceFieldRefs {
    readonly id: FieldRef<"Invoice", 'String'>
    readonly clubId: FieldRef<"Invoice", 'String'>
    readonly eventId: FieldRef<"Invoice", 'String'>
    readonly totalCents: FieldRef<"Invoice", 'Int'>
    readonly status: FieldRef<"Invoice", 'InvoiceStatus'>
    readonly pdfUrl: FieldRef<"Invoice", 'String'>
    readonly createdAt: FieldRef<"Invoice", 'DateTime'>
    readonly updatedAt: FieldRef<"Invoice", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Invoice findUnique
   */
  export type InvoiceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findUniqueOrThrow
   */
  export type InvoiceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findFirst
   */
  export type InvoiceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findFirstOrThrow
   */
  export type InvoiceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findMany
   */
  export type InvoiceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter, which Invoices to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice create
   */
  export type InvoiceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The data needed to create a Invoice.
     */
    data: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
  }

  /**
   * Invoice createMany
   */
  export type InvoiceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invoice createManyAndReturn
   */
  export type InvoiceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Invoice update
   */
  export type InvoiceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The data needed to update a Invoice.
     */
    data: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
    /**
     * Choose, which Invoice to update.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice updateMany
   */
  export type InvoiceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to update.
     */
    limit?: number
  }

  /**
   * Invoice updateManyAndReturn
   */
  export type InvoiceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Invoice upsert
   */
  export type InvoiceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * The filter to search for the Invoice to update in case it exists.
     */
    where: InvoiceWhereUniqueInput
    /**
     * In case the Invoice found by the `where` argument doesn't exist, create a new Invoice with this data.
     */
    create: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
    /**
     * In case the Invoice was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
  }

  /**
   * Invoice delete
   */
  export type InvoiceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
    /**
     * Filter which Invoice to delete.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice deleteMany
   */
  export type InvoiceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoices to delete
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to delete.
     */
    limit?: number
  }

  /**
   * Invoice without action
   */
  export type InvoiceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvoiceInclude<ExtArgs> | null
  }


  /**
   * Model AuditLog
   */

  export type AggregateAuditLog = {
    _count: AuditLogCountAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  export type AuditLogMinAggregateOutputType = {
    id: string | null
    userId: string | null
    entityType: string | null
    entityId: string | null
    action: string | null
    diffJson: string | null
    createdAt: Date | null
  }

  export type AuditLogMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    entityType: string | null
    entityId: string | null
    action: string | null
    diffJson: string | null
    createdAt: Date | null
  }

  export type AuditLogCountAggregateOutputType = {
    id: number
    userId: number
    entityType: number
    entityId: number
    action: number
    diffJson: number
    createdAt: number
    _all: number
  }


  export type AuditLogMinAggregateInputType = {
    id?: true
    userId?: true
    entityType?: true
    entityId?: true
    action?: true
    diffJson?: true
    createdAt?: true
  }

  export type AuditLogMaxAggregateInputType = {
    id?: true
    userId?: true
    entityType?: true
    entityId?: true
    action?: true
    diffJson?: true
    createdAt?: true
  }

  export type AuditLogCountAggregateInputType = {
    id?: true
    userId?: true
    entityType?: true
    entityId?: true
    action?: true
    diffJson?: true
    createdAt?: true
    _all?: true
  }

  export type AuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLog to aggregate.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditLogs
    **/
    _count?: true | AuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditLogMaxAggregateInputType
  }

  export type GetAuditLogAggregateType<T extends AuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditLog[P]>
      : GetScalarType<T[P], AggregateAuditLog[P]>
  }




  export type AuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditLogWhereInput
    orderBy?: AuditLogOrderByWithAggregationInput | AuditLogOrderByWithAggregationInput[]
    by: AuditLogScalarFieldEnum[] | AuditLogScalarFieldEnum
    having?: AuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditLogCountAggregateInputType | true
    _min?: AuditLogMinAggregateInputType
    _max?: AuditLogMaxAggregateInputType
  }

  export type AuditLogGroupByOutputType = {
    id: string
    userId: string | null
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt: Date
    _count: AuditLogCountAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  type GetAuditLogGroupByPayload<T extends AuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
        }
      >
    >


  export type AuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    entityType?: boolean
    entityId?: boolean
    action?: boolean
    diffJson?: boolean
    createdAt?: boolean
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    entityType?: boolean
    entityId?: boolean
    action?: boolean
    diffJson?: boolean
    createdAt?: boolean
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    entityType?: boolean
    entityId?: boolean
    action?: boolean
    diffJson?: boolean
    createdAt?: boolean
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectScalar = {
    id?: boolean
    userId?: boolean
    entityType?: boolean
    entityId?: boolean
    action?: boolean
    diffJson?: boolean
    createdAt?: boolean
  }

  export type AuditLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "entityType" | "entityId" | "action" | "diffJson" | "createdAt", ExtArgs["result"]["auditLog"]>
  export type AuditLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }
  export type AuditLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }
  export type AuditLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }

  export type $AuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditLog"
    objects: {
      user: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string | null
      entityType: string
      entityId: string
      action: string
      diffJson: string
      createdAt: Date
    }, ExtArgs["result"]["auditLog"]>
    composites: {}
  }

  type AuditLogGetPayload<S extends boolean | null | undefined | AuditLogDefaultArgs> = $Result.GetResult<Prisma.$AuditLogPayload, S>

  type AuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AuditLogCountAggregateInputType | true
    }

  export interface AuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditLog'], meta: { name: 'AuditLog' } }
    /**
     * Find zero or one AuditLog that matches the filter.
     * @param {AuditLogFindUniqueArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditLogFindUniqueArgs>(args: SelectSubset<T, AuditLogFindUniqueArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AuditLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditLogFindUniqueOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditLogFindFirstArgs>(args?: SelectSubset<T, AuditLogFindFirstArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditLogs
     * const auditLogs = await prisma.auditLog.findMany()
     * 
     * // Get first 10 AuditLogs
     * const auditLogs = await prisma.auditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditLogFindManyArgs>(args?: SelectSubset<T, AuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AuditLog.
     * @param {AuditLogCreateArgs} args - Arguments to create a AuditLog.
     * @example
     * // Create one AuditLog
     * const AuditLog = await prisma.auditLog.create({
     *   data: {
     *     // ... data to create a AuditLog
     *   }
     * })
     * 
     */
    create<T extends AuditLogCreateArgs>(args: SelectSubset<T, AuditLogCreateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AuditLogs.
     * @param {AuditLogCreateManyArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditLogCreateManyArgs>(args?: SelectSubset<T, AuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditLogs and returns the data saved in the database.
     * @param {AuditLogCreateManyAndReturnArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AuditLog.
     * @param {AuditLogDeleteArgs} args - Arguments to delete one AuditLog.
     * @example
     * // Delete one AuditLog
     * const AuditLog = await prisma.auditLog.delete({
     *   where: {
     *     // ... filter to delete one AuditLog
     *   }
     * })
     * 
     */
    delete<T extends AuditLogDeleteArgs>(args: SelectSubset<T, AuditLogDeleteArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AuditLog.
     * @param {AuditLogUpdateArgs} args - Arguments to update one AuditLog.
     * @example
     * // Update one AuditLog
     * const auditLog = await prisma.auditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditLogUpdateArgs>(args: SelectSubset<T, AuditLogUpdateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AuditLogs.
     * @param {AuditLogDeleteManyArgs} args - Arguments to filter AuditLogs to delete.
     * @example
     * // Delete a few AuditLogs
     * const { count } = await prisma.auditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditLogDeleteManyArgs>(args?: SelectSubset<T, AuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditLogUpdateManyArgs>(args: SelectSubset<T, AuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs and returns the data updated in the database.
     * @param {AuditLogUpdateManyAndReturnArgs} args - Arguments to update many AuditLogs.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditLogUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AuditLog.
     * @param {AuditLogUpsertArgs} args - Arguments to update or create a AuditLog.
     * @example
     * // Update or create a AuditLog
     * const auditLog = await prisma.auditLog.upsert({
     *   create: {
     *     // ... data to create a AuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditLog we want to update
     *   }
     * })
     */
    upsert<T extends AuditLogUpsertArgs>(args: SelectSubset<T, AuditLogUpsertArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogCountArgs} args - Arguments to filter AuditLogs to count.
     * @example
     * // Count the number of AuditLogs
     * const count = await prisma.auditLog.count({
     *   where: {
     *     // ... the filter for the AuditLogs we want to count
     *   }
     * })
    **/
    count<T extends AuditLogCountArgs>(
      args?: Subset<T, AuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditLogAggregateArgs>(args: Subset<T, AuditLogAggregateArgs>): Prisma.PrismaPromise<GetAuditLogAggregateType<T>>

    /**
     * Group by AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditLogGroupByArgs['orderBy'] }
        : { orderBy?: AuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditLog model
   */
  readonly fields: AuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends AuditLog$userArgs<ExtArgs> = {}>(args?: Subset<T, AuditLog$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditLog model
   */
  interface AuditLogFieldRefs {
    readonly id: FieldRef<"AuditLog", 'String'>
    readonly userId: FieldRef<"AuditLog", 'String'>
    readonly entityType: FieldRef<"AuditLog", 'String'>
    readonly entityId: FieldRef<"AuditLog", 'String'>
    readonly action: FieldRef<"AuditLog", 'String'>
    readonly diffJson: FieldRef<"AuditLog", 'String'>
    readonly createdAt: FieldRef<"AuditLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AuditLog findUnique
   */
  export type AuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog findUniqueOrThrow
   */
  export type AuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog findFirst
   */
  export type AuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog findFirstOrThrow
   */
  export type AuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog findMany
   */
  export type AuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLogs to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog create
   */
  export type AuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * The data needed to create a AuditLog.
     */
    data: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
  }

  /**
   * AuditLog createMany
   */
  export type AuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditLog createManyAndReturn
   */
  export type AuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AuditLog update
   */
  export type AuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * The data needed to update a AuditLog.
     */
    data: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
    /**
     * Choose, which AuditLog to update.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog updateMany
   */
  export type AuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
  }

  /**
   * AuditLog updateManyAndReturn
   */
  export type AuditLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AuditLog upsert
   */
  export type AuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * The filter to search for the AuditLog to update in case it exists.
     */
    where: AuditLogWhereUniqueInput
    /**
     * In case the AuditLog found by the `where` argument doesn't exist, create a new AuditLog with this data.
     */
    create: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
    /**
     * In case the AuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
  }

  /**
   * AuditLog delete
   */
  export type AuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter which AuditLog to delete.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog deleteMany
   */
  export type AuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLogs to delete
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to delete.
     */
    limit?: number
  }

  /**
   * AuditLog.user
   */
  export type AuditLog$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * AuditLog without action
   */
  export type AuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    role: 'role',
    clubId: 'clubId',
    passwordHash: 'passwordHash',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ClubScalarFieldEnum: {
    id: 'id',
    name: 'name',
    region: 'region',
    contactName: 'contactName',
    email: 'email',
    phone: 'phone',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ClubScalarFieldEnum = (typeof ClubScalarFieldEnum)[keyof typeof ClubScalarFieldEnum]


  export const EventScalarFieldEnum: {
    id: 'id',
    name: 'name',
    venue: 'venue',
    city: 'city',
    country: 'country',
    startDate: 'startDate',
    regOpen: 'regOpen',
    regClose: 'regClose',
    configJson: 'configJson',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EventScalarFieldEnum = (typeof EventScalarFieldEnum)[keyof typeof EventScalarFieldEnum]


  export const DivisionScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    key: 'key',
    name: 'name',
    minAge: 'minAge',
    maxAge: 'maxAge',
    gender: 'gender',
    notes: 'notes'
  };

  export type DivisionScalarFieldEnum = (typeof DivisionScalarFieldEnum)[keyof typeof DivisionScalarFieldEnum]


  export const WeightClassScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    divisionId: 'divisionId',
    gender: 'gender',
    name: 'name',
    minKg: 'minKg',
    maxKg: 'maxKg'
  };

  export type WeightClassScalarFieldEnum = (typeof WeightClassScalarFieldEnum)[keyof typeof WeightClassScalarFieldEnum]


  export const AthleteScalarFieldEnum: {
    id: 'id',
    clubId: 'clubId',
    firstName: 'firstName',
    lastName: 'lastName',
    dob: 'dob',
    gender: 'gender',
    nationality: 'nationality',
    idType: 'idType',
    idNumber: 'idNumber',
    beltRank: 'beltRank',
    weightKg: 'weightKg',
    medicalNotes: 'medicalNotes',
    emergencyName: 'emergencyName',
    emergencyPhone: 'emergencyPhone',
    guardianName: 'guardianName',
    guardianPhone: 'guardianPhone',
    photoUrl: 'photoUrl',
    waiverUrl: 'waiverUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AthleteScalarFieldEnum = (typeof AthleteScalarFieldEnum)[keyof typeof AthleteScalarFieldEnum]


  export const EntryScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    clubId: 'clubId',
    athleteId: 'athleteId',
    teamId: 'teamId',
    entryType: 'entryType',
    divisionId: 'divisionId',
    weightClassId: 'weightClassId',
    status: 'status',
    feeCents: 'feeCents',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EntryScalarFieldEnum = (typeof EntryScalarFieldEnum)[keyof typeof EntryScalarFieldEnum]


  export const TeamScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    clubId: 'clubId',
    name: 'name',
    teamType: 'teamType',
    divisionId: 'divisionId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TeamScalarFieldEnum = (typeof TeamScalarFieldEnum)[keyof typeof TeamScalarFieldEnum]


  export const TeamMemberScalarFieldEnum: {
    id: 'id',
    teamId: 'teamId',
    athleteId: 'athleteId',
    isReserve: 'isReserve'
  };

  export type TeamMemberScalarFieldEnum = (typeof TeamMemberScalarFieldEnum)[keyof typeof TeamMemberScalarFieldEnum]


  export const InvoiceScalarFieldEnum: {
    id: 'id',
    clubId: 'clubId',
    eventId: 'eventId',
    totalCents: 'totalCents',
    status: 'status',
    pdfUrl: 'pdfUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InvoiceScalarFieldEnum = (typeof InvoiceScalarFieldEnum)[keyof typeof InvoiceScalarFieldEnum]


  export const AuditLogScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    entityType: 'entityType',
    entityId: 'entityId',
    action: 'action',
    diffJson: 'diffJson',
    createdAt: 'createdAt'
  };

  export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Gender'
   */
  export type EnumGenderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Gender'>
    


  /**
   * Reference to a field of type 'Gender[]'
   */
  export type ListEnumGenderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Gender[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'EntryType'
   */
  export type EnumEntryTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EntryType'>
    


  /**
   * Reference to a field of type 'EntryType[]'
   */
  export type ListEnumEntryTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EntryType[]'>
    


  /**
   * Reference to a field of type 'EntryStatus'
   */
  export type EnumEntryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EntryStatus'>
    


  /**
   * Reference to a field of type 'EntryStatus[]'
   */
  export type ListEnumEntryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'EntryStatus[]'>
    


  /**
   * Reference to a field of type 'TeamStatus'
   */
  export type EnumTeamStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TeamStatus'>
    


  /**
   * Reference to a field of type 'TeamStatus[]'
   */
  export type ListEnumTeamStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TeamStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'InvoiceStatus'
   */
  export type EnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus'>
    


  /**
   * Reference to a field of type 'InvoiceStatus[]'
   */
  export type ListEnumInvoiceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InvoiceStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    email?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    clubId?: StringNullableFilter<"User"> | string | null
    passwordHash?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    club?: XOR<ClubNullableScalarRelationFilter, ClubWhereInput> | null
    AuditLogs?: AuditLogListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrder
    role?: SortOrder
    clubId?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    club?: ClubOrderByWithRelationInput
    AuditLogs?: AuditLogOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
    clubId?: StringNullableFilter<"User"> | string | null
    passwordHash?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    club?: XOR<ClubNullableScalarRelationFilter, ClubWhereInput> | null
    AuditLogs?: AuditLogListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrder
    role?: SortOrder
    clubId?: SortOrderInput | SortOrder
    passwordHash?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    email?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    clubId?: StringNullableWithAggregatesFilter<"User"> | string | null
    passwordHash?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ClubWhereInput = {
    AND?: ClubWhereInput | ClubWhereInput[]
    OR?: ClubWhereInput[]
    NOT?: ClubWhereInput | ClubWhereInput[]
    id?: StringFilter<"Club"> | string
    name?: StringFilter<"Club"> | string
    region?: StringNullableFilter<"Club"> | string | null
    contactName?: StringFilter<"Club"> | string
    email?: StringFilter<"Club"> | string
    phone?: StringNullableFilter<"Club"> | string | null
    notes?: StringNullableFilter<"Club"> | string | null
    createdAt?: DateTimeFilter<"Club"> | Date | string
    updatedAt?: DateTimeFilter<"Club"> | Date | string
    users?: UserListRelationFilter
    athletes?: AthleteListRelationFilter
    teams?: TeamListRelationFilter
    entries?: EntryListRelationFilter
    invoices?: InvoiceListRelationFilter
  }

  export type ClubOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    region?: SortOrderInput | SortOrder
    contactName?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    users?: UserOrderByRelationAggregateInput
    athletes?: AthleteOrderByRelationAggregateInput
    teams?: TeamOrderByRelationAggregateInput
    entries?: EntryOrderByRelationAggregateInput
    invoices?: InvoiceOrderByRelationAggregateInput
  }

  export type ClubWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ClubWhereInput | ClubWhereInput[]
    OR?: ClubWhereInput[]
    NOT?: ClubWhereInput | ClubWhereInput[]
    name?: StringFilter<"Club"> | string
    region?: StringNullableFilter<"Club"> | string | null
    contactName?: StringFilter<"Club"> | string
    email?: StringFilter<"Club"> | string
    phone?: StringNullableFilter<"Club"> | string | null
    notes?: StringNullableFilter<"Club"> | string | null
    createdAt?: DateTimeFilter<"Club"> | Date | string
    updatedAt?: DateTimeFilter<"Club"> | Date | string
    users?: UserListRelationFilter
    athletes?: AthleteListRelationFilter
    teams?: TeamListRelationFilter
    entries?: EntryListRelationFilter
    invoices?: InvoiceListRelationFilter
  }, "id">

  export type ClubOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    region?: SortOrderInput | SortOrder
    contactName?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ClubCountOrderByAggregateInput
    _max?: ClubMaxOrderByAggregateInput
    _min?: ClubMinOrderByAggregateInput
  }

  export type ClubScalarWhereWithAggregatesInput = {
    AND?: ClubScalarWhereWithAggregatesInput | ClubScalarWhereWithAggregatesInput[]
    OR?: ClubScalarWhereWithAggregatesInput[]
    NOT?: ClubScalarWhereWithAggregatesInput | ClubScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Club"> | string
    name?: StringWithAggregatesFilter<"Club"> | string
    region?: StringNullableWithAggregatesFilter<"Club"> | string | null
    contactName?: StringWithAggregatesFilter<"Club"> | string
    email?: StringWithAggregatesFilter<"Club"> | string
    phone?: StringNullableWithAggregatesFilter<"Club"> | string | null
    notes?: StringNullableWithAggregatesFilter<"Club"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Club"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Club"> | Date | string
  }

  export type EventWhereInput = {
    AND?: EventWhereInput | EventWhereInput[]
    OR?: EventWhereInput[]
    NOT?: EventWhereInput | EventWhereInput[]
    id?: StringFilter<"Event"> | string
    name?: StringFilter<"Event"> | string
    venue?: StringFilter<"Event"> | string
    city?: StringFilter<"Event"> | string
    country?: StringFilter<"Event"> | string
    startDate?: DateTimeFilter<"Event"> | Date | string
    regOpen?: DateTimeFilter<"Event"> | Date | string
    regClose?: DateTimeFilter<"Event"> | Date | string
    configJson?: StringFilter<"Event"> | string
    createdAt?: DateTimeFilter<"Event"> | Date | string
    updatedAt?: DateTimeFilter<"Event"> | Date | string
    divisions?: DivisionListRelationFilter
    weightClasses?: WeightClassListRelationFilter
    entries?: EntryListRelationFilter
    teams?: TeamListRelationFilter
    invoices?: InvoiceListRelationFilter
  }

  export type EventOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    venue?: SortOrder
    city?: SortOrder
    country?: SortOrder
    startDate?: SortOrder
    regOpen?: SortOrder
    regClose?: SortOrder
    configJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    divisions?: DivisionOrderByRelationAggregateInput
    weightClasses?: WeightClassOrderByRelationAggregateInput
    entries?: EntryOrderByRelationAggregateInput
    teams?: TeamOrderByRelationAggregateInput
    invoices?: InvoiceOrderByRelationAggregateInput
  }

  export type EventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EventWhereInput | EventWhereInput[]
    OR?: EventWhereInput[]
    NOT?: EventWhereInput | EventWhereInput[]
    name?: StringFilter<"Event"> | string
    venue?: StringFilter<"Event"> | string
    city?: StringFilter<"Event"> | string
    country?: StringFilter<"Event"> | string
    startDate?: DateTimeFilter<"Event"> | Date | string
    regOpen?: DateTimeFilter<"Event"> | Date | string
    regClose?: DateTimeFilter<"Event"> | Date | string
    configJson?: StringFilter<"Event"> | string
    createdAt?: DateTimeFilter<"Event"> | Date | string
    updatedAt?: DateTimeFilter<"Event"> | Date | string
    divisions?: DivisionListRelationFilter
    weightClasses?: WeightClassListRelationFilter
    entries?: EntryListRelationFilter
    teams?: TeamListRelationFilter
    invoices?: InvoiceListRelationFilter
  }, "id">

  export type EventOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    venue?: SortOrder
    city?: SortOrder
    country?: SortOrder
    startDate?: SortOrder
    regOpen?: SortOrder
    regClose?: SortOrder
    configJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EventCountOrderByAggregateInput
    _max?: EventMaxOrderByAggregateInput
    _min?: EventMinOrderByAggregateInput
  }

  export type EventScalarWhereWithAggregatesInput = {
    AND?: EventScalarWhereWithAggregatesInput | EventScalarWhereWithAggregatesInput[]
    OR?: EventScalarWhereWithAggregatesInput[]
    NOT?: EventScalarWhereWithAggregatesInput | EventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Event"> | string
    name?: StringWithAggregatesFilter<"Event"> | string
    venue?: StringWithAggregatesFilter<"Event"> | string
    city?: StringWithAggregatesFilter<"Event"> | string
    country?: StringWithAggregatesFilter<"Event"> | string
    startDate?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    regOpen?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    regClose?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    configJson?: StringWithAggregatesFilter<"Event"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Event"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Event"> | Date | string
  }

  export type DivisionWhereInput = {
    AND?: DivisionWhereInput | DivisionWhereInput[]
    OR?: DivisionWhereInput[]
    NOT?: DivisionWhereInput | DivisionWhereInput[]
    id?: StringFilter<"Division"> | string
    eventId?: StringFilter<"Division"> | string
    key?: StringFilter<"Division"> | string
    name?: StringFilter<"Division"> | string
    minAge?: IntFilter<"Division"> | number
    maxAge?: IntFilter<"Division"> | number
    gender?: EnumGenderFilter<"Division"> | $Enums.Gender
    notes?: StringNullableFilter<"Division"> | string | null
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    entries?: EntryListRelationFilter
    teams?: TeamListRelationFilter
    weightClasses?: WeightClassListRelationFilter
  }

  export type DivisionOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    key?: SortOrder
    name?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    gender?: SortOrder
    notes?: SortOrderInput | SortOrder
    event?: EventOrderByWithRelationInput
    entries?: EntryOrderByRelationAggregateInput
    teams?: TeamOrderByRelationAggregateInput
    weightClasses?: WeightClassOrderByRelationAggregateInput
  }

  export type DivisionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DivisionWhereInput | DivisionWhereInput[]
    OR?: DivisionWhereInput[]
    NOT?: DivisionWhereInput | DivisionWhereInput[]
    eventId?: StringFilter<"Division"> | string
    key?: StringFilter<"Division"> | string
    name?: StringFilter<"Division"> | string
    minAge?: IntFilter<"Division"> | number
    maxAge?: IntFilter<"Division"> | number
    gender?: EnumGenderFilter<"Division"> | $Enums.Gender
    notes?: StringNullableFilter<"Division"> | string | null
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    entries?: EntryListRelationFilter
    teams?: TeamListRelationFilter
    weightClasses?: WeightClassListRelationFilter
  }, "id">

  export type DivisionOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    key?: SortOrder
    name?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    gender?: SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: DivisionCountOrderByAggregateInput
    _avg?: DivisionAvgOrderByAggregateInput
    _max?: DivisionMaxOrderByAggregateInput
    _min?: DivisionMinOrderByAggregateInput
    _sum?: DivisionSumOrderByAggregateInput
  }

  export type DivisionScalarWhereWithAggregatesInput = {
    AND?: DivisionScalarWhereWithAggregatesInput | DivisionScalarWhereWithAggregatesInput[]
    OR?: DivisionScalarWhereWithAggregatesInput[]
    NOT?: DivisionScalarWhereWithAggregatesInput | DivisionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Division"> | string
    eventId?: StringWithAggregatesFilter<"Division"> | string
    key?: StringWithAggregatesFilter<"Division"> | string
    name?: StringWithAggregatesFilter<"Division"> | string
    minAge?: IntWithAggregatesFilter<"Division"> | number
    maxAge?: IntWithAggregatesFilter<"Division"> | number
    gender?: EnumGenderWithAggregatesFilter<"Division"> | $Enums.Gender
    notes?: StringNullableWithAggregatesFilter<"Division"> | string | null
  }

  export type WeightClassWhereInput = {
    AND?: WeightClassWhereInput | WeightClassWhereInput[]
    OR?: WeightClassWhereInput[]
    NOT?: WeightClassWhereInput | WeightClassWhereInput[]
    id?: StringFilter<"WeightClass"> | string
    eventId?: StringFilter<"WeightClass"> | string
    divisionId?: StringNullableFilter<"WeightClass"> | string | null
    gender?: EnumGenderFilter<"WeightClass"> | $Enums.Gender
    name?: StringFilter<"WeightClass"> | string
    minKg?: FloatNullableFilter<"WeightClass"> | number | null
    maxKg?: FloatNullableFilter<"WeightClass"> | number | null
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    division?: XOR<DivisionNullableScalarRelationFilter, DivisionWhereInput> | null
    entries?: EntryListRelationFilter
  }

  export type WeightClassOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    divisionId?: SortOrderInput | SortOrder
    gender?: SortOrder
    name?: SortOrder
    minKg?: SortOrderInput | SortOrder
    maxKg?: SortOrderInput | SortOrder
    event?: EventOrderByWithRelationInput
    division?: DivisionOrderByWithRelationInput
    entries?: EntryOrderByRelationAggregateInput
  }

  export type WeightClassWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WeightClassWhereInput | WeightClassWhereInput[]
    OR?: WeightClassWhereInput[]
    NOT?: WeightClassWhereInput | WeightClassWhereInput[]
    eventId?: StringFilter<"WeightClass"> | string
    divisionId?: StringNullableFilter<"WeightClass"> | string | null
    gender?: EnumGenderFilter<"WeightClass"> | $Enums.Gender
    name?: StringFilter<"WeightClass"> | string
    minKg?: FloatNullableFilter<"WeightClass"> | number | null
    maxKg?: FloatNullableFilter<"WeightClass"> | number | null
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    division?: XOR<DivisionNullableScalarRelationFilter, DivisionWhereInput> | null
    entries?: EntryListRelationFilter
  }, "id">

  export type WeightClassOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    divisionId?: SortOrderInput | SortOrder
    gender?: SortOrder
    name?: SortOrder
    minKg?: SortOrderInput | SortOrder
    maxKg?: SortOrderInput | SortOrder
    _count?: WeightClassCountOrderByAggregateInput
    _avg?: WeightClassAvgOrderByAggregateInput
    _max?: WeightClassMaxOrderByAggregateInput
    _min?: WeightClassMinOrderByAggregateInput
    _sum?: WeightClassSumOrderByAggregateInput
  }

  export type WeightClassScalarWhereWithAggregatesInput = {
    AND?: WeightClassScalarWhereWithAggregatesInput | WeightClassScalarWhereWithAggregatesInput[]
    OR?: WeightClassScalarWhereWithAggregatesInput[]
    NOT?: WeightClassScalarWhereWithAggregatesInput | WeightClassScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WeightClass"> | string
    eventId?: StringWithAggregatesFilter<"WeightClass"> | string
    divisionId?: StringNullableWithAggregatesFilter<"WeightClass"> | string | null
    gender?: EnumGenderWithAggregatesFilter<"WeightClass"> | $Enums.Gender
    name?: StringWithAggregatesFilter<"WeightClass"> | string
    minKg?: FloatNullableWithAggregatesFilter<"WeightClass"> | number | null
    maxKg?: FloatNullableWithAggregatesFilter<"WeightClass"> | number | null
  }

  export type AthleteWhereInput = {
    AND?: AthleteWhereInput | AthleteWhereInput[]
    OR?: AthleteWhereInput[]
    NOT?: AthleteWhereInput | AthleteWhereInput[]
    id?: StringFilter<"Athlete"> | string
    clubId?: StringFilter<"Athlete"> | string
    firstName?: StringFilter<"Athlete"> | string
    lastName?: StringFilter<"Athlete"> | string
    dob?: DateTimeFilter<"Athlete"> | Date | string
    gender?: EnumGenderFilter<"Athlete"> | $Enums.Gender
    nationality?: StringFilter<"Athlete"> | string
    idType?: StringNullableFilter<"Athlete"> | string | null
    idNumber?: StringNullableFilter<"Athlete"> | string | null
    beltRank?: StringNullableFilter<"Athlete"> | string | null
    weightKg?: FloatNullableFilter<"Athlete"> | number | null
    medicalNotes?: StringNullableFilter<"Athlete"> | string | null
    emergencyName?: StringFilter<"Athlete"> | string
    emergencyPhone?: StringFilter<"Athlete"> | string
    guardianName?: StringNullableFilter<"Athlete"> | string | null
    guardianPhone?: StringNullableFilter<"Athlete"> | string | null
    photoUrl?: StringNullableFilter<"Athlete"> | string | null
    waiverUrl?: StringNullableFilter<"Athlete"> | string | null
    createdAt?: DateTimeFilter<"Athlete"> | Date | string
    updatedAt?: DateTimeFilter<"Athlete"> | Date | string
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    entries?: EntryListRelationFilter
    teamMembers?: TeamMemberListRelationFilter
  }

  export type AthleteOrderByWithRelationInput = {
    id?: SortOrder
    clubId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    nationality?: SortOrder
    idType?: SortOrderInput | SortOrder
    idNumber?: SortOrderInput | SortOrder
    beltRank?: SortOrderInput | SortOrder
    weightKg?: SortOrderInput | SortOrder
    medicalNotes?: SortOrderInput | SortOrder
    emergencyName?: SortOrder
    emergencyPhone?: SortOrder
    guardianName?: SortOrderInput | SortOrder
    guardianPhone?: SortOrderInput | SortOrder
    photoUrl?: SortOrderInput | SortOrder
    waiverUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    club?: ClubOrderByWithRelationInput
    entries?: EntryOrderByRelationAggregateInput
    teamMembers?: TeamMemberOrderByRelationAggregateInput
  }

  export type AthleteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AthleteWhereInput | AthleteWhereInput[]
    OR?: AthleteWhereInput[]
    NOT?: AthleteWhereInput | AthleteWhereInput[]
    clubId?: StringFilter<"Athlete"> | string
    firstName?: StringFilter<"Athlete"> | string
    lastName?: StringFilter<"Athlete"> | string
    dob?: DateTimeFilter<"Athlete"> | Date | string
    gender?: EnumGenderFilter<"Athlete"> | $Enums.Gender
    nationality?: StringFilter<"Athlete"> | string
    idType?: StringNullableFilter<"Athlete"> | string | null
    idNumber?: StringNullableFilter<"Athlete"> | string | null
    beltRank?: StringNullableFilter<"Athlete"> | string | null
    weightKg?: FloatNullableFilter<"Athlete"> | number | null
    medicalNotes?: StringNullableFilter<"Athlete"> | string | null
    emergencyName?: StringFilter<"Athlete"> | string
    emergencyPhone?: StringFilter<"Athlete"> | string
    guardianName?: StringNullableFilter<"Athlete"> | string | null
    guardianPhone?: StringNullableFilter<"Athlete"> | string | null
    photoUrl?: StringNullableFilter<"Athlete"> | string | null
    waiverUrl?: StringNullableFilter<"Athlete"> | string | null
    createdAt?: DateTimeFilter<"Athlete"> | Date | string
    updatedAt?: DateTimeFilter<"Athlete"> | Date | string
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    entries?: EntryListRelationFilter
    teamMembers?: TeamMemberListRelationFilter
  }, "id">

  export type AthleteOrderByWithAggregationInput = {
    id?: SortOrder
    clubId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    nationality?: SortOrder
    idType?: SortOrderInput | SortOrder
    idNumber?: SortOrderInput | SortOrder
    beltRank?: SortOrderInput | SortOrder
    weightKg?: SortOrderInput | SortOrder
    medicalNotes?: SortOrderInput | SortOrder
    emergencyName?: SortOrder
    emergencyPhone?: SortOrder
    guardianName?: SortOrderInput | SortOrder
    guardianPhone?: SortOrderInput | SortOrder
    photoUrl?: SortOrderInput | SortOrder
    waiverUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AthleteCountOrderByAggregateInput
    _avg?: AthleteAvgOrderByAggregateInput
    _max?: AthleteMaxOrderByAggregateInput
    _min?: AthleteMinOrderByAggregateInput
    _sum?: AthleteSumOrderByAggregateInput
  }

  export type AthleteScalarWhereWithAggregatesInput = {
    AND?: AthleteScalarWhereWithAggregatesInput | AthleteScalarWhereWithAggregatesInput[]
    OR?: AthleteScalarWhereWithAggregatesInput[]
    NOT?: AthleteScalarWhereWithAggregatesInput | AthleteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Athlete"> | string
    clubId?: StringWithAggregatesFilter<"Athlete"> | string
    firstName?: StringWithAggregatesFilter<"Athlete"> | string
    lastName?: StringWithAggregatesFilter<"Athlete"> | string
    dob?: DateTimeWithAggregatesFilter<"Athlete"> | Date | string
    gender?: EnumGenderWithAggregatesFilter<"Athlete"> | $Enums.Gender
    nationality?: StringWithAggregatesFilter<"Athlete"> | string
    idType?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    idNumber?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    beltRank?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    weightKg?: FloatNullableWithAggregatesFilter<"Athlete"> | number | null
    medicalNotes?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    emergencyName?: StringWithAggregatesFilter<"Athlete"> | string
    emergencyPhone?: StringWithAggregatesFilter<"Athlete"> | string
    guardianName?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    guardianPhone?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    photoUrl?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    waiverUrl?: StringNullableWithAggregatesFilter<"Athlete"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Athlete"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Athlete"> | Date | string
  }

  export type EntryWhereInput = {
    AND?: EntryWhereInput | EntryWhereInput[]
    OR?: EntryWhereInput[]
    NOT?: EntryWhereInput | EntryWhereInput[]
    id?: StringFilter<"Entry"> | string
    eventId?: StringFilter<"Entry"> | string
    clubId?: StringFilter<"Entry"> | string
    athleteId?: StringNullableFilter<"Entry"> | string | null
    teamId?: StringNullableFilter<"Entry"> | string | null
    entryType?: EnumEntryTypeFilter<"Entry"> | $Enums.EntryType
    divisionId?: StringFilter<"Entry"> | string
    weightClassId?: StringNullableFilter<"Entry"> | string | null
    status?: EnumEntryStatusFilter<"Entry"> | $Enums.EntryStatus
    feeCents?: IntFilter<"Entry"> | number
    notes?: StringNullableFilter<"Entry"> | string | null
    createdAt?: DateTimeFilter<"Entry"> | Date | string
    updatedAt?: DateTimeFilter<"Entry"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    athlete?: XOR<AthleteNullableScalarRelationFilter, AthleteWhereInput> | null
    team?: XOR<TeamNullableScalarRelationFilter, TeamWhereInput> | null
    division?: XOR<DivisionScalarRelationFilter, DivisionWhereInput>
    weightClass?: XOR<WeightClassNullableScalarRelationFilter, WeightClassWhereInput> | null
  }

  export type EntryOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    athleteId?: SortOrderInput | SortOrder
    teamId?: SortOrderInput | SortOrder
    entryType?: SortOrder
    divisionId?: SortOrder
    weightClassId?: SortOrderInput | SortOrder
    status?: SortOrder
    feeCents?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    event?: EventOrderByWithRelationInput
    club?: ClubOrderByWithRelationInput
    athlete?: AthleteOrderByWithRelationInput
    team?: TeamOrderByWithRelationInput
    division?: DivisionOrderByWithRelationInput
    weightClass?: WeightClassOrderByWithRelationInput
  }

  export type EntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    eventId_athleteId_entryType_divisionId?: EntryEventIdAthleteIdEntryTypeDivisionIdCompoundUniqueInput
    eventId_teamId_entryType_divisionId?: EntryEventIdTeamIdEntryTypeDivisionIdCompoundUniqueInput
    AND?: EntryWhereInput | EntryWhereInput[]
    OR?: EntryWhereInput[]
    NOT?: EntryWhereInput | EntryWhereInput[]
    eventId?: StringFilter<"Entry"> | string
    clubId?: StringFilter<"Entry"> | string
    athleteId?: StringNullableFilter<"Entry"> | string | null
    teamId?: StringNullableFilter<"Entry"> | string | null
    entryType?: EnumEntryTypeFilter<"Entry"> | $Enums.EntryType
    divisionId?: StringFilter<"Entry"> | string
    weightClassId?: StringNullableFilter<"Entry"> | string | null
    status?: EnumEntryStatusFilter<"Entry"> | $Enums.EntryStatus
    feeCents?: IntFilter<"Entry"> | number
    notes?: StringNullableFilter<"Entry"> | string | null
    createdAt?: DateTimeFilter<"Entry"> | Date | string
    updatedAt?: DateTimeFilter<"Entry"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    athlete?: XOR<AthleteNullableScalarRelationFilter, AthleteWhereInput> | null
    team?: XOR<TeamNullableScalarRelationFilter, TeamWhereInput> | null
    division?: XOR<DivisionScalarRelationFilter, DivisionWhereInput>
    weightClass?: XOR<WeightClassNullableScalarRelationFilter, WeightClassWhereInput> | null
  }, "id" | "eventId_athleteId_entryType_divisionId" | "eventId_teamId_entryType_divisionId">

  export type EntryOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    athleteId?: SortOrderInput | SortOrder
    teamId?: SortOrderInput | SortOrder
    entryType?: SortOrder
    divisionId?: SortOrder
    weightClassId?: SortOrderInput | SortOrder
    status?: SortOrder
    feeCents?: SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EntryCountOrderByAggregateInput
    _avg?: EntryAvgOrderByAggregateInput
    _max?: EntryMaxOrderByAggregateInput
    _min?: EntryMinOrderByAggregateInput
    _sum?: EntrySumOrderByAggregateInput
  }

  export type EntryScalarWhereWithAggregatesInput = {
    AND?: EntryScalarWhereWithAggregatesInput | EntryScalarWhereWithAggregatesInput[]
    OR?: EntryScalarWhereWithAggregatesInput[]
    NOT?: EntryScalarWhereWithAggregatesInput | EntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Entry"> | string
    eventId?: StringWithAggregatesFilter<"Entry"> | string
    clubId?: StringWithAggregatesFilter<"Entry"> | string
    athleteId?: StringNullableWithAggregatesFilter<"Entry"> | string | null
    teamId?: StringNullableWithAggregatesFilter<"Entry"> | string | null
    entryType?: EnumEntryTypeWithAggregatesFilter<"Entry"> | $Enums.EntryType
    divisionId?: StringWithAggregatesFilter<"Entry"> | string
    weightClassId?: StringNullableWithAggregatesFilter<"Entry"> | string | null
    status?: EnumEntryStatusWithAggregatesFilter<"Entry"> | $Enums.EntryStatus
    feeCents?: IntWithAggregatesFilter<"Entry"> | number
    notes?: StringNullableWithAggregatesFilter<"Entry"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Entry"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Entry"> | Date | string
  }

  export type TeamWhereInput = {
    AND?: TeamWhereInput | TeamWhereInput[]
    OR?: TeamWhereInput[]
    NOT?: TeamWhereInput | TeamWhereInput[]
    id?: StringFilter<"Team"> | string
    eventId?: StringFilter<"Team"> | string
    clubId?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    teamType?: EnumEntryTypeFilter<"Team"> | $Enums.EntryType
    divisionId?: StringFilter<"Team"> | string
    status?: EnumTeamStatusFilter<"Team"> | $Enums.TeamStatus
    createdAt?: DateTimeFilter<"Team"> | Date | string
    updatedAt?: DateTimeFilter<"Team"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    division?: XOR<DivisionScalarRelationFilter, DivisionWhereInput>
    members?: TeamMemberListRelationFilter
    entries?: EntryListRelationFilter
  }

  export type TeamOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    name?: SortOrder
    teamType?: SortOrder
    divisionId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    event?: EventOrderByWithRelationInput
    club?: ClubOrderByWithRelationInput
    division?: DivisionOrderByWithRelationInput
    members?: TeamMemberOrderByRelationAggregateInput
    entries?: EntryOrderByRelationAggregateInput
  }

  export type TeamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TeamWhereInput | TeamWhereInput[]
    OR?: TeamWhereInput[]
    NOT?: TeamWhereInput | TeamWhereInput[]
    eventId?: StringFilter<"Team"> | string
    clubId?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    teamType?: EnumEntryTypeFilter<"Team"> | $Enums.EntryType
    divisionId?: StringFilter<"Team"> | string
    status?: EnumTeamStatusFilter<"Team"> | $Enums.TeamStatus
    createdAt?: DateTimeFilter<"Team"> | Date | string
    updatedAt?: DateTimeFilter<"Team"> | Date | string
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    division?: XOR<DivisionScalarRelationFilter, DivisionWhereInput>
    members?: TeamMemberListRelationFilter
    entries?: EntryListRelationFilter
  }, "id">

  export type TeamOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    name?: SortOrder
    teamType?: SortOrder
    divisionId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TeamCountOrderByAggregateInput
    _max?: TeamMaxOrderByAggregateInput
    _min?: TeamMinOrderByAggregateInput
  }

  export type TeamScalarWhereWithAggregatesInput = {
    AND?: TeamScalarWhereWithAggregatesInput | TeamScalarWhereWithAggregatesInput[]
    OR?: TeamScalarWhereWithAggregatesInput[]
    NOT?: TeamScalarWhereWithAggregatesInput | TeamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Team"> | string
    eventId?: StringWithAggregatesFilter<"Team"> | string
    clubId?: StringWithAggregatesFilter<"Team"> | string
    name?: StringWithAggregatesFilter<"Team"> | string
    teamType?: EnumEntryTypeWithAggregatesFilter<"Team"> | $Enums.EntryType
    divisionId?: StringWithAggregatesFilter<"Team"> | string
    status?: EnumTeamStatusWithAggregatesFilter<"Team"> | $Enums.TeamStatus
    createdAt?: DateTimeWithAggregatesFilter<"Team"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Team"> | Date | string
  }

  export type TeamMemberWhereInput = {
    AND?: TeamMemberWhereInput | TeamMemberWhereInput[]
    OR?: TeamMemberWhereInput[]
    NOT?: TeamMemberWhereInput | TeamMemberWhereInput[]
    id?: StringFilter<"TeamMember"> | string
    teamId?: StringFilter<"TeamMember"> | string
    athleteId?: StringFilter<"TeamMember"> | string
    isReserve?: BoolFilter<"TeamMember"> | boolean
    team?: XOR<TeamScalarRelationFilter, TeamWhereInput>
    athlete?: XOR<AthleteScalarRelationFilter, AthleteWhereInput>
  }

  export type TeamMemberOrderByWithRelationInput = {
    id?: SortOrder
    teamId?: SortOrder
    athleteId?: SortOrder
    isReserve?: SortOrder
    team?: TeamOrderByWithRelationInput
    athlete?: AthleteOrderByWithRelationInput
  }

  export type TeamMemberWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    teamId_athleteId?: TeamMemberTeamIdAthleteIdCompoundUniqueInput
    AND?: TeamMemberWhereInput | TeamMemberWhereInput[]
    OR?: TeamMemberWhereInput[]
    NOT?: TeamMemberWhereInput | TeamMemberWhereInput[]
    teamId?: StringFilter<"TeamMember"> | string
    athleteId?: StringFilter<"TeamMember"> | string
    isReserve?: BoolFilter<"TeamMember"> | boolean
    team?: XOR<TeamScalarRelationFilter, TeamWhereInput>
    athlete?: XOR<AthleteScalarRelationFilter, AthleteWhereInput>
  }, "id" | "teamId_athleteId">

  export type TeamMemberOrderByWithAggregationInput = {
    id?: SortOrder
    teamId?: SortOrder
    athleteId?: SortOrder
    isReserve?: SortOrder
    _count?: TeamMemberCountOrderByAggregateInput
    _max?: TeamMemberMaxOrderByAggregateInput
    _min?: TeamMemberMinOrderByAggregateInput
  }

  export type TeamMemberScalarWhereWithAggregatesInput = {
    AND?: TeamMemberScalarWhereWithAggregatesInput | TeamMemberScalarWhereWithAggregatesInput[]
    OR?: TeamMemberScalarWhereWithAggregatesInput[]
    NOT?: TeamMemberScalarWhereWithAggregatesInput | TeamMemberScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TeamMember"> | string
    teamId?: StringWithAggregatesFilter<"TeamMember"> | string
    athleteId?: StringWithAggregatesFilter<"TeamMember"> | string
    isReserve?: BoolWithAggregatesFilter<"TeamMember"> | boolean
  }

  export type InvoiceWhereInput = {
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    id?: StringFilter<"Invoice"> | string
    clubId?: StringFilter<"Invoice"> | string
    eventId?: StringFilter<"Invoice"> | string
    totalCents?: IntFilter<"Invoice"> | number
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }

  export type InvoiceOrderByWithRelationInput = {
    id?: SortOrder
    clubId?: SortOrder
    eventId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    club?: ClubOrderByWithRelationInput
    event?: EventOrderByWithRelationInput
  }

  export type InvoiceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    clubId?: StringFilter<"Invoice"> | string
    eventId?: StringFilter<"Invoice"> | string
    totalCents?: IntFilter<"Invoice"> | number
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
    club?: XOR<ClubScalarRelationFilter, ClubWhereInput>
    event?: XOR<EventScalarRelationFilter, EventWhereInput>
  }, "id">

  export type InvoiceOrderByWithAggregationInput = {
    id?: SortOrder
    clubId?: SortOrder
    eventId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InvoiceCountOrderByAggregateInput
    _avg?: InvoiceAvgOrderByAggregateInput
    _max?: InvoiceMaxOrderByAggregateInput
    _min?: InvoiceMinOrderByAggregateInput
    _sum?: InvoiceSumOrderByAggregateInput
  }

  export type InvoiceScalarWhereWithAggregatesInput = {
    AND?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    OR?: InvoiceScalarWhereWithAggregatesInput[]
    NOT?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Invoice"> | string
    clubId?: StringWithAggregatesFilter<"Invoice"> | string
    eventId?: StringWithAggregatesFilter<"Invoice"> | string
    totalCents?: IntWithAggregatesFilter<"Invoice"> | number
    status?: EnumInvoiceStatusWithAggregatesFilter<"Invoice"> | $Enums.InvoiceStatus
    pdfUrl?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
  }

  export type AuditLogWhereInput = {
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    id?: StringFilter<"AuditLog"> | string
    userId?: StringNullableFilter<"AuditLog"> | string | null
    entityType?: StringFilter<"AuditLog"> | string
    entityId?: StringFilter<"AuditLog"> | string
    action?: StringFilter<"AuditLog"> | string
    diffJson?: StringFilter<"AuditLog"> | string
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }

  export type AuditLogOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    action?: SortOrder
    diffJson?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type AuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    userId?: StringNullableFilter<"AuditLog"> | string | null
    entityType?: StringFilter<"AuditLog"> | string
    entityId?: StringFilter<"AuditLog"> | string
    action?: StringFilter<"AuditLog"> | string
    diffJson?: StringFilter<"AuditLog"> | string
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }, "id">

  export type AuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    action?: SortOrder
    diffJson?: SortOrder
    createdAt?: SortOrder
    _count?: AuditLogCountOrderByAggregateInput
    _max?: AuditLogMaxOrderByAggregateInput
    _min?: AuditLogMinOrderByAggregateInput
  }

  export type AuditLogScalarWhereWithAggregatesInput = {
    AND?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    OR?: AuditLogScalarWhereWithAggregatesInput[]
    NOT?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AuditLog"> | string
    userId?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    entityType?: StringWithAggregatesFilter<"AuditLog"> | string
    entityId?: StringWithAggregatesFilter<"AuditLog"> | string
    action?: StringWithAggregatesFilter<"AuditLog"> | string
    diffJson?: StringWithAggregatesFilter<"AuditLog"> | string
    createdAt?: DateTimeWithAggregatesFilter<"AuditLog"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club?: ClubCreateNestedOneWithoutUsersInput
    AuditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    clubId?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    AuditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneWithoutUsersNestedInput
    AuditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    clubId?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    AuditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    clubId?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    clubId?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClubCreateInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutClubInput
    athletes?: AthleteCreateNestedManyWithoutClubInput
    teams?: TeamCreateNestedManyWithoutClubInput
    entries?: EntryCreateNestedManyWithoutClubInput
    invoices?: InvoiceCreateNestedManyWithoutClubInput
  }

  export type ClubUncheckedCreateInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutClubInput
    athletes?: AthleteUncheckedCreateNestedManyWithoutClubInput
    teams?: TeamUncheckedCreateNestedManyWithoutClubInput
    entries?: EntryUncheckedCreateNestedManyWithoutClubInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutClubInput
  }

  export type ClubUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutClubNestedInput
    athletes?: AthleteUpdateManyWithoutClubNestedInput
    teams?: TeamUpdateManyWithoutClubNestedInput
    entries?: EntryUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUpdateManyWithoutClubNestedInput
  }

  export type ClubUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutClubNestedInput
    athletes?: AthleteUncheckedUpdateManyWithoutClubNestedInput
    teams?: TeamUncheckedUpdateManyWithoutClubNestedInput
    entries?: EntryUncheckedUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutClubNestedInput
  }

  export type ClubCreateManyInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClubUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClubUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventCreateInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassCreateNestedManyWithoutEventInput
    entries?: EntryCreateNestedManyWithoutEventInput
    teams?: TeamCreateNestedManyWithoutEventInput
    invoices?: InvoiceCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionUncheckedCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutEventInput
    entries?: EntryUncheckedCreateNestedManyWithoutEventInput
    teams?: TeamUncheckedCreateNestedManyWithoutEventInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUpdateManyWithoutEventNestedInput
    entries?: EntryUpdateManyWithoutEventNestedInput
    teams?: TeamUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUncheckedUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutEventNestedInput
    entries?: EntryUncheckedUpdateManyWithoutEventNestedInput
    teams?: TeamUncheckedUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutEventNestedInput
  }

  export type EventCreateManyInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DivisionCreateInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    event: EventCreateNestedOneWithoutDivisionsInput
    entries?: EntryCreateNestedManyWithoutDivisionInput
    teams?: TeamCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassCreateNestedManyWithoutDivisionInput
  }

  export type DivisionUncheckedCreateInput = {
    id?: string
    eventId: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    entries?: EntryUncheckedCreateNestedManyWithoutDivisionInput
    teams?: TeamUncheckedCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutDivisionInput
  }

  export type DivisionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    event?: EventUpdateOneRequiredWithoutDivisionsNestedInput
    entries?: EntryUpdateManyWithoutDivisionNestedInput
    teams?: TeamUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    entries?: EntryUncheckedUpdateManyWithoutDivisionNestedInput
    teams?: TeamUncheckedUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionCreateManyInput = {
    id?: string
    eventId: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
  }

  export type DivisionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type DivisionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type WeightClassCreateInput = {
    id?: string
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    event: EventCreateNestedOneWithoutWeightClassesInput
    division?: DivisionCreateNestedOneWithoutWeightClassesInput
    entries?: EntryCreateNestedManyWithoutWeightClassInput
  }

  export type WeightClassUncheckedCreateInput = {
    id?: string
    eventId: string
    divisionId?: string | null
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    entries?: EntryUncheckedCreateNestedManyWithoutWeightClassInput
  }

  export type WeightClassUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    event?: EventUpdateOneRequiredWithoutWeightClassesNestedInput
    division?: DivisionUpdateOneWithoutWeightClassesNestedInput
    entries?: EntryUpdateManyWithoutWeightClassNestedInput
  }

  export type WeightClassUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    divisionId?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    entries?: EntryUncheckedUpdateManyWithoutWeightClassNestedInput
  }

  export type WeightClassCreateManyInput = {
    id?: string
    eventId: string
    divisionId?: string | null
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
  }

  export type WeightClassUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
  }

  export type WeightClassUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    divisionId?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
  }

  export type AthleteCreateInput = {
    id?: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutAthletesInput
    entries?: EntryCreateNestedManyWithoutAthleteInput
    teamMembers?: TeamMemberCreateNestedManyWithoutAthleteInput
  }

  export type AthleteUncheckedCreateInput = {
    id?: string
    clubId: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: EntryUncheckedCreateNestedManyWithoutAthleteInput
    teamMembers?: TeamMemberUncheckedCreateNestedManyWithoutAthleteInput
  }

  export type AthleteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutAthletesNestedInput
    entries?: EntryUpdateManyWithoutAthleteNestedInput
    teamMembers?: TeamMemberUpdateManyWithoutAthleteNestedInput
  }

  export type AthleteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: EntryUncheckedUpdateManyWithoutAthleteNestedInput
    teamMembers?: TeamMemberUncheckedUpdateManyWithoutAthleteNestedInput
  }

  export type AthleteCreateManyInput = {
    id?: string
    clubId: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AthleteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AthleteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryCreateInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutEntriesInput
    club: ClubCreateNestedOneWithoutEntriesInput
    athlete?: AthleteCreateNestedOneWithoutEntriesInput
    team?: TeamCreateNestedOneWithoutEntriesInput
    division: DivisionCreateNestedOneWithoutEntriesInput
    weightClass?: WeightClassCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutEntriesNestedInput
    club?: ClubUpdateOneRequiredWithoutEntriesNestedInput
    athlete?: AthleteUpdateOneWithoutEntriesNestedInput
    team?: TeamUpdateOneWithoutEntriesNestedInput
    division?: DivisionUpdateOneRequiredWithoutEntriesNestedInput
    weightClass?: WeightClassUpdateOneWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryCreateManyInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamCreateInput = {
    id?: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutTeamsInput
    club: ClubCreateNestedOneWithoutTeamsInput
    division: DivisionCreateNestedOneWithoutTeamsInput
    members?: TeamMemberCreateNestedManyWithoutTeamInput
    entries?: EntryCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateInput = {
    id?: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: TeamMemberUncheckedCreateNestedManyWithoutTeamInput
    entries?: EntryUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutTeamsNestedInput
    club?: ClubUpdateOneRequiredWithoutTeamsNestedInput
    division?: DivisionUpdateOneRequiredWithoutTeamsNestedInput
    members?: TeamMemberUpdateManyWithoutTeamNestedInput
    entries?: EntryUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: TeamMemberUncheckedUpdateManyWithoutTeamNestedInput
    entries?: EntryUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamCreateManyInput = {
    id?: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamMemberCreateInput = {
    id?: string
    isReserve?: boolean
    team: TeamCreateNestedOneWithoutMembersInput
    athlete: AthleteCreateNestedOneWithoutTeamMembersInput
  }

  export type TeamMemberUncheckedCreateInput = {
    id?: string
    teamId: string
    athleteId: string
    isReserve?: boolean
  }

  export type TeamMemberUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
    team?: TeamUpdateOneRequiredWithoutMembersNestedInput
    athlete?: AthleteUpdateOneRequiredWithoutTeamMembersNestedInput
  }

  export type TeamMemberUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    athleteId?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type TeamMemberCreateManyInput = {
    id?: string
    teamId: string
    athleteId: string
    isReserve?: boolean
  }

  export type TeamMemberUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type TeamMemberUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    athleteId?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type InvoiceCreateInput = {
    id?: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutInvoicesInput
    event: EventCreateNestedOneWithoutInvoicesInput
  }

  export type InvoiceUncheckedCreateInput = {
    id?: string
    clubId: string
    eventId: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutInvoicesNestedInput
    event?: EventUpdateOneRequiredWithoutInvoicesNestedInput
  }

  export type InvoiceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceCreateManyInput = {
    id?: string
    clubId: string
    eventId: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateInput = {
    id?: string
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt?: Date | string
    user?: UserCreateNestedOneWithoutAuditLogsInput
  }

  export type AuditLogUncheckedCreateInput = {
    id?: string
    userId?: string | null
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt?: Date | string
  }

  export type AuditLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneWithoutAuditLogsNestedInput
  }

  export type AuditLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateManyInput = {
    id?: string
    userId?: string | null
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt?: Date | string
  }

  export type AuditLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ClubNullableScalarRelationFilter = {
    is?: ClubWhereInput | null
    isNot?: ClubWhereInput | null
  }

  export type AuditLogListRelationFilter = {
    every?: AuditLogWhereInput
    some?: AuditLogWhereInput
    none?: AuditLogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AuditLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    role?: SortOrder
    clubId?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    role?: SortOrder
    clubId?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    role?: SortOrder
    clubId?: SortOrder
    passwordHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type AthleteListRelationFilter = {
    every?: AthleteWhereInput
    some?: AthleteWhereInput
    none?: AthleteWhereInput
  }

  export type TeamListRelationFilter = {
    every?: TeamWhereInput
    some?: TeamWhereInput
    none?: TeamWhereInput
  }

  export type EntryListRelationFilter = {
    every?: EntryWhereInput
    some?: EntryWhereInput
    none?: EntryWhereInput
  }

  export type InvoiceListRelationFilter = {
    every?: InvoiceWhereInput
    some?: InvoiceWhereInput
    none?: InvoiceWhereInput
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AthleteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TeamOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InvoiceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ClubCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    region?: SortOrder
    contactName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ClubMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    region?: SortOrder
    contactName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ClubMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    region?: SortOrder
    contactName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DivisionListRelationFilter = {
    every?: DivisionWhereInput
    some?: DivisionWhereInput
    none?: DivisionWhereInput
  }

  export type WeightClassListRelationFilter = {
    every?: WeightClassWhereInput
    some?: WeightClassWhereInput
    none?: WeightClassWhereInput
  }

  export type DivisionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WeightClassOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EventCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    venue?: SortOrder
    city?: SortOrder
    country?: SortOrder
    startDate?: SortOrder
    regOpen?: SortOrder
    regClose?: SortOrder
    configJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    venue?: SortOrder
    city?: SortOrder
    country?: SortOrder
    startDate?: SortOrder
    regOpen?: SortOrder
    regClose?: SortOrder
    configJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EventMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    venue?: SortOrder
    city?: SortOrder
    country?: SortOrder
    startDate?: SortOrder
    regOpen?: SortOrder
    regClose?: SortOrder
    configJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type EnumGenderFilter<$PrismaModel = never> = {
    equals?: $Enums.Gender | EnumGenderFieldRefInput<$PrismaModel>
    in?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    notIn?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    not?: NestedEnumGenderFilter<$PrismaModel> | $Enums.Gender
  }

  export type EventScalarRelationFilter = {
    is?: EventWhereInput
    isNot?: EventWhereInput
  }

  export type DivisionCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    key?: SortOrder
    name?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    gender?: SortOrder
    notes?: SortOrder
  }

  export type DivisionAvgOrderByAggregateInput = {
    minAge?: SortOrder
    maxAge?: SortOrder
  }

  export type DivisionMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    key?: SortOrder
    name?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    gender?: SortOrder
    notes?: SortOrder
  }

  export type DivisionMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    key?: SortOrder
    name?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    gender?: SortOrder
    notes?: SortOrder
  }

  export type DivisionSumOrderByAggregateInput = {
    minAge?: SortOrder
    maxAge?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumGenderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Gender | EnumGenderFieldRefInput<$PrismaModel>
    in?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    notIn?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    not?: NestedEnumGenderWithAggregatesFilter<$PrismaModel> | $Enums.Gender
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGenderFilter<$PrismaModel>
    _max?: NestedEnumGenderFilter<$PrismaModel>
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type DivisionNullableScalarRelationFilter = {
    is?: DivisionWhereInput | null
    isNot?: DivisionWhereInput | null
  }

  export type WeightClassCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    divisionId?: SortOrder
    gender?: SortOrder
    name?: SortOrder
    minKg?: SortOrder
    maxKg?: SortOrder
  }

  export type WeightClassAvgOrderByAggregateInput = {
    minKg?: SortOrder
    maxKg?: SortOrder
  }

  export type WeightClassMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    divisionId?: SortOrder
    gender?: SortOrder
    name?: SortOrder
    minKg?: SortOrder
    maxKg?: SortOrder
  }

  export type WeightClassMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    divisionId?: SortOrder
    gender?: SortOrder
    name?: SortOrder
    minKg?: SortOrder
    maxKg?: SortOrder
  }

  export type WeightClassSumOrderByAggregateInput = {
    minKg?: SortOrder
    maxKg?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type ClubScalarRelationFilter = {
    is?: ClubWhereInput
    isNot?: ClubWhereInput
  }

  export type TeamMemberListRelationFilter = {
    every?: TeamMemberWhereInput
    some?: TeamMemberWhereInput
    none?: TeamMemberWhereInput
  }

  export type TeamMemberOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AthleteCountOrderByAggregateInput = {
    id?: SortOrder
    clubId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    nationality?: SortOrder
    idType?: SortOrder
    idNumber?: SortOrder
    beltRank?: SortOrder
    weightKg?: SortOrder
    medicalNotes?: SortOrder
    emergencyName?: SortOrder
    emergencyPhone?: SortOrder
    guardianName?: SortOrder
    guardianPhone?: SortOrder
    photoUrl?: SortOrder
    waiverUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AthleteAvgOrderByAggregateInput = {
    weightKg?: SortOrder
  }

  export type AthleteMaxOrderByAggregateInput = {
    id?: SortOrder
    clubId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    nationality?: SortOrder
    idType?: SortOrder
    idNumber?: SortOrder
    beltRank?: SortOrder
    weightKg?: SortOrder
    medicalNotes?: SortOrder
    emergencyName?: SortOrder
    emergencyPhone?: SortOrder
    guardianName?: SortOrder
    guardianPhone?: SortOrder
    photoUrl?: SortOrder
    waiverUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AthleteMinOrderByAggregateInput = {
    id?: SortOrder
    clubId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    nationality?: SortOrder
    idType?: SortOrder
    idNumber?: SortOrder
    beltRank?: SortOrder
    weightKg?: SortOrder
    medicalNotes?: SortOrder
    emergencyName?: SortOrder
    emergencyPhone?: SortOrder
    guardianName?: SortOrder
    guardianPhone?: SortOrder
    photoUrl?: SortOrder
    waiverUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AthleteSumOrderByAggregateInput = {
    weightKg?: SortOrder
  }

  export type EnumEntryTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryType | EnumEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryTypeFilter<$PrismaModel> | $Enums.EntryType
  }

  export type EnumEntryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryStatus | EnumEntryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryStatusFilter<$PrismaModel> | $Enums.EntryStatus
  }

  export type AthleteNullableScalarRelationFilter = {
    is?: AthleteWhereInput | null
    isNot?: AthleteWhereInput | null
  }

  export type TeamNullableScalarRelationFilter = {
    is?: TeamWhereInput | null
    isNot?: TeamWhereInput | null
  }

  export type DivisionScalarRelationFilter = {
    is?: DivisionWhereInput
    isNot?: DivisionWhereInput
  }

  export type WeightClassNullableScalarRelationFilter = {
    is?: WeightClassWhereInput | null
    isNot?: WeightClassWhereInput | null
  }

  export type EntryEventIdAthleteIdEntryTypeDivisionIdCompoundUniqueInput = {
    eventId: string
    athleteId: string
    entryType: $Enums.EntryType
    divisionId: string
  }

  export type EntryEventIdTeamIdEntryTypeDivisionIdCompoundUniqueInput = {
    eventId: string
    teamId: string
    entryType: $Enums.EntryType
    divisionId: string
  }

  export type EntryCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    athleteId?: SortOrder
    teamId?: SortOrder
    entryType?: SortOrder
    divisionId?: SortOrder
    weightClassId?: SortOrder
    status?: SortOrder
    feeCents?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EntryAvgOrderByAggregateInput = {
    feeCents?: SortOrder
  }

  export type EntryMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    athleteId?: SortOrder
    teamId?: SortOrder
    entryType?: SortOrder
    divisionId?: SortOrder
    weightClassId?: SortOrder
    status?: SortOrder
    feeCents?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EntryMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    athleteId?: SortOrder
    teamId?: SortOrder
    entryType?: SortOrder
    divisionId?: SortOrder
    weightClassId?: SortOrder
    status?: SortOrder
    feeCents?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EntrySumOrderByAggregateInput = {
    feeCents?: SortOrder
  }

  export type EnumEntryTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryType | EnumEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryTypeWithAggregatesFilter<$PrismaModel> | $Enums.EntryType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEntryTypeFilter<$PrismaModel>
    _max?: NestedEnumEntryTypeFilter<$PrismaModel>
  }

  export type EnumEntryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryStatus | EnumEntryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryStatusWithAggregatesFilter<$PrismaModel> | $Enums.EntryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEntryStatusFilter<$PrismaModel>
    _max?: NestedEnumEntryStatusFilter<$PrismaModel>
  }

  export type EnumTeamStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TeamStatus | EnumTeamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTeamStatusFilter<$PrismaModel> | $Enums.TeamStatus
  }

  export type TeamCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    name?: SortOrder
    teamType?: SortOrder
    divisionId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    name?: SortOrder
    teamType?: SortOrder
    divisionId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TeamMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    clubId?: SortOrder
    name?: SortOrder
    teamType?: SortOrder
    divisionId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumTeamStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TeamStatus | EnumTeamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTeamStatusWithAggregatesFilter<$PrismaModel> | $Enums.TeamStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTeamStatusFilter<$PrismaModel>
    _max?: NestedEnumTeamStatusFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type TeamScalarRelationFilter = {
    is?: TeamWhereInput
    isNot?: TeamWhereInput
  }

  export type AthleteScalarRelationFilter = {
    is?: AthleteWhereInput
    isNot?: AthleteWhereInput
  }

  export type TeamMemberTeamIdAthleteIdCompoundUniqueInput = {
    teamId: string
    athleteId: string
  }

  export type TeamMemberCountOrderByAggregateInput = {
    id?: SortOrder
    teamId?: SortOrder
    athleteId?: SortOrder
    isReserve?: SortOrder
  }

  export type TeamMemberMaxOrderByAggregateInput = {
    id?: SortOrder
    teamId?: SortOrder
    athleteId?: SortOrder
    isReserve?: SortOrder
  }

  export type TeamMemberMinOrderByAggregateInput = {
    id?: SortOrder
    teamId?: SortOrder
    athleteId?: SortOrder
    isReserve?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumInvoiceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusFilter<$PrismaModel> | $Enums.InvoiceStatus
  }

  export type InvoiceCountOrderByAggregateInput = {
    id?: SortOrder
    clubId?: SortOrder
    eventId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    pdfUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceAvgOrderByAggregateInput = {
    totalCents?: SortOrder
  }

  export type InvoiceMaxOrderByAggregateInput = {
    id?: SortOrder
    clubId?: SortOrder
    eventId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    pdfUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceMinOrderByAggregateInput = {
    id?: SortOrder
    clubId?: SortOrder
    eventId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    pdfUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceSumOrderByAggregateInput = {
    totalCents?: SortOrder
  }

  export type EnumInvoiceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvoiceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInvoiceStatusFilter<$PrismaModel>
    _max?: NestedEnumInvoiceStatusFilter<$PrismaModel>
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type AuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    action?: SortOrder
    diffJson?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    action?: SortOrder
    diffJson?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entityType?: SortOrder
    entityId?: SortOrder
    action?: SortOrder
    diffJson?: SortOrder
    createdAt?: SortOrder
  }

  export type ClubCreateNestedOneWithoutUsersInput = {
    create?: XOR<ClubCreateWithoutUsersInput, ClubUncheckedCreateWithoutUsersInput>
    connectOrCreate?: ClubCreateOrConnectWithoutUsersInput
    connect?: ClubWhereUniqueInput
  }

  export type AuditLogCreateNestedManyWithoutUserInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
  }

  export type AuditLogUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ClubUpdateOneWithoutUsersNestedInput = {
    create?: XOR<ClubCreateWithoutUsersInput, ClubUncheckedCreateWithoutUsersInput>
    connectOrCreate?: ClubCreateOrConnectWithoutUsersInput
    upsert?: ClubUpsertWithoutUsersInput
    disconnect?: ClubWhereInput | boolean
    delete?: ClubWhereInput | boolean
    connect?: ClubWhereUniqueInput
    update?: XOR<XOR<ClubUpdateToOneWithWhereWithoutUsersInput, ClubUpdateWithoutUsersInput>, ClubUncheckedUpdateWithoutUsersInput>
  }

  export type AuditLogUpdateManyWithoutUserNestedInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    upsert?: AuditLogUpsertWithWhereUniqueWithoutUserInput | AuditLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    set?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    disconnect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    delete?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    update?: AuditLogUpdateWithWhereUniqueWithoutUserInput | AuditLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AuditLogUpdateManyWithWhereWithoutUserInput | AuditLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
  }

  export type AuditLogUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    upsert?: AuditLogUpsertWithWhereUniqueWithoutUserInput | AuditLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    set?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    disconnect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    delete?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    update?: AuditLogUpdateWithWhereUniqueWithoutUserInput | AuditLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AuditLogUpdateManyWithWhereWithoutUserInput | AuditLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
  }

  export type UserCreateNestedManyWithoutClubInput = {
    create?: XOR<UserCreateWithoutClubInput, UserUncheckedCreateWithoutClubInput> | UserCreateWithoutClubInput[] | UserUncheckedCreateWithoutClubInput[]
    connectOrCreate?: UserCreateOrConnectWithoutClubInput | UserCreateOrConnectWithoutClubInput[]
    createMany?: UserCreateManyClubInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type AthleteCreateNestedManyWithoutClubInput = {
    create?: XOR<AthleteCreateWithoutClubInput, AthleteUncheckedCreateWithoutClubInput> | AthleteCreateWithoutClubInput[] | AthleteUncheckedCreateWithoutClubInput[]
    connectOrCreate?: AthleteCreateOrConnectWithoutClubInput | AthleteCreateOrConnectWithoutClubInput[]
    createMany?: AthleteCreateManyClubInputEnvelope
    connect?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
  }

  export type TeamCreateNestedManyWithoutClubInput = {
    create?: XOR<TeamCreateWithoutClubInput, TeamUncheckedCreateWithoutClubInput> | TeamCreateWithoutClubInput[] | TeamUncheckedCreateWithoutClubInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutClubInput | TeamCreateOrConnectWithoutClubInput[]
    createMany?: TeamCreateManyClubInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type EntryCreateNestedManyWithoutClubInput = {
    create?: XOR<EntryCreateWithoutClubInput, EntryUncheckedCreateWithoutClubInput> | EntryCreateWithoutClubInput[] | EntryUncheckedCreateWithoutClubInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutClubInput | EntryCreateOrConnectWithoutClubInput[]
    createMany?: EntryCreateManyClubInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type InvoiceCreateNestedManyWithoutClubInput = {
    create?: XOR<InvoiceCreateWithoutClubInput, InvoiceUncheckedCreateWithoutClubInput> | InvoiceCreateWithoutClubInput[] | InvoiceUncheckedCreateWithoutClubInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutClubInput | InvoiceCreateOrConnectWithoutClubInput[]
    createMany?: InvoiceCreateManyClubInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutClubInput = {
    create?: XOR<UserCreateWithoutClubInput, UserUncheckedCreateWithoutClubInput> | UserCreateWithoutClubInput[] | UserUncheckedCreateWithoutClubInput[]
    connectOrCreate?: UserCreateOrConnectWithoutClubInput | UserCreateOrConnectWithoutClubInput[]
    createMany?: UserCreateManyClubInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type AthleteUncheckedCreateNestedManyWithoutClubInput = {
    create?: XOR<AthleteCreateWithoutClubInput, AthleteUncheckedCreateWithoutClubInput> | AthleteCreateWithoutClubInput[] | AthleteUncheckedCreateWithoutClubInput[]
    connectOrCreate?: AthleteCreateOrConnectWithoutClubInput | AthleteCreateOrConnectWithoutClubInput[]
    createMany?: AthleteCreateManyClubInputEnvelope
    connect?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
  }

  export type TeamUncheckedCreateNestedManyWithoutClubInput = {
    create?: XOR<TeamCreateWithoutClubInput, TeamUncheckedCreateWithoutClubInput> | TeamCreateWithoutClubInput[] | TeamUncheckedCreateWithoutClubInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutClubInput | TeamCreateOrConnectWithoutClubInput[]
    createMany?: TeamCreateManyClubInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type EntryUncheckedCreateNestedManyWithoutClubInput = {
    create?: XOR<EntryCreateWithoutClubInput, EntryUncheckedCreateWithoutClubInput> | EntryCreateWithoutClubInput[] | EntryUncheckedCreateWithoutClubInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutClubInput | EntryCreateOrConnectWithoutClubInput[]
    createMany?: EntryCreateManyClubInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type InvoiceUncheckedCreateNestedManyWithoutClubInput = {
    create?: XOR<InvoiceCreateWithoutClubInput, InvoiceUncheckedCreateWithoutClubInput> | InvoiceCreateWithoutClubInput[] | InvoiceUncheckedCreateWithoutClubInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutClubInput | InvoiceCreateOrConnectWithoutClubInput[]
    createMany?: InvoiceCreateManyClubInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type UserUpdateManyWithoutClubNestedInput = {
    create?: XOR<UserCreateWithoutClubInput, UserUncheckedCreateWithoutClubInput> | UserCreateWithoutClubInput[] | UserUncheckedCreateWithoutClubInput[]
    connectOrCreate?: UserCreateOrConnectWithoutClubInput | UserCreateOrConnectWithoutClubInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutClubInput | UserUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: UserCreateManyClubInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutClubInput | UserUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: UserUpdateManyWithWhereWithoutClubInput | UserUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type AthleteUpdateManyWithoutClubNestedInput = {
    create?: XOR<AthleteCreateWithoutClubInput, AthleteUncheckedCreateWithoutClubInput> | AthleteCreateWithoutClubInput[] | AthleteUncheckedCreateWithoutClubInput[]
    connectOrCreate?: AthleteCreateOrConnectWithoutClubInput | AthleteCreateOrConnectWithoutClubInput[]
    upsert?: AthleteUpsertWithWhereUniqueWithoutClubInput | AthleteUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: AthleteCreateManyClubInputEnvelope
    set?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    disconnect?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    delete?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    connect?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    update?: AthleteUpdateWithWhereUniqueWithoutClubInput | AthleteUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: AthleteUpdateManyWithWhereWithoutClubInput | AthleteUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: AthleteScalarWhereInput | AthleteScalarWhereInput[]
  }

  export type TeamUpdateManyWithoutClubNestedInput = {
    create?: XOR<TeamCreateWithoutClubInput, TeamUncheckedCreateWithoutClubInput> | TeamCreateWithoutClubInput[] | TeamUncheckedCreateWithoutClubInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutClubInput | TeamCreateOrConnectWithoutClubInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutClubInput | TeamUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: TeamCreateManyClubInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutClubInput | TeamUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutClubInput | TeamUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type EntryUpdateManyWithoutClubNestedInput = {
    create?: XOR<EntryCreateWithoutClubInput, EntryUncheckedCreateWithoutClubInput> | EntryCreateWithoutClubInput[] | EntryUncheckedCreateWithoutClubInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutClubInput | EntryCreateOrConnectWithoutClubInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutClubInput | EntryUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: EntryCreateManyClubInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutClubInput | EntryUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutClubInput | EntryUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type InvoiceUpdateManyWithoutClubNestedInput = {
    create?: XOR<InvoiceCreateWithoutClubInput, InvoiceUncheckedCreateWithoutClubInput> | InvoiceCreateWithoutClubInput[] | InvoiceUncheckedCreateWithoutClubInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutClubInput | InvoiceCreateOrConnectWithoutClubInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutClubInput | InvoiceUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: InvoiceCreateManyClubInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutClubInput | InvoiceUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutClubInput | InvoiceUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutClubNestedInput = {
    create?: XOR<UserCreateWithoutClubInput, UserUncheckedCreateWithoutClubInput> | UserCreateWithoutClubInput[] | UserUncheckedCreateWithoutClubInput[]
    connectOrCreate?: UserCreateOrConnectWithoutClubInput | UserCreateOrConnectWithoutClubInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutClubInput | UserUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: UserCreateManyClubInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutClubInput | UserUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: UserUpdateManyWithWhereWithoutClubInput | UserUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type AthleteUncheckedUpdateManyWithoutClubNestedInput = {
    create?: XOR<AthleteCreateWithoutClubInput, AthleteUncheckedCreateWithoutClubInput> | AthleteCreateWithoutClubInput[] | AthleteUncheckedCreateWithoutClubInput[]
    connectOrCreate?: AthleteCreateOrConnectWithoutClubInput | AthleteCreateOrConnectWithoutClubInput[]
    upsert?: AthleteUpsertWithWhereUniqueWithoutClubInput | AthleteUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: AthleteCreateManyClubInputEnvelope
    set?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    disconnect?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    delete?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    connect?: AthleteWhereUniqueInput | AthleteWhereUniqueInput[]
    update?: AthleteUpdateWithWhereUniqueWithoutClubInput | AthleteUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: AthleteUpdateManyWithWhereWithoutClubInput | AthleteUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: AthleteScalarWhereInput | AthleteScalarWhereInput[]
  }

  export type TeamUncheckedUpdateManyWithoutClubNestedInput = {
    create?: XOR<TeamCreateWithoutClubInput, TeamUncheckedCreateWithoutClubInput> | TeamCreateWithoutClubInput[] | TeamUncheckedCreateWithoutClubInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutClubInput | TeamCreateOrConnectWithoutClubInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutClubInput | TeamUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: TeamCreateManyClubInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutClubInput | TeamUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutClubInput | TeamUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type EntryUncheckedUpdateManyWithoutClubNestedInput = {
    create?: XOR<EntryCreateWithoutClubInput, EntryUncheckedCreateWithoutClubInput> | EntryCreateWithoutClubInput[] | EntryUncheckedCreateWithoutClubInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutClubInput | EntryCreateOrConnectWithoutClubInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutClubInput | EntryUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: EntryCreateManyClubInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutClubInput | EntryUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutClubInput | EntryUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type InvoiceUncheckedUpdateManyWithoutClubNestedInput = {
    create?: XOR<InvoiceCreateWithoutClubInput, InvoiceUncheckedCreateWithoutClubInput> | InvoiceCreateWithoutClubInput[] | InvoiceUncheckedCreateWithoutClubInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutClubInput | InvoiceCreateOrConnectWithoutClubInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutClubInput | InvoiceUpsertWithWhereUniqueWithoutClubInput[]
    createMany?: InvoiceCreateManyClubInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutClubInput | InvoiceUpdateWithWhereUniqueWithoutClubInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutClubInput | InvoiceUpdateManyWithWhereWithoutClubInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type DivisionCreateNestedManyWithoutEventInput = {
    create?: XOR<DivisionCreateWithoutEventInput, DivisionUncheckedCreateWithoutEventInput> | DivisionCreateWithoutEventInput[] | DivisionUncheckedCreateWithoutEventInput[]
    connectOrCreate?: DivisionCreateOrConnectWithoutEventInput | DivisionCreateOrConnectWithoutEventInput[]
    createMany?: DivisionCreateManyEventInputEnvelope
    connect?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
  }

  export type WeightClassCreateNestedManyWithoutEventInput = {
    create?: XOR<WeightClassCreateWithoutEventInput, WeightClassUncheckedCreateWithoutEventInput> | WeightClassCreateWithoutEventInput[] | WeightClassUncheckedCreateWithoutEventInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutEventInput | WeightClassCreateOrConnectWithoutEventInput[]
    createMany?: WeightClassCreateManyEventInputEnvelope
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
  }

  export type EntryCreateNestedManyWithoutEventInput = {
    create?: XOR<EntryCreateWithoutEventInput, EntryUncheckedCreateWithoutEventInput> | EntryCreateWithoutEventInput[] | EntryUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutEventInput | EntryCreateOrConnectWithoutEventInput[]
    createMany?: EntryCreateManyEventInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamCreateNestedManyWithoutEventInput = {
    create?: XOR<TeamCreateWithoutEventInput, TeamUncheckedCreateWithoutEventInput> | TeamCreateWithoutEventInput[] | TeamUncheckedCreateWithoutEventInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutEventInput | TeamCreateOrConnectWithoutEventInput[]
    createMany?: TeamCreateManyEventInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type InvoiceCreateNestedManyWithoutEventInput = {
    create?: XOR<InvoiceCreateWithoutEventInput, InvoiceUncheckedCreateWithoutEventInput> | InvoiceCreateWithoutEventInput[] | InvoiceUncheckedCreateWithoutEventInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutEventInput | InvoiceCreateOrConnectWithoutEventInput[]
    createMany?: InvoiceCreateManyEventInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type DivisionUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<DivisionCreateWithoutEventInput, DivisionUncheckedCreateWithoutEventInput> | DivisionCreateWithoutEventInput[] | DivisionUncheckedCreateWithoutEventInput[]
    connectOrCreate?: DivisionCreateOrConnectWithoutEventInput | DivisionCreateOrConnectWithoutEventInput[]
    createMany?: DivisionCreateManyEventInputEnvelope
    connect?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
  }

  export type WeightClassUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<WeightClassCreateWithoutEventInput, WeightClassUncheckedCreateWithoutEventInput> | WeightClassCreateWithoutEventInput[] | WeightClassUncheckedCreateWithoutEventInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutEventInput | WeightClassCreateOrConnectWithoutEventInput[]
    createMany?: WeightClassCreateManyEventInputEnvelope
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
  }

  export type EntryUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<EntryCreateWithoutEventInput, EntryUncheckedCreateWithoutEventInput> | EntryCreateWithoutEventInput[] | EntryUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutEventInput | EntryCreateOrConnectWithoutEventInput[]
    createMany?: EntryCreateManyEventInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<TeamCreateWithoutEventInput, TeamUncheckedCreateWithoutEventInput> | TeamCreateWithoutEventInput[] | TeamUncheckedCreateWithoutEventInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutEventInput | TeamCreateOrConnectWithoutEventInput[]
    createMany?: TeamCreateManyEventInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type InvoiceUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<InvoiceCreateWithoutEventInput, InvoiceUncheckedCreateWithoutEventInput> | InvoiceCreateWithoutEventInput[] | InvoiceUncheckedCreateWithoutEventInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutEventInput | InvoiceCreateOrConnectWithoutEventInput[]
    createMany?: InvoiceCreateManyEventInputEnvelope
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
  }

  export type DivisionUpdateManyWithoutEventNestedInput = {
    create?: XOR<DivisionCreateWithoutEventInput, DivisionUncheckedCreateWithoutEventInput> | DivisionCreateWithoutEventInput[] | DivisionUncheckedCreateWithoutEventInput[]
    connectOrCreate?: DivisionCreateOrConnectWithoutEventInput | DivisionCreateOrConnectWithoutEventInput[]
    upsert?: DivisionUpsertWithWhereUniqueWithoutEventInput | DivisionUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: DivisionCreateManyEventInputEnvelope
    set?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    disconnect?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    delete?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    connect?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    update?: DivisionUpdateWithWhereUniqueWithoutEventInput | DivisionUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: DivisionUpdateManyWithWhereWithoutEventInput | DivisionUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: DivisionScalarWhereInput | DivisionScalarWhereInput[]
  }

  export type WeightClassUpdateManyWithoutEventNestedInput = {
    create?: XOR<WeightClassCreateWithoutEventInput, WeightClassUncheckedCreateWithoutEventInput> | WeightClassCreateWithoutEventInput[] | WeightClassUncheckedCreateWithoutEventInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutEventInput | WeightClassCreateOrConnectWithoutEventInput[]
    upsert?: WeightClassUpsertWithWhereUniqueWithoutEventInput | WeightClassUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: WeightClassCreateManyEventInputEnvelope
    set?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    disconnect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    delete?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    update?: WeightClassUpdateWithWhereUniqueWithoutEventInput | WeightClassUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: WeightClassUpdateManyWithWhereWithoutEventInput | WeightClassUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: WeightClassScalarWhereInput | WeightClassScalarWhereInput[]
  }

  export type EntryUpdateManyWithoutEventNestedInput = {
    create?: XOR<EntryCreateWithoutEventInput, EntryUncheckedCreateWithoutEventInput> | EntryCreateWithoutEventInput[] | EntryUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutEventInput | EntryCreateOrConnectWithoutEventInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutEventInput | EntryUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EntryCreateManyEventInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutEventInput | EntryUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutEventInput | EntryUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamUpdateManyWithoutEventNestedInput = {
    create?: XOR<TeamCreateWithoutEventInput, TeamUncheckedCreateWithoutEventInput> | TeamCreateWithoutEventInput[] | TeamUncheckedCreateWithoutEventInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutEventInput | TeamCreateOrConnectWithoutEventInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutEventInput | TeamUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: TeamCreateManyEventInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutEventInput | TeamUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutEventInput | TeamUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type InvoiceUpdateManyWithoutEventNestedInput = {
    create?: XOR<InvoiceCreateWithoutEventInput, InvoiceUncheckedCreateWithoutEventInput> | InvoiceCreateWithoutEventInput[] | InvoiceUncheckedCreateWithoutEventInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutEventInput | InvoiceCreateOrConnectWithoutEventInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutEventInput | InvoiceUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: InvoiceCreateManyEventInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutEventInput | InvoiceUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutEventInput | InvoiceUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type DivisionUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<DivisionCreateWithoutEventInput, DivisionUncheckedCreateWithoutEventInput> | DivisionCreateWithoutEventInput[] | DivisionUncheckedCreateWithoutEventInput[]
    connectOrCreate?: DivisionCreateOrConnectWithoutEventInput | DivisionCreateOrConnectWithoutEventInput[]
    upsert?: DivisionUpsertWithWhereUniqueWithoutEventInput | DivisionUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: DivisionCreateManyEventInputEnvelope
    set?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    disconnect?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    delete?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    connect?: DivisionWhereUniqueInput | DivisionWhereUniqueInput[]
    update?: DivisionUpdateWithWhereUniqueWithoutEventInput | DivisionUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: DivisionUpdateManyWithWhereWithoutEventInput | DivisionUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: DivisionScalarWhereInput | DivisionScalarWhereInput[]
  }

  export type WeightClassUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<WeightClassCreateWithoutEventInput, WeightClassUncheckedCreateWithoutEventInput> | WeightClassCreateWithoutEventInput[] | WeightClassUncheckedCreateWithoutEventInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutEventInput | WeightClassCreateOrConnectWithoutEventInput[]
    upsert?: WeightClassUpsertWithWhereUniqueWithoutEventInput | WeightClassUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: WeightClassCreateManyEventInputEnvelope
    set?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    disconnect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    delete?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    update?: WeightClassUpdateWithWhereUniqueWithoutEventInput | WeightClassUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: WeightClassUpdateManyWithWhereWithoutEventInput | WeightClassUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: WeightClassScalarWhereInput | WeightClassScalarWhereInput[]
  }

  export type EntryUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<EntryCreateWithoutEventInput, EntryUncheckedCreateWithoutEventInput> | EntryCreateWithoutEventInput[] | EntryUncheckedCreateWithoutEventInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutEventInput | EntryCreateOrConnectWithoutEventInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutEventInput | EntryUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: EntryCreateManyEventInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutEventInput | EntryUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutEventInput | EntryUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<TeamCreateWithoutEventInput, TeamUncheckedCreateWithoutEventInput> | TeamCreateWithoutEventInput[] | TeamUncheckedCreateWithoutEventInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutEventInput | TeamCreateOrConnectWithoutEventInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutEventInput | TeamUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: TeamCreateManyEventInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutEventInput | TeamUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutEventInput | TeamUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type InvoiceUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<InvoiceCreateWithoutEventInput, InvoiceUncheckedCreateWithoutEventInput> | InvoiceCreateWithoutEventInput[] | InvoiceUncheckedCreateWithoutEventInput[]
    connectOrCreate?: InvoiceCreateOrConnectWithoutEventInput | InvoiceCreateOrConnectWithoutEventInput[]
    upsert?: InvoiceUpsertWithWhereUniqueWithoutEventInput | InvoiceUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: InvoiceCreateManyEventInputEnvelope
    set?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    disconnect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    delete?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    connect?: InvoiceWhereUniqueInput | InvoiceWhereUniqueInput[]
    update?: InvoiceUpdateWithWhereUniqueWithoutEventInput | InvoiceUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: InvoiceUpdateManyWithWhereWithoutEventInput | InvoiceUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
  }

  export type EventCreateNestedOneWithoutDivisionsInput = {
    create?: XOR<EventCreateWithoutDivisionsInput, EventUncheckedCreateWithoutDivisionsInput>
    connectOrCreate?: EventCreateOrConnectWithoutDivisionsInput
    connect?: EventWhereUniqueInput
  }

  export type EntryCreateNestedManyWithoutDivisionInput = {
    create?: XOR<EntryCreateWithoutDivisionInput, EntryUncheckedCreateWithoutDivisionInput> | EntryCreateWithoutDivisionInput[] | EntryUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutDivisionInput | EntryCreateOrConnectWithoutDivisionInput[]
    createMany?: EntryCreateManyDivisionInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamCreateNestedManyWithoutDivisionInput = {
    create?: XOR<TeamCreateWithoutDivisionInput, TeamUncheckedCreateWithoutDivisionInput> | TeamCreateWithoutDivisionInput[] | TeamUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutDivisionInput | TeamCreateOrConnectWithoutDivisionInput[]
    createMany?: TeamCreateManyDivisionInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type WeightClassCreateNestedManyWithoutDivisionInput = {
    create?: XOR<WeightClassCreateWithoutDivisionInput, WeightClassUncheckedCreateWithoutDivisionInput> | WeightClassCreateWithoutDivisionInput[] | WeightClassUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutDivisionInput | WeightClassCreateOrConnectWithoutDivisionInput[]
    createMany?: WeightClassCreateManyDivisionInputEnvelope
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
  }

  export type EntryUncheckedCreateNestedManyWithoutDivisionInput = {
    create?: XOR<EntryCreateWithoutDivisionInput, EntryUncheckedCreateWithoutDivisionInput> | EntryCreateWithoutDivisionInput[] | EntryUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutDivisionInput | EntryCreateOrConnectWithoutDivisionInput[]
    createMany?: EntryCreateManyDivisionInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamUncheckedCreateNestedManyWithoutDivisionInput = {
    create?: XOR<TeamCreateWithoutDivisionInput, TeamUncheckedCreateWithoutDivisionInput> | TeamCreateWithoutDivisionInput[] | TeamUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutDivisionInput | TeamCreateOrConnectWithoutDivisionInput[]
    createMany?: TeamCreateManyDivisionInputEnvelope
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
  }

  export type WeightClassUncheckedCreateNestedManyWithoutDivisionInput = {
    create?: XOR<WeightClassCreateWithoutDivisionInput, WeightClassUncheckedCreateWithoutDivisionInput> | WeightClassCreateWithoutDivisionInput[] | WeightClassUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutDivisionInput | WeightClassCreateOrConnectWithoutDivisionInput[]
    createMany?: WeightClassCreateManyDivisionInputEnvelope
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumGenderFieldUpdateOperationsInput = {
    set?: $Enums.Gender
  }

  export type EventUpdateOneRequiredWithoutDivisionsNestedInput = {
    create?: XOR<EventCreateWithoutDivisionsInput, EventUncheckedCreateWithoutDivisionsInput>
    connectOrCreate?: EventCreateOrConnectWithoutDivisionsInput
    upsert?: EventUpsertWithoutDivisionsInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutDivisionsInput, EventUpdateWithoutDivisionsInput>, EventUncheckedUpdateWithoutDivisionsInput>
  }

  export type EntryUpdateManyWithoutDivisionNestedInput = {
    create?: XOR<EntryCreateWithoutDivisionInput, EntryUncheckedCreateWithoutDivisionInput> | EntryCreateWithoutDivisionInput[] | EntryUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutDivisionInput | EntryCreateOrConnectWithoutDivisionInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutDivisionInput | EntryUpsertWithWhereUniqueWithoutDivisionInput[]
    createMany?: EntryCreateManyDivisionInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutDivisionInput | EntryUpdateWithWhereUniqueWithoutDivisionInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutDivisionInput | EntryUpdateManyWithWhereWithoutDivisionInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamUpdateManyWithoutDivisionNestedInput = {
    create?: XOR<TeamCreateWithoutDivisionInput, TeamUncheckedCreateWithoutDivisionInput> | TeamCreateWithoutDivisionInput[] | TeamUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutDivisionInput | TeamCreateOrConnectWithoutDivisionInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutDivisionInput | TeamUpsertWithWhereUniqueWithoutDivisionInput[]
    createMany?: TeamCreateManyDivisionInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutDivisionInput | TeamUpdateWithWhereUniqueWithoutDivisionInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutDivisionInput | TeamUpdateManyWithWhereWithoutDivisionInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type WeightClassUpdateManyWithoutDivisionNestedInput = {
    create?: XOR<WeightClassCreateWithoutDivisionInput, WeightClassUncheckedCreateWithoutDivisionInput> | WeightClassCreateWithoutDivisionInput[] | WeightClassUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutDivisionInput | WeightClassCreateOrConnectWithoutDivisionInput[]
    upsert?: WeightClassUpsertWithWhereUniqueWithoutDivisionInput | WeightClassUpsertWithWhereUniqueWithoutDivisionInput[]
    createMany?: WeightClassCreateManyDivisionInputEnvelope
    set?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    disconnect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    delete?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    update?: WeightClassUpdateWithWhereUniqueWithoutDivisionInput | WeightClassUpdateWithWhereUniqueWithoutDivisionInput[]
    updateMany?: WeightClassUpdateManyWithWhereWithoutDivisionInput | WeightClassUpdateManyWithWhereWithoutDivisionInput[]
    deleteMany?: WeightClassScalarWhereInput | WeightClassScalarWhereInput[]
  }

  export type EntryUncheckedUpdateManyWithoutDivisionNestedInput = {
    create?: XOR<EntryCreateWithoutDivisionInput, EntryUncheckedCreateWithoutDivisionInput> | EntryCreateWithoutDivisionInput[] | EntryUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutDivisionInput | EntryCreateOrConnectWithoutDivisionInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutDivisionInput | EntryUpsertWithWhereUniqueWithoutDivisionInput[]
    createMany?: EntryCreateManyDivisionInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutDivisionInput | EntryUpdateWithWhereUniqueWithoutDivisionInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutDivisionInput | EntryUpdateManyWithWhereWithoutDivisionInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamUncheckedUpdateManyWithoutDivisionNestedInput = {
    create?: XOR<TeamCreateWithoutDivisionInput, TeamUncheckedCreateWithoutDivisionInput> | TeamCreateWithoutDivisionInput[] | TeamUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: TeamCreateOrConnectWithoutDivisionInput | TeamCreateOrConnectWithoutDivisionInput[]
    upsert?: TeamUpsertWithWhereUniqueWithoutDivisionInput | TeamUpsertWithWhereUniqueWithoutDivisionInput[]
    createMany?: TeamCreateManyDivisionInputEnvelope
    set?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    disconnect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    delete?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    connect?: TeamWhereUniqueInput | TeamWhereUniqueInput[]
    update?: TeamUpdateWithWhereUniqueWithoutDivisionInput | TeamUpdateWithWhereUniqueWithoutDivisionInput[]
    updateMany?: TeamUpdateManyWithWhereWithoutDivisionInput | TeamUpdateManyWithWhereWithoutDivisionInput[]
    deleteMany?: TeamScalarWhereInput | TeamScalarWhereInput[]
  }

  export type WeightClassUncheckedUpdateManyWithoutDivisionNestedInput = {
    create?: XOR<WeightClassCreateWithoutDivisionInput, WeightClassUncheckedCreateWithoutDivisionInput> | WeightClassCreateWithoutDivisionInput[] | WeightClassUncheckedCreateWithoutDivisionInput[]
    connectOrCreate?: WeightClassCreateOrConnectWithoutDivisionInput | WeightClassCreateOrConnectWithoutDivisionInput[]
    upsert?: WeightClassUpsertWithWhereUniqueWithoutDivisionInput | WeightClassUpsertWithWhereUniqueWithoutDivisionInput[]
    createMany?: WeightClassCreateManyDivisionInputEnvelope
    set?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    disconnect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    delete?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    connect?: WeightClassWhereUniqueInput | WeightClassWhereUniqueInput[]
    update?: WeightClassUpdateWithWhereUniqueWithoutDivisionInput | WeightClassUpdateWithWhereUniqueWithoutDivisionInput[]
    updateMany?: WeightClassUpdateManyWithWhereWithoutDivisionInput | WeightClassUpdateManyWithWhereWithoutDivisionInput[]
    deleteMany?: WeightClassScalarWhereInput | WeightClassScalarWhereInput[]
  }

  export type EventCreateNestedOneWithoutWeightClassesInput = {
    create?: XOR<EventCreateWithoutWeightClassesInput, EventUncheckedCreateWithoutWeightClassesInput>
    connectOrCreate?: EventCreateOrConnectWithoutWeightClassesInput
    connect?: EventWhereUniqueInput
  }

  export type DivisionCreateNestedOneWithoutWeightClassesInput = {
    create?: XOR<DivisionCreateWithoutWeightClassesInput, DivisionUncheckedCreateWithoutWeightClassesInput>
    connectOrCreate?: DivisionCreateOrConnectWithoutWeightClassesInput
    connect?: DivisionWhereUniqueInput
  }

  export type EntryCreateNestedManyWithoutWeightClassInput = {
    create?: XOR<EntryCreateWithoutWeightClassInput, EntryUncheckedCreateWithoutWeightClassInput> | EntryCreateWithoutWeightClassInput[] | EntryUncheckedCreateWithoutWeightClassInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutWeightClassInput | EntryCreateOrConnectWithoutWeightClassInput[]
    createMany?: EntryCreateManyWeightClassInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type EntryUncheckedCreateNestedManyWithoutWeightClassInput = {
    create?: XOR<EntryCreateWithoutWeightClassInput, EntryUncheckedCreateWithoutWeightClassInput> | EntryCreateWithoutWeightClassInput[] | EntryUncheckedCreateWithoutWeightClassInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutWeightClassInput | EntryCreateOrConnectWithoutWeightClassInput[]
    createMany?: EntryCreateManyWeightClassInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EventUpdateOneRequiredWithoutWeightClassesNestedInput = {
    create?: XOR<EventCreateWithoutWeightClassesInput, EventUncheckedCreateWithoutWeightClassesInput>
    connectOrCreate?: EventCreateOrConnectWithoutWeightClassesInput
    upsert?: EventUpsertWithoutWeightClassesInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutWeightClassesInput, EventUpdateWithoutWeightClassesInput>, EventUncheckedUpdateWithoutWeightClassesInput>
  }

  export type DivisionUpdateOneWithoutWeightClassesNestedInput = {
    create?: XOR<DivisionCreateWithoutWeightClassesInput, DivisionUncheckedCreateWithoutWeightClassesInput>
    connectOrCreate?: DivisionCreateOrConnectWithoutWeightClassesInput
    upsert?: DivisionUpsertWithoutWeightClassesInput
    disconnect?: DivisionWhereInput | boolean
    delete?: DivisionWhereInput | boolean
    connect?: DivisionWhereUniqueInput
    update?: XOR<XOR<DivisionUpdateToOneWithWhereWithoutWeightClassesInput, DivisionUpdateWithoutWeightClassesInput>, DivisionUncheckedUpdateWithoutWeightClassesInput>
  }

  export type EntryUpdateManyWithoutWeightClassNestedInput = {
    create?: XOR<EntryCreateWithoutWeightClassInput, EntryUncheckedCreateWithoutWeightClassInput> | EntryCreateWithoutWeightClassInput[] | EntryUncheckedCreateWithoutWeightClassInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutWeightClassInput | EntryCreateOrConnectWithoutWeightClassInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutWeightClassInput | EntryUpsertWithWhereUniqueWithoutWeightClassInput[]
    createMany?: EntryCreateManyWeightClassInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutWeightClassInput | EntryUpdateWithWhereUniqueWithoutWeightClassInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutWeightClassInput | EntryUpdateManyWithWhereWithoutWeightClassInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type EntryUncheckedUpdateManyWithoutWeightClassNestedInput = {
    create?: XOR<EntryCreateWithoutWeightClassInput, EntryUncheckedCreateWithoutWeightClassInput> | EntryCreateWithoutWeightClassInput[] | EntryUncheckedCreateWithoutWeightClassInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutWeightClassInput | EntryCreateOrConnectWithoutWeightClassInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutWeightClassInput | EntryUpsertWithWhereUniqueWithoutWeightClassInput[]
    createMany?: EntryCreateManyWeightClassInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutWeightClassInput | EntryUpdateWithWhereUniqueWithoutWeightClassInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutWeightClassInput | EntryUpdateManyWithWhereWithoutWeightClassInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type ClubCreateNestedOneWithoutAthletesInput = {
    create?: XOR<ClubCreateWithoutAthletesInput, ClubUncheckedCreateWithoutAthletesInput>
    connectOrCreate?: ClubCreateOrConnectWithoutAthletesInput
    connect?: ClubWhereUniqueInput
  }

  export type EntryCreateNestedManyWithoutAthleteInput = {
    create?: XOR<EntryCreateWithoutAthleteInput, EntryUncheckedCreateWithoutAthleteInput> | EntryCreateWithoutAthleteInput[] | EntryUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutAthleteInput | EntryCreateOrConnectWithoutAthleteInput[]
    createMany?: EntryCreateManyAthleteInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamMemberCreateNestedManyWithoutAthleteInput = {
    create?: XOR<TeamMemberCreateWithoutAthleteInput, TeamMemberUncheckedCreateWithoutAthleteInput> | TeamMemberCreateWithoutAthleteInput[] | TeamMemberUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutAthleteInput | TeamMemberCreateOrConnectWithoutAthleteInput[]
    createMany?: TeamMemberCreateManyAthleteInputEnvelope
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
  }

  export type EntryUncheckedCreateNestedManyWithoutAthleteInput = {
    create?: XOR<EntryCreateWithoutAthleteInput, EntryUncheckedCreateWithoutAthleteInput> | EntryCreateWithoutAthleteInput[] | EntryUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutAthleteInput | EntryCreateOrConnectWithoutAthleteInput[]
    createMany?: EntryCreateManyAthleteInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamMemberUncheckedCreateNestedManyWithoutAthleteInput = {
    create?: XOR<TeamMemberCreateWithoutAthleteInput, TeamMemberUncheckedCreateWithoutAthleteInput> | TeamMemberCreateWithoutAthleteInput[] | TeamMemberUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutAthleteInput | TeamMemberCreateOrConnectWithoutAthleteInput[]
    createMany?: TeamMemberCreateManyAthleteInputEnvelope
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
  }

  export type ClubUpdateOneRequiredWithoutAthletesNestedInput = {
    create?: XOR<ClubCreateWithoutAthletesInput, ClubUncheckedCreateWithoutAthletesInput>
    connectOrCreate?: ClubCreateOrConnectWithoutAthletesInput
    upsert?: ClubUpsertWithoutAthletesInput
    connect?: ClubWhereUniqueInput
    update?: XOR<XOR<ClubUpdateToOneWithWhereWithoutAthletesInput, ClubUpdateWithoutAthletesInput>, ClubUncheckedUpdateWithoutAthletesInput>
  }

  export type EntryUpdateManyWithoutAthleteNestedInput = {
    create?: XOR<EntryCreateWithoutAthleteInput, EntryUncheckedCreateWithoutAthleteInput> | EntryCreateWithoutAthleteInput[] | EntryUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutAthleteInput | EntryCreateOrConnectWithoutAthleteInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutAthleteInput | EntryUpsertWithWhereUniqueWithoutAthleteInput[]
    createMany?: EntryCreateManyAthleteInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutAthleteInput | EntryUpdateWithWhereUniqueWithoutAthleteInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutAthleteInput | EntryUpdateManyWithWhereWithoutAthleteInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamMemberUpdateManyWithoutAthleteNestedInput = {
    create?: XOR<TeamMemberCreateWithoutAthleteInput, TeamMemberUncheckedCreateWithoutAthleteInput> | TeamMemberCreateWithoutAthleteInput[] | TeamMemberUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutAthleteInput | TeamMemberCreateOrConnectWithoutAthleteInput[]
    upsert?: TeamMemberUpsertWithWhereUniqueWithoutAthleteInput | TeamMemberUpsertWithWhereUniqueWithoutAthleteInput[]
    createMany?: TeamMemberCreateManyAthleteInputEnvelope
    set?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    disconnect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    delete?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    update?: TeamMemberUpdateWithWhereUniqueWithoutAthleteInput | TeamMemberUpdateWithWhereUniqueWithoutAthleteInput[]
    updateMany?: TeamMemberUpdateManyWithWhereWithoutAthleteInput | TeamMemberUpdateManyWithWhereWithoutAthleteInput[]
    deleteMany?: TeamMemberScalarWhereInput | TeamMemberScalarWhereInput[]
  }

  export type EntryUncheckedUpdateManyWithoutAthleteNestedInput = {
    create?: XOR<EntryCreateWithoutAthleteInput, EntryUncheckedCreateWithoutAthleteInput> | EntryCreateWithoutAthleteInput[] | EntryUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutAthleteInput | EntryCreateOrConnectWithoutAthleteInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutAthleteInput | EntryUpsertWithWhereUniqueWithoutAthleteInput[]
    createMany?: EntryCreateManyAthleteInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutAthleteInput | EntryUpdateWithWhereUniqueWithoutAthleteInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutAthleteInput | EntryUpdateManyWithWhereWithoutAthleteInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamMemberUncheckedUpdateManyWithoutAthleteNestedInput = {
    create?: XOR<TeamMemberCreateWithoutAthleteInput, TeamMemberUncheckedCreateWithoutAthleteInput> | TeamMemberCreateWithoutAthleteInput[] | TeamMemberUncheckedCreateWithoutAthleteInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutAthleteInput | TeamMemberCreateOrConnectWithoutAthleteInput[]
    upsert?: TeamMemberUpsertWithWhereUniqueWithoutAthleteInput | TeamMemberUpsertWithWhereUniqueWithoutAthleteInput[]
    createMany?: TeamMemberCreateManyAthleteInputEnvelope
    set?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    disconnect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    delete?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    update?: TeamMemberUpdateWithWhereUniqueWithoutAthleteInput | TeamMemberUpdateWithWhereUniqueWithoutAthleteInput[]
    updateMany?: TeamMemberUpdateManyWithWhereWithoutAthleteInput | TeamMemberUpdateManyWithWhereWithoutAthleteInput[]
    deleteMany?: TeamMemberScalarWhereInput | TeamMemberScalarWhereInput[]
  }

  export type EventCreateNestedOneWithoutEntriesInput = {
    create?: XOR<EventCreateWithoutEntriesInput, EventUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: EventCreateOrConnectWithoutEntriesInput
    connect?: EventWhereUniqueInput
  }

  export type ClubCreateNestedOneWithoutEntriesInput = {
    create?: XOR<ClubCreateWithoutEntriesInput, ClubUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: ClubCreateOrConnectWithoutEntriesInput
    connect?: ClubWhereUniqueInput
  }

  export type AthleteCreateNestedOneWithoutEntriesInput = {
    create?: XOR<AthleteCreateWithoutEntriesInput, AthleteUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: AthleteCreateOrConnectWithoutEntriesInput
    connect?: AthleteWhereUniqueInput
  }

  export type TeamCreateNestedOneWithoutEntriesInput = {
    create?: XOR<TeamCreateWithoutEntriesInput, TeamUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: TeamCreateOrConnectWithoutEntriesInput
    connect?: TeamWhereUniqueInput
  }

  export type DivisionCreateNestedOneWithoutEntriesInput = {
    create?: XOR<DivisionCreateWithoutEntriesInput, DivisionUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: DivisionCreateOrConnectWithoutEntriesInput
    connect?: DivisionWhereUniqueInput
  }

  export type WeightClassCreateNestedOneWithoutEntriesInput = {
    create?: XOR<WeightClassCreateWithoutEntriesInput, WeightClassUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: WeightClassCreateOrConnectWithoutEntriesInput
    connect?: WeightClassWhereUniqueInput
  }

  export type EnumEntryTypeFieldUpdateOperationsInput = {
    set?: $Enums.EntryType
  }

  export type EnumEntryStatusFieldUpdateOperationsInput = {
    set?: $Enums.EntryStatus
  }

  export type EventUpdateOneRequiredWithoutEntriesNestedInput = {
    create?: XOR<EventCreateWithoutEntriesInput, EventUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: EventCreateOrConnectWithoutEntriesInput
    upsert?: EventUpsertWithoutEntriesInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutEntriesInput, EventUpdateWithoutEntriesInput>, EventUncheckedUpdateWithoutEntriesInput>
  }

  export type ClubUpdateOneRequiredWithoutEntriesNestedInput = {
    create?: XOR<ClubCreateWithoutEntriesInput, ClubUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: ClubCreateOrConnectWithoutEntriesInput
    upsert?: ClubUpsertWithoutEntriesInput
    connect?: ClubWhereUniqueInput
    update?: XOR<XOR<ClubUpdateToOneWithWhereWithoutEntriesInput, ClubUpdateWithoutEntriesInput>, ClubUncheckedUpdateWithoutEntriesInput>
  }

  export type AthleteUpdateOneWithoutEntriesNestedInput = {
    create?: XOR<AthleteCreateWithoutEntriesInput, AthleteUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: AthleteCreateOrConnectWithoutEntriesInput
    upsert?: AthleteUpsertWithoutEntriesInput
    disconnect?: AthleteWhereInput | boolean
    delete?: AthleteWhereInput | boolean
    connect?: AthleteWhereUniqueInput
    update?: XOR<XOR<AthleteUpdateToOneWithWhereWithoutEntriesInput, AthleteUpdateWithoutEntriesInput>, AthleteUncheckedUpdateWithoutEntriesInput>
  }

  export type TeamUpdateOneWithoutEntriesNestedInput = {
    create?: XOR<TeamCreateWithoutEntriesInput, TeamUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: TeamCreateOrConnectWithoutEntriesInput
    upsert?: TeamUpsertWithoutEntriesInput
    disconnect?: TeamWhereInput | boolean
    delete?: TeamWhereInput | boolean
    connect?: TeamWhereUniqueInput
    update?: XOR<XOR<TeamUpdateToOneWithWhereWithoutEntriesInput, TeamUpdateWithoutEntriesInput>, TeamUncheckedUpdateWithoutEntriesInput>
  }

  export type DivisionUpdateOneRequiredWithoutEntriesNestedInput = {
    create?: XOR<DivisionCreateWithoutEntriesInput, DivisionUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: DivisionCreateOrConnectWithoutEntriesInput
    upsert?: DivisionUpsertWithoutEntriesInput
    connect?: DivisionWhereUniqueInput
    update?: XOR<XOR<DivisionUpdateToOneWithWhereWithoutEntriesInput, DivisionUpdateWithoutEntriesInput>, DivisionUncheckedUpdateWithoutEntriesInput>
  }

  export type WeightClassUpdateOneWithoutEntriesNestedInput = {
    create?: XOR<WeightClassCreateWithoutEntriesInput, WeightClassUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: WeightClassCreateOrConnectWithoutEntriesInput
    upsert?: WeightClassUpsertWithoutEntriesInput
    disconnect?: WeightClassWhereInput | boolean
    delete?: WeightClassWhereInput | boolean
    connect?: WeightClassWhereUniqueInput
    update?: XOR<XOR<WeightClassUpdateToOneWithWhereWithoutEntriesInput, WeightClassUpdateWithoutEntriesInput>, WeightClassUncheckedUpdateWithoutEntriesInput>
  }

  export type EventCreateNestedOneWithoutTeamsInput = {
    create?: XOR<EventCreateWithoutTeamsInput, EventUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: EventCreateOrConnectWithoutTeamsInput
    connect?: EventWhereUniqueInput
  }

  export type ClubCreateNestedOneWithoutTeamsInput = {
    create?: XOR<ClubCreateWithoutTeamsInput, ClubUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: ClubCreateOrConnectWithoutTeamsInput
    connect?: ClubWhereUniqueInput
  }

  export type DivisionCreateNestedOneWithoutTeamsInput = {
    create?: XOR<DivisionCreateWithoutTeamsInput, DivisionUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: DivisionCreateOrConnectWithoutTeamsInput
    connect?: DivisionWhereUniqueInput
  }

  export type TeamMemberCreateNestedManyWithoutTeamInput = {
    create?: XOR<TeamMemberCreateWithoutTeamInput, TeamMemberUncheckedCreateWithoutTeamInput> | TeamMemberCreateWithoutTeamInput[] | TeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutTeamInput | TeamMemberCreateOrConnectWithoutTeamInput[]
    createMany?: TeamMemberCreateManyTeamInputEnvelope
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
  }

  export type EntryCreateNestedManyWithoutTeamInput = {
    create?: XOR<EntryCreateWithoutTeamInput, EntryUncheckedCreateWithoutTeamInput> | EntryCreateWithoutTeamInput[] | EntryUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutTeamInput | EntryCreateOrConnectWithoutTeamInput[]
    createMany?: EntryCreateManyTeamInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type TeamMemberUncheckedCreateNestedManyWithoutTeamInput = {
    create?: XOR<TeamMemberCreateWithoutTeamInput, TeamMemberUncheckedCreateWithoutTeamInput> | TeamMemberCreateWithoutTeamInput[] | TeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutTeamInput | TeamMemberCreateOrConnectWithoutTeamInput[]
    createMany?: TeamMemberCreateManyTeamInputEnvelope
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
  }

  export type EntryUncheckedCreateNestedManyWithoutTeamInput = {
    create?: XOR<EntryCreateWithoutTeamInput, EntryUncheckedCreateWithoutTeamInput> | EntryCreateWithoutTeamInput[] | EntryUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutTeamInput | EntryCreateOrConnectWithoutTeamInput[]
    createMany?: EntryCreateManyTeamInputEnvelope
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
  }

  export type EnumTeamStatusFieldUpdateOperationsInput = {
    set?: $Enums.TeamStatus
  }

  export type EventUpdateOneRequiredWithoutTeamsNestedInput = {
    create?: XOR<EventCreateWithoutTeamsInput, EventUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: EventCreateOrConnectWithoutTeamsInput
    upsert?: EventUpsertWithoutTeamsInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutTeamsInput, EventUpdateWithoutTeamsInput>, EventUncheckedUpdateWithoutTeamsInput>
  }

  export type ClubUpdateOneRequiredWithoutTeamsNestedInput = {
    create?: XOR<ClubCreateWithoutTeamsInput, ClubUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: ClubCreateOrConnectWithoutTeamsInput
    upsert?: ClubUpsertWithoutTeamsInput
    connect?: ClubWhereUniqueInput
    update?: XOR<XOR<ClubUpdateToOneWithWhereWithoutTeamsInput, ClubUpdateWithoutTeamsInput>, ClubUncheckedUpdateWithoutTeamsInput>
  }

  export type DivisionUpdateOneRequiredWithoutTeamsNestedInput = {
    create?: XOR<DivisionCreateWithoutTeamsInput, DivisionUncheckedCreateWithoutTeamsInput>
    connectOrCreate?: DivisionCreateOrConnectWithoutTeamsInput
    upsert?: DivisionUpsertWithoutTeamsInput
    connect?: DivisionWhereUniqueInput
    update?: XOR<XOR<DivisionUpdateToOneWithWhereWithoutTeamsInput, DivisionUpdateWithoutTeamsInput>, DivisionUncheckedUpdateWithoutTeamsInput>
  }

  export type TeamMemberUpdateManyWithoutTeamNestedInput = {
    create?: XOR<TeamMemberCreateWithoutTeamInput, TeamMemberUncheckedCreateWithoutTeamInput> | TeamMemberCreateWithoutTeamInput[] | TeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutTeamInput | TeamMemberCreateOrConnectWithoutTeamInput[]
    upsert?: TeamMemberUpsertWithWhereUniqueWithoutTeamInput | TeamMemberUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: TeamMemberCreateManyTeamInputEnvelope
    set?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    disconnect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    delete?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    update?: TeamMemberUpdateWithWhereUniqueWithoutTeamInput | TeamMemberUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: TeamMemberUpdateManyWithWhereWithoutTeamInput | TeamMemberUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: TeamMemberScalarWhereInput | TeamMemberScalarWhereInput[]
  }

  export type EntryUpdateManyWithoutTeamNestedInput = {
    create?: XOR<EntryCreateWithoutTeamInput, EntryUncheckedCreateWithoutTeamInput> | EntryCreateWithoutTeamInput[] | EntryUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutTeamInput | EntryCreateOrConnectWithoutTeamInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutTeamInput | EntryUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: EntryCreateManyTeamInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutTeamInput | EntryUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutTeamInput | EntryUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamMemberUncheckedUpdateManyWithoutTeamNestedInput = {
    create?: XOR<TeamMemberCreateWithoutTeamInput, TeamMemberUncheckedCreateWithoutTeamInput> | TeamMemberCreateWithoutTeamInput[] | TeamMemberUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: TeamMemberCreateOrConnectWithoutTeamInput | TeamMemberCreateOrConnectWithoutTeamInput[]
    upsert?: TeamMemberUpsertWithWhereUniqueWithoutTeamInput | TeamMemberUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: TeamMemberCreateManyTeamInputEnvelope
    set?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    disconnect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    delete?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    connect?: TeamMemberWhereUniqueInput | TeamMemberWhereUniqueInput[]
    update?: TeamMemberUpdateWithWhereUniqueWithoutTeamInput | TeamMemberUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: TeamMemberUpdateManyWithWhereWithoutTeamInput | TeamMemberUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: TeamMemberScalarWhereInput | TeamMemberScalarWhereInput[]
  }

  export type EntryUncheckedUpdateManyWithoutTeamNestedInput = {
    create?: XOR<EntryCreateWithoutTeamInput, EntryUncheckedCreateWithoutTeamInput> | EntryCreateWithoutTeamInput[] | EntryUncheckedCreateWithoutTeamInput[]
    connectOrCreate?: EntryCreateOrConnectWithoutTeamInput | EntryCreateOrConnectWithoutTeamInput[]
    upsert?: EntryUpsertWithWhereUniqueWithoutTeamInput | EntryUpsertWithWhereUniqueWithoutTeamInput[]
    createMany?: EntryCreateManyTeamInputEnvelope
    set?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    disconnect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    delete?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    connect?: EntryWhereUniqueInput | EntryWhereUniqueInput[]
    update?: EntryUpdateWithWhereUniqueWithoutTeamInput | EntryUpdateWithWhereUniqueWithoutTeamInput[]
    updateMany?: EntryUpdateManyWithWhereWithoutTeamInput | EntryUpdateManyWithWhereWithoutTeamInput[]
    deleteMany?: EntryScalarWhereInput | EntryScalarWhereInput[]
  }

  export type TeamCreateNestedOneWithoutMembersInput = {
    create?: XOR<TeamCreateWithoutMembersInput, TeamUncheckedCreateWithoutMembersInput>
    connectOrCreate?: TeamCreateOrConnectWithoutMembersInput
    connect?: TeamWhereUniqueInput
  }

  export type AthleteCreateNestedOneWithoutTeamMembersInput = {
    create?: XOR<AthleteCreateWithoutTeamMembersInput, AthleteUncheckedCreateWithoutTeamMembersInput>
    connectOrCreate?: AthleteCreateOrConnectWithoutTeamMembersInput
    connect?: AthleteWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type TeamUpdateOneRequiredWithoutMembersNestedInput = {
    create?: XOR<TeamCreateWithoutMembersInput, TeamUncheckedCreateWithoutMembersInput>
    connectOrCreate?: TeamCreateOrConnectWithoutMembersInput
    upsert?: TeamUpsertWithoutMembersInput
    connect?: TeamWhereUniqueInput
    update?: XOR<XOR<TeamUpdateToOneWithWhereWithoutMembersInput, TeamUpdateWithoutMembersInput>, TeamUncheckedUpdateWithoutMembersInput>
  }

  export type AthleteUpdateOneRequiredWithoutTeamMembersNestedInput = {
    create?: XOR<AthleteCreateWithoutTeamMembersInput, AthleteUncheckedCreateWithoutTeamMembersInput>
    connectOrCreate?: AthleteCreateOrConnectWithoutTeamMembersInput
    upsert?: AthleteUpsertWithoutTeamMembersInput
    connect?: AthleteWhereUniqueInput
    update?: XOR<XOR<AthleteUpdateToOneWithWhereWithoutTeamMembersInput, AthleteUpdateWithoutTeamMembersInput>, AthleteUncheckedUpdateWithoutTeamMembersInput>
  }

  export type ClubCreateNestedOneWithoutInvoicesInput = {
    create?: XOR<ClubCreateWithoutInvoicesInput, ClubUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: ClubCreateOrConnectWithoutInvoicesInput
    connect?: ClubWhereUniqueInput
  }

  export type EventCreateNestedOneWithoutInvoicesInput = {
    create?: XOR<EventCreateWithoutInvoicesInput, EventUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: EventCreateOrConnectWithoutInvoicesInput
    connect?: EventWhereUniqueInput
  }

  export type EnumInvoiceStatusFieldUpdateOperationsInput = {
    set?: $Enums.InvoiceStatus
  }

  export type ClubUpdateOneRequiredWithoutInvoicesNestedInput = {
    create?: XOR<ClubCreateWithoutInvoicesInput, ClubUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: ClubCreateOrConnectWithoutInvoicesInput
    upsert?: ClubUpsertWithoutInvoicesInput
    connect?: ClubWhereUniqueInput
    update?: XOR<XOR<ClubUpdateToOneWithWhereWithoutInvoicesInput, ClubUpdateWithoutInvoicesInput>, ClubUncheckedUpdateWithoutInvoicesInput>
  }

  export type EventUpdateOneRequiredWithoutInvoicesNestedInput = {
    create?: XOR<EventCreateWithoutInvoicesInput, EventUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: EventCreateOrConnectWithoutInvoicesInput
    upsert?: EventUpsertWithoutInvoicesInput
    connect?: EventWhereUniqueInput
    update?: XOR<XOR<EventUpdateToOneWithWhereWithoutInvoicesInput, EventUpdateWithoutInvoicesInput>, EventUncheckedUpdateWithoutInvoicesInput>
  }

  export type UserCreateNestedOneWithoutAuditLogsInput = {
    create?: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAuditLogsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneWithoutAuditLogsNestedInput = {
    create?: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAuditLogsInput
    upsert?: UserUpsertWithoutAuditLogsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAuditLogsInput, UserUpdateWithoutAuditLogsInput>, UserUncheckedUpdateWithoutAuditLogsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumGenderFilter<$PrismaModel = never> = {
    equals?: $Enums.Gender | EnumGenderFieldRefInput<$PrismaModel>
    in?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    notIn?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    not?: NestedEnumGenderFilter<$PrismaModel> | $Enums.Gender
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumGenderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Gender | EnumGenderFieldRefInput<$PrismaModel>
    in?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    notIn?: $Enums.Gender[] | ListEnumGenderFieldRefInput<$PrismaModel>
    not?: NestedEnumGenderWithAggregatesFilter<$PrismaModel> | $Enums.Gender
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGenderFilter<$PrismaModel>
    _max?: NestedEnumGenderFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumEntryTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryType | EnumEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryTypeFilter<$PrismaModel> | $Enums.EntryType
  }

  export type NestedEnumEntryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryStatus | EnumEntryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryStatusFilter<$PrismaModel> | $Enums.EntryStatus
  }

  export type NestedEnumEntryTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryType | EnumEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryType[] | ListEnumEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryTypeWithAggregatesFilter<$PrismaModel> | $Enums.EntryType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEntryTypeFilter<$PrismaModel>
    _max?: NestedEnumEntryTypeFilter<$PrismaModel>
  }

  export type NestedEnumEntryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.EntryStatus | EnumEntryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.EntryStatus[] | ListEnumEntryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumEntryStatusWithAggregatesFilter<$PrismaModel> | $Enums.EntryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumEntryStatusFilter<$PrismaModel>
    _max?: NestedEnumEntryStatusFilter<$PrismaModel>
  }

  export type NestedEnumTeamStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TeamStatus | EnumTeamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTeamStatusFilter<$PrismaModel> | $Enums.TeamStatus
  }

  export type NestedEnumTeamStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TeamStatus | EnumTeamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TeamStatus[] | ListEnumTeamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTeamStatusWithAggregatesFilter<$PrismaModel> | $Enums.TeamStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTeamStatusFilter<$PrismaModel>
    _max?: NestedEnumTeamStatusFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumInvoiceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusFilter<$PrismaModel> | $Enums.InvoiceStatus
  }

  export type NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InvoiceStatus | EnumInvoiceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.InvoiceStatus[] | ListEnumInvoiceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumInvoiceStatusWithAggregatesFilter<$PrismaModel> | $Enums.InvoiceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInvoiceStatusFilter<$PrismaModel>
    _max?: NestedEnumInvoiceStatusFilter<$PrismaModel>
  }

  export type ClubCreateWithoutUsersInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    athletes?: AthleteCreateNestedManyWithoutClubInput
    teams?: TeamCreateNestedManyWithoutClubInput
    entries?: EntryCreateNestedManyWithoutClubInput
    invoices?: InvoiceCreateNestedManyWithoutClubInput
  }

  export type ClubUncheckedCreateWithoutUsersInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    athletes?: AthleteUncheckedCreateNestedManyWithoutClubInput
    teams?: TeamUncheckedCreateNestedManyWithoutClubInput
    entries?: EntryUncheckedCreateNestedManyWithoutClubInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutClubInput
  }

  export type ClubCreateOrConnectWithoutUsersInput = {
    where: ClubWhereUniqueInput
    create: XOR<ClubCreateWithoutUsersInput, ClubUncheckedCreateWithoutUsersInput>
  }

  export type AuditLogCreateWithoutUserInput = {
    id?: string
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt?: Date | string
  }

  export type AuditLogUncheckedCreateWithoutUserInput = {
    id?: string
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt?: Date | string
  }

  export type AuditLogCreateOrConnectWithoutUserInput = {
    where: AuditLogWhereUniqueInput
    create: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput>
  }

  export type AuditLogCreateManyUserInputEnvelope = {
    data: AuditLogCreateManyUserInput | AuditLogCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ClubUpsertWithoutUsersInput = {
    update: XOR<ClubUpdateWithoutUsersInput, ClubUncheckedUpdateWithoutUsersInput>
    create: XOR<ClubCreateWithoutUsersInput, ClubUncheckedCreateWithoutUsersInput>
    where?: ClubWhereInput
  }

  export type ClubUpdateToOneWithWhereWithoutUsersInput = {
    where?: ClubWhereInput
    data: XOR<ClubUpdateWithoutUsersInput, ClubUncheckedUpdateWithoutUsersInput>
  }

  export type ClubUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    athletes?: AthleteUpdateManyWithoutClubNestedInput
    teams?: TeamUpdateManyWithoutClubNestedInput
    entries?: EntryUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUpdateManyWithoutClubNestedInput
  }

  export type ClubUncheckedUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    athletes?: AthleteUncheckedUpdateManyWithoutClubNestedInput
    teams?: TeamUncheckedUpdateManyWithoutClubNestedInput
    entries?: EntryUncheckedUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutClubNestedInput
  }

  export type AuditLogUpsertWithWhereUniqueWithoutUserInput = {
    where: AuditLogWhereUniqueInput
    update: XOR<AuditLogUpdateWithoutUserInput, AuditLogUncheckedUpdateWithoutUserInput>
    create: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput>
  }

  export type AuditLogUpdateWithWhereUniqueWithoutUserInput = {
    where: AuditLogWhereUniqueInput
    data: XOR<AuditLogUpdateWithoutUserInput, AuditLogUncheckedUpdateWithoutUserInput>
  }

  export type AuditLogUpdateManyWithWhereWithoutUserInput = {
    where: AuditLogScalarWhereInput
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyWithoutUserInput>
  }

  export type AuditLogScalarWhereInput = {
    AND?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
    OR?: AuditLogScalarWhereInput[]
    NOT?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
    id?: StringFilter<"AuditLog"> | string
    userId?: StringNullableFilter<"AuditLog"> | string | null
    entityType?: StringFilter<"AuditLog"> | string
    entityId?: StringFilter<"AuditLog"> | string
    action?: StringFilter<"AuditLog"> | string
    diffJson?: StringFilter<"AuditLog"> | string
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
  }

  export type UserCreateWithoutClubInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    AuditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutClubInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    AuditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutClubInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutClubInput, UserUncheckedCreateWithoutClubInput>
  }

  export type UserCreateManyClubInputEnvelope = {
    data: UserCreateManyClubInput | UserCreateManyClubInput[]
    skipDuplicates?: boolean
  }

  export type AthleteCreateWithoutClubInput = {
    id?: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: EntryCreateNestedManyWithoutAthleteInput
    teamMembers?: TeamMemberCreateNestedManyWithoutAthleteInput
  }

  export type AthleteUncheckedCreateWithoutClubInput = {
    id?: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: EntryUncheckedCreateNestedManyWithoutAthleteInput
    teamMembers?: TeamMemberUncheckedCreateNestedManyWithoutAthleteInput
  }

  export type AthleteCreateOrConnectWithoutClubInput = {
    where: AthleteWhereUniqueInput
    create: XOR<AthleteCreateWithoutClubInput, AthleteUncheckedCreateWithoutClubInput>
  }

  export type AthleteCreateManyClubInputEnvelope = {
    data: AthleteCreateManyClubInput | AthleteCreateManyClubInput[]
    skipDuplicates?: boolean
  }

  export type TeamCreateWithoutClubInput = {
    id?: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutTeamsInput
    division: DivisionCreateNestedOneWithoutTeamsInput
    members?: TeamMemberCreateNestedManyWithoutTeamInput
    entries?: EntryCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutClubInput = {
    id?: string
    eventId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: TeamMemberUncheckedCreateNestedManyWithoutTeamInput
    entries?: EntryUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutClubInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutClubInput, TeamUncheckedCreateWithoutClubInput>
  }

  export type TeamCreateManyClubInputEnvelope = {
    data: TeamCreateManyClubInput | TeamCreateManyClubInput[]
    skipDuplicates?: boolean
  }

  export type EntryCreateWithoutClubInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutEntriesInput
    athlete?: AthleteCreateNestedOneWithoutEntriesInput
    team?: TeamCreateNestedOneWithoutEntriesInput
    division: DivisionCreateNestedOneWithoutEntriesInput
    weightClass?: WeightClassCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateWithoutClubInput = {
    id?: string
    eventId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateOrConnectWithoutClubInput = {
    where: EntryWhereUniqueInput
    create: XOR<EntryCreateWithoutClubInput, EntryUncheckedCreateWithoutClubInput>
  }

  export type EntryCreateManyClubInputEnvelope = {
    data: EntryCreateManyClubInput | EntryCreateManyClubInput[]
    skipDuplicates?: boolean
  }

  export type InvoiceCreateWithoutClubInput = {
    id?: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutInvoicesInput
  }

  export type InvoiceUncheckedCreateWithoutClubInput = {
    id?: string
    eventId: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceCreateOrConnectWithoutClubInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutClubInput, InvoiceUncheckedCreateWithoutClubInput>
  }

  export type InvoiceCreateManyClubInputEnvelope = {
    data: InvoiceCreateManyClubInput | InvoiceCreateManyClubInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithWhereUniqueWithoutClubInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutClubInput, UserUncheckedUpdateWithoutClubInput>
    create: XOR<UserCreateWithoutClubInput, UserUncheckedCreateWithoutClubInput>
  }

  export type UserUpdateWithWhereUniqueWithoutClubInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutClubInput, UserUncheckedUpdateWithoutClubInput>
  }

  export type UserUpdateManyWithWhereWithoutClubInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutClubInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    email?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    clubId?: StringNullableFilter<"User"> | string | null
    passwordHash?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type AthleteUpsertWithWhereUniqueWithoutClubInput = {
    where: AthleteWhereUniqueInput
    update: XOR<AthleteUpdateWithoutClubInput, AthleteUncheckedUpdateWithoutClubInput>
    create: XOR<AthleteCreateWithoutClubInput, AthleteUncheckedCreateWithoutClubInput>
  }

  export type AthleteUpdateWithWhereUniqueWithoutClubInput = {
    where: AthleteWhereUniqueInput
    data: XOR<AthleteUpdateWithoutClubInput, AthleteUncheckedUpdateWithoutClubInput>
  }

  export type AthleteUpdateManyWithWhereWithoutClubInput = {
    where: AthleteScalarWhereInput
    data: XOR<AthleteUpdateManyMutationInput, AthleteUncheckedUpdateManyWithoutClubInput>
  }

  export type AthleteScalarWhereInput = {
    AND?: AthleteScalarWhereInput | AthleteScalarWhereInput[]
    OR?: AthleteScalarWhereInput[]
    NOT?: AthleteScalarWhereInput | AthleteScalarWhereInput[]
    id?: StringFilter<"Athlete"> | string
    clubId?: StringFilter<"Athlete"> | string
    firstName?: StringFilter<"Athlete"> | string
    lastName?: StringFilter<"Athlete"> | string
    dob?: DateTimeFilter<"Athlete"> | Date | string
    gender?: EnumGenderFilter<"Athlete"> | $Enums.Gender
    nationality?: StringFilter<"Athlete"> | string
    idType?: StringNullableFilter<"Athlete"> | string | null
    idNumber?: StringNullableFilter<"Athlete"> | string | null
    beltRank?: StringNullableFilter<"Athlete"> | string | null
    weightKg?: FloatNullableFilter<"Athlete"> | number | null
    medicalNotes?: StringNullableFilter<"Athlete"> | string | null
    emergencyName?: StringFilter<"Athlete"> | string
    emergencyPhone?: StringFilter<"Athlete"> | string
    guardianName?: StringNullableFilter<"Athlete"> | string | null
    guardianPhone?: StringNullableFilter<"Athlete"> | string | null
    photoUrl?: StringNullableFilter<"Athlete"> | string | null
    waiverUrl?: StringNullableFilter<"Athlete"> | string | null
    createdAt?: DateTimeFilter<"Athlete"> | Date | string
    updatedAt?: DateTimeFilter<"Athlete"> | Date | string
  }

  export type TeamUpsertWithWhereUniqueWithoutClubInput = {
    where: TeamWhereUniqueInput
    update: XOR<TeamUpdateWithoutClubInput, TeamUncheckedUpdateWithoutClubInput>
    create: XOR<TeamCreateWithoutClubInput, TeamUncheckedCreateWithoutClubInput>
  }

  export type TeamUpdateWithWhereUniqueWithoutClubInput = {
    where: TeamWhereUniqueInput
    data: XOR<TeamUpdateWithoutClubInput, TeamUncheckedUpdateWithoutClubInput>
  }

  export type TeamUpdateManyWithWhereWithoutClubInput = {
    where: TeamScalarWhereInput
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyWithoutClubInput>
  }

  export type TeamScalarWhereInput = {
    AND?: TeamScalarWhereInput | TeamScalarWhereInput[]
    OR?: TeamScalarWhereInput[]
    NOT?: TeamScalarWhereInput | TeamScalarWhereInput[]
    id?: StringFilter<"Team"> | string
    eventId?: StringFilter<"Team"> | string
    clubId?: StringFilter<"Team"> | string
    name?: StringFilter<"Team"> | string
    teamType?: EnumEntryTypeFilter<"Team"> | $Enums.EntryType
    divisionId?: StringFilter<"Team"> | string
    status?: EnumTeamStatusFilter<"Team"> | $Enums.TeamStatus
    createdAt?: DateTimeFilter<"Team"> | Date | string
    updatedAt?: DateTimeFilter<"Team"> | Date | string
  }

  export type EntryUpsertWithWhereUniqueWithoutClubInput = {
    where: EntryWhereUniqueInput
    update: XOR<EntryUpdateWithoutClubInput, EntryUncheckedUpdateWithoutClubInput>
    create: XOR<EntryCreateWithoutClubInput, EntryUncheckedCreateWithoutClubInput>
  }

  export type EntryUpdateWithWhereUniqueWithoutClubInput = {
    where: EntryWhereUniqueInput
    data: XOR<EntryUpdateWithoutClubInput, EntryUncheckedUpdateWithoutClubInput>
  }

  export type EntryUpdateManyWithWhereWithoutClubInput = {
    where: EntryScalarWhereInput
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyWithoutClubInput>
  }

  export type EntryScalarWhereInput = {
    AND?: EntryScalarWhereInput | EntryScalarWhereInput[]
    OR?: EntryScalarWhereInput[]
    NOT?: EntryScalarWhereInput | EntryScalarWhereInput[]
    id?: StringFilter<"Entry"> | string
    eventId?: StringFilter<"Entry"> | string
    clubId?: StringFilter<"Entry"> | string
    athleteId?: StringNullableFilter<"Entry"> | string | null
    teamId?: StringNullableFilter<"Entry"> | string | null
    entryType?: EnumEntryTypeFilter<"Entry"> | $Enums.EntryType
    divisionId?: StringFilter<"Entry"> | string
    weightClassId?: StringNullableFilter<"Entry"> | string | null
    status?: EnumEntryStatusFilter<"Entry"> | $Enums.EntryStatus
    feeCents?: IntFilter<"Entry"> | number
    notes?: StringNullableFilter<"Entry"> | string | null
    createdAt?: DateTimeFilter<"Entry"> | Date | string
    updatedAt?: DateTimeFilter<"Entry"> | Date | string
  }

  export type InvoiceUpsertWithWhereUniqueWithoutClubInput = {
    where: InvoiceWhereUniqueInput
    update: XOR<InvoiceUpdateWithoutClubInput, InvoiceUncheckedUpdateWithoutClubInput>
    create: XOR<InvoiceCreateWithoutClubInput, InvoiceUncheckedCreateWithoutClubInput>
  }

  export type InvoiceUpdateWithWhereUniqueWithoutClubInput = {
    where: InvoiceWhereUniqueInput
    data: XOR<InvoiceUpdateWithoutClubInput, InvoiceUncheckedUpdateWithoutClubInput>
  }

  export type InvoiceUpdateManyWithWhereWithoutClubInput = {
    where: InvoiceScalarWhereInput
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyWithoutClubInput>
  }

  export type InvoiceScalarWhereInput = {
    AND?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
    OR?: InvoiceScalarWhereInput[]
    NOT?: InvoiceScalarWhereInput | InvoiceScalarWhereInput[]
    id?: StringFilter<"Invoice"> | string
    clubId?: StringFilter<"Invoice"> | string
    eventId?: StringFilter<"Invoice"> | string
    totalCents?: IntFilter<"Invoice"> | number
    status?: EnumInvoiceStatusFilter<"Invoice"> | $Enums.InvoiceStatus
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
  }

  export type DivisionCreateWithoutEventInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    entries?: EntryCreateNestedManyWithoutDivisionInput
    teams?: TeamCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassCreateNestedManyWithoutDivisionInput
  }

  export type DivisionUncheckedCreateWithoutEventInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    entries?: EntryUncheckedCreateNestedManyWithoutDivisionInput
    teams?: TeamUncheckedCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutDivisionInput
  }

  export type DivisionCreateOrConnectWithoutEventInput = {
    where: DivisionWhereUniqueInput
    create: XOR<DivisionCreateWithoutEventInput, DivisionUncheckedCreateWithoutEventInput>
  }

  export type DivisionCreateManyEventInputEnvelope = {
    data: DivisionCreateManyEventInput | DivisionCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type WeightClassCreateWithoutEventInput = {
    id?: string
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    division?: DivisionCreateNestedOneWithoutWeightClassesInput
    entries?: EntryCreateNestedManyWithoutWeightClassInput
  }

  export type WeightClassUncheckedCreateWithoutEventInput = {
    id?: string
    divisionId?: string | null
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    entries?: EntryUncheckedCreateNestedManyWithoutWeightClassInput
  }

  export type WeightClassCreateOrConnectWithoutEventInput = {
    where: WeightClassWhereUniqueInput
    create: XOR<WeightClassCreateWithoutEventInput, WeightClassUncheckedCreateWithoutEventInput>
  }

  export type WeightClassCreateManyEventInputEnvelope = {
    data: WeightClassCreateManyEventInput | WeightClassCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type EntryCreateWithoutEventInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutEntriesInput
    athlete?: AthleteCreateNestedOneWithoutEntriesInput
    team?: TeamCreateNestedOneWithoutEntriesInput
    division: DivisionCreateNestedOneWithoutEntriesInput
    weightClass?: WeightClassCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateWithoutEventInput = {
    id?: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateOrConnectWithoutEventInput = {
    where: EntryWhereUniqueInput
    create: XOR<EntryCreateWithoutEventInput, EntryUncheckedCreateWithoutEventInput>
  }

  export type EntryCreateManyEventInputEnvelope = {
    data: EntryCreateManyEventInput | EntryCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type TeamCreateWithoutEventInput = {
    id?: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutTeamsInput
    division: DivisionCreateNestedOneWithoutTeamsInput
    members?: TeamMemberCreateNestedManyWithoutTeamInput
    entries?: EntryCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutEventInput = {
    id?: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: TeamMemberUncheckedCreateNestedManyWithoutTeamInput
    entries?: EntryUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutEventInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutEventInput, TeamUncheckedCreateWithoutEventInput>
  }

  export type TeamCreateManyEventInputEnvelope = {
    data: TeamCreateManyEventInput | TeamCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type InvoiceCreateWithoutEventInput = {
    id?: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutInvoicesInput
  }

  export type InvoiceUncheckedCreateWithoutEventInput = {
    id?: string
    clubId: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceCreateOrConnectWithoutEventInput = {
    where: InvoiceWhereUniqueInput
    create: XOR<InvoiceCreateWithoutEventInput, InvoiceUncheckedCreateWithoutEventInput>
  }

  export type InvoiceCreateManyEventInputEnvelope = {
    data: InvoiceCreateManyEventInput | InvoiceCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type DivisionUpsertWithWhereUniqueWithoutEventInput = {
    where: DivisionWhereUniqueInput
    update: XOR<DivisionUpdateWithoutEventInput, DivisionUncheckedUpdateWithoutEventInput>
    create: XOR<DivisionCreateWithoutEventInput, DivisionUncheckedCreateWithoutEventInput>
  }

  export type DivisionUpdateWithWhereUniqueWithoutEventInput = {
    where: DivisionWhereUniqueInput
    data: XOR<DivisionUpdateWithoutEventInput, DivisionUncheckedUpdateWithoutEventInput>
  }

  export type DivisionUpdateManyWithWhereWithoutEventInput = {
    where: DivisionScalarWhereInput
    data: XOR<DivisionUpdateManyMutationInput, DivisionUncheckedUpdateManyWithoutEventInput>
  }

  export type DivisionScalarWhereInput = {
    AND?: DivisionScalarWhereInput | DivisionScalarWhereInput[]
    OR?: DivisionScalarWhereInput[]
    NOT?: DivisionScalarWhereInput | DivisionScalarWhereInput[]
    id?: StringFilter<"Division"> | string
    eventId?: StringFilter<"Division"> | string
    key?: StringFilter<"Division"> | string
    name?: StringFilter<"Division"> | string
    minAge?: IntFilter<"Division"> | number
    maxAge?: IntFilter<"Division"> | number
    gender?: EnumGenderFilter<"Division"> | $Enums.Gender
    notes?: StringNullableFilter<"Division"> | string | null
  }

  export type WeightClassUpsertWithWhereUniqueWithoutEventInput = {
    where: WeightClassWhereUniqueInput
    update: XOR<WeightClassUpdateWithoutEventInput, WeightClassUncheckedUpdateWithoutEventInput>
    create: XOR<WeightClassCreateWithoutEventInput, WeightClassUncheckedCreateWithoutEventInput>
  }

  export type WeightClassUpdateWithWhereUniqueWithoutEventInput = {
    where: WeightClassWhereUniqueInput
    data: XOR<WeightClassUpdateWithoutEventInput, WeightClassUncheckedUpdateWithoutEventInput>
  }

  export type WeightClassUpdateManyWithWhereWithoutEventInput = {
    where: WeightClassScalarWhereInput
    data: XOR<WeightClassUpdateManyMutationInput, WeightClassUncheckedUpdateManyWithoutEventInput>
  }

  export type WeightClassScalarWhereInput = {
    AND?: WeightClassScalarWhereInput | WeightClassScalarWhereInput[]
    OR?: WeightClassScalarWhereInput[]
    NOT?: WeightClassScalarWhereInput | WeightClassScalarWhereInput[]
    id?: StringFilter<"WeightClass"> | string
    eventId?: StringFilter<"WeightClass"> | string
    divisionId?: StringNullableFilter<"WeightClass"> | string | null
    gender?: EnumGenderFilter<"WeightClass"> | $Enums.Gender
    name?: StringFilter<"WeightClass"> | string
    minKg?: FloatNullableFilter<"WeightClass"> | number | null
    maxKg?: FloatNullableFilter<"WeightClass"> | number | null
  }

  export type EntryUpsertWithWhereUniqueWithoutEventInput = {
    where: EntryWhereUniqueInput
    update: XOR<EntryUpdateWithoutEventInput, EntryUncheckedUpdateWithoutEventInput>
    create: XOR<EntryCreateWithoutEventInput, EntryUncheckedCreateWithoutEventInput>
  }

  export type EntryUpdateWithWhereUniqueWithoutEventInput = {
    where: EntryWhereUniqueInput
    data: XOR<EntryUpdateWithoutEventInput, EntryUncheckedUpdateWithoutEventInput>
  }

  export type EntryUpdateManyWithWhereWithoutEventInput = {
    where: EntryScalarWhereInput
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyWithoutEventInput>
  }

  export type TeamUpsertWithWhereUniqueWithoutEventInput = {
    where: TeamWhereUniqueInput
    update: XOR<TeamUpdateWithoutEventInput, TeamUncheckedUpdateWithoutEventInput>
    create: XOR<TeamCreateWithoutEventInput, TeamUncheckedCreateWithoutEventInput>
  }

  export type TeamUpdateWithWhereUniqueWithoutEventInput = {
    where: TeamWhereUniqueInput
    data: XOR<TeamUpdateWithoutEventInput, TeamUncheckedUpdateWithoutEventInput>
  }

  export type TeamUpdateManyWithWhereWithoutEventInput = {
    where: TeamScalarWhereInput
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyWithoutEventInput>
  }

  export type InvoiceUpsertWithWhereUniqueWithoutEventInput = {
    where: InvoiceWhereUniqueInput
    update: XOR<InvoiceUpdateWithoutEventInput, InvoiceUncheckedUpdateWithoutEventInput>
    create: XOR<InvoiceCreateWithoutEventInput, InvoiceUncheckedCreateWithoutEventInput>
  }

  export type InvoiceUpdateWithWhereUniqueWithoutEventInput = {
    where: InvoiceWhereUniqueInput
    data: XOR<InvoiceUpdateWithoutEventInput, InvoiceUncheckedUpdateWithoutEventInput>
  }

  export type InvoiceUpdateManyWithWhereWithoutEventInput = {
    where: InvoiceScalarWhereInput
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyWithoutEventInput>
  }

  export type EventCreateWithoutDivisionsInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    weightClasses?: WeightClassCreateNestedManyWithoutEventInput
    entries?: EntryCreateNestedManyWithoutEventInput
    teams?: TeamCreateNestedManyWithoutEventInput
    invoices?: InvoiceCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutDivisionsInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutEventInput
    entries?: EntryUncheckedCreateNestedManyWithoutEventInput
    teams?: TeamUncheckedCreateNestedManyWithoutEventInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutDivisionsInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutDivisionsInput, EventUncheckedCreateWithoutDivisionsInput>
  }

  export type EntryCreateWithoutDivisionInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutEntriesInput
    club: ClubCreateNestedOneWithoutEntriesInput
    athlete?: AthleteCreateNestedOneWithoutEntriesInput
    team?: TeamCreateNestedOneWithoutEntriesInput
    weightClass?: WeightClassCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateWithoutDivisionInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateOrConnectWithoutDivisionInput = {
    where: EntryWhereUniqueInput
    create: XOR<EntryCreateWithoutDivisionInput, EntryUncheckedCreateWithoutDivisionInput>
  }

  export type EntryCreateManyDivisionInputEnvelope = {
    data: EntryCreateManyDivisionInput | EntryCreateManyDivisionInput[]
    skipDuplicates?: boolean
  }

  export type TeamCreateWithoutDivisionInput = {
    id?: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutTeamsInput
    club: ClubCreateNestedOneWithoutTeamsInput
    members?: TeamMemberCreateNestedManyWithoutTeamInput
    entries?: EntryCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutDivisionInput = {
    id?: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: TeamMemberUncheckedCreateNestedManyWithoutTeamInput
    entries?: EntryUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutDivisionInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutDivisionInput, TeamUncheckedCreateWithoutDivisionInput>
  }

  export type TeamCreateManyDivisionInputEnvelope = {
    data: TeamCreateManyDivisionInput | TeamCreateManyDivisionInput[]
    skipDuplicates?: boolean
  }

  export type WeightClassCreateWithoutDivisionInput = {
    id?: string
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    event: EventCreateNestedOneWithoutWeightClassesInput
    entries?: EntryCreateNestedManyWithoutWeightClassInput
  }

  export type WeightClassUncheckedCreateWithoutDivisionInput = {
    id?: string
    eventId: string
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    entries?: EntryUncheckedCreateNestedManyWithoutWeightClassInput
  }

  export type WeightClassCreateOrConnectWithoutDivisionInput = {
    where: WeightClassWhereUniqueInput
    create: XOR<WeightClassCreateWithoutDivisionInput, WeightClassUncheckedCreateWithoutDivisionInput>
  }

  export type WeightClassCreateManyDivisionInputEnvelope = {
    data: WeightClassCreateManyDivisionInput | WeightClassCreateManyDivisionInput[]
    skipDuplicates?: boolean
  }

  export type EventUpsertWithoutDivisionsInput = {
    update: XOR<EventUpdateWithoutDivisionsInput, EventUncheckedUpdateWithoutDivisionsInput>
    create: XOR<EventCreateWithoutDivisionsInput, EventUncheckedCreateWithoutDivisionsInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutDivisionsInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutDivisionsInput, EventUncheckedUpdateWithoutDivisionsInput>
  }

  export type EventUpdateWithoutDivisionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    weightClasses?: WeightClassUpdateManyWithoutEventNestedInput
    entries?: EntryUpdateManyWithoutEventNestedInput
    teams?: TeamUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutDivisionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    weightClasses?: WeightClassUncheckedUpdateManyWithoutEventNestedInput
    entries?: EntryUncheckedUpdateManyWithoutEventNestedInput
    teams?: TeamUncheckedUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutEventNestedInput
  }

  export type EntryUpsertWithWhereUniqueWithoutDivisionInput = {
    where: EntryWhereUniqueInput
    update: XOR<EntryUpdateWithoutDivisionInput, EntryUncheckedUpdateWithoutDivisionInput>
    create: XOR<EntryCreateWithoutDivisionInput, EntryUncheckedCreateWithoutDivisionInput>
  }

  export type EntryUpdateWithWhereUniqueWithoutDivisionInput = {
    where: EntryWhereUniqueInput
    data: XOR<EntryUpdateWithoutDivisionInput, EntryUncheckedUpdateWithoutDivisionInput>
  }

  export type EntryUpdateManyWithWhereWithoutDivisionInput = {
    where: EntryScalarWhereInput
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyWithoutDivisionInput>
  }

  export type TeamUpsertWithWhereUniqueWithoutDivisionInput = {
    where: TeamWhereUniqueInput
    update: XOR<TeamUpdateWithoutDivisionInput, TeamUncheckedUpdateWithoutDivisionInput>
    create: XOR<TeamCreateWithoutDivisionInput, TeamUncheckedCreateWithoutDivisionInput>
  }

  export type TeamUpdateWithWhereUniqueWithoutDivisionInput = {
    where: TeamWhereUniqueInput
    data: XOR<TeamUpdateWithoutDivisionInput, TeamUncheckedUpdateWithoutDivisionInput>
  }

  export type TeamUpdateManyWithWhereWithoutDivisionInput = {
    where: TeamScalarWhereInput
    data: XOR<TeamUpdateManyMutationInput, TeamUncheckedUpdateManyWithoutDivisionInput>
  }

  export type WeightClassUpsertWithWhereUniqueWithoutDivisionInput = {
    where: WeightClassWhereUniqueInput
    update: XOR<WeightClassUpdateWithoutDivisionInput, WeightClassUncheckedUpdateWithoutDivisionInput>
    create: XOR<WeightClassCreateWithoutDivisionInput, WeightClassUncheckedCreateWithoutDivisionInput>
  }

  export type WeightClassUpdateWithWhereUniqueWithoutDivisionInput = {
    where: WeightClassWhereUniqueInput
    data: XOR<WeightClassUpdateWithoutDivisionInput, WeightClassUncheckedUpdateWithoutDivisionInput>
  }

  export type WeightClassUpdateManyWithWhereWithoutDivisionInput = {
    where: WeightClassScalarWhereInput
    data: XOR<WeightClassUpdateManyMutationInput, WeightClassUncheckedUpdateManyWithoutDivisionInput>
  }

  export type EventCreateWithoutWeightClassesInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionCreateNestedManyWithoutEventInput
    entries?: EntryCreateNestedManyWithoutEventInput
    teams?: TeamCreateNestedManyWithoutEventInput
    invoices?: InvoiceCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutWeightClassesInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionUncheckedCreateNestedManyWithoutEventInput
    entries?: EntryUncheckedCreateNestedManyWithoutEventInput
    teams?: TeamUncheckedCreateNestedManyWithoutEventInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutWeightClassesInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutWeightClassesInput, EventUncheckedCreateWithoutWeightClassesInput>
  }

  export type DivisionCreateWithoutWeightClassesInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    event: EventCreateNestedOneWithoutDivisionsInput
    entries?: EntryCreateNestedManyWithoutDivisionInput
    teams?: TeamCreateNestedManyWithoutDivisionInput
  }

  export type DivisionUncheckedCreateWithoutWeightClassesInput = {
    id?: string
    eventId: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    entries?: EntryUncheckedCreateNestedManyWithoutDivisionInput
    teams?: TeamUncheckedCreateNestedManyWithoutDivisionInput
  }

  export type DivisionCreateOrConnectWithoutWeightClassesInput = {
    where: DivisionWhereUniqueInput
    create: XOR<DivisionCreateWithoutWeightClassesInput, DivisionUncheckedCreateWithoutWeightClassesInput>
  }

  export type EntryCreateWithoutWeightClassInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutEntriesInput
    club: ClubCreateNestedOneWithoutEntriesInput
    athlete?: AthleteCreateNestedOneWithoutEntriesInput
    team?: TeamCreateNestedOneWithoutEntriesInput
    division: DivisionCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateWithoutWeightClassInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateOrConnectWithoutWeightClassInput = {
    where: EntryWhereUniqueInput
    create: XOR<EntryCreateWithoutWeightClassInput, EntryUncheckedCreateWithoutWeightClassInput>
  }

  export type EntryCreateManyWeightClassInputEnvelope = {
    data: EntryCreateManyWeightClassInput | EntryCreateManyWeightClassInput[]
    skipDuplicates?: boolean
  }

  export type EventUpsertWithoutWeightClassesInput = {
    update: XOR<EventUpdateWithoutWeightClassesInput, EventUncheckedUpdateWithoutWeightClassesInput>
    create: XOR<EventCreateWithoutWeightClassesInput, EventUncheckedCreateWithoutWeightClassesInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutWeightClassesInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutWeightClassesInput, EventUncheckedUpdateWithoutWeightClassesInput>
  }

  export type EventUpdateWithoutWeightClassesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUpdateManyWithoutEventNestedInput
    entries?: EntryUpdateManyWithoutEventNestedInput
    teams?: TeamUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutWeightClassesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUncheckedUpdateManyWithoutEventNestedInput
    entries?: EntryUncheckedUpdateManyWithoutEventNestedInput
    teams?: TeamUncheckedUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutEventNestedInput
  }

  export type DivisionUpsertWithoutWeightClassesInput = {
    update: XOR<DivisionUpdateWithoutWeightClassesInput, DivisionUncheckedUpdateWithoutWeightClassesInput>
    create: XOR<DivisionCreateWithoutWeightClassesInput, DivisionUncheckedCreateWithoutWeightClassesInput>
    where?: DivisionWhereInput
  }

  export type DivisionUpdateToOneWithWhereWithoutWeightClassesInput = {
    where?: DivisionWhereInput
    data: XOR<DivisionUpdateWithoutWeightClassesInput, DivisionUncheckedUpdateWithoutWeightClassesInput>
  }

  export type DivisionUpdateWithoutWeightClassesInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    event?: EventUpdateOneRequiredWithoutDivisionsNestedInput
    entries?: EntryUpdateManyWithoutDivisionNestedInput
    teams?: TeamUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionUncheckedUpdateWithoutWeightClassesInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    entries?: EntryUncheckedUpdateManyWithoutDivisionNestedInput
    teams?: TeamUncheckedUpdateManyWithoutDivisionNestedInput
  }

  export type EntryUpsertWithWhereUniqueWithoutWeightClassInput = {
    where: EntryWhereUniqueInput
    update: XOR<EntryUpdateWithoutWeightClassInput, EntryUncheckedUpdateWithoutWeightClassInput>
    create: XOR<EntryCreateWithoutWeightClassInput, EntryUncheckedCreateWithoutWeightClassInput>
  }

  export type EntryUpdateWithWhereUniqueWithoutWeightClassInput = {
    where: EntryWhereUniqueInput
    data: XOR<EntryUpdateWithoutWeightClassInput, EntryUncheckedUpdateWithoutWeightClassInput>
  }

  export type EntryUpdateManyWithWhereWithoutWeightClassInput = {
    where: EntryScalarWhereInput
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyWithoutWeightClassInput>
  }

  export type ClubCreateWithoutAthletesInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutClubInput
    teams?: TeamCreateNestedManyWithoutClubInput
    entries?: EntryCreateNestedManyWithoutClubInput
    invoices?: InvoiceCreateNestedManyWithoutClubInput
  }

  export type ClubUncheckedCreateWithoutAthletesInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutClubInput
    teams?: TeamUncheckedCreateNestedManyWithoutClubInput
    entries?: EntryUncheckedCreateNestedManyWithoutClubInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutClubInput
  }

  export type ClubCreateOrConnectWithoutAthletesInput = {
    where: ClubWhereUniqueInput
    create: XOR<ClubCreateWithoutAthletesInput, ClubUncheckedCreateWithoutAthletesInput>
  }

  export type EntryCreateWithoutAthleteInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutEntriesInput
    club: ClubCreateNestedOneWithoutEntriesInput
    team?: TeamCreateNestedOneWithoutEntriesInput
    division: DivisionCreateNestedOneWithoutEntriesInput
    weightClass?: WeightClassCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateWithoutAthleteInput = {
    id?: string
    eventId: string
    clubId: string
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateOrConnectWithoutAthleteInput = {
    where: EntryWhereUniqueInput
    create: XOR<EntryCreateWithoutAthleteInput, EntryUncheckedCreateWithoutAthleteInput>
  }

  export type EntryCreateManyAthleteInputEnvelope = {
    data: EntryCreateManyAthleteInput | EntryCreateManyAthleteInput[]
    skipDuplicates?: boolean
  }

  export type TeamMemberCreateWithoutAthleteInput = {
    id?: string
    isReserve?: boolean
    team: TeamCreateNestedOneWithoutMembersInput
  }

  export type TeamMemberUncheckedCreateWithoutAthleteInput = {
    id?: string
    teamId: string
    isReserve?: boolean
  }

  export type TeamMemberCreateOrConnectWithoutAthleteInput = {
    where: TeamMemberWhereUniqueInput
    create: XOR<TeamMemberCreateWithoutAthleteInput, TeamMemberUncheckedCreateWithoutAthleteInput>
  }

  export type TeamMemberCreateManyAthleteInputEnvelope = {
    data: TeamMemberCreateManyAthleteInput | TeamMemberCreateManyAthleteInput[]
    skipDuplicates?: boolean
  }

  export type ClubUpsertWithoutAthletesInput = {
    update: XOR<ClubUpdateWithoutAthletesInput, ClubUncheckedUpdateWithoutAthletesInput>
    create: XOR<ClubCreateWithoutAthletesInput, ClubUncheckedCreateWithoutAthletesInput>
    where?: ClubWhereInput
  }

  export type ClubUpdateToOneWithWhereWithoutAthletesInput = {
    where?: ClubWhereInput
    data: XOR<ClubUpdateWithoutAthletesInput, ClubUncheckedUpdateWithoutAthletesInput>
  }

  export type ClubUpdateWithoutAthletesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutClubNestedInput
    teams?: TeamUpdateManyWithoutClubNestedInput
    entries?: EntryUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUpdateManyWithoutClubNestedInput
  }

  export type ClubUncheckedUpdateWithoutAthletesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutClubNestedInput
    teams?: TeamUncheckedUpdateManyWithoutClubNestedInput
    entries?: EntryUncheckedUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutClubNestedInput
  }

  export type EntryUpsertWithWhereUniqueWithoutAthleteInput = {
    where: EntryWhereUniqueInput
    update: XOR<EntryUpdateWithoutAthleteInput, EntryUncheckedUpdateWithoutAthleteInput>
    create: XOR<EntryCreateWithoutAthleteInput, EntryUncheckedCreateWithoutAthleteInput>
  }

  export type EntryUpdateWithWhereUniqueWithoutAthleteInput = {
    where: EntryWhereUniqueInput
    data: XOR<EntryUpdateWithoutAthleteInput, EntryUncheckedUpdateWithoutAthleteInput>
  }

  export type EntryUpdateManyWithWhereWithoutAthleteInput = {
    where: EntryScalarWhereInput
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyWithoutAthleteInput>
  }

  export type TeamMemberUpsertWithWhereUniqueWithoutAthleteInput = {
    where: TeamMemberWhereUniqueInput
    update: XOR<TeamMemberUpdateWithoutAthleteInput, TeamMemberUncheckedUpdateWithoutAthleteInput>
    create: XOR<TeamMemberCreateWithoutAthleteInput, TeamMemberUncheckedCreateWithoutAthleteInput>
  }

  export type TeamMemberUpdateWithWhereUniqueWithoutAthleteInput = {
    where: TeamMemberWhereUniqueInput
    data: XOR<TeamMemberUpdateWithoutAthleteInput, TeamMemberUncheckedUpdateWithoutAthleteInput>
  }

  export type TeamMemberUpdateManyWithWhereWithoutAthleteInput = {
    where: TeamMemberScalarWhereInput
    data: XOR<TeamMemberUpdateManyMutationInput, TeamMemberUncheckedUpdateManyWithoutAthleteInput>
  }

  export type TeamMemberScalarWhereInput = {
    AND?: TeamMemberScalarWhereInput | TeamMemberScalarWhereInput[]
    OR?: TeamMemberScalarWhereInput[]
    NOT?: TeamMemberScalarWhereInput | TeamMemberScalarWhereInput[]
    id?: StringFilter<"TeamMember"> | string
    teamId?: StringFilter<"TeamMember"> | string
    athleteId?: StringFilter<"TeamMember"> | string
    isReserve?: BoolFilter<"TeamMember"> | boolean
  }

  export type EventCreateWithoutEntriesInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassCreateNestedManyWithoutEventInput
    teams?: TeamCreateNestedManyWithoutEventInput
    invoices?: InvoiceCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutEntriesInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionUncheckedCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutEventInput
    teams?: TeamUncheckedCreateNestedManyWithoutEventInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutEntriesInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutEntriesInput, EventUncheckedCreateWithoutEntriesInput>
  }

  export type ClubCreateWithoutEntriesInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutClubInput
    athletes?: AthleteCreateNestedManyWithoutClubInput
    teams?: TeamCreateNestedManyWithoutClubInput
    invoices?: InvoiceCreateNestedManyWithoutClubInput
  }

  export type ClubUncheckedCreateWithoutEntriesInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutClubInput
    athletes?: AthleteUncheckedCreateNestedManyWithoutClubInput
    teams?: TeamUncheckedCreateNestedManyWithoutClubInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutClubInput
  }

  export type ClubCreateOrConnectWithoutEntriesInput = {
    where: ClubWhereUniqueInput
    create: XOR<ClubCreateWithoutEntriesInput, ClubUncheckedCreateWithoutEntriesInput>
  }

  export type AthleteCreateWithoutEntriesInput = {
    id?: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutAthletesInput
    teamMembers?: TeamMemberCreateNestedManyWithoutAthleteInput
  }

  export type AthleteUncheckedCreateWithoutEntriesInput = {
    id?: string
    clubId: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    teamMembers?: TeamMemberUncheckedCreateNestedManyWithoutAthleteInput
  }

  export type AthleteCreateOrConnectWithoutEntriesInput = {
    where: AthleteWhereUniqueInput
    create: XOR<AthleteCreateWithoutEntriesInput, AthleteUncheckedCreateWithoutEntriesInput>
  }

  export type TeamCreateWithoutEntriesInput = {
    id?: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutTeamsInput
    club: ClubCreateNestedOneWithoutTeamsInput
    division: DivisionCreateNestedOneWithoutTeamsInput
    members?: TeamMemberCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutEntriesInput = {
    id?: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    members?: TeamMemberUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutEntriesInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutEntriesInput, TeamUncheckedCreateWithoutEntriesInput>
  }

  export type DivisionCreateWithoutEntriesInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    event: EventCreateNestedOneWithoutDivisionsInput
    teams?: TeamCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassCreateNestedManyWithoutDivisionInput
  }

  export type DivisionUncheckedCreateWithoutEntriesInput = {
    id?: string
    eventId: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    teams?: TeamUncheckedCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutDivisionInput
  }

  export type DivisionCreateOrConnectWithoutEntriesInput = {
    where: DivisionWhereUniqueInput
    create: XOR<DivisionCreateWithoutEntriesInput, DivisionUncheckedCreateWithoutEntriesInput>
  }

  export type WeightClassCreateWithoutEntriesInput = {
    id?: string
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
    event: EventCreateNestedOneWithoutWeightClassesInput
    division?: DivisionCreateNestedOneWithoutWeightClassesInput
  }

  export type WeightClassUncheckedCreateWithoutEntriesInput = {
    id?: string
    eventId: string
    divisionId?: string | null
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
  }

  export type WeightClassCreateOrConnectWithoutEntriesInput = {
    where: WeightClassWhereUniqueInput
    create: XOR<WeightClassCreateWithoutEntriesInput, WeightClassUncheckedCreateWithoutEntriesInput>
  }

  export type EventUpsertWithoutEntriesInput = {
    update: XOR<EventUpdateWithoutEntriesInput, EventUncheckedUpdateWithoutEntriesInput>
    create: XOR<EventCreateWithoutEntriesInput, EventUncheckedCreateWithoutEntriesInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutEntriesInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutEntriesInput, EventUncheckedUpdateWithoutEntriesInput>
  }

  export type EventUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUpdateManyWithoutEventNestedInput
    teams?: TeamUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUncheckedUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutEventNestedInput
    teams?: TeamUncheckedUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutEventNestedInput
  }

  export type ClubUpsertWithoutEntriesInput = {
    update: XOR<ClubUpdateWithoutEntriesInput, ClubUncheckedUpdateWithoutEntriesInput>
    create: XOR<ClubCreateWithoutEntriesInput, ClubUncheckedCreateWithoutEntriesInput>
    where?: ClubWhereInput
  }

  export type ClubUpdateToOneWithWhereWithoutEntriesInput = {
    where?: ClubWhereInput
    data: XOR<ClubUpdateWithoutEntriesInput, ClubUncheckedUpdateWithoutEntriesInput>
  }

  export type ClubUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutClubNestedInput
    athletes?: AthleteUpdateManyWithoutClubNestedInput
    teams?: TeamUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUpdateManyWithoutClubNestedInput
  }

  export type ClubUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutClubNestedInput
    athletes?: AthleteUncheckedUpdateManyWithoutClubNestedInput
    teams?: TeamUncheckedUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutClubNestedInput
  }

  export type AthleteUpsertWithoutEntriesInput = {
    update: XOR<AthleteUpdateWithoutEntriesInput, AthleteUncheckedUpdateWithoutEntriesInput>
    create: XOR<AthleteCreateWithoutEntriesInput, AthleteUncheckedCreateWithoutEntriesInput>
    where?: AthleteWhereInput
  }

  export type AthleteUpdateToOneWithWhereWithoutEntriesInput = {
    where?: AthleteWhereInput
    data: XOR<AthleteUpdateWithoutEntriesInput, AthleteUncheckedUpdateWithoutEntriesInput>
  }

  export type AthleteUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutAthletesNestedInput
    teamMembers?: TeamMemberUpdateManyWithoutAthleteNestedInput
  }

  export type AthleteUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teamMembers?: TeamMemberUncheckedUpdateManyWithoutAthleteNestedInput
  }

  export type TeamUpsertWithoutEntriesInput = {
    update: XOR<TeamUpdateWithoutEntriesInput, TeamUncheckedUpdateWithoutEntriesInput>
    create: XOR<TeamCreateWithoutEntriesInput, TeamUncheckedCreateWithoutEntriesInput>
    where?: TeamWhereInput
  }

  export type TeamUpdateToOneWithWhereWithoutEntriesInput = {
    where?: TeamWhereInput
    data: XOR<TeamUpdateWithoutEntriesInput, TeamUncheckedUpdateWithoutEntriesInput>
  }

  export type TeamUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutTeamsNestedInput
    club?: ClubUpdateOneRequiredWithoutTeamsNestedInput
    division?: DivisionUpdateOneRequiredWithoutTeamsNestedInput
    members?: TeamMemberUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: TeamMemberUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type DivisionUpsertWithoutEntriesInput = {
    update: XOR<DivisionUpdateWithoutEntriesInput, DivisionUncheckedUpdateWithoutEntriesInput>
    create: XOR<DivisionCreateWithoutEntriesInput, DivisionUncheckedCreateWithoutEntriesInput>
    where?: DivisionWhereInput
  }

  export type DivisionUpdateToOneWithWhereWithoutEntriesInput = {
    where?: DivisionWhereInput
    data: XOR<DivisionUpdateWithoutEntriesInput, DivisionUncheckedUpdateWithoutEntriesInput>
  }

  export type DivisionUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    event?: EventUpdateOneRequiredWithoutDivisionsNestedInput
    teams?: TeamUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    teams?: TeamUncheckedUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutDivisionNestedInput
  }

  export type WeightClassUpsertWithoutEntriesInput = {
    update: XOR<WeightClassUpdateWithoutEntriesInput, WeightClassUncheckedUpdateWithoutEntriesInput>
    create: XOR<WeightClassCreateWithoutEntriesInput, WeightClassUncheckedCreateWithoutEntriesInput>
    where?: WeightClassWhereInput
  }

  export type WeightClassUpdateToOneWithWhereWithoutEntriesInput = {
    where?: WeightClassWhereInput
    data: XOR<WeightClassUpdateWithoutEntriesInput, WeightClassUncheckedUpdateWithoutEntriesInput>
  }

  export type WeightClassUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    event?: EventUpdateOneRequiredWithoutWeightClassesNestedInput
    division?: DivisionUpdateOneWithoutWeightClassesNestedInput
  }

  export type WeightClassUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    divisionId?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
  }

  export type EventCreateWithoutTeamsInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassCreateNestedManyWithoutEventInput
    entries?: EntryCreateNestedManyWithoutEventInput
    invoices?: InvoiceCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutTeamsInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionUncheckedCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutEventInput
    entries?: EntryUncheckedCreateNestedManyWithoutEventInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutTeamsInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutTeamsInput, EventUncheckedCreateWithoutTeamsInput>
  }

  export type ClubCreateWithoutTeamsInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutClubInput
    athletes?: AthleteCreateNestedManyWithoutClubInput
    entries?: EntryCreateNestedManyWithoutClubInput
    invoices?: InvoiceCreateNestedManyWithoutClubInput
  }

  export type ClubUncheckedCreateWithoutTeamsInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutClubInput
    athletes?: AthleteUncheckedCreateNestedManyWithoutClubInput
    entries?: EntryUncheckedCreateNestedManyWithoutClubInput
    invoices?: InvoiceUncheckedCreateNestedManyWithoutClubInput
  }

  export type ClubCreateOrConnectWithoutTeamsInput = {
    where: ClubWhereUniqueInput
    create: XOR<ClubCreateWithoutTeamsInput, ClubUncheckedCreateWithoutTeamsInput>
  }

  export type DivisionCreateWithoutTeamsInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    event: EventCreateNestedOneWithoutDivisionsInput
    entries?: EntryCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassCreateNestedManyWithoutDivisionInput
  }

  export type DivisionUncheckedCreateWithoutTeamsInput = {
    id?: string
    eventId: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
    entries?: EntryUncheckedCreateNestedManyWithoutDivisionInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutDivisionInput
  }

  export type DivisionCreateOrConnectWithoutTeamsInput = {
    where: DivisionWhereUniqueInput
    create: XOR<DivisionCreateWithoutTeamsInput, DivisionUncheckedCreateWithoutTeamsInput>
  }

  export type TeamMemberCreateWithoutTeamInput = {
    id?: string
    isReserve?: boolean
    athlete: AthleteCreateNestedOneWithoutTeamMembersInput
  }

  export type TeamMemberUncheckedCreateWithoutTeamInput = {
    id?: string
    athleteId: string
    isReserve?: boolean
  }

  export type TeamMemberCreateOrConnectWithoutTeamInput = {
    where: TeamMemberWhereUniqueInput
    create: XOR<TeamMemberCreateWithoutTeamInput, TeamMemberUncheckedCreateWithoutTeamInput>
  }

  export type TeamMemberCreateManyTeamInputEnvelope = {
    data: TeamMemberCreateManyTeamInput | TeamMemberCreateManyTeamInput[]
    skipDuplicates?: boolean
  }

  export type EntryCreateWithoutTeamInput = {
    id?: string
    entryType: $Enums.EntryType
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutEntriesInput
    club: ClubCreateNestedOneWithoutEntriesInput
    athlete?: AthleteCreateNestedOneWithoutEntriesInput
    division: DivisionCreateNestedOneWithoutEntriesInput
    weightClass?: WeightClassCreateNestedOneWithoutEntriesInput
  }

  export type EntryUncheckedCreateWithoutTeamInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateOrConnectWithoutTeamInput = {
    where: EntryWhereUniqueInput
    create: XOR<EntryCreateWithoutTeamInput, EntryUncheckedCreateWithoutTeamInput>
  }

  export type EntryCreateManyTeamInputEnvelope = {
    data: EntryCreateManyTeamInput | EntryCreateManyTeamInput[]
    skipDuplicates?: boolean
  }

  export type EventUpsertWithoutTeamsInput = {
    update: XOR<EventUpdateWithoutTeamsInput, EventUncheckedUpdateWithoutTeamsInput>
    create: XOR<EventCreateWithoutTeamsInput, EventUncheckedCreateWithoutTeamsInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutTeamsInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutTeamsInput, EventUncheckedUpdateWithoutTeamsInput>
  }

  export type EventUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUpdateManyWithoutEventNestedInput
    entries?: EntryUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUncheckedUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutEventNestedInput
    entries?: EntryUncheckedUpdateManyWithoutEventNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutEventNestedInput
  }

  export type ClubUpsertWithoutTeamsInput = {
    update: XOR<ClubUpdateWithoutTeamsInput, ClubUncheckedUpdateWithoutTeamsInput>
    create: XOR<ClubCreateWithoutTeamsInput, ClubUncheckedCreateWithoutTeamsInput>
    where?: ClubWhereInput
  }

  export type ClubUpdateToOneWithWhereWithoutTeamsInput = {
    where?: ClubWhereInput
    data: XOR<ClubUpdateWithoutTeamsInput, ClubUncheckedUpdateWithoutTeamsInput>
  }

  export type ClubUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutClubNestedInput
    athletes?: AthleteUpdateManyWithoutClubNestedInput
    entries?: EntryUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUpdateManyWithoutClubNestedInput
  }

  export type ClubUncheckedUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutClubNestedInput
    athletes?: AthleteUncheckedUpdateManyWithoutClubNestedInput
    entries?: EntryUncheckedUpdateManyWithoutClubNestedInput
    invoices?: InvoiceUncheckedUpdateManyWithoutClubNestedInput
  }

  export type DivisionUpsertWithoutTeamsInput = {
    update: XOR<DivisionUpdateWithoutTeamsInput, DivisionUncheckedUpdateWithoutTeamsInput>
    create: XOR<DivisionCreateWithoutTeamsInput, DivisionUncheckedCreateWithoutTeamsInput>
    where?: DivisionWhereInput
  }

  export type DivisionUpdateToOneWithWhereWithoutTeamsInput = {
    where?: DivisionWhereInput
    data: XOR<DivisionUpdateWithoutTeamsInput, DivisionUncheckedUpdateWithoutTeamsInput>
  }

  export type DivisionUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    event?: EventUpdateOneRequiredWithoutDivisionsNestedInput
    entries?: EntryUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionUncheckedUpdateWithoutTeamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    entries?: EntryUncheckedUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutDivisionNestedInput
  }

  export type TeamMemberUpsertWithWhereUniqueWithoutTeamInput = {
    where: TeamMemberWhereUniqueInput
    update: XOR<TeamMemberUpdateWithoutTeamInput, TeamMemberUncheckedUpdateWithoutTeamInput>
    create: XOR<TeamMemberCreateWithoutTeamInput, TeamMemberUncheckedCreateWithoutTeamInput>
  }

  export type TeamMemberUpdateWithWhereUniqueWithoutTeamInput = {
    where: TeamMemberWhereUniqueInput
    data: XOR<TeamMemberUpdateWithoutTeamInput, TeamMemberUncheckedUpdateWithoutTeamInput>
  }

  export type TeamMemberUpdateManyWithWhereWithoutTeamInput = {
    where: TeamMemberScalarWhereInput
    data: XOR<TeamMemberUpdateManyMutationInput, TeamMemberUncheckedUpdateManyWithoutTeamInput>
  }

  export type EntryUpsertWithWhereUniqueWithoutTeamInput = {
    where: EntryWhereUniqueInput
    update: XOR<EntryUpdateWithoutTeamInput, EntryUncheckedUpdateWithoutTeamInput>
    create: XOR<EntryCreateWithoutTeamInput, EntryUncheckedCreateWithoutTeamInput>
  }

  export type EntryUpdateWithWhereUniqueWithoutTeamInput = {
    where: EntryWhereUniqueInput
    data: XOR<EntryUpdateWithoutTeamInput, EntryUncheckedUpdateWithoutTeamInput>
  }

  export type EntryUpdateManyWithWhereWithoutTeamInput = {
    where: EntryScalarWhereInput
    data: XOR<EntryUpdateManyMutationInput, EntryUncheckedUpdateManyWithoutTeamInput>
  }

  export type TeamCreateWithoutMembersInput = {
    id?: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    event: EventCreateNestedOneWithoutTeamsInput
    club: ClubCreateNestedOneWithoutTeamsInput
    division: DivisionCreateNestedOneWithoutTeamsInput
    entries?: EntryCreateNestedManyWithoutTeamInput
  }

  export type TeamUncheckedCreateWithoutMembersInput = {
    id?: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: EntryUncheckedCreateNestedManyWithoutTeamInput
  }

  export type TeamCreateOrConnectWithoutMembersInput = {
    where: TeamWhereUniqueInput
    create: XOR<TeamCreateWithoutMembersInput, TeamUncheckedCreateWithoutMembersInput>
  }

  export type AthleteCreateWithoutTeamMembersInput = {
    id?: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club: ClubCreateNestedOneWithoutAthletesInput
    entries?: EntryCreateNestedManyWithoutAthleteInput
  }

  export type AthleteUncheckedCreateWithoutTeamMembersInput = {
    id?: string
    clubId: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: EntryUncheckedCreateNestedManyWithoutAthleteInput
  }

  export type AthleteCreateOrConnectWithoutTeamMembersInput = {
    where: AthleteWhereUniqueInput
    create: XOR<AthleteCreateWithoutTeamMembersInput, AthleteUncheckedCreateWithoutTeamMembersInput>
  }

  export type TeamUpsertWithoutMembersInput = {
    update: XOR<TeamUpdateWithoutMembersInput, TeamUncheckedUpdateWithoutMembersInput>
    create: XOR<TeamCreateWithoutMembersInput, TeamUncheckedCreateWithoutMembersInput>
    where?: TeamWhereInput
  }

  export type TeamUpdateToOneWithWhereWithoutMembersInput = {
    where?: TeamWhereInput
    data: XOR<TeamUpdateWithoutMembersInput, TeamUncheckedUpdateWithoutMembersInput>
  }

  export type TeamUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutTeamsNestedInput
    club?: ClubUpdateOneRequiredWithoutTeamsNestedInput
    division?: DivisionUpdateOneRequiredWithoutTeamsNestedInput
    entries?: EntryUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: EntryUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type AthleteUpsertWithoutTeamMembersInput = {
    update: XOR<AthleteUpdateWithoutTeamMembersInput, AthleteUncheckedUpdateWithoutTeamMembersInput>
    create: XOR<AthleteCreateWithoutTeamMembersInput, AthleteUncheckedCreateWithoutTeamMembersInput>
    where?: AthleteWhereInput
  }

  export type AthleteUpdateToOneWithWhereWithoutTeamMembersInput = {
    where?: AthleteWhereInput
    data: XOR<AthleteUpdateWithoutTeamMembersInput, AthleteUncheckedUpdateWithoutTeamMembersInput>
  }

  export type AthleteUpdateWithoutTeamMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutAthletesNestedInput
    entries?: EntryUpdateManyWithoutAthleteNestedInput
  }

  export type AthleteUncheckedUpdateWithoutTeamMembersInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: EntryUncheckedUpdateManyWithoutAthleteNestedInput
  }

  export type ClubCreateWithoutInvoicesInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutClubInput
    athletes?: AthleteCreateNestedManyWithoutClubInput
    teams?: TeamCreateNestedManyWithoutClubInput
    entries?: EntryCreateNestedManyWithoutClubInput
  }

  export type ClubUncheckedCreateWithoutInvoicesInput = {
    id?: string
    name: string
    region?: string | null
    contactName: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutClubInput
    athletes?: AthleteUncheckedCreateNestedManyWithoutClubInput
    teams?: TeamUncheckedCreateNestedManyWithoutClubInput
    entries?: EntryUncheckedCreateNestedManyWithoutClubInput
  }

  export type ClubCreateOrConnectWithoutInvoicesInput = {
    where: ClubWhereUniqueInput
    create: XOR<ClubCreateWithoutInvoicesInput, ClubUncheckedCreateWithoutInvoicesInput>
  }

  export type EventCreateWithoutInvoicesInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassCreateNestedManyWithoutEventInput
    entries?: EntryCreateNestedManyWithoutEventInput
    teams?: TeamCreateNestedManyWithoutEventInput
  }

  export type EventUncheckedCreateWithoutInvoicesInput = {
    id?: string
    name: string
    venue: string
    city: string
    country: string
    startDate: Date | string
    regOpen: Date | string
    regClose: Date | string
    configJson: string
    createdAt?: Date | string
    updatedAt?: Date | string
    divisions?: DivisionUncheckedCreateNestedManyWithoutEventInput
    weightClasses?: WeightClassUncheckedCreateNestedManyWithoutEventInput
    entries?: EntryUncheckedCreateNestedManyWithoutEventInput
    teams?: TeamUncheckedCreateNestedManyWithoutEventInput
  }

  export type EventCreateOrConnectWithoutInvoicesInput = {
    where: EventWhereUniqueInput
    create: XOR<EventCreateWithoutInvoicesInput, EventUncheckedCreateWithoutInvoicesInput>
  }

  export type ClubUpsertWithoutInvoicesInput = {
    update: XOR<ClubUpdateWithoutInvoicesInput, ClubUncheckedUpdateWithoutInvoicesInput>
    create: XOR<ClubCreateWithoutInvoicesInput, ClubUncheckedCreateWithoutInvoicesInput>
    where?: ClubWhereInput
  }

  export type ClubUpdateToOneWithWhereWithoutInvoicesInput = {
    where?: ClubWhereInput
    data: XOR<ClubUpdateWithoutInvoicesInput, ClubUncheckedUpdateWithoutInvoicesInput>
  }

  export type ClubUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutClubNestedInput
    athletes?: AthleteUpdateManyWithoutClubNestedInput
    teams?: TeamUpdateManyWithoutClubNestedInput
    entries?: EntryUpdateManyWithoutClubNestedInput
  }

  export type ClubUncheckedUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    contactName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutClubNestedInput
    athletes?: AthleteUncheckedUpdateManyWithoutClubNestedInput
    teams?: TeamUncheckedUpdateManyWithoutClubNestedInput
    entries?: EntryUncheckedUpdateManyWithoutClubNestedInput
  }

  export type EventUpsertWithoutInvoicesInput = {
    update: XOR<EventUpdateWithoutInvoicesInput, EventUncheckedUpdateWithoutInvoicesInput>
    create: XOR<EventCreateWithoutInvoicesInput, EventUncheckedCreateWithoutInvoicesInput>
    where?: EventWhereInput
  }

  export type EventUpdateToOneWithWhereWithoutInvoicesInput = {
    where?: EventWhereInput
    data: XOR<EventUpdateWithoutInvoicesInput, EventUncheckedUpdateWithoutInvoicesInput>
  }

  export type EventUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUpdateManyWithoutEventNestedInput
    entries?: EntryUpdateManyWithoutEventNestedInput
    teams?: TeamUpdateManyWithoutEventNestedInput
  }

  export type EventUncheckedUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    regOpen?: DateTimeFieldUpdateOperationsInput | Date | string
    regClose?: DateTimeFieldUpdateOperationsInput | Date | string
    configJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    divisions?: DivisionUncheckedUpdateManyWithoutEventNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutEventNestedInput
    entries?: EntryUncheckedUpdateManyWithoutEventNestedInput
    teams?: TeamUncheckedUpdateManyWithoutEventNestedInput
  }

  export type UserCreateWithoutAuditLogsInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    club?: ClubCreateNestedOneWithoutUsersInput
  }

  export type UserUncheckedCreateWithoutAuditLogsInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    clubId?: string | null
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserCreateOrConnectWithoutAuditLogsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
  }

  export type UserUpsertWithoutAuditLogsInput = {
    update: XOR<UserUpdateWithoutAuditLogsInput, UserUncheckedUpdateWithoutAuditLogsInput>
    create: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAuditLogsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAuditLogsInput, UserUncheckedUpdateWithoutAuditLogsInput>
  }

  export type UserUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneWithoutUsersNestedInput
  }

  export type UserUncheckedUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    clubId?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateManyUserInput = {
    id?: string
    entityType: string
    entityId: string
    action: string
    diffJson: string
    createdAt?: Date | string
  }

  export type AuditLogUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    entityType?: StringFieldUpdateOperationsInput | string
    entityId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    diffJson?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateManyClubInput = {
    id?: string
    name?: string | null
    email: string
    role: $Enums.Role
    passwordHash?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AthleteCreateManyClubInput = {
    id?: string
    firstName: string
    lastName: string
    dob: Date | string
    gender: $Enums.Gender
    nationality: string
    idType?: string | null
    idNumber?: string | null
    beltRank?: string | null
    weightKg?: number | null
    medicalNotes?: string | null
    emergencyName: string
    emergencyPhone: string
    guardianName?: string | null
    guardianPhone?: string | null
    photoUrl?: string | null
    waiverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamCreateManyClubInput = {
    id?: string
    eventId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryCreateManyClubInput = {
    id?: string
    eventId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceCreateManyClubInput = {
    id?: string
    eventId: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    AuditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    AuditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateManyWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AthleteUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: EntryUpdateManyWithoutAthleteNestedInput
    teamMembers?: TeamMemberUpdateManyWithoutAthleteNestedInput
  }

  export type AthleteUncheckedUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: EntryUncheckedUpdateManyWithoutAthleteNestedInput
    teamMembers?: TeamMemberUncheckedUpdateManyWithoutAthleteNestedInput
  }

  export type AthleteUncheckedUpdateManyWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    dob?: DateTimeFieldUpdateOperationsInput | Date | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    nationality?: StringFieldUpdateOperationsInput | string
    idType?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    beltRank?: NullableStringFieldUpdateOperationsInput | string | null
    weightKg?: NullableFloatFieldUpdateOperationsInput | number | null
    medicalNotes?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyName?: StringFieldUpdateOperationsInput | string
    emergencyPhone?: StringFieldUpdateOperationsInput | string
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    guardianPhone?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    waiverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutTeamsNestedInput
    division?: DivisionUpdateOneRequiredWithoutTeamsNestedInput
    members?: TeamMemberUpdateManyWithoutTeamNestedInput
    entries?: EntryUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: TeamMemberUncheckedUpdateManyWithoutTeamNestedInput
    entries?: EntryUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateManyWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutEntriesNestedInput
    athlete?: AthleteUpdateOneWithoutEntriesNestedInput
    team?: TeamUpdateOneWithoutEntriesNestedInput
    division?: DivisionUpdateOneRequiredWithoutEntriesNestedInput
    weightClass?: WeightClassUpdateOneWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutInvoicesNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateManyWithoutClubInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DivisionCreateManyEventInput = {
    id?: string
    key: string
    name: string
    minAge: number
    maxAge: number
    gender: $Enums.Gender
    notes?: string | null
  }

  export type WeightClassCreateManyEventInput = {
    id?: string
    divisionId?: string | null
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
  }

  export type EntryCreateManyEventInput = {
    id?: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamCreateManyEventInput = {
    id?: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    divisionId: string
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceCreateManyEventInput = {
    id?: string
    clubId: string
    totalCents: number
    status?: $Enums.InvoiceStatus
    pdfUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DivisionUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    entries?: EntryUpdateManyWithoutDivisionNestedInput
    teams?: TeamUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    entries?: EntryUncheckedUpdateManyWithoutDivisionNestedInput
    teams?: TeamUncheckedUpdateManyWithoutDivisionNestedInput
    weightClasses?: WeightClassUncheckedUpdateManyWithoutDivisionNestedInput
  }

  export type DivisionUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    minAge?: IntFieldUpdateOperationsInput | number
    maxAge?: IntFieldUpdateOperationsInput | number
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type WeightClassUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    division?: DivisionUpdateOneWithoutWeightClassesNestedInput
    entries?: EntryUpdateManyWithoutWeightClassNestedInput
  }

  export type WeightClassUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    divisionId?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    entries?: EntryUncheckedUpdateManyWithoutWeightClassNestedInput
  }

  export type WeightClassUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    divisionId?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
  }

  export type EntryUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutEntriesNestedInput
    athlete?: AthleteUpdateOneWithoutEntriesNestedInput
    team?: TeamUpdateOneWithoutEntriesNestedInput
    division?: DivisionUpdateOneRequiredWithoutEntriesNestedInput
    weightClass?: WeightClassUpdateOneWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutTeamsNestedInput
    division?: DivisionUpdateOneRequiredWithoutTeamsNestedInput
    members?: TeamMemberUpdateManyWithoutTeamNestedInput
    entries?: EntryUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: TeamMemberUncheckedUpdateManyWithoutTeamNestedInput
    entries?: EntryUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    club?: ClubUpdateOneRequiredWithoutInvoicesNestedInput
  }

  export type InvoiceUncheckedUpdateWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateManyWithoutEventInput = {
    id?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumInvoiceStatusFieldUpdateOperationsInput | $Enums.InvoiceStatus
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryCreateManyDivisionInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamCreateManyDivisionInput = {
    id?: string
    eventId: string
    clubId: string
    name: string
    teamType: $Enums.EntryType
    status?: $Enums.TeamStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WeightClassCreateManyDivisionInput = {
    id?: string
    eventId: string
    gender: $Enums.Gender
    name: string
    minKg?: number | null
    maxKg?: number | null
  }

  export type EntryUpdateWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutEntriesNestedInput
    club?: ClubUpdateOneRequiredWithoutEntriesNestedInput
    athlete?: AthleteUpdateOneWithoutEntriesNestedInput
    team?: TeamUpdateOneWithoutEntriesNestedInput
    weightClass?: WeightClassUpdateOneWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamUpdateWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutTeamsNestedInput
    club?: ClubUpdateOneRequiredWithoutTeamsNestedInput
    members?: TeamMemberUpdateManyWithoutTeamNestedInput
    entries?: EntryUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: TeamMemberUncheckedUpdateManyWithoutTeamNestedInput
    entries?: EntryUncheckedUpdateManyWithoutTeamNestedInput
  }

  export type TeamUncheckedUpdateManyWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    teamType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumTeamStatusFieldUpdateOperationsInput | $Enums.TeamStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WeightClassUpdateWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    event?: EventUpdateOneRequiredWithoutWeightClassesNestedInput
    entries?: EntryUpdateManyWithoutWeightClassNestedInput
  }

  export type WeightClassUncheckedUpdateWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
    entries?: EntryUncheckedUpdateManyWithoutWeightClassNestedInput
  }

  export type WeightClassUncheckedUpdateManyWithoutDivisionInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    gender?: EnumGenderFieldUpdateOperationsInput | $Enums.Gender
    name?: StringFieldUpdateOperationsInput | string
    minKg?: NullableFloatFieldUpdateOperationsInput | number | null
    maxKg?: NullableFloatFieldUpdateOperationsInput | number | null
  }

  export type EntryCreateManyWeightClassInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EntryUpdateWithoutWeightClassInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutEntriesNestedInput
    club?: ClubUpdateOneRequiredWithoutEntriesNestedInput
    athlete?: AthleteUpdateOneWithoutEntriesNestedInput
    team?: TeamUpdateOneWithoutEntriesNestedInput
    division?: DivisionUpdateOneRequiredWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateWithoutWeightClassInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyWithoutWeightClassInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryCreateManyAthleteInput = {
    id?: string
    eventId: string
    clubId: string
    teamId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamMemberCreateManyAthleteInput = {
    id?: string
    teamId: string
    isReserve?: boolean
  }

  export type EntryUpdateWithoutAthleteInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutEntriesNestedInput
    club?: ClubUpdateOneRequiredWithoutEntriesNestedInput
    team?: TeamUpdateOneWithoutEntriesNestedInput
    division?: DivisionUpdateOneRequiredWithoutEntriesNestedInput
    weightClass?: WeightClassUpdateOneWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateWithoutAthleteInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyWithoutAthleteInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    teamId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TeamMemberUpdateWithoutAthleteInput = {
    id?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
    team?: TeamUpdateOneRequiredWithoutMembersNestedInput
  }

  export type TeamMemberUncheckedUpdateWithoutAthleteInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type TeamMemberUncheckedUpdateManyWithoutAthleteInput = {
    id?: StringFieldUpdateOperationsInput | string
    teamId?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type TeamMemberCreateManyTeamInput = {
    id?: string
    athleteId: string
    isReserve?: boolean
  }

  export type EntryCreateManyTeamInput = {
    id?: string
    eventId: string
    clubId: string
    athleteId?: string | null
    entryType: $Enums.EntryType
    divisionId: string
    weightClassId?: string | null
    status?: $Enums.EntryStatus
    feeCents?: number
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TeamMemberUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
    athlete?: AthleteUpdateOneRequiredWithoutTeamMembersNestedInput
  }

  export type TeamMemberUncheckedUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    athleteId?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type TeamMemberUncheckedUpdateManyWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    athleteId?: StringFieldUpdateOperationsInput | string
    isReserve?: BoolFieldUpdateOperationsInput | boolean
  }

  export type EntryUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    event?: EventUpdateOneRequiredWithoutEntriesNestedInput
    club?: ClubUpdateOneRequiredWithoutEntriesNestedInput
    athlete?: AthleteUpdateOneWithoutEntriesNestedInput
    division?: DivisionUpdateOneRequiredWithoutEntriesNestedInput
    weightClass?: WeightClassUpdateOneWithoutEntriesNestedInput
  }

  export type EntryUncheckedUpdateWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EntryUncheckedUpdateManyWithoutTeamInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    clubId?: StringFieldUpdateOperationsInput | string
    athleteId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumEntryTypeFieldUpdateOperationsInput | $Enums.EntryType
    divisionId?: StringFieldUpdateOperationsInput | string
    weightClassId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumEntryStatusFieldUpdateOperationsInput | $Enums.EntryStatus
    feeCents?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}