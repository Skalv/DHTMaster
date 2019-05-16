'use strict'

const MQTTProv = use('GP/MQTT')
const Device = use('App/Models/Device')

const _ = require('lodash')

class DHTManager {
  constructor() {
    MQTTProv.subscribe('DHTMaster/helloGP', this.newSensor)

    this.subscribeAll()
  }

  async newSensor (payload) {
    try {
      let msg = JSON.parse(payload)

      let device = await Device.findOrCreate(
        {macAddress: msg.macAddress},
        {
          macAddress: msg.macAddress,
          type: msg.type,
          uid: msg.uid
        }
      )

      if (device.uid !== msg.uid) {
        device.uid = msg.uid
        await device.save()
      }

      MQTTProv.publish(`DHTMaster/${device.uid}`, JSON.stringify({
        action: "boardSynchro",
        state: "ok",
        uid: device.uid
      }))

      MQTTProv.subscribe(`DHTMaster/${device.uid}`, this.newMessage)
        

    } catch (e) {
      console.error(e)
    }
  }

  async newMessage(payload, topic) {
    let sensoruid = _.split(topic, '/')
    sensoruid = sensoruid[1]
    console.log(sensoruid)
    try {
      let msg = JSON.parse(payload)

      let sensor = await Device.findBy({uid: sensoruid})
      let temperature = msg.temperature
      let humidity = msg.humidity


      await Database
        .table('dht_data')
        .insert(
          {sensor_uid: sensoruid ,type: "temperature", value: temperature},
          {sensor_uid: sensoruid ,type: "humidity", value: humidity}
        )

    } catch(e) {
      console.error(e)
    }
  }
  
  async subscribeAll() {
    const sensors = await Device
      .query()
      .where('type', 'dht')
      .fetch()

    _.each(sensors.rows, (sensor) => {
      MQTTProv.subscribe(`DHTMaster/${sensor.uid}`, this.newMessage)
    })
  }

  getTriggers () {
    return [
      {
        name: "New temperature value",
        fields: ["sensor_uid"]
      },
      {
        name: "New humidity value",
        fields: ["sensor_uid"]
      }
    ]
  }

  getActions () {
    return []
  }
}

module.exports = DHTManager