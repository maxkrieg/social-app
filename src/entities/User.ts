import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {

  @Field(() => ID)
  @PrimaryKey()
  id!: number

  @Field()
  @Property({ type: 'text', unique: true })
  email!: string;

  @Property()
  password!: string;

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date()

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date()
}