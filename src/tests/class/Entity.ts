import { Column, CoreEntity, Entity } from '@grandlinex/core';

@Entity('Entity01')
// eslint-disable-next-line import/prefer-default-export
export class Entity01 extends CoreEntity {
  @Column({
    dataType: 'string',
  })
  title: string;

  constructor() {
    super();
    this.title = '';
  }
}
