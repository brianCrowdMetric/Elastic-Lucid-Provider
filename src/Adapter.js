module.exports = {
    type: 'analytics',

    setClient(client) {
        this.client = client
    },

    async indexExists(index) {
        return await this.client.indices.exists({index})
    },

    async createIndex(index) {
        return await this.client.indices.create({index})
    },

    async runMapping(index, body) {
        let properties = Object.keys(body.properties)
        for(let property of properties) {
            if(typeof body.properties[property] === 'string') {
                body.properties[property] = {type: body.properties[property]}
            }
        }
        return await this.client.indices.putMapping({
            index,
            type: this.type,
            body: JSON.stringify(body)
        })
    },

    async runSettings(index, body) {
        return await this.client.indices.putSettings({
            index,
            body: JSON.stringify(body)
        })
    },

    async createOrUpdate(index, body, id) {
        return await this.client.index({
            index,
            type: this.type,
            body,
            id
        })
    },

    async getSingle(index, id) {
        return await this.client.get({
            index,
            type: this.type,
            id
        });
    },

    async search(index, body) {
        let response = await this.client.search({
            index,
            body
        })
        return response
    }
}
