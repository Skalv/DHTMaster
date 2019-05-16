'use strict'

const Schema = use('Schema')

class DhtDataSchema extends Schema {
  up () {
    this.create('dht_data', (table) => {
      table.increments()
      table.timestamps()
      table.integer('sensor_uid').notNullable()
      table.enu('type', ["temperature", "humidity"])
      table.float('value').notNullable()
    })
  }

  down () {
    this.drop('dht_data')
  }
}

module.exports = DhtDataSchema