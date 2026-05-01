const prisma = require('../config/db');

class BaseRepository {
    constructor(model) {
        this.model = prisma[model];
    }

    async findAll(params = {}) {
        return await this.model.findMany(params);
    }

    async findById(id, idField = 'id') {
        return await this.model.findUnique({
            where: { [idField]: id }
        });
    }

    async create(data) {
        return await this.model.create({ data });
    }

    async update(id, data, idField = 'id') {
        return await this.model.update({
            where: { [idField]: id },
            data
        });
    }

    async delete(id, idField = 'id') {
        return await this.model.delete({
            where: { [idField]: id }
        });
    }
}

module.exports = BaseRepository;
