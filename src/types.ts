import { Connection, EntityManager, IDatabaseDriver } from "mikro-orm";

export type RequestContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
}