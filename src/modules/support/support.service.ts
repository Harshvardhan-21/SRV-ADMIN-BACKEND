import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../../database/entities/support-ticket.entity';
import { SupportTicketStatus, SupportTicketPriority } from '../../common/enums';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private supportTicketRepository: Repository<SupportTicket>,
  ) {}

  async getTickets(
    page: number = 1,
    limit: number = 20,
    status?: SupportTicketStatus,
    priority?: SupportTicketPriority,
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.supportTicketRepository.createQueryBuilder('ticket');

    if (status) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }

    queryBuilder
      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTicket(id: string) {
    const ticket = await this.supportTicketRepository.findOne({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async respond(id: string, response: string, adminId: string) {
    const ticket = await this.getTicket(id);

    await this.supportTicketRepository.update(id, {
      response,
      assignedTo: adminId,
      status: SupportTicketStatus.IN_PROGRESS,
    });

    return this.getTicket(id);
  }

  async updateStatus(id: string, status: SupportTicketStatus, adminId: string) {
    const ticket = await this.getTicket(id);

    await this.supportTicketRepository.update(id, {
      status,
      assignedTo: adminId,
    });

    return this.getTicket(id);
  }
}