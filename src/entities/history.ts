import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from "typeorm";
import { Check } from "./check";

@Entity()
export class History extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column()
    public timestamp!: string

    @Column()
    public status!: string

    @Column()
    public responseTime!: number

    @ManyToOne(() => Check, (check) => check.histories, {
        onDelete: "CASCADE"
    })
    public check!: Check
}