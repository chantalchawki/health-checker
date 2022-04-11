import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, BaseEntity, AfterInsert, AfterRemove } from "typeorm"
import { User } from "./user";
import { History } from "./history";

export enum Protocol {
    HTTP = "http",
    HTTPS = "https",
    TCP = "tcp"
}

@Entity()
export class Check extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column()
    public name!: string

    @Column()
    public url!: string

    @Column({
        type: "enum",
        enum: Protocol,
        default: Protocol.HTTPS,
    })
    public protocol!: Protocol

    @Column({ nullable: true })
    public path?: string

    @Column({ nullable: true })
    public port?: number

    @Column({ nullable: true })
    public webhook?: string

    @Column({ default: ""})
    public tags?: string

    @Column({ default: 5})
    public timeout?: number

    @Column({ default: 10})
    public interval?: number

    @Column({ default: 1})
    public threshold?: number

    @Column({ nullable: true })
    public username?: string

    @Column({ nullable: true })
    public password?: string

    @Column({ nullable: true })
    public httpHeaders?: string
    
    @Column({ nullable: true })
    public statusCode?: string

    @Column({ nullable: true })
    public ignoreSSL?: boolean

    @Column({ default: 0 })
    public outages?: number

    @ManyToOne(() => User, (user) => user.checks)
    public user!: User

    @OneToMany(() => History, (history) => history.check)
    public histories!: History[]
}