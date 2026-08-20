import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('messages')
  @ApiOperation({
    summary: 'Send a message and stream the assistant reply',
    description:
      'Server-Sent Events over POST. See CONTRACT.md for the event protocol.',
  })
  async create(
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.messagesService.createMessageAndStream(
      conversationId,
      user.id,
      dto,
      req,
      res,
    );
  }

  @Post('regenerate')
  @ApiOperation({
    summary: 'Regenerate the assistant reply to the last user message',
    description: 'Same SSE protocol as POST .../messages, no request body.',
  })
  async regenerate(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.messagesService.regenerateAndStream(
      conversationId,
      user.id,
      req,
      res,
    );
  }
}
