import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { FavoritesService } from './favorite.service';
import { TracksService } from '../track/track.service';
import { ArtistsService } from '../artist/artist.service';
import { AlbumsService } from '../album/album.service';
import { albumIdSchema } from '../../dto/album';
import { artistIdSchema } from '../../dto/artist';
import { trackIdSchema } from '../../dto/track';
import { InstanceForFavoriteNotFoundException } from '../../exceptions/instance-for-favorite-not-found.exception';
import { InstanceNotFavoriteException } from '../../exceptions/instance-not-favorite.exception';
import ZodValidationPipe from '../../pipes/zod-validation.pipe';
import { Favorites } from '../../dto/favorites';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetAllDataResponse } from '../../decorators/ApiGetAllDataResponse';
import { ApiAddItemToFavorites } from '../../decorators/ApiAddItemToFavorites';
import { ApiDelItemFromFavorites } from '../../decorators/ApiDelItemFromFavorites';

@ApiTags('favs')
@Controller('favs')
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly tracksService: TracksService,
    private readonly albumsService: AlbumsService,
    private readonly artistsService: ArtistsService,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  @HttpCode(200)
  @ApiGetAllDataResponse(
    Favorites,
    ['Favorites'],
    'favorites',
    ' movies, tracks and books',
  )
  async getAllFavorites(): Promise<Favorites> {
    return await this.favoritesService.getAllFavorites();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('album/:id')
  @HttpCode(201)
  @ApiAddItemToFavorites(['Favorites'], 'album')
  async addAlbum(
    @Param('id', new ZodValidationPipe(albumIdSchema)) id: string,
  ) {
    if (!(await this.albumsService.getAlbum(id)))
      throw new InstanceForFavoriteNotFoundException(`album with id = ${id}`);
    await this.favoritesService.addAlbumToFavorites(id);
    return 'Album added to favorites';
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('artist/:id')
  @HttpCode(201)
  @ApiAddItemToFavorites(['Favorites'], 'artist')
  async addArtist(
    @Param('id', new ZodValidationPipe(artistIdSchema)) id: string,
  ) {
    if (!(await this.artistsService.getArtist(id)))
      throw new InstanceForFavoriteNotFoundException(`artist with id = ${id}`);
    await this.favoritesService.addArtistToFavorites(id);
    return 'Artist added to favorites';
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('track/:id')
  @HttpCode(201)
  @ApiAddItemToFavorites(['Favorites'], 'track')
  async addTrack(
    @Param('id', new ZodValidationPipe(trackIdSchema)) id: string,
  ) {
    if (!(await this.tracksService.getTrack(id)))
      throw new InstanceForFavoriteNotFoundException(`track with id = ${id}`);
    await this.favoritesService.addTrackToFavorites(id);
    return 'Track added to favorites';
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete('album/:id')
  @HttpCode(204)
  @ApiDelItemFromFavorites(['Favorites'], 'album')
  async deleteAlbum(
    @Param('id', new ZodValidationPipe(albumIdSchema)) id: string,
  ) {
    const deleteResult: boolean =
      await this.favoritesService.deleteAlbumFromFavorites(id);
    if (!deleteResult)
      throw new InstanceNotFavoriteException(`album with id = ${id}`);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete('artist/:id')
  @HttpCode(204)
  @ApiDelItemFromFavorites(['Favorites'], 'artist')
  async deleteArtist(
    @Param('id', new ZodValidationPipe(artistIdSchema)) id: string,
  ) {
    const deleteResult: boolean =
      await this.favoritesService.deleteArtistFromFavorites(id);
    if (!deleteResult)
      throw new InstanceNotFavoriteException(`artist with id = ${id}`);
  }

  @ApiDelItemFromFavorites(['Favorites'], 'track')
  @UseInterceptors(ClassSerializerInterceptor)
  @Delete('track/:id')
  @HttpCode(204)
  @ApiDelItemFromFavorites(['Favorites'], 'track')
  async deleteTrack(
    @Param('id', new ZodValidationPipe(trackIdSchema)) id: string,
  ) {
    const deleteResult: boolean =
      await this.favoritesService.deleteTrackFromFavorites(id);
    if (!deleteResult)
      throw new InstanceNotFavoriteException(`track with id = ${id}`);
  }
}
