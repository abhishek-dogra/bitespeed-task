export class IdentityResponse {
  contact: ContactDetails = new ContactDetails();
}

export class ContactDetails {
  primaryContatctId: number = null;
  emails: string[] = []; // first element being email of primary contact
  phoneNumbers: string[] = []; // first element being phoneNumber of primary contact
  secondaryContactIds: number[] = []; // Array of all Contact IDs that are "secondary" to the primary contact
}
