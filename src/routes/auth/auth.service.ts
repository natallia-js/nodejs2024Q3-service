import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/user.service';
import { CreateUserDto, User, AuthUserDto, RefreshTokenDto } from '../../dto/user';
import { UserWithLoginAndPasswordNotFoundException } from '../../exceptions/user-with-login-and-password-not-found.exception';
import { Tokens } from '../../dto/tokens';
import { NoRefreshTokenException } from '../../exceptions/no-refresh-token.exception';
import { PayloadDto } from '../../dto/payload';
import { InvalidRefreshTokenException } from '../../exceptions/invalid-refresh-token.exception';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async calcPasswordHash(password: string): Promise<string> {
    return await bcrypt.hash(password, Number(this.configService.get('CRYPT_SALT') || '10'));
  }

  async signup(createUserDto: CreateUserDto): Promise<User> {
    const passwordHash = await this.calcPasswordHash(createUserDto.password);
    return await this.usersService.addUser({ login: createUserDto.login, password: passwordHash });
  }

  async getUserByAuthData({ login, password }: { login: string, password: string }): Promise<User | null> {
    const passwordHash = await this.calcPasswordHash(password);
    return await this.usersService.getUserByAuthData({ login, password: passwordHash });
  }

  async login(authUserDto: AuthUserDto): Promise<Tokens> {
    const user = await this.getUserByAuthData(authUserDto);
    if (!user)
      throw new UserWithLoginAndPasswordNotFoundException(authUserDto.login);
    const payload = { userId: user.id, login: user.login };
    return await this.getNewTokens(payload);
  }
  
  async refresh(refreshTokenDto: RefreshTokenDto): Promise<Tokens> {
    if (!refreshTokenDto?.refreshToken)
      throw new NoRefreshTokenException();

    try {
      const { userId, login }: PayloadDto = this.jwtService.verify(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.get('JWT_SECRET_REFRESH_KEY'),
        },
      );
      const tokens = await this.getNewTokens({ userId, login });
      return new Tokens(tokens);
    } catch {
      throw new InvalidRefreshTokenException();
    }
  }

  async getNewTokens(payload: PayloadDto): Promise<Tokens> {
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET_KEY'),
        expiresIn: this.configService.get('TOKEN_EXPIRE_TIME'),
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET_REFRESH_KEY'),
        expiresIn: this.configService.get('TOKEN_REFRESH_EXPIRE_TIME'),
      }),
    };
  }
}