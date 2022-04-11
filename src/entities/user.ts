import { Entity, Column, PrimaryGeneratedColumn, OneToMany, BaseEntity } from "typeorm";
import { Check } from "./check";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column()
    public email!: string

    @Column()
    public password!: string

    @OneToMany(() => Check, (check) => check.user)
    public checks!: Check[]
}