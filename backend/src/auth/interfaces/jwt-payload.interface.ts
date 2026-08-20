export interface JwtPayload {
  sub: string;
  email: string;
}

export interface RefreshJwtUser extends JwtPayload {
  refreshToken: string;
}
