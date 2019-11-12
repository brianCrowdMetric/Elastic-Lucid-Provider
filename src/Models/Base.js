const adapter = require('../Adapter')
const bodybuilder = require('bodybuilder')
const extendBuilder = require('../ExtendBuilder')
const BaseSerializer = require('../Serializers/Base')

class ElasticBaseModel {
    constructor(body, id) {
        this.id = id
        this.body = body
        this.adapter = adapter
    }

    static get createdAtField() {
        return 'createdAt'
    }

    static async create(body, id) {
        if(this.createdAtField) {
            body[this.createdAtField] = new Date()
        }
        let obj = new this(body, id)
        let response = await obj.save()
        obj.id = response._id
        return obj
    }

    static all() {
        return this.query().fetch()
    }

    static async find(id) {
        try {
            return await this.findOrFail(id)
        } catch (e) {
            return undefined
        }
    }

    static async findOrFail(id) {
        let response = await adapter.getSingle(this.index, id)
        return new this(response._source, response._id)
    }

    async save() {
        return await adapter.createOrUpdate(this.constructor.index, this.body, this.id)
    }
    
    async delete() {
        return await adapter.deleteSingle(this.constructor.index, this.id)
    }
    
    toJSON() {
        const Serializer = this.constructor.resolveSerializer()
        const serializer = new Serializer([this], null, {isOne: true})
        return serializer.toJSON()
    }

    static async raw(query) {
        let response = await adapter.search(this.index, query)
        return this.responseToObject(response)
    }

    static async rawMany(queries) {
        let results = await adapter.multiSearch(this.index, queries)
        return results.map(result => this.responseToObject(result))
    }

    static query() {
        return extendBuilder(bodybuilder(), this)
    }
    
    static get Serializer() {
        return BaseSerializer
    }
    
    static resolveSerializer() {
        if(typeof this.Serializer === 'string') {
            return use(this.Serializer)
        } else {
            return this.Serializer
        }
    }

    static responseToObject(response, pagination) {
        const rows = response.hits.hits.map(hit => new this(hit._source, hit._id))
        const Serializer = this.resolveSerializer()
        return new Serializer(rows, response.aggregations, pagination)
    }

    static async bulkAction(bulkBody, ...pluckFields) {
        return await adapter.bulkAction(this.index, bulkBody, pluckFields)
    }
}

module.exports = ElasticBaseModel
