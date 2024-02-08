import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, In, Not, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ContactEntity } from "./contact.entity";

@Injectable()
export class AppService {

  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepository: Repository<ContactEntity>
  ) {
  }

  getHello(): string {
    return "Hello World!";
  }

  async findOneByEmailOrPhoneNumber(phoneNumber: string, email: string) {
    const whereClause: FindOptionsWhere<ContactEntity>[] = [];
    if (phoneNumber != null) {
      whereClause.push({ phoneNumber: phoneNumber });
    }
    if (email != null) {
      whereClause.push({ email: email });
    }
    return await this.contactRepository.findOne({ where: whereClause, order: { createdAt: "asc" } });
  }

  async findContactById(id: number) {
    return await this.contactRepository.findOne({
      where: { id: id }
    });
  }

  async createNewContact(email: string, phoneNumber: string, linkedId: number) {
    const contact = new ContactEntity(phoneNumber, email, linkedId, linkedId == null ? "primary" : "secondary");
    return await this.contactRepository.save(contact);
  }

  async getContactsByLinkedId(id: number) {
    return await this.contactRepository.find({ where: { linkedId: id } });
  }

  async findAllByEmail(email: string) {
    if (email == null) {
      return null;
    }
    return await this.contactRepository.find({ where: { email: email }, order: { createdAt: "asc" } });
  }

  async findAllByPhoneNumber(phoneNumber: string) {
    if (phoneNumber == null) {
      return null;
    }
    return await this.contactRepository.find({ where: { phoneNumber: phoneNumber }, order: { createdAt: "asc" } });
  }

  async saveContactsBulk(contactList: ContactEntity[]) {
    return await this.contactRepository.save(contactList);
  }

  async getContactsByLinkedIdAndNotIds(ids: number[]) {
    if (ids == null || ids.length == 0) {
      return [];
    }
    return await this.contactRepository.find({ where: { linkedId: In(ids) } });
  }

  async getContactsByIds(ids: number[]) {
    if (ids == null || ids.length == 0) {
      return [];
    }
    return await this.contactRepository.find({ where: { id: In(ids) } });
  }
}
