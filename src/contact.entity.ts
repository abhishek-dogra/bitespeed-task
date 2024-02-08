import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("contact", { schema: "bitespeed_task" })
export class ContactEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "phone_number" })
  phoneNumber: string;

  @Column({ name: "email" })
  email: string;

  @Column({ name: "linked_id" })
  linkedId: number;

  @Column({ name: "link_precedence" })
  linkPrecedence: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "deleted_at" })
  deletedAt: Date;

  constructor(phoneNumber: string, email: string, linkedId: number, linkPrecedence: string) {
    this.phoneNumber = phoneNumber;
    this.email = email;
    this.linkedId = linkedId;
    this.linkPrecedence = linkPrecedence;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
