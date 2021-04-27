export interface IAppConfig {
  cookies: {
    maxAge: number;
  };
  domain: string;
  prop: "value";
}

export interface IJwtConfig {
  publicKey: string;
}
