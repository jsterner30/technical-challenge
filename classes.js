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
        this.online = online
        this.days = days
    }
}

class WeekCourse {
    constructor(name, building, room, startTime, endTime, online, startTimeSecs) {
        this.name = name
        this.building = building
        this.room = room
        this.startTime = startTime
        this.timeSecs = startTimeSecs
        this.endTime = endTime
        this.online = online
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
    constructor() {
        this.Monday = []
        this.Tuesday = []
        this.Wednesday = []
        this.Thursday = []
        this.Friday = []
        this.Saturday = []
        this.Sunday = []
    }

    /**
     * Sorts week so that earliest times are printed first
     */
    sorter() {
        this.Monday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
        this.Tuesday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
        this.Wednesday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
        this.Thursday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
        this.Friday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
        this.Saturday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
        this.Sunday.sort((a, b) => parseFloat(a.timeSecs) - parseFloat(b.timeSecs))
    }

    /**
     * Returns a day array based on position in week
     * @param number Position in week
     * @returns {[]} Day array
     */
    at(number) {
        switch (number) {
            case 0:
                return this.Monday
                break
            case 1:
                return this.Tuesday
                break
            case 2:
                return this.Wednesday
                break
            case 3:
                return this.Thursday
                break
            case 4:
                return this.Friday
                break
            case 5:
                return this.Saturday
                break
            case 6:
                return this.Sunday
                break
        }
    }

    /**
     * Returns day name based on position in week
     * @param number Position in week
     * @returns {string} Day name
     */
    day(number) {
        switch (number) {
            case 0:
                return "Monday"
                break
            case 1:
                return "Tuesday"
                break
            case 2:
                return "Wednesday"
                break
            case 3:
                return "Thursday"
                break
            case 4:
                return "Friday"
                break
            case 5:
                return "Saturday"
                break
            case 6:
                return "Sunday"
                break
        }
    }
}
//Export Classes
module.exports = {Building, Room, Course, FreeRoom, Week, WeekCourse}





