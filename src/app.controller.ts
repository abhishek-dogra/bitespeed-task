import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post } from "@nestjs/common";
import { AppService } from "./app.service";
import { IdentityDto } from "./dtos/Identity.dto";
import { IdentityResponse } from "./dtos/Identity.response";
import { ContactEntity } from "./contact.entity";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("identify")
  @HttpCode(HttpStatus.OK)
  async identify(@Body() identityRequest: IdentityDto): Promise<IdentityResponse> {
    if (identityRequest.email == null && identityRequest.phoneNumber == null) {
      throw new HttpException(
        { message: "Please provide phone number or email." },
        HttpStatus.BAD_REQUEST
      );
    }
    if (identityRequest.email === "") {
      throw new HttpException(
        { message: "Incorrect email format." },
        HttpStatus.BAD_REQUEST
      );
    }
    if (identityRequest.phoneNumber === "") {
      throw new HttpException(
        { message: "Incorrect phone number format." },
        HttpStatus.BAD_REQUEST
      );
    }
    const emailMatchingContacts: ContactEntity[] = await this.appService.findAllByEmail(identityRequest.email);
    const phoneMatchingContacts: ContactEntity[] = await this.appService.findAllByPhoneNumber(identityRequest.phoneNumber);
    await this.checkAndCreateNewContact(identityRequest.phoneNumber, identityRequest.email, emailMatchingContacts, phoneMatchingContacts);
    let primaryContact: ContactEntity = await this.getPrimaryContact(identityRequest.email, identityRequest.phoneNumber);
    primaryContact = await this.checkAndLinkContacts(emailMatchingContacts, phoneMatchingContacts, primaryContact);
    return this.buildIdentifyResponse(primaryContact);
  }

  private async buildIdentifyResponse(primaryContact: ContactEntity) {
    const linkedContacts = await this.appService.getContactsByLinkedId(primaryContact.id);
    const emailSet = new Set<string>();
    const phoneSet = new Set<string>();
    const secondaryIdSet = new Set<number>();
    for (const contact of linkedContacts) {
      if (contact.email !== null) {
        emailSet.add(contact.email);
      }
      if (contact.phoneNumber !== null) {
        phoneSet.add(contact.phoneNumber);
      }
      secondaryIdSet.add(contact.id);
    }
    if (primaryContact.email != null) {
      emailSet.delete(primaryContact.email);
    }
    if (primaryContact.phoneNumber != null) {
      phoneSet.delete(primaryContact.phoneNumber);
    }
    const phoneList = ((primaryContact.phoneNumber) ? [primaryContact.phoneNumber] : []).concat([...phoneSet.values()]);
    const emailList = ((primaryContact.email) ? [primaryContact.email] : []).concat([...emailSet.values()]);
    const secondaryIds = [...secondaryIdSet.values()];
    const response = new IdentityResponse();
    response.contact.primaryContatctId = primaryContact.id;
    response.contact.emails = emailList;
    response.contact.phoneNumbers = phoneList;
    response.contact.secondaryContactIds = secondaryIds;
    return response;
  }

  private async checkAndCreateNewContact(phoneNumber: string, email: string, emailMatchingContacts: ContactEntity[], phoneMatchingContacts: ContactEntity[]) {
    if (emailMatchingContacts != null && phoneMatchingContacts != null) {
      if (emailMatchingContacts.length > 0 && phoneMatchingContacts.length > 0) {
        return;
      }
      if (emailMatchingContacts.length == 0 && phoneMatchingContacts.length == 0) {
        await this.appService.createNewContact(email, phoneNumber, null);
        return;
      }
      let linkedId = this.getLinkedIdFromLists(emailMatchingContacts, phoneMatchingContacts);
      await this.appService.createNewContact(email, phoneNumber, linkedId);
    } else if (emailMatchingContacts != null) {
      if (emailMatchingContacts.length == 0) {
        await this.appService.createNewContact(email, phoneNumber, null);
        return;
      }
    } else if (phoneMatchingContacts != null) {
      if (phoneMatchingContacts.length == 0) {
        await this.appService.createNewContact(email, phoneNumber, null);
        return;
      }
    }
  }

  private getLinkedIdFromLists(emailMatchingContacts: ContactEntity[], phoneMatchingContacts: ContactEntity[]) {
    const checkingList = (emailMatchingContacts.length > 0) ? emailMatchingContacts : phoneMatchingContacts;
    if (checkingList.at(0).linkPrecedence == "primary") {
      return checkingList.at(0).id;
    }
    return checkingList.at(0).linkedId;
  }

  private async checkAndLinkContacts(emailMatchingContacts: ContactEntity[], phoneMatchingContacts: ContactEntity[], primaryContact: ContactEntity) {
    const updatedContactList = [];
    const linkedIdsSet = new Set<number>();
    const idsSet = new Set<number>();
    const ignoreIdSet = [];
    if (emailMatchingContacts !== null) {
      for (const contact of emailMatchingContacts) {
        if (contact.id !== primaryContact.id) {
          if (contact.linkedId != null && contact.linkedId !== primaryContact.id) {
            linkedIdsSet.add(contact.linkedId);
            idsSet.add(contact.linkedId);
          }
          idsSet.add(contact.id);
          linkedIdsSet.add(contact.id);
        }
      }
    }
    if (phoneMatchingContacts !== null) {
      for (const contact of phoneMatchingContacts) {
        if (contact.id !== primaryContact.id) {
          if (contact.linkedId != null && contact.linkedId !== primaryContact.id) {
            linkedIdsSet.add(contact.linkedId);
            idsSet.add(contact.linkedId);
          }
          idsSet.add(contact.id);
          linkedIdsSet.add(contact.id);
        }
      }
    }
    let linkedContacts: ContactEntity[] = [];
    if (linkedIdsSet.size > 0) {
      linkedContacts = await this.appService.getContactsByLinkedIdAndNotIds([...linkedIdsSet.values()]);
    }
    let parentContacts: ContactEntity[] = [];
    if (idsSet.size > 0) {
      parentContacts = await this.appService.getContactsByIds([...idsSet.values()]);
    }
    if (linkedContacts.length > 0 && linkedContacts.at(0).id < primaryContact.id && linkedContacts.at(0).linkPrecedence === "primary") {
      const temp = linkedContacts.shift();
      linkedContacts.unshift(primaryContact);
      primaryContact = temp;
    }
    if (parentContacts.length > 0 && parentContacts.at(0).id < primaryContact.id && parentContacts.at(0).linkPrecedence === "primary") {
      const temp = parentContacts.shift();
      parentContacts.unshift(primaryContact);
      primaryContact = temp;
    }
    for (const contact of linkedContacts) {
      contact.linkedId = primaryContact.id;
      contact.linkPrecedence = "secondary";
      updatedContactList.push(contact);
    }
    for (const contact of parentContacts) {
      contact.linkedId = primaryContact.id;
      contact.linkPrecedence = "secondary";
      updatedContactList.push(contact);
    }
    await this.appService.saveContactsBulk(updatedContactList);
    return primaryContact;
  }

  private async getPrimaryContact(email: string, phoneNumber: string) {
    const contact = await this.appService.findOneByEmailOrPhoneNumber(phoneNumber, email);
    let primaryContact: ContactEntity;
    if (contact.linkPrecedence === "primary") {
      primaryContact = contact;
    } else {
      primaryContact = await this.appService.findContactById(contact.linkedId);
    }
    return primaryContact;
  }
}
