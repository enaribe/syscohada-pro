import { createTRPCRouter } from './context'
import { balanceRouter } from './routers/balance'
import { clotureRouter } from './routers/cloture'
import { coffreRouter } from './routers/coffre'
import { dashboardRouter } from './routers/dashboard'
import { entrepriseRouter } from './routers/entreprise'
import { etatsRouter } from './routers/etats'
import { exercicesRouter } from './routers/exercices'
import { grandLivreRouter } from './routers/grand-livre'
import { iaRouter } from './routers/ia'
import { immobilisationsRouter } from './routers/immobilisations'
import { journalRouter } from './routers/journal'
import { liasseRouter } from './routers/liasse'
import { rapprochementRouter } from './routers/rapprochement'
import { recurrentesRouter } from './routers/recurrentes'
import { relancesRouter } from './routers/relances'
import { tresorerieRouter } from './routers/tresorerie'
import { usersRouter } from './routers/users'

export const appRouter = createTRPCRouter({
  exercices: exercicesRouter,
  journal: journalRouter,
  balance: balanceRouter,
  grandLivre: grandLivreRouter,
  dashboard: dashboardRouter,
  ia: iaRouter,
  immobilisations: immobilisationsRouter,
  tresorerie: tresorerieRouter,
  rapprochement: rapprochementRouter,
  recurrentes: recurrentesRouter,
  etats: etatsRouter,
  liasse: liasseRouter,
  cloture: clotureRouter,
  relances: relancesRouter,
  coffre: coffreRouter,
  entreprise: entrepriseRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
