import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { ConversationDetailDto } from './dto/conversation-detail.dto';
import {
  ConversationSummaryDto,
  PaginatedConversationsDto,
} from './dto/conversation-summary.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedConversationsDto })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListConversationsQueryDto,
  ): Promise<PaginatedConversationsDto> {
    return this.conversationsService.list(user.id, query);
  }

  @Post()
  @ApiCreatedResponse({ type: ConversationSummaryDto })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationSummaryDto> {
    return this.conversationsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: ConversationDetailDto })
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.findOneDetailed(user.id, id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ConversationSummaryDto })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ConversationSummaryDto> {
    return this.conversationsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.conversationsService.remove(user.id, id);
  }
}
