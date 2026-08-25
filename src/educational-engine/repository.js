export class CurriculumRepository {
  async createVersion() { throw new Error('Not implemented'); }
  async getVersion() { throw new Error('Not implemented'); }
  async listVersions() { throw new Error('Not implemented'); }
  async setEvaluation() { throw new Error('Not implemented'); }
  async approveVersion() { throw new Error('Not implemented'); }
  async rollback() { throw new Error('Not implemented'); }
}

// Production adapters should implement this contract with PostgreSQL/SQLite.
// Keeping the engine independent from storage makes persistence testable and replaceable.
