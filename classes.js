class Building {
    constructor(name, code, lat, lon) {
        this.code = code
        this.name = name
        this.lat = lat
        this.lon = lon
        this.roomArray
    }
}
class Room {
    constructor(number, description) {
        this.number = number
        this.description = description
        this.scheduleArray
        this.weekScheduleArray = []
        this.freeTime = []
    }
}

class Course {
    constructor(name, id, studName, building, room, startTime, endTime, online, days) {
        this.name = name
        this.id = id
        this.studName = studName
        this.building = building
        this.room = room
        this.startTime = startTime
        this.endTime = endTime
        this.online = online;
        this.days = days
    }
}

class WeekCourse {
    constructor(name, building, room, startTime, endTime) {
        this.name = name
        this.building = building
        this.room = room
        this.startTime = startTime
        this.endTime = endTime
    }
}

class FreeRoom {
    constructor(number, time) {
        this.name = number
        this.Room_Number = number
        this.Available_Until = time
    }
}

class Week {
    constructor(){
        this.Monday = []
        this.Tuesday = []
        this.Wednesday = []
        this.Thursday = []
        this.Friday = []
        this.Saturday = []
        this.Sunday = []
    }
}
//Export Classes
module.exports = {Building, Room, Course, FreeRoom, Week, WeekCourse}





